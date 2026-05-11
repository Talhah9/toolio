import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Glyph } from '../components/Glyph';
import { ToolIcon } from '../components/ToolIcon';
import { PlanBadge } from '../components/PlanBadge';
import { TOOLS } from '../data/catalog';
import { useApp } from '../context/AppContext';

export function Dashboard() {
  const navigate = useNavigate();
  const { credits, plan } = useApp();
  const low = credits < 50;

  return (
    <>
      <AppHeader />
      <div className="page-pad">
        <div style={{ marginBottom: 28 }}>
          <h1 className="h1" style={{ marginBottom: 6 }}>Vos outils</h1>
          <p className="muted">Choisissez un outil pour commencer. Les crédits sont décomptés au moment de la génération.</p>
        </div>

        {low && (
          <div className="banner">
            <span className="row" style={{ gap: 10 }}>
              <Glyph name="lightning" size={14} />
              Vous approchez de la limite — il vous reste <b style={{ marginLeft: 4 }}>{credits} crédits</b>.
            </span>
            <button className="btn btn-sm" style={{ background: 'var(--warn-fg)', color: '#fff' }} onClick={() => navigate('/pricing')}>
              Recharger
            </button>
          </div>
        )}

        {plan === 'free' && !low && (
          <div className="banner banner-accent">
            <span className="row" style={{ gap: 10 }}>
              <Glyph name="sparkle" size={14} />
              Débloquez les 6 outils Pro et 500 crédits/mois pour 49€.
            </span>
            <button className="btn btn-sm" onClick={() => navigate('/pricing')}>
              Passer au Pro
            </button>
          </div>
        )}

        <div className="tools-grid">
          {TOOLS.map(t => {
            const locked = t.plan === 'pro' && plan === 'free';
            return (
              <div
                key={t.id}
                className="tool-card"
                onClick={() => locked ? navigate('/pricing') : navigate(`/tools/${t.id}`)}
                style={locked ? { opacity: 0.7 } : {}}
              >
                <div className="tool-card-head">
                  <ToolIcon tool={t} size="lg" />
                  <PlanBadge plan={t.plan} />
                </div>
                <h3 className="tool-card-title">{t.name}</h3>
                <p className="tool-card-desc">{t.desc}</p>
                <div className="tool-card-foot">
                  <span className="tabular">{t.credits} crédits{t.unit ? ` / ${t.unit}` : ''}</span>
                  {locked
                    ? <span className="row" style={{ gap: 4, color: 'var(--fg-4)' }}><Glyph name="lock" size={12} /> Pro</span>
                    : <span className="row" style={{ gap: 4 }}>Utiliser <Glyph name="arrow-right" size={12} /></span>
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
