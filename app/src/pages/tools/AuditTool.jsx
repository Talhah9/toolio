import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ToolShell } from '../../components/ToolShell';
import { Glyph } from '../../components/Glyph';
import { CreditGate } from '../../components/CreditGate';
import { SaveButton } from '../../components/SaveButton';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';
import { exportPdf } from '../../lib/exportPdf';

const CHECK_KEYS = [
  'tool.audit.check.titles',
  'tool.audit.check.headings',
  'tool.audit.check.speed',
  'tool.audit.check.cta',
  'tool.audit.check.mobile',
  'tool.audit.check.links',
  'tool.audit.check.alt',
  'tool.audit.check.schema',
];

export function AuditTool({ tool }) {
  const { credits, logGeneration, session, user } = useApp();
  const { t, lang } = useLang();
  const [url, setUrl] = useState('');
  const [checks, setChecks] = useState(CHECK_KEYS.map(() => true));
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [genId, setGenId] = useState(null);
  const [toast, ToastEl] = useToast();

  const generate = async () => {
    if (!url.trim()) { toast(t('tool.audit.error.url')); return; }
    if (credits === null) return;
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }
    setLoading(true);
    setOutput('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
        body: JSON.stringify({
          toolId: tool.id,
          input: { url, checks: CHECK_KEYS.filter((_, i) => checks[i]) },
          userId: session?.user?.id,
          lang,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setOutput(json.output);
      const id = await logGeneration(tool.id, { url }, json.output, tool.credits);
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
      <div className="card card-pad" style={{ marginBottom: 24, textAlign: 'center' }}>
        <p className="muted" style={{ marginBottom: 16, fontSize: 14 }}>{t('tool.audit.url.label')}</p>
        <div className="row" style={{ gap: 10, maxWidth: 600, margin: '0 auto' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-4)' }}>
              <Glyph name="audit" size={15} />
            </span>
            <input
              className="input"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder={t('tool.audit.url.placeholder')}
              style={{ paddingLeft: 36 }}
              onKeyDown={e => e.key === 'Enter' && generate()}
            />
          </div>
          <button className="btn btn-accent" onClick={generate} disabled={loading || credits === null || credits < tool.credits} style={{ whiteSpace: 'nowrap' }}>
            {loading ? t('tool.generating') : t('tool.audit.btn')}
          </button>
        </div>
      </div>

      <div className="tool-page">
        <div className="card card-pad">
          <h3 className="h3" style={{ marginBottom: 16, fontSize: 15 }}>{t('tool.audit.checks.title')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CHECK_KEYS.map((key, i) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={checks[i]}
                  onChange={() => setChecks(c => c.map((v, j) => j === i ? !v : v))}
                  style={{ accentColor: 'var(--accent)', width: 15, height: 15 }}
                />
                <span style={{ color: checks[i] ? 'var(--fg)' : 'var(--fg-4)' }}>{t(key)}</span>
              </label>
            ))}
          </div>
          <div className="hr" style={{ margin: '20px 0' }} />
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
            <span className="muted">{t('tool.cost')}</span>
            <span className="tabular"><b>{tool.credits}</b> {t('tool.credits')}</span>
          </div>
          <CreditGate cost={tool.credits}><></></CreditGate>
        </div>

        <div>
          <div className="result-zone">
            <div className="result-head">
              <span className="muted" style={{ fontSize: 13 }}>{t('tool.result')}</span>
              <div className="row" style={{ gap: 6 }}>
                <SaveButton generationId={genId} toolName={lang === 'fr' ? tool.name_fr : tool.name_en} />
                <button className="btn btn-ghost btn-sm" onClick={copy} disabled={!output}><Glyph name="copy" size={12} /> {t('tool.copy')}</button>
                {output && <button className="btn btn-ghost btn-sm" onClick={downloadPdf}><Glyph name="arrow-down" size={12} /> {t('tool.pdf')}</button>}
                <button className="btn btn-ghost btn-sm" onClick={generate} disabled={!output || loading}><Glyph name="refresh" size={12} /> {t('tool.regenerate')}</button>
              </div>
            </div>
            {loading ? (
              <div className="result-empty"><span className="row" style={{ gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite' }} />{t('tool.result.working')}</span></div>
            ) : output ? (
              <div className="result-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown></div>
            ) : (
              <div className="result-empty">{t('tool.result.placeholder')}</div>
            )}
          </div>
        </div>
      </div>
      {ToastEl}
    </ToolShell>
  );
}
