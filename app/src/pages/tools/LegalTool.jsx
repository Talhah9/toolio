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

// Tab definitions per docType — null means no tabs (single streaming output)
const TABS_BY_DOCTYPE = {
  tos: [
    { id: 'IDENTITY',  labelKey: 'tool.legal.tab.identity' },
    { id: 'SERVICES',  labelKey: 'tool.legal.tab.services' },
    { id: 'PAYMENT',   labelKey: 'tool.legal.tab.payment' },
    { id: 'EXECUTION', labelKey: 'tool.legal.tab.execution' },
    { id: 'LIABILITY', labelKey: 'tool.legal.tab.liability' },
    { id: 'LEGAL',     labelKey: 'tool.legal.tab.legal' },
  ],
  all: [
    { id: 'TERMS',   labelKey: 'tool.legal.tab.terms' },
    { id: 'PRIVACY', labelKey: 'tool.legal.tab.privacy_doc' },
    { id: 'NOTICE',  labelKey: 'tool.legal.tab.notice_doc' },
  ],
};

function parseSections(output, keys) {
  const sections = {};
  for (let i = 0; i < keys.length; i++) {
    const marker = `[SECTION:${keys[i]}]`;
    const start = output.indexOf(marker);
    if (start === -1) continue;
    const contentStart = start + marker.length;
    const nextMarker = i < keys.length - 1 ? output.indexOf(`[SECTION:${keys[i + 1]}]`) : -1;
    sections[keys[i]] = output.slice(contentStart, nextMarker !== -1 ? nextMarker : output.length).trim();
  }
  return sections;
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
  const [output, setOutput] = useState('');       // non-tabbed streaming
  const [sections, setSections] = useState({});   // tabbed output
  const [rawOutput, setRawOutput] = useState('');
  const [activeTab, setActiveTab] = useState('IDENTITY');
  const [loading, setLoading] = useState(false);
  const [genId, setGenId] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [toast, ToastEl] = useToast();
  const resultRef = useRef(null);

  const tabs = TABS_BY_DOCTYPE[docType] ?? null;
  const hasTabOutput = tabs !== null && Object.keys(sections).length > 0;
  const hasOutput = hasTabOutput || !!output;

  // Auto-scroll result body during non-tabbed streaming
  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight;
    }
  }, [output]);

  // Reset state when docType changes
  useEffect(() => {
    const firstTab = TABS_BY_DOCTYPE[docType]?.[0]?.id ?? 'IDENTITY';
    setActiveTab(firstTab);
    setSections({});
    setOutput('');
    setRawOutput('');
  }, [docType]);

  const generate = async () => {
    if (!company.trim()) { toast(t('tool.legal.error.name')); return; }
    if (credits === null) return;
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }
    setLoading(true);
    setOutput('');
    setSections({});
    setRawOutput('');
    try {
      const input = { company, type, country, address, activity, docType, today: new Date().toLocaleDateString('fr-FR') };
      const isTabbed = !!TABS_BY_DOCTYPE[docType];
      const fullText = await streamGenerate(
        { toolId: tool.id, input, session, lang },
        isTabbed ? () => {} : (chunk) => setOutput(chunk),
      );
      if (isTabbed) {
        const sectionKeys = TABS_BY_DOCTYPE[docType].map(tab => tab.id);
        const parsed = parseSections(fullText, sectionKeys);
        setSections(parsed);
        setActiveTab(sectionKeys[0]);
      }
      setRawOutput(fullText);
      const id = await logGeneration(tool.id, input, fullText, tool.credits);
      setGenId(id);
      setShowCelebration(true);
    } catch (err) {
      toast(err.message || t('tool.error.generic'));
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    const text = tabs ? (sections[activeTab] || '') : output;
    if (!text) return;
    navigator.clipboard?.writeText(text);
    toast(t('tool.copied'));
  };

  const downloadPdf = () => {
    const pdfContent = tabs
      ? tabs.map(tab => sections[tab.id] ? `## ${t(tab.labelKey)}\n\n${sections[tab.id]}` : '').filter(Boolean).join('\n\n---\n\n')
      : (rawOutput || output);
    exportPdf({
      toolName: lang === 'fr' ? tool.name_fr : tool.name_en,
      userEmail: user?.email,
      output: pdfContent,
      filename: `savvly-${tool.id}-${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  };

  const TYPE_KEYS = ['sole', 'ltd', 'llc', 'partnership', 'other'];

  return (
    <ToolShell tool={tool}>
      <div className="tool-page">
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
          <button className="btn btn-accent btn-lg btn-block" onClick={generate} disabled={loading}>
            {loading ? t('tool.generating') : <><Glyph name="sparkle" size={14} /> {t('tool.legal.btn')}</>}
          </button>
        </div>

        <div>
          <div className="result-zone">
            <div className="result-head">
              <span className="muted" style={{ fontSize: 13 }}>{t('tool.result')}</span>
              <div className="row" style={{ gap: 6 }}>
                <SaveButton generationId={genId} toolName={lang === 'fr' ? tool.name_fr : tool.name_en} />
                <ShareButton generationId={genId} />
                <button className="btn btn-ghost btn-sm" onClick={copy} disabled={!hasOutput}><Glyph name="copy" size={12} /> {t('tool.copy')}</button>
                {hasOutput && <button className="btn btn-ghost btn-sm" onClick={downloadPdf}><Glyph name="arrow-down" size={12} /> {t('tool.pdf')}</button>}
                <button className="btn btn-ghost btn-sm" onClick={generate} disabled={!hasOutput || loading}><Glyph name="refresh" size={12} /> {t('tool.regenerate')}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setViewerOpen(true)} disabled={!hasOutput}><Glyph name="expand" size={12} /> Fullscreen</button>
              </div>
            </div>

            {viewerOpen && <ResultViewer output={rawOutput || output} toolName={lang === 'fr' ? tool.name_fr : tool.name_en} userEmail={user?.email} onClose={() => setViewerOpen(false)} />}

            {/* Tab navigation — shown when tabbed output is ready */}
            {hasTabOutput && (
              <div style={{ borderBottom: '1px solid var(--border)', display: 'flex', overflowX: 'auto' }}>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '10px 14px',
                      fontSize: 12,
                      fontWeight: activeTab === tab.id ? 600 : 400,
                      color: activeTab === tab.id ? 'var(--accent)' : 'var(--fg-3)',
                      border: 'none',
                      borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                      background: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'color 0.15s',
                    }}
                  >
                    {t(tab.labelKey)}
                  </button>
                ))}
              </div>
            )}

            {/* Content area */}
            {loading ? (
              <div className="result-empty">
                <span className="row" style={{ gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite' }} />
                  {t('tool.legal.streaming')}
                </span>
              </div>
            ) : hasTabOutput ? (
              sections[activeTab]
                ? <MarkdownResult key={activeTab}>{sections[activeTab]}</MarkdownResult>
                : <div className="result-empty">{t('tool.audit.section.empty') || 'Section not generated.'}</div>
            ) : output && !loading ? (
              <MarkdownResult>{output}</MarkdownResult>
            ) : output && loading ? (
              <div className="result-body" ref={resultRef}>
                <style>{`@keyframes dot-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
                <pre className="stream-text" style={{ margin: 0 }}>{output}<span className="stream-cursor" /></pre>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0 4px', color: 'var(--accent)', fontSize: 13 }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                  <span>{t('tool.legal.streaming')}</span>
                </div>
              </div>
            ) : (
              <div className="result-empty">{t('tool.result.placeholder')}</div>
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
