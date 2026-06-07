import { useNavigate } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { Glyph } from './Glyph';
import { getToolText } from '../data/catalog';

export function ToolIntro({ tool, credits, lang, onStart }) {
  const navigate = useNavigate();
  const { name, intro, features } = getToolText(tool, lang);
  const accent = tool.accent || '#4F46E5';

  const creditLabel = tool.credits === 0
    ? (lang === 'fr' ? 'Gratuit — aucun crédit requis' : 'Free — no credits required')
    : `${tool.credits} ${lang === 'fr' ? 'crédits par génération' : 'credits per generation'}`;

  const planLabel  = tool.plan === 'free' ? (lang === 'fr' ? 'Gratuit' : 'Free') : 'Pro';
  const planBg     = tool.plan === 'free' ? '#D1FAE5' : 'rgba(79,70,229,0.1)';
  const planColor  = tool.plan === 'free' ? '#065F46' : '#4F46E5';
  const creditsDisplay = credits === null ? '—' : credits;

  return (
    <>
      <style>{`
        @keyframes introFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tool-intro-card { animation: introFadeUp 0.3s ease-out both; }
      `}</style>
      <AppHeader />
      <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div
          className="tool-intro-card"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '40px 40px 36px',
            maxWidth: 580,
            width: '100%',
            boxShadow: '0 8px 40px rgba(15,15,60,0.08)',
          }}
        >
          {/* Back link */}
          <button
            onClick={() => navigate('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)', fontSize: 13, padding: 0, marginBottom: 28 }}
          >
            <Glyph name="arrow-left" size={12} />
            Dashboard
          </button>

          {/* Icon + name */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, flexShrink: 0,
              background: `${accent}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Glyph name={tool.glyph} size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--fg)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  {name}
                </h1>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: planBg, color: planColor, whiteSpace: 'nowrap' }}>
                  {planLabel}
                </span>
                {tool.franceOnly && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 20, border: '1px solid #dbeafe', background: '#eff6ff', color: '#1d4ed8', whiteSpace: 'nowrap' }}>
                    🇫🇷 France
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.65 }}>
                {intro}
              </p>
            </div>
          </div>

          {/* Credit cost pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: tool.credits === 0 ? '#D1FAE5' : `${accent}10`,
            border: `1px solid ${tool.credits === 0 ? '#A7F3D0' : `${accent}28`}`,
            borderRadius: 10, padding: '8px 14px', marginBottom: 24,
            fontSize: 13, fontWeight: 600,
            color: tool.credits === 0 ? '#065F46' : accent,
          }}>
            <Glyph name="lightning" size={13} />
            {creditLabel}
          </div>

          {/* Feature bullets */}
          {features.length > 0 && (
            <ul style={{ margin: '0 0 28px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {features.map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--fg)', lineHeight: 1.5 }}>
                  <span style={{ color: accent, fontWeight: 800, fontSize: 15, flexShrink: 0, marginTop: 1 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          )}

          {/* CTA */}
          <button
            onClick={onStart}
            style={{
              width: '100%', padding: '14px 24px',
              background: accent, color: '#fff',
              border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 800, cursor: 'pointer',
              letterSpacing: '0.01em',
              boxShadow: `0 4px 16px ${accent}38`,
              transition: 'opacity 0.15s, transform 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {lang === 'fr' ? "Accéder à l'outil →" : 'Open the tool →'}
          </button>

          {/* Current credits */}
          <p style={{ textAlign: 'center', margin: '14px 0 0', fontSize: 12, color: 'var(--fg-4)' }}>
            {lang === 'fr' ? `Vos crédits actuels : ${creditsDisplay}` : `Your current credits: ${creditsDisplay}`}
          </p>
        </div>
      </div>
    </>
  );
}
