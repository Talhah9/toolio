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

export function LegalTool({ tool, initialData }) {
  const { credits, logGeneration, session, user } = useApp();
  const { t, lang } = useLang();
  const [company, setCompany] = useState('');
  const [type, setType] = useState(initialData?.type ?? 'sole');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [activity, setActivity] = useState(initialData?.activity ?? '');
  const [docType, setDocType] = useState(initialData?.docType ?? 'tos');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [genId, setGenId] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [toast, ToastEl] = useToast();
  const resultRef = useRef(null);

  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight;
    }
  }, [output]);

  const generate = async () => {
    if (!company.trim()) { toast(t('tool.legal.error.name')); return; }
    if (credits === null) return;
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }
    setLoading(true);
    setOutput('');
    try {
      const input = { company, type, country, address, activity, docType, today: new Date().toLocaleDateString('fr-FR') };
      const fullText = await streamGenerate(
        { toolId: tool.id, input, session, lang },
        (chunk) => setOutput(chunk),
      );
      const id = await logGeneration(tool.id, input, fullText, tool.credits);
      setGenId(id);
      setShowCelebration(true);
    } catch (err) {
      toast(err.message || t('tool.error.generic'));
    } finally {
      setLoading(false);
    }
  };

  const copy = () => { if (!output) return; navigator.clipboard?.writeText(output); toast(t('tool.copied')); };

  const downloadPdf = () => exportPdf({
    toolName: lang === 'fr' ? tool.name_fr : tool.name_en,
    userEmail: user?.email,
    output,
    filename: `savvly-${tool.id}-${new Date().toISOString().slice(0, 10)}.pdf`,
  });

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
                <button className="btn btn-ghost btn-sm" onClick={copy} disabled={!output}><Glyph name="copy" size={12} /> {t('tool.copy')}</button>
                {output && <button className="btn btn-ghost btn-sm" onClick={downloadPdf}><Glyph name="arrow-down" size={12} /> {t('tool.pdf')}</button>}
                <button className="btn btn-ghost btn-sm" onClick={generate} disabled={!output || loading}><Glyph name="refresh" size={12} /> {t('tool.regenerate')}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setViewerOpen(true)} disabled={!output}><Glyph name="expand" size={12} /> Fullscreen</button>
              </div>
            </div>
            {viewerOpen && <ResultViewer output={output} toolName={lang === 'fr' ? tool.name_fr : tool.name_en} userEmail={user?.email} onClose={() => setViewerOpen(false)} />}
            {loading && !output ? (
              <div className="result-empty"><span className="row" style={{ gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite' }} />{t('tool.result.working')}</span></div>
            ) : output && loading ? (
              <div className="result-body" ref={resultRef}>
                <pre className="stream-text" style={{ margin: 0 }}>{output}<span className="stream-cursor" /></pre>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0 4px', color: 'var(--accent)', fontSize: 13 }}>
                  <style>{`@keyframes dot-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                  <span>{t('tool.legal.streaming')}</span>
                </div>
              </div>
            ) : output ? (
              <MarkdownResult>{output}</MarkdownResult>
            ) : <div className="result-empty">{t('tool.result.placeholder')}</div>}
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
