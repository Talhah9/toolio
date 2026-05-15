import { useNavigate } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { Glyph } from './Glyph';
import { PlanBadge } from './PlanBadge';
import { getToolText } from '../data/catalog';
import { useLang } from '../context/LanguageContext';
import { TEMPLATES } from '../data/templates';

export function ToolIntro({ tool, onStart }) {
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const { name, desc } = getToolText(tool, lang);

  const bullets = [
    t(`tool.intro.${tool.id}.b1`),
    t(`tool.intro.${tool.id}.b2`),
    t(`tool.intro.${tool.id}.b3`),
  ];

  const costLabel = tool.credits === 0
    ? t('tool.intro.cost.free')
    : `${tool.credits} ${t('tool.intro.cost.credits')}`;

  const isFree = tool.credits === 0;
  const templates = TEMPLATES[tool.id] || null;

  return (
    <>
      <style>{`
        @keyframes introIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tool-intro-card { animation: introIn 0.3s ease-out both; }
      `}</style>

      <AppHeader />

      <div className="page-pad" style={{ display: 'flex', justifyContent: 'center', paddingTop: 56 }}>
        <div className="tool-intro-card" style={{ maxWidth: 460, width: '100%' }}>

          {/* Breadcrumb */}
          <div className="breadcrumb" style={{ marginBottom: 32 }}>
            <a onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</a>
            <Glyph name="chevron-right" size={12} />
            <span>{t('tool.breadcrumb.tools')}</span>
            <Glyph name="chevron-right" size={12} />
            <span className="current">{getToolText(tool, lang).short}</span>
          </div>

          {/* Icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'var(--accent-soft)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Glyph name={tool.glyph} size={30} />
            </div>
          </div>

          {/* Name + badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
            <h1 className="h1" style={{ margin: 0 }}>{name}</h1>
            <PlanBadge plan={tool.plan} />
            {tool.franceOnly && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                border: '1px solid #dbeafe', background: '#eff6ff', color: '#1d4ed8',
              }}>
                🇫🇷
              </span>
            )}
          </div>

          {/* Description */}
          <p className="muted" style={{ fontSize: 15, textAlign: 'center', maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.6 }}>
            {desc}
          </p>

          {/* Cost pill */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
              background: isFree ? '#F0FDF4' : 'var(--accent-soft)',
              color: isFree ? '#15803D' : 'var(--accent)',
              border: `1px solid ${isFree ? '#BBF7D0' : 'var(--accent-soft)'}`,
            }}>
              {isFree
                ? <><Glyph name="check" size={12} /> {costLabel}</>
                : <><Glyph name="sparkle" size={12} /> {costLabel}</>
              }
            </span>
          </div>

          {/* Bullets */}
          <div style={{
            background: 'var(--bg-soft)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '20px 24px',
            display: 'flex', flexDirection: 'column', gap: 13,
            marginBottom: 28,
          }}>
            {bullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14 }}>
                <span style={{ color: '#10B981', flexShrink: 0, marginTop: 1 }}>
                  <Glyph name="check" size={14} />
                </span>
                <span style={{ color: 'var(--fg-2)', lineHeight: 1.5 }}>{b}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            className="btn btn-accent btn-lg btn-block"
            onClick={() => onStart(null)}
            style={{ cursor: 'pointer' }}
          >
            {t('tool.intro.cta')} →
          </button>

          {/* Templates */}
          {templates && (
            <div style={{ marginTop: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--fg-4)', marginBottom: 10 }}>
                {t('tool.intro.templates')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {templates.map(tpl => (
                  <button
                    key={tpl.id}
                    className="btn btn-ghost btn-sm"
                    onClick={() => onStart(tpl.data)}
                    style={{
                      justifyContent: 'flex-start', gap: 10,
                      border: '1px solid var(--border)',
                      borderRadius: 10, padding: '10px 14px',
                      fontSize: 13, fontWeight: 500,
                      color: 'var(--fg-2)',
                      cursor: 'pointer',
                    }}
                  >
                    <Glyph name="arrow-right" size={13} />
                    {lang === 'fr' ? tpl.label_fr : tpl.label_en}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
