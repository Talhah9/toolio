import { useState } from 'react';
import { MarkdownResult } from '../../components/MarkdownResult';
import { ResultViewer } from '../../components/ResultViewer';
import { ToolShell } from '../../components/ToolShell';
import { Glyph } from '../../components/Glyph';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';
import { streamGenerate } from '../../lib/streamGenerate';
import { CompletionCelebration } from '../../components/CompletionCelebration';
import GeneratingIndicator from '../../components/GeneratingIndicator';
import StreamingBanner from '../../components/StreamingBanner';

const TONES = [
  { id: 'cordial', labelKey: 'tool.relance.tone.cordial.label', descKey: 'tool.relance.tone.cordial.desc', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  { id: 'firm',    labelKey: 'tool.relance.tone.firm.label',    descKey: 'tool.relance.tone.firm.desc',    color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { id: 'urgent',  labelKey: 'tool.relance.tone.urgent.label',  descKey: 'tool.relance.tone.urgent.desc',  color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
];

export function RelanceTool({ tool }) {
  const { credits, logGeneration, session, user } = useApp();
  const { t, lang } = useLang();
  const [context, setContext] = useState('');
  const [tone, setTone] = useState('cordial');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [toast, ToastEl] = useToast();

  const generate = async () => {
    if (!context.trim()) { toast(t('tool.relance.error.context')); return; }
    if (credits === null) return;
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }
    setLoading(true);
    setOutput('');
    try {
      const fullText = await streamGenerate(
        { toolId: tool.id, input: { context, tone }, session, lang },
        (chunk) => setOutput(chunk),
      );
      await logGeneration(tool.id, { context, tone }, fullText, tool.credits);
      setShowCelebration(true);
    } catch (err) {
      toast(err.message || t('tool.error.generic'));
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!output) return;
    navigator.clipboard?.writeText(output);
    toast(t('tool.copied'));
  };

  const activeTone = TONES.find(t => t.id === tone);

  return (
    <ToolShell tool={tool}>
      <div className="tool-page">
        <div className="card card-pad">
          <h3 className="h3" style={{ marginBottom: 16, fontSize: 15 }}>{t('tool.relance.context.label')}</h3>

          <div className="field">
            <label className="label">{t('tool.relance.context.label')} <span style={{ color: 'var(--accent)' }}>*</span></label>
            <textarea
              className="textarea"
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder={t('tool.relance.context.placeholder')}
              rows={5}
            />
          </div>

          <div className="field">
            <label className="label">{t('tool.relance.tone.label')}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {TONES.map(t_item => (
                <button
                  key={t_item.id}
                  type="button"
                  onClick={() => setTone(t_item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: `2px solid ${tone === t_item.id ? t_item.color : 'var(--border)'}`,
                    background: tone === t_item.id ? t_item.bg : 'var(--bg)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: t_item.color,
                    flexShrink: 0,
                  }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: tone === t_item.id ? t_item.color : 'var(--fg)' }}>{t(t_item.labelKey)}</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 1 }}>{t(t_item.descKey)}</div>
                  </div>
                  {tone === t_item.id && (
                    <span style={{ marginLeft: 'auto', color: t_item.color }}>
                      <Glyph name="check-circle" size={16} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="hr" style={{ margin: '20px 0' }} />
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
            <span className="muted">{t('tool.cost')}</span>
            <span style={{ color: '#10B981', fontWeight: 600 }}>{t('tool.free')}</span>
          </div>
          <button
            className="btn btn-lg btn-block"
            onClick={generate}
            disabled={loading}
            style={{
              background: activeTone?.color || 'var(--accent)',
              color: '#fff',
              border: 'none',
            }}
          >
            {loading ? t('tool.generating') : <><Glyph name="sparkle" size={14} /> {t('tool.relance.btn')}</>}
          </button>
        </div>

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
                <button className="btn btn-ghost btn-sm" onClick={() => setViewerOpen(true)} disabled={!output}>
                  <Glyph name="expand" size={12} /> Fullscreen
                </button>
              </div>
            </div>
            {viewerOpen && <ResultViewer output={output} toolName={lang === 'fr' ? tool.name_fr : tool.name_en} userEmail={user?.email} onClose={() => setViewerOpen(false)} />}
            <StreamingBanner loading={loading} hasOutput={!!output} />
            {loading && !output ? (
              <GeneratingIndicator toolId="relance" />
            ) : output ? (
              loading ? (
                <pre className="stream-text">{output}<span className="stream-cursor" /></pre>
              ) : (
                <MarkdownResult>{output}</MarkdownResult>
              )
            ) : (
              <div className="result-empty">{t('tool.result.placeholder')}</div>
            )}
          </div>
        </div>
      </div>
      {ToastEl}
      {showCelebration && (
        <CompletionCelebration
          onFullscreen={() => setViewerOpen(true)}
          onClose={() => setShowCelebration(false)}
          t={t}
        />
      )}
    </ToolShell>
  );
}
