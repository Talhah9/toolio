import { useState } from 'react';
import { ToolShell } from '../../components/ToolShell';
import { Glyph } from '../../components/Glyph';
import { CreditGate } from '../../components/CreditGate';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';

const STYLES = [
  { id: 'photorealistic', key: 'tool.image.style.photo' },
  { id: 'illustration',   key: 'tool.image.style.illustration' },
  { id: 'minimalist',     key: 'tool.image.style.minimalist' },
  { id: 'bold',           key: 'tool.image.style.bold' },
];

const SIZES = [
  { id: '1584x396',  key: 'tool.image.size.banner',   ratio: '4/1',  label: '1584 × 396' },
  { id: '1080x1080', key: 'tool.image.size.square',   ratio: '1/1',  label: '1080 × 1080' },
  { id: '1080x1350', key: 'tool.image.size.portrait', ratio: '4/5',  label: '1080 × 1350' },
];

const PLACEHOLDER_COLORS = {
  photorealistic: ['#1a1a2e', '#16213e', '#0f3460'],
  illustration:   ['#f7971e', '#ffd200', '#f7971e'],
  minimalist:     ['#f8f9fa', '#e9ecef', '#dee2e6'],
  bold:           ['#f72585', '#7209b7', '#3a0ca3'],
};

export function ImageTool({ tool }) {
  const { credits, consumeCredits } = useApp();
  const { t } = useLang();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('photorealistic');
  const [size, setSize] = useState('1080x1080');
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, ToastEl] = useToast();

  const selectedSize = SIZES.find(s => s.id === size);

  const generate = () => {
    if (!prompt.trim()) { toast(t('tool.image.error.prompt')); return; }
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }
    setLoading(true);
    setOutput(null);
    setTimeout(() => {
      setOutput({ prompt, style, size });
      setLoading(false);
      consumeCredits(tool.credits);
    }, 2000);
  };

  const colors = PLACEHOLDER_COLORS[style];

  return (
    <ToolShell tool={tool}>
      <div className="tool-page">
        {/* Form */}
        <div className="card card-pad">
          <h3 className="h3" style={{ marginBottom: 16, fontSize: 15 }}>{t('tool.params')}</h3>

          <div className="field">
            <label className="label">{t('tool.image.prompt.label')} <span style={{ color: 'var(--accent)' }}>*</span></label>
            <textarea
              className="textarea"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={t('tool.image.prompt.placeholder')}
              rows={4}
            />
          </div>

          <div className="field">
            <label className="label">{t('tool.image.style.label')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {STYLES.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className="btn btn-sm"
                  style={{
                    border: '1px solid ' + (style === s.id ? 'var(--accent)' : 'var(--border)'),
                    background: style === s.id ? 'var(--accent-bg, #f0f7ff)' : 'var(--bg)',
                    color: style === s.id ? 'var(--accent)' : 'var(--fg-2)',
                    fontWeight: style === s.id ? 600 : 400,
                    justifyContent: 'flex-start',
                  }}
                >
                  {t(s.key)}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="label">{t('tool.image.size.label')}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SIZES.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSize(s.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: `1px solid ${size === s.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: size === s.id ? 'var(--accent-bg, #f0f7ff)' : 'var(--bg)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {/* Aspect ratio preview box */}
                  <div style={{
                    width: s.ratio === '4/1' ? 40 : s.ratio === '4/5' ? 16 : 22,
                    height: s.ratio === '4/1' ? 10 : 22,
                    borderRadius: 3,
                    border: `2px solid ${size === s.id ? 'var(--accent)' : 'var(--fg-4)'}`,
                    flexShrink: 0,
                  }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{t(s.key)}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 1 }}>{s.label}px</div>
                  </div>
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
              {loading ? t('tool.generating') : <><Glyph name="sparkle" size={14} /> {t('tool.image.btn')}</>}
            </button>
          </CreditGate>
        </div>

        {/* Result */}
        <div>
          <div className="result-zone" style={{ minHeight: 320 }}>
            <div className="result-head">
              <span className="muted" style={{ fontSize: 13 }}>{t('tool.result')}</span>
              {output && (
                <button className="btn btn-ghost btn-sm" onClick={generate} disabled={loading}>
                  <Glyph name="refresh" size={12} /> {t('tool.regenerate')}
                </button>
              )}
            </div>

            {loading ? (
              <div className="result-empty" style={{ flexDirection: 'column', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
                  animation: 'pulse 1.2s infinite',
                }} />
                <span className="muted" style={{ fontSize: 13 }}>{t('tool.image.generating')}</span>
              </div>
            ) : output ? (
              <div style={{ padding: 16 }}>
                {/* Mock image placeholder */}
                <div style={{
                  width: '100%',
                  aspectRatio: selectedSize?.ratio || '1/1',
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.35)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 8, padding: 20, textAlign: 'center',
                  }}>
                    <Glyph name="image" size={32} style={{ color: 'rgba(255,255,255,0.6)' }} />
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontStyle: 'italic', maxWidth: 260, margin: 0 }}>
                      "{output.prompt}"
                    </p>
                    <span style={{
                      fontSize: 11, color: 'rgba(255,255,255,0.5)',
                      padding: '3px 10px', borderRadius: 20,
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}>
                      {t(`tool.image.style.${output.style.split('').slice(0,4).join('')}`)} · {output.size}px · {t('tool.image.mock')}
                    </span>
                  </div>
                </div>
                <p className="muted" style={{ fontSize: 12, textAlign: 'center', marginTop: 10 }}>
                  {t('tool.image.mock.note')}
                </p>
              </div>
            ) : (
              <div className="result-empty">{t('tool.image.result.placeholder')}</div>
            )}
          </div>
        </div>
      </div>
      {ToastEl}
    </ToolShell>
  );
}
