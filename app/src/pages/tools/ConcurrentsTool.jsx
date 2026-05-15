import { useState } from 'react';
import { ToolShell } from '../../components/ToolShell';
import { Glyph } from '../../components/Glyph';
import { CreditGate } from '../../components/CreditGate';
import { SaveButton } from '../../components/SaveButton';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';
import { exportPdf } from '../../lib/exportPdf';

const FOCUS_OPTIONS = [
  { id: 'positioning', key: 'tool.compete.focus.positioning' },
  { id: 'keywords',    key: 'tool.compete.focus.keywords' },
  { id: 'offer',       key: 'tool.compete.focus.offer' },
  { id: 'content',     key: 'tool.compete.focus.content' },
];

export function ConcurrentsTool({ tool }) {
  const { credits, logGeneration, session, user } = useApp();
  const { t, lang } = useLang();
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [yourUrl, setYourUrl] = useState('');
  const [focus, setFocus] = useState(['positioning', 'keywords', 'content']);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [genId, setGenId] = useState(null);
  const [toast, ToastEl] = useToast();

  const toggleFocus = (id) => setFocus(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);

  const generate = async () => {
    if (!competitorUrl.trim()) { toast(t('tool.compete.error.url')); return; }
    if (credits === null) return;
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }
    setLoading(true);
    setOutput('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: tool.id,
          input: { competitorUrl, yourUrl, focus },
          userId: session?.user?.id,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setOutput(json.output);
      const id = await logGeneration(tool.id, { competitorUrl, yourUrl, focus }, json.output, tool.credits);
      setGenId(id);
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
    filename: `toolio-${tool.id}-${new Date().toISOString().slice(0, 10)}.pdf`,
  });

  return (
    <ToolShell tool={tool}>
      <div className="tool-page">
        <div className="card card-pad">
          <h3 className="h3" style={{ marginBottom: 16, fontSize: 15 }}>{t('tool.params')}</h3>

          <div className="field">
            <label className="label">{t('tool.compete.competitor.label')} <span style={{ color: 'var(--accent)' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-4)' }}><Glyph name="compete" size={14} /></span>
              <input className="input" value={competitorUrl} onChange={e => setCompetitorUrl(e.target.value)} placeholder={t('tool.compete.competitor.placeholder')} style={{ paddingLeft: 34 }} />
            </div>
          </div>

          <div className="field">
            <label className="label">{t('tool.compete.yours.label')} <span className="muted" style={{ fontWeight: 400 }}>{t('tool.compete.yours.hint')}</span></label>
            <input className="input" value={yourUrl} onChange={e => setYourUrl(e.target.value)} placeholder={t('tool.compete.yours.placeholder')} />
          </div>

          <div className="field">
            <label className="label">{t('tool.compete.analyse.label')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {FOCUS_OPTIONS.map(opt => (
                <button key={opt.id} type="button" onClick={() => toggleFocus(opt.id)} className="btn btn-sm"
                  style={{ border: '1px solid ' + (focus.includes(opt.id) ? 'var(--fg)' : 'var(--border)'), background: focus.includes(opt.id) ? 'var(--fg)' : 'var(--bg)', color: focus.includes(opt.id) ? '#fff' : 'var(--fg-2)' }}>
                  {focus.includes(opt.id) && <Glyph name="check" size={11} />}
                  {t(opt.key)}
                </button>
              ))}
            </div>
          </div>

          <div className="hr" style={{ margin: '20px 0' }} />
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
            <span className="muted">{t('tool.cost')}</span>
            <span className="tabular"><b>{tool.credits}</b> {t('tool.credits')}</span>
          </div>
          <CreditGate cost={tool.credits}>
            <button className="btn btn-accent btn-lg btn-block" onClick={generate} disabled={loading}>
              {loading ? t('tool.generating') : <><Glyph name="sparkle" size={14} /> {t('tool.compete.btn')}</>}
            </button>
          </CreditGate>
        </div>

        <div>
          <div className="result-zone">
            <div className="result-head">
              <span className="muted" style={{ fontSize: 13 }}>{t('tool.result')}</span>
              <div className="row" style={{ gap: 6 }}>
                <SaveButton generationId={genId} />
                <button className="btn btn-ghost btn-sm" onClick={copy} disabled={!output}><Glyph name="copy" size={12} /> {t('tool.copy')}</button>
                {output && <button className="btn btn-ghost btn-sm" onClick={downloadPdf}><Glyph name="arrow-down" size={12} /> {t('tool.pdf')}</button>}
                <button className="btn btn-ghost btn-sm" onClick={generate} disabled={!output || loading}><Glyph name="refresh" size={12} /> {t('tool.regenerate')}</button>
              </div>
            </div>
            {loading ? (
              <div className="result-empty"><span className="row" style={{ gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite' }} />{t('tool.result.working')}</span></div>
            ) : output ? <div className="result-body">{output}</div> : <div className="result-empty">{t('tool.result.placeholder')}</div>}
          </div>
        </div>
      </div>
      {ToastEl}
    </ToolShell>
  );
}
