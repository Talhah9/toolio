import { useState } from 'react';
import { ToolShell } from '../../components/ToolShell';
import { Glyph } from '../../components/Glyph';
import { CreditGate } from '../../components/CreditGate';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';

const FOCUS_OPTIONS = [
  { id: 'positioning', key: 'tool.compete.focus.positioning' },
  { id: 'keywords',    key: 'tool.compete.focus.keywords' },
  { id: 'offer',       key: 'tool.compete.focus.offer' },
  { id: 'content',     key: 'tool.compete.focus.content' },
];

const SAMPLE = `COMPETITOR ANALYSIS
━━━━━━━━━━━━━━━━━━

POSITIONING
They position as "the affordable option for small teams." Their hero copy focuses on price, not outcomes. This is a weakness you can exploit by leading with results.

OFFER STRUCTURE
→ 3 pricing tiers (Free / Growth / Enterprise)
→ Free tier has strong feature parity — they're using it as top-of-funnel
→ No annual discount offered (opportunity for you)
→ Key missing feature: no mobile app

KEYWORDS THEY RANK FOR
Top 20 keywords driving their organic traffic:
• "project management for freelancers" — pos. 4 (vol. 8,400/mo)
• "simple invoicing tool" — pos. 2 (vol. 5,200/mo)
• "freelance CRM" — pos. 11 (vol. 3,100/mo)

CONTENT STRATEGY
Posting 3x/week on LinkedIn. Topics: productivity tips, client management, freelance finance. Low engagement (avg. 12 likes). No YouTube presence.

WEAKNESSES TO EXPLOIT
1. Slow onboarding — 7 steps to first value
2. No integrations with Stripe or Wise
3. Support only via email (48h response time)
4. No localisation for non-English markets

YOUR MOVE
Lead with speed-to-value ("live in 60 seconds"), highlight Stripe integration, and target their #2 keyword "simple invoicing tool" with a dedicated landing page.`;

export function ConcurrentsTool({ tool }) {
  const { credits, logGeneration } = useApp();
  const { t } = useLang();
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [yourUrl, setYourUrl] = useState('');
  const [focus, setFocus] = useState(['positioning', 'keywords', 'content']);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, ToastEl] = useToast();

  const toggleFocus = (id) => setFocus(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);

  const generate = () => {
    if (!competitorUrl.trim()) { toast(t('tool.compete.error.url')); return; }
    if (credits === null) return;
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }
    setLoading(true);
    setOutput('');
    setTimeout(async () => {
      setOutput(SAMPLE);
      setLoading(false);
      await logGeneration(tool.id, { competitorUrl, yourUrl, focus }, SAMPLE, tool.credits);
    }, 1600);
  };

  const copy = () => { if (!output) return; navigator.clipboard?.writeText(output); toast(t('tool.copied')); };

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
                <button className="btn btn-ghost btn-sm" onClick={copy} disabled={!output}><Glyph name="copy" size={12} /> {t('tool.copy')}</button>
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
