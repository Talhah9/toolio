import { useState } from 'react';
import { ToolShell } from '../../components/ToolShell';
import { Glyph } from '../../components/Glyph';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';
import { SAMPLE_OUTPUTS } from '../../data/catalog';

const TONES = [
  { id: 'direct', label: 'Direct', desc: 'No fluff, straight to the point' },
  { id: 'storytelling', label: 'Story', desc: 'Personal, narrative-driven' },
  { id: 'expert', label: 'Expert', desc: 'Analytical, data-backed' },
  { id: 'provocateur', label: 'Bold', desc: 'Contrarian, attention-grabbing' },
];

const FORMATS = [
  { id: 'storytelling', label: 'Storytelling' },
  { id: 'liste', label: 'Bullet list' },
  { id: 'opinion', label: 'Strong opinion' },
  { id: 'question', label: 'Open question' },
];

const LI_LIMIT = 3000;

export function LinkedinTool({ tool }) {
  const { credits, consumeCredits } = useApp();
  const { t } = useLang();
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('direct');
  const [format, setFormat] = useState('storytelling');
  const [output, setOutput] = useState('');
  const [outIndex, setOutIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, ToastEl] = useToast();

  const charCount = output.length;
  const overLimit = charCount > LI_LIMIT;

  const generate = () => {
    if (!topic.trim()) { toast('Enter a topic or idea.'); return; }
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }
    setLoading(true);
    setOutput('');
    setTimeout(() => {
      const samples = SAMPLE_OUTPUTS['linkedin-content'];
      setOutput(samples[outIndex % samples.length]);
      setOutIndex(i => i + 1);
      setLoading(false);
      consumeCredits(tool.credits);
    }, 1200);
  };

  const copy = () => {
    if (!output) return;
    navigator.clipboard?.writeText(output);
    toast(t('tool.copied'));
  };

  return (
    <ToolShell tool={tool}>
      <div className="tool-page">
        {/* Form */}
        <div className="card card-pad">
          <h3 className="h3" style={{ marginBottom: 16, fontSize: 15 }}>Your post</h3>

          <div className="field">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="label" style={{ margin: 0 }}>Topic or idea <span style={{ color: 'var(--accent)' }}>*</span></label>
            </div>
            <textarea
              className="textarea"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Raising my rates after 2 years of undercharging — what changed and what I wish I'd known earlier…"
              rows={5}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="field">
            <label className="label">Tone</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {TONES.map(t_item => (
                <button
                  key={t_item.id}
                  type="button"
                  onClick={() => setTone(t_item.id)}
                  className="btn btn-sm"
                  style={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    height: 'auto',
                    padding: '10px 12px',
                    border: '1px solid ' + (tone === t_item.id ? 'var(--accent)' : 'var(--border)'),
                    background: tone === t_item.id ? 'var(--accent-bg, #f0f7ff)' : 'var(--bg)',
                    color: 'var(--fg)',
                    gap: 2,
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{t_item.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--fg-4)', fontWeight: 400 }}>{t_item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="label">Format</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {FORMATS.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id)}
                  className="btn btn-sm"
                  style={{
                    border: '1px solid ' + (format === f.id ? 'var(--fg)' : 'var(--border)'),
                    background: format === f.id ? 'var(--fg)' : 'var(--bg)',
                    color: format === f.id ? '#fff' : 'var(--fg-2)',
                    justifyContent: 'flex-start',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hr" style={{ margin: '20px 0' }} />
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
            <span className="muted">{t('tool.cost')}</span>
            <span className="tabular"><b>{tool.credits}</b> {t('tool.credits')}</span>
          </div>
          <button className="btn btn-accent btn-lg btn-block" onClick={generate} disabled={loading}>
            {loading ? t('tool.generating') : <><Glyph name="sparkle" size={14} /> Write post</>}
          </button>
        </div>

        {/* Result */}
        <div>
          <div className="result-zone">
            <div className="result-head">
              <span className="muted" style={{ fontSize: 13 }}>{t('tool.result')}</span>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={copy} disabled={!output}>
                  <Glyph name="copy" size={12} /> {t('tool.copy')}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={generate} disabled={!output || loading}>
                  <Glyph name="refresh" size={12} /> {t('tool.regenerate')}
                </button>
              </div>
            </div>
            {loading ? (
              <div className="result-empty">
                <span className="row" style={{ gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite' }} />
                  {t('tool.result.working')}
                </span>
              </div>
            ) : output ? (
              <>
                <div className="result-body">{output}</div>
                <div style={{
                  padding: '8px 16px',
                  borderTop: '1px solid var(--border)',
                  fontSize: 12,
                  color: overLimit ? '#EF4444' : 'var(--fg-4)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}>
                  {charCount} / {LI_LIMIT} characters {overLimit && '— over LinkedIn limit'}
                </div>
              </>
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
