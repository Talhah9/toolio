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

const TONES = [
  { id: 'direct',       labelKey: 'tool.linkedin.tone.direct.label', descKey: 'tool.linkedin.tone.direct.desc' },
  { id: 'storytelling', labelKey: 'tool.linkedin.tone.story.label',  descKey: 'tool.linkedin.tone.story.desc' },
  { id: 'expert',       labelKey: 'tool.linkedin.tone.expert.label', descKey: 'tool.linkedin.tone.expert.desc' },
  { id: 'provocateur',  labelKey: 'tool.linkedin.tone.bold.label',   descKey: 'tool.linkedin.tone.bold.desc' },
];

const FORMATS = [
  { id: 'storytelling', key: 'tool.linkedin.format.storytelling' },
  { id: 'liste',        key: 'tool.linkedin.format.bullets' },
  { id: 'opinion',      key: 'tool.linkedin.format.opinion' },
  { id: 'question',     key: 'tool.linkedin.format.question' },
];

const LI_LIMIT = 3000;

export function LinkedinTool({ tool, initialData }) {
  const { credits, logGeneration, session } = useApp();
  const { t, lang } = useLang();
  const [topic, setTopic] = useState(initialData?.topic ?? '');
  const [tone, setTone] = useState(initialData?.tone ?? 'direct');
  const [format, setFormat] = useState(initialData?.format ?? 'storytelling');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [genId, setGenId] = useState(null);
  const [toast, ToastEl] = useToast();

  const charCount = output.length;
  const overLimit = charCount > LI_LIMIT;

  const generate = async () => {
    if (!topic.trim()) { toast(t('tool.linkedin.error.topic')); return; }
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
          input: { topic, tone, format },
          userId: session?.user?.id,
          lang,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setOutput(json.output);
      const id = await logGeneration(tool.id, { topic, tone, format }, json.output, tool.credits);
      setGenId(id);
    } catch (err) {
      toast(err.message || t('tool.error.generic'));
    } finally {
      setLoading(false);
    }
  };

  const copy = () => { if (!output) return; navigator.clipboard?.writeText(output); toast(t('tool.copied')); };

  return (
    <ToolShell tool={tool}>
      <div className="tool-page">
        <div className="card card-pad">
          <h3 className="h3" style={{ marginBottom: 16, fontSize: 15 }}>{t('tool.params')}</h3>

          <div className="field">
            <label className="label">{t('tool.linkedin.topic.label')} <span style={{ color: 'var(--accent)' }}>*</span></label>
            <textarea className="textarea" value={topic} onChange={e => setTopic(e.target.value)} placeholder={t('tool.linkedin.topic.placeholder')} rows={5} style={{ resize: 'vertical' }} />
          </div>

          <div className="field">
            <label className="label">{t('tool.linkedin.tone.label')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {TONES.map(item => (
                <button key={item.id} type="button" onClick={() => setTone(item.id)} className="btn btn-sm"
                  style={{ flexDirection: 'column', alignItems: 'flex-start', height: 'auto', padding: '10px 12px',
                    border: '1px solid ' + (tone === item.id ? 'var(--accent)' : 'var(--border)'),
                    background: tone === item.id ? 'var(--accent-bg, #f0f7ff)' : 'var(--bg)',
                    color: 'var(--fg)', gap: 2 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{t(item.labelKey)}</span>
                  <span style={{ fontSize: 11, color: 'var(--fg-4)', fontWeight: 400 }}>{t(item.descKey)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="label">{t('tool.linkedin.format.label')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {FORMATS.map(f => (
                <button key={f.id} type="button" onClick={() => setFormat(f.id)} className="btn btn-sm"
                  style={{ border: '1px solid ' + (format === f.id ? 'var(--fg)' : 'var(--border)'), background: format === f.id ? 'var(--fg)' : 'var(--bg)', color: format === f.id ? '#fff' : 'var(--fg-2)', justifyContent: 'flex-start' }}>
                  {t(f.key)}
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
              {loading ? t('tool.generating') : <><Glyph name="sparkle" size={14} /> {t('tool.linkedin.btn')}</>}
            </button>
          </CreditGate>
        </div>

        <div>
          <div className="result-zone">
            <div className="result-head">
              <span className="muted" style={{ fontSize: 13 }}>{t('tool.result')}</span>
              <div className="row" style={{ gap: 6 }}>
                <SaveButton generationId={genId} toolName={lang === 'fr' ? tool.name_fr : tool.name_en} />
                <button className="btn btn-ghost btn-sm" onClick={copy} disabled={!output}><Glyph name="copy" size={12} /> {t('tool.copy')}</button>
                <button className="btn btn-ghost btn-sm" onClick={generate} disabled={!output || loading}><Glyph name="refresh" size={12} /> {t('tool.regenerate')}</button>
              </div>
            </div>
            {loading ? (
              <div className="result-empty"><span className="row" style={{ gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite' }} />{t('tool.result.working')}</span></div>
            ) : output ? (
              <>
                <div className="result-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown></div>
                <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: overLimit ? '#EF4444' : 'var(--fg-4)', display: 'flex', justifyContent: 'flex-end' }}>
                  {charCount} / {LI_LIMIT} {overLimit && t('tool.linkedin.overlimit')}
                </div>
              </>
            ) : <div className="result-empty">{t('tool.result.placeholder')}</div>}
          </div>
        </div>
      </div>
      {ToastEl}
    </ToolShell>
  );
}
