import { useState } from 'react';
import { ToolShell } from '../../components/ToolShell';
import { Glyph } from '../../components/Glyph';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';

const SAMPLES = {
  cordial: `Subject: Following up — Invoice #2026-038

Hi Sophie,

I hope you're well. I wanted to gently follow up on Invoice #2026-038 for €4,500, which was due on May 1st.

I understand things get busy — if there's anything you need from my end (a new copy, different payment details, etc.) just let me know and I'll sort it straight away.

If payment has already been sent, please disregard this message.

Best,
Léa`,
  firm: `Subject: Overdue payment — Invoice #2026-038 (21 days)

Hi Sophie,

Invoice #2026-038 for €4,500 (due May 1st) is now 21 days overdue. I'm writing to request prompt settlement.

As per our agreement, a late payment fee of 1.5% per month applies to overdue amounts. I'd prefer to resolve this without applying it.

Please confirm a payment date by Friday May 16th. I'm available to discuss if there's an issue.

Best regards,
Léa Marchand`,
  urgent: `Subject: URGENT — Invoice #2026-038 overdue 30+ days — action required

Sophie,

Invoice #2026-038 (€4,500, due May 1st) remains unpaid after 30 days and multiple follow-ups.

I must now formally request payment within 48 hours. If I don't hear back by Thursday, I will pass this to my solicitor and register the dispute with the relevant small claims process.

This is not the outcome I want — I'd prefer to resolve this directly. Please contact me immediately.

Léa Marchand
+44 7700 900000`,
};

const TONES = [
  { id: 'cordial', labelKey: 'tool.relance.tone.cordial.label', descKey: 'tool.relance.tone.cordial.desc', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  { id: 'firm',    labelKey: 'tool.relance.tone.firm.label',    descKey: 'tool.relance.tone.firm.desc',    color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { id: 'urgent',  labelKey: 'tool.relance.tone.urgent.label',  descKey: 'tool.relance.tone.urgent.desc',  color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
];

export function RelanceTool({ tool }) {
  const { credits, consumeCredits } = useApp();
  const { t } = useLang();
  const [context, setContext] = useState('');
  const [tone, setTone] = useState('cordial');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, ToastEl] = useToast();

  const generate = () => {
    if (!context.trim()) { toast(t('tool.relance.error.context')); return; }
    if (credits === null) return;
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }
    setLoading(true);
    setOutput('');
    setTimeout(() => {
      setOutput(SAMPLES[tone]);
      setLoading(false);
      consumeCredits(tool.credits);
    }, 1000);
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
        {/* Form */}
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
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeTone?.color || 'var(--accent)', animation: 'pulse 1s infinite' }} />
                  {t('tool.result.working')}
                </span>
              </div>
            ) : output ? (
              <div className="result-body" style={{ whiteSpace: 'pre-line' }}>{output}</div>
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
