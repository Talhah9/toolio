import { useState, useRef, useEffect } from 'react';
import { MarkdownResult } from '../../components/MarkdownResult';
import { ResultViewer } from '../../components/ResultViewer';
import { ToolShell } from '../../components/ToolShell';
import { Glyph } from '../../components/Glyph';
import { SaveButton } from '../../components/SaveButton';
import { ShareButton } from '../../components/ShareButton';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';
import { exportPdf } from '../../lib/exportPdf';
import { streamGenerate } from '../../lib/streamGenerate';
import { CompletionCelebration } from '../../components/CompletionCelebration';

const DOCTYPE_OPTIONS = [
  { id: 'tos',     key: 'tool.legal.doctype.tos' },
  { id: 'privacy', key: 'tool.legal.doctype.privacy' },
  { id: 'notice',  key: 'tool.legal.doctype.notice' },
  { id: 'all',     key: 'tool.legal.doctype.all' },
];

const TYPE_KEYS = ['sole', 'ltd', 'llc', 'partnership', 'other'];

const SECTION_DEFS = {
  tos: [
    { key: 'SECTION_1', label: 'Art. 1-2' },
    { key: 'SECTION_2', label: 'Art. 3-4' },
    { key: 'SECTION_3', label: 'Art. 5-6' },
    { key: 'SECTION_4', label: 'Art. 7-9' },
    { key: 'SECTION_5', label: 'Art. 10-11' },
    { key: 'SECTION_6', label: 'Art. 12-14' },
  ],
  privacy: [
    { key: 'SECTION_1', label: 'Collecte' },
    { key: 'SECTION_2', label: 'Droits' },
    { key: 'SECTION_3', label: 'Sécurité' },
  ],
  notice: [
    { key: 'SECTION_1', label: 'Éditeur' },
    { key: 'SECTION_2', label: 'PI & Resp.' },
  ],
};

function buildSectionList(docType) {
  if (docType === 'all') {
    return [
      ...SECTION_DEFS.tos.map(s => ({ ...s, compositeKey: `tos_${s.key}`, docType: 'tos', tabLabel: `CGV ${s.label}` })),
      ...SECTION_DEFS.privacy.map(s => ({ ...s, compositeKey: `privacy_${s.key}`, docType: 'privacy', tabLabel: `Conf. ${s.label}` })),
      ...SECTION_DEFS.notice.map(s => ({ ...s, compositeKey: `notice_${s.key}`, docType: 'notice', tabLabel: `ML ${s.label}` })),
    ];
  }
  return SECTION_DEFS[docType].map(s => ({ ...s, compositeKey: s.key, docType, tabLabel: s.label }));
}

function buildFullDocument(sectionList, sectionsData, docType) {
  if (docType !== 'all') {
    return sectionList.map(s => sectionsData[s.compositeKey] || '').filter(Boolean).join('\n\n');
  }
  const tos = sectionList.filter(s => s.docType === 'tos').map(s => sectionsData[s.compositeKey] || '').filter(Boolean).join('\n\n');
  const privacy = sectionList.filter(s => s.docType === 'privacy').map(s => sectionsData[s.compositeKey] || '').filter(Boolean).join('\n\n');
  const notice = sectionList.filter(s => s.docType === 'notice').map(s => sectionsData[s.compositeKey] || '').filter(Boolean).join('\n\n');
  return [tos, privacy, notice].filter(Boolean).join('\n\n---\n\n');
}

export function LegalTool({ tool, initialData }) {
  const { credits, logGeneration, session, user } = useApp();
  const { t, lang } = useLang();
  const [company, setCompany] = useState('');
  const [type, setType] = useState(initialData?.type ?? 'sole');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [activity, setActivity] = useState(initialData?.activity ?? '');
  const [docType, setDocType] = useState(initialData?.docType ?? 'tos');

  const [sections, setSections] = useState({});
  const [currentGenerating, setCurrentGenerating] = useState(null);
  const [completedSections, setCompletedSections] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [sectionList, setSectionList] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const [genId, setGenId] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [toast, ToastEl] = useToast();
  const resultRef = useRef(null);

  useEffect(() => {
    if (currentGenerating && resultRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight;
    }
  }, [sections, currentGenerating]);

  const hasOutput = completedSections.length > 0 || currentGenerating !== null;
  const isComplete = sectionList.length > 0 && completedSections.length === sectionList.length;

  const getFullDoc = () => buildFullDocument(sectionList, sections, docType);

  const generate = async () => {
    if (!company.trim()) { toast(t('tool.legal.error.name')); return; }
    if (credits === null) return;
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }

    const currentSectionList = buildSectionList(docType);
    setSectionList(currentSectionList);
    setSections({});
    setCompletedSections([]);
    setActiveTab(currentSectionList[0]?.compositeKey ?? null);
    setIsGenerating(true);
    setGenId(null);

    const baseInput = {
      company, type, country, address, activity,
      today: new Date().toLocaleDateString('fr-FR'),
    };

    const allResults = {};

    try {
      for (const sec of currentSectionList) {
        const cKey = sec.compositeKey;
        setCurrentGenerating(cKey);
        setActiveTab(cKey);
        setSections(prev => ({ ...prev, [cKey]: '' }));

        const input = { ...baseInput, docType: sec.docType, sectionKey: sec.key };
        const fullText = await streamGenerate(
          { toolId: tool.id, input, session, lang },
          (chunk) => setSections(prev => ({ ...prev, [cKey]: chunk })),
        );

        allResults[cKey] = fullText;
        setCompletedSections(prev => [...prev, cKey]);
      }

      setCurrentGenerating(null);
      const fullDoc = buildFullDocument(currentSectionList, allResults, docType);
      const id = await logGeneration(tool.id, { ...baseInput, docType }, fullDoc, tool.credits);
      setGenId(id);
      setShowCelebration(true);
    } catch (err) {
      toast(err.message || t('tool.error.generic'));
    } finally {
      setIsGenerating(false);
      setCurrentGenerating(null);
    }
  };

  const downloadPdf = () => exportPdf({
    toolName: lang === 'fr' ? tool.name_fr : tool.name_en,
    userEmail: user?.email,
    output: getFullDoc(),
    filename: `savvly-${tool.id}-${new Date().toISOString().slice(0, 10)}.pdf`,
  });

  const copy = () => {
    const doc = getFullDoc();
    if (!doc.trim()) return;
    navigator.clipboard?.writeText(doc);
    toast(t('tool.copied'));
  };

  const activeContent = activeTab ? sections[activeTab] : null;
  const isActiveStreaming = currentGenerating !== null && activeTab === currentGenerating;
  const progressPct = sectionList.length > 0 ? (completedSections.length / sectionList.length) * 100 : 0;

  return (
    <ToolShell tool={tool}>
      <div className="tool-page">
        {/* LEFT: Form */}
        <div className="card card-pad">
          <h3 className="h3" style={{ marginBottom: 16, fontSize: 15 }}>{t('tool.legal.section.title')}</h3>

          <div className="field">
            <label className="label">{t('tool.legal.company.label')} <span style={{ color: 'var(--accent)' }}>*</span></label>
            <input className="input" value={company} onChange={e => setCompany(e.target.value)} placeholder={t('tool.legal.company.placeholder')} />
          </div>

          <div className="field">
            <label className="label">{t('tool.legal.type.label')}</label>
            <select className="select" value={type} onChange={e => setType(e.target.value)}>
              {TYPE_KEYS.map(k => <option key={k} value={k}>{t(`tool.legal.type.${k}`)}</option>)}
            </select>
          </div>

          <div className="field">
            <label className="label">{t('tool.legal.country.label')}</label>
            <input className="input" value={country} onChange={e => setCountry(e.target.value)} placeholder={t('tool.legal.country.placeholder')} />
          </div>

          <div className="field">
            <label className="label">{t('tool.legal.address.label')}</label>
            <input className="input" value={address} onChange={e => setAddress(e.target.value)} placeholder={t('tool.legal.address.placeholder')} />
          </div>

          <div className="field">
            <label className="label">{t('tool.legal.activity.label')}</label>
            <textarea className="textarea" value={activity} onChange={e => setActivity(e.target.value)} placeholder={t('tool.legal.activity.placeholder')} rows={3} />
          </div>

          <div className="field">
            <label className="label">{t('tool.legal.doctype.label')}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DOCTYPE_OPTIONS.map(opt => {
                const active = docType === opt.id;
                return (
                  <button key={opt.id} type="button" onClick={() => setDocType(opt.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, textAlign: 'left', border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'), background: active ? 'color-mix(in srgb, var(--accent) 10%, var(--bg))' : 'var(--bg)', color: active ? 'var(--accent)' : 'var(--fg-2)', fontWeight: active ? 600 : 400, transition: 'all 0.15s' }}>
                    <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid ' + (active ? 'var(--accent)' : 'var(--border)'), flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {active && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'block' }} />}
                    </span>
                    {t(opt.key)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hr" style={{ margin: '20px 0' }} />
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
            <span className="muted">{t('tool.cost')}</span>
            <span style={{ color: '#10B981', fontWeight: 600 }}>{t('tool.free')}</span>
          </div>
          <button className="btn btn-accent btn-lg btn-block" onClick={generate} disabled={isGenerating}>
            {isGenerating ? t('tool.generating') : <><Glyph name="sparkle" size={14} /> {t('tool.legal.btn')}</>}
          </button>
        </div>

        {/* RIGHT: Result */}
        <div>
          <div className="result-zone">
            <div className="result-head">
              <span className="muted" style={{ fontSize: 13 }}>{t('tool.result')}</span>
              <div className="row" style={{ gap: 6 }}>
                <SaveButton generationId={genId} toolName={lang === 'fr' ? tool.name_fr : tool.name_en} />
                <ShareButton generationId={genId} />
                <button className="btn btn-ghost btn-sm" onClick={copy} disabled={!hasOutput}><Glyph name="copy" size={12} /> {t('tool.copy')}</button>
                {hasOutput && <button className="btn btn-ghost btn-sm" onClick={downloadPdf}><Glyph name="arrow-down" size={12} /> {t('tool.pdf')}</button>}
                <button className="btn btn-ghost btn-sm" onClick={generate} disabled={!isComplete || isGenerating}><Glyph name="refresh" size={12} /> {t('tool.regenerate')}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setViewerOpen(true)} disabled={!isComplete}><Glyph name="expand" size={12} /> Fullscreen</button>
              </div>
            </div>

            {viewerOpen && (
              <ResultViewer output={getFullDoc()} toolName={lang === 'fr' ? tool.name_fr : tool.name_en} userEmail={user?.email} onClose={() => setViewerOpen(false)} />
            )}

            {!hasOutput ? (
              <div className="result-empty">{t('tool.result.placeholder')}</div>
            ) : (
              <div style={{ padding: '12px 16px 0' }}>
                {/* Tab bar */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                  {sectionList.map(sec => {
                    const cKey = sec.compositeKey;
                    const isDone = completedSections.includes(cKey);
                    const isCurrent = currentGenerating === cKey;
                    const isActive = activeTab === cKey;
                    return (
                      <button key={cKey} type="button" onClick={() => setActiveTab(cKey)}
                        style={{
                          padding: '5px 10px', borderRadius: 6, fontSize: 12,
                          fontWeight: isActive ? 600 : 400, cursor: 'pointer',
                          border: '1px solid ' + (isActive ? 'var(--accent)' : 'var(--border)'),
                          background: isActive ? 'color-mix(in srgb, var(--accent) 12%, var(--bg))' : 'var(--bg)',
                          color: isActive ? 'var(--accent)' : isDone ? 'var(--fg)' : 'var(--fg-3)',
                          display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
                          opacity: !isDone && !isCurrent ? 0.45 : 1,
                        }}>
                        {isCurrent && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite', flexShrink: 0 }} />}
                        {isDone && !isCurrent && <span style={{ color: '#10B981', fontSize: 10, lineHeight: 1 }}>✓</span>}
                        {sec.tabLabel}
                      </button>
                    );
                  })}
                </div>

                {/* Thin progress bar */}
                <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 2, width: `${progressPct}%`, transition: 'width 0.4s ease' }} />
                </div>

                {/* Active tab content — scrollable */}
                <div className="result-body" ref={resultRef} style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 280px)', scrollBehavior: 'smooth', height: '100%' }}>
                  {activeTab && (
                    isActiveStreaming ? (
                      <pre className="stream-text" style={{ margin: 0 }}>{activeContent}<span className="stream-cursor" /></pre>
                    ) : activeContent ? (
                      <MarkdownResult>{activeContent}</MarkdownResult>
                    ) : (
                      <div className="result-empty" style={{ fontSize: 13, padding: '24px 0' }}>
                        {lang === 'fr' ? 'Sera généré automatiquement…' : 'Will be generated automatically…'}
                      </div>
                    )
                  )}
                </div>

                {/* Status indicator — outside scroll area, always visible */}
                <style>{`@keyframes dot-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
                {isGenerating ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0 6px', color: 'var(--accent)', fontSize: 13, borderTop: '1px solid var(--border)', marginTop: 8 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                    <span>⚡ Section {completedSections.length + 1}/{sectionList.length} {lang === 'fr' ? 'en cours de création…' : 'in progress…'}</span>
                  </div>
                ) : isComplete ? (
                  <div style={{ padding: '10px 0 6px', fontSize: 13, color: '#10B981', borderTop: '1px solid var(--border)', marginTop: 8 }}>
                    ✅ {lang === 'fr' ? `Document complet — ${sectionList.length}/${sectionList.length} sections` : `Complete — ${sectionList.length}/${sectionList.length} sections`}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
      {ToastEl}
      {showCelebration && (
        <CompletionCelebration
          onPdf={downloadPdf}
          onFullscreen={() => setViewerOpen(true)}
          onClose={() => setShowCelebration(false)}
          t={t}
        />
      )}
    </ToolShell>
  );
}
