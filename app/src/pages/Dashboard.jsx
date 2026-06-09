import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Glyph } from '../components/Glyph';
import { ToolIcon } from '../components/ToolIcon';
import { PlanBadge } from '../components/PlanBadge';
import { useToast } from '../components/Toast';
import { TOOLS, getToolText } from '../data/catalog';
import { CoachingBanner } from '../components/CoachingBanner';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';

export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { credits, plan, isPro, refreshCredits } = useApp();
  const { lang, t } = useLang();
  const [toast, ToastEl] = useToast();
  const low = credits !== null && credits < 15 && !isPro;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment') === 'success') {
      toast(t('payment.success'));
      refreshCredits();
      navigate('/dashboard', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <AppHeader />
      <div className="page-pad">
        <div style={{ marginBottom: 28 }}>
          <h1 className="h1" style={{ marginBottom: 6 }}>{t('dashboard.title')}</h1>
          <p className="muted">{t('dashboard.subtitle')}</p>
        </div>

        {isPro && <CoachingBanner />}

        {!isPro && (
          <div className="banner" style={{ marginBottom: 16 }}>
            <span className="row" style={{ gap: 10 }}>
              <Glyph name="lightning" size={14} />
              {t('dashboard.banner.pro')}
            </span>
            <button className="btn btn-sm" style={{ background: 'var(--accent)', color: '#fff' }} onClick={() => navigate('/pricing')}>
              {t('dashboard.banner.pro.cta')}
            </button>
          </div>
        )}

        {low && (
          <div className="banner">
            <span className="row" style={{ gap: 10 }}>
              <Glyph name="lightning" size={14} />
              {t('dashboard.banner.low')} <b style={{ marginLeft: 4, marginRight: 4 }}>{credits}</b> {t('dashboard.banner.low.credits')}
            </span>
            <button className="btn btn-sm" style={{ background: 'var(--warn-fg)', color: '#fff' }} onClick={() => navigate('/pricing')}>
              {t('dashboard.banner.low.cta')}
            </button>
          </div>
        )}

        <div className="tools-grid">
          {TOOLS.flatMap(tool => {
            const { name, desc } = getToolText(tool, lang);
            const locked = tool.plan === 'pro' && !isPro;

            const toolCard = (
              <div
                key={tool.id}
                className="tool-card"
                style={{
                  ...(locked ? { opacity: 0.55, cursor: 'default' } : undefined),
                  ...(tool.disabled ? { opacity: 0.6, cursor: 'default', position: 'relative', overflow: 'hidden' } : undefined),
                }}
                onClick={() => {
                  if (tool.disabled) return;
                  locked ? navigate('/pricing') : navigate(`/tools/${tool.id}`);
                }}
              >
                {tool.disabled && (
                  <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, background: '#6B7280', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, letterSpacing: '0.04em' }}>
                    Bientôt disponible
                  </div>
                )}
                <div className="tool-card-head">
                  <ToolIcon tool={tool} size="lg" />
                  <div className="row" style={{ gap: 6 }}>
                    {tool.id === 'linkedin-content' && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: '#fad02c', color: '#78350F', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
                        ⭐ BEST SELLER
                      </span>
                    )}
                    {tool.franceOnly && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                        border: '1px solid #dbeafe', background: '#eff6ff', color: '#1d4ed8', whiteSpace: 'nowrap',
                      }}>
                        🇫🇷 France
                      </span>
                    )}
                    {!tool.disabled && <PlanBadge plan={tool.plan} />}
                  </div>
                </div>
                <h3 className="tool-card-title">{name}</h3>
                <p className="tool-card-desc">{desc}</p>
                <div className="tool-card-foot">
                  {tool.disabled ? (
                    <span style={{ color: 'var(--fg-4)', fontWeight: 500, fontSize: 13 }}>En cours de développement</span>
                  ) : locked ? (
                    <span className="row" style={{ gap: 6, color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}>
                      <Glyph name="lock" size={12} />
                      {t('dashboard.lock.cta')}
                    </span>
                  ) : (
                    <>
                      {tool.credits === 0
                        ? <span style={{ color: '#10B981', fontWeight: 600, fontSize: 13 }}>{t('tool.free')}</span>
                        : <span className="tabular">{tool.credits} {t('tool.credits')}{tool.unit ? ` / ${tool.unit}` : ''}</span>
                      }
                      <span className="row" style={{ gap: 4 }}>{t('dashboard.use')} <Glyph name="arrow-right" size={12} /></span>
                    </>
                  )}
                </div>
              </div>
            );

            if (tool.id === 'mission-finder') {
              return [toolCard, (
                <div key="coaching-card" className="tool-card" onClick={() => navigate('/coaching')}>
                  <div className="tool-card-head">
                    <span className="glyph glyph-lg">
                      <Glyph name="calendar" size={20} />
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: 'rgba(250,208,44,0.14)', border: '1px solid rgba(250,208,44,0.3)', color: '#b45309', whiteSpace: 'nowrap' }}>
                      80€
                    </span>
                  </div>
                  <h3 className="tool-card-title">{t('coaching.card.title')}</h3>
                  <p className="tool-card-desc">{t('coaching.card.desc')}</p>
                  <div className="tool-card-foot">
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#d97706' }}>{t('coaching.card.foot')}</span>
                    <span className="row" style={{ gap: 4 }}>{t('dashboard.use')} <Glyph name="arrow-right" size={12} /></span>
                  </div>
                </div>
              ), (
                <div key="community-card" className="tool-card" style={{ opacity: 0.55, cursor: 'default', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, background: '#6B7280', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, letterSpacing: '0.04em' }}>
                    Bientôt
                  </div>
                  <div className="tool-card-head">
                    <span className="glyph glyph-lg">
                      <Glyph name="community" size={20} />
                    </span>
                  </div>
                  <h3 className="tool-card-title">{t('nav.community')}</h3>
                  <p className="tool-card-desc">Entraide, partage et opportunités entre les membres du club.</p>
                  <div className="tool-card-foot">
                    <span style={{ color: 'var(--fg-4)', fontWeight: 500, fontSize: 13 }}>En cours de développement</span>
                  </div>
                </div>
              )];
            }

            return [toolCard];
          })}
        </div>
      </div>
      {ToastEl}
    </>
  );
}
