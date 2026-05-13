import { useState } from 'react';
import { ToolShell } from '../../components/ToolShell';
import { Glyph } from '../../components/Glyph';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';

const CHECKLIST = [
  'Title tags & meta descriptions',
  'H1 / H2 heading structure',
  'Page load speed & Core Web Vitals',
  'CTA clarity & placement',
  'Mobile responsiveness',
  'Internal linking structure',
  'Image alt text coverage',
  'Structured data / schema markup',
];

const SAMPLE = `SEO & CRO AUDIT REPORT
━━━━━━━━━━━━━━━━━━━━━

✅ Title Tags — Good
Your homepage title is within the 50–60 character sweet spot and includes your primary keyword.

⚠️  Meta Descriptions — Needs work
3 pages are missing meta descriptions. These pages lose click-through potential in search results.
→ Action: Write unique meta descriptions for /pricing, /about, and /contact.

❌ Page Speed — Critical
Your Largest Contentful Paint (LCP) is 4.2s (threshold: < 2.5s). This hurts both UX and rankings.
→ Action: Compress hero images (currently 1.2MB), enable lazy loading, defer non-critical JS.

✅ H1 Structure — Good
Every page has exactly one H1. No duplicates detected.

⚠️  CTA Placement — Needs work
Primary CTA appears only at the bottom of the page. Users who don't scroll will miss it.
→ Action: Add a sticky header CTA and a mid-page CTA above the fold.

✅ Mobile — Good
Fully responsive across tested breakpoints (375px, 768px, 1280px).

❌ Internal Links — Critical
The /services page has 0 internal links pointing to it. It's an orphan page.
→ Action: Link to /services from the homepage, navbar, and 3 relevant blog posts.

PRIORITY ACTIONS
1. Fix page speed (LCP < 2.5s)
2. Add internal links to orphan pages
3. Write missing meta descriptions`;

export function AuditTool({ tool }) {
  const { credits, consumeCredits } = useApp();
  const { t } = useLang();
  const [url, setUrl] = useState('');
  const [checks, setChecks] = useState(CHECKLIST.map(() => true));
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, ToastEl] = useToast();

  const generate = () => {
    if (!url.trim()) { toast('Enter a URL to analyse.'); return; }
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }
    setLoading(true);
    setOutput('');
    setTimeout(() => {
      setOutput(SAMPLE);
      setLoading(false);
      consumeCredits(tool.credits);
    }, 1800);
  };

  const copy = () => {
    if (!output) return;
    navigator.clipboard?.writeText(output);
    toast(t('tool.copied'));
  };

  return (
    <ToolShell tool={tool}>
      {/* URL hero */}
      <div className="card card-pad" style={{ marginBottom: 24, textAlign: 'center' }}>
        <p className="muted" style={{ marginBottom: 16, fontSize: 14 }}>Enter the URL of the site to audit</p>
        <div className="row" style={{ gap: 10, maxWidth: 600, margin: '0 auto' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-4)' }}>
              <Glyph name="audit" size={15} />
            </span>
            <input
              className="input"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://yoursite.com"
              style={{ paddingLeft: 36 }}
              onKeyDown={e => e.key === 'Enter' && generate()}
            />
          </div>
          <button
            className="btn btn-accent"
            onClick={generate}
            disabled={loading}
            style={{ whiteSpace: 'nowrap' }}
          >
            {loading ? t('tool.generating') : 'Analyse site'}
          </button>
        </div>
      </div>

      <div className="tool-page">
        {/* Checklist selector */}
        <div className="card card-pad">
          <h3 className="h3" style={{ marginBottom: 16, fontSize: 15 }}>What to check</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CHECKLIST.map((item, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={checks[i]}
                  onChange={() => setChecks(c => c.map((v, j) => j === i ? !v : v))}
                  style={{ accentColor: 'var(--accent)', width: 15, height: 15 }}
                />
                <span style={{ color: checks[i] ? 'var(--fg)' : 'var(--fg-4)' }}>{item}</span>
              </label>
            ))}
          </div>

          <div className="hr" style={{ margin: '20px 0' }} />
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
            <span className="muted">{t('tool.cost')}</span>
            <span className="tabular"><b>{tool.credits}</b> {t('tool.credits')}</span>
          </div>
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
              <div className="result-body">{output}</div>
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
