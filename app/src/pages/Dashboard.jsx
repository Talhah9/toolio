import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Glyph } from '../components/Glyph';
import { ToolIcon } from '../components/ToolIcon';
import { PlanBadge } from '../components/PlanBadge';
import { useToast } from '../components/Toast';
import { TOOLS, getToolText } from '../data/catalog';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';

export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { credits, refreshCredits } = useApp();
  const { lang, t } = useLang();
  const [toast, ToastEl] = useToast();
  const low = credits !== null && credits < 15;

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
          {TOOLS.map(tool => {
            const { name, desc } = getToolText(tool, lang);
            return (
              <div
                key={tool.id}
                className="tool-card"
                onClick={() => navigate(`/tools/${tool.id}`)}
              >
                <div className="tool-card-head">
                  <ToolIcon tool={tool} size="lg" />
                  <div className="row" style={{ gap: 6 }}>
                    {tool.franceOnly && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                        border: '1px solid #dbeafe', background: '#eff6ff', color: '#1d4ed8', whiteSpace: 'nowrap',
                      }}>
                        🇫🇷 France
                      </span>
                    )}
                    <PlanBadge plan={tool.plan} />
                  </div>
                </div>
                <h3 className="tool-card-title">{name}</h3>
                <p className="tool-card-desc">{desc}</p>
                <div className="tool-card-foot">
                  {tool.credits === 0
                    ? <span style={{ color: '#10B981', fontWeight: 600, fontSize: 13 }}>{t('tool.free')}</span>
                    : <span className="tabular">{tool.credits} {t('tool.credits')}{tool.unit ? ` / ${tool.unit}` : ''}</span>
                  }
                  <span className="row" style={{ gap: 4 }}>{t('dashboard.use')} <Glyph name="arrow-right" size={12} /></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {ToastEl}
    </>
  );
}
