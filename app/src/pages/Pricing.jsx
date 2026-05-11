import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Checkout } from '../components/Checkout';
import { Glyph } from '../components/Glyph';
import { PlanBadge } from '../components/PlanBadge';
import { useToast } from '../components/Toast';
import { PACKS } from '../data/catalog';
import { useApp } from '../context/AppContext';

export function Pricing() {
  const navigate = useNavigate();
  const { credits, plan, upgrade, addPack } = useApp();
  const [showCheckout, setShowCheckout] = useState(null);
  const [toast, ToastEl] = useToast();

  return (
    <>
      <AppHeader />
      <div className="page-pad">
        <div style={{ marginBottom: 32 }}>
          <h1 className="h1" style={{ marginBottom: 6 }}>Plan & crédits</h1>
          <p className="muted">Gérez votre abonnement et rechargez vos crédits.</p>
        </div>

        {/* Current plan summary */}
        <div className="kv-list" style={{ marginBottom: 40 }}>
          <div className="kv-row">
            <span className="k">Plan actuel</span>
            <span className="v">{plan === 'pro' ? 'Pro' : 'Free'}</span>
            <PlanBadge plan={plan} />
          </div>
          <div className="kv-row">
            <span className="k">Crédits restants</span>
            <span className="v tabular">{credits} crédits</span>
            <span className="muted" style={{ fontSize: 13 }}>{plan === 'pro' ? 'Renouvelés le 1er du mois' : '50 offerts à l\'inscription'}</span>
          </div>
          <div className="kv-row">
            <span className="k">Prochaine échéance</span>
            <span className="v">{plan === 'pro' ? '1er juin 2026' : '—'}</span>
            <span className="muted" style={{ fontSize: 13 }}>{plan === 'pro' ? '49,00€' : 'Aucune'}</span>
          </div>
        </div>

        {/* Plans */}
        <div style={{ marginBottom: 16 }}>
          <h2 className="h2" style={{ marginBottom: 4 }}>Abonnements</h2>
          <p className="muted" style={{ marginBottom: 24 }}>Tout-illimité dans la limite des crédits mensuels.</p>
        </div>
        <div className="pricing-grid" style={{ marginBottom: 64 }}>
          <div className="plan">
            <div>
              <h3 className="plan-name">Free</h3>
              <p className="muted" style={{ fontSize: 13, margin: '0 0 24px' }}>Pour découvrir.</p>
              <p className="plan-price">0€<small>/ mois</small></p>
            </div>
            <ul className="plan-features">
              <li><Glyph name="check" size={14} /><span>50 crédits offerts</span></li>
              <li><Glyph name="check" size={14} /><span>3 outils gratuits</span></li>
              <li><Glyph name="check" size={14} /><span>Recharges à la demande</span></li>
            </ul>
            {plan === 'free'
              ? <button className="btn btn-secondary btn-lg btn-block" disabled>Plan actuel</button>
              : <button className="btn btn-secondary btn-lg btn-block">Rétrograder</button>
            }
          </div>

          <div className="plan featured">
            <div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3 className="plan-name">Pro</h3>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>Recommandé</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: '0 0 24px' }}>Pour aller vite.</p>
              <p className="plan-price">49€<small style={{ color: 'rgba(255,255,255,0.6)' }}>/ mois</small></p>
            </div>
            <ul className="plan-features" style={{ color: 'rgba(255,255,255,0.85)' }}>
              <li><Glyph name="check" size={14} /><span>500 crédits / mois</span></li>
              <li><Glyph name="check" size={14} /><span>Accès aux 9 outils</span></li>
              <li><Glyph name="check" size={14} /><span>Historique complet & exports</span></li>
              <li><Glyph name="check" size={14} /><span>Support prioritaire</span></li>
            </ul>
            {plan === 'pro'
              ? <button className="btn btn-block btn-lg" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }} disabled>Plan actuel</button>
              : <button className="btn btn-block btn-lg" style={{ background: '#fff', color: 'var(--fg)' }} onClick={() => setShowCheckout({ type: 'pro' })}>Passer au Pro</button>
            }
          </div>
        </div>

        {/* Packs */}
        <div style={{ marginBottom: 16 }}>
          <h2 className="h2" style={{ marginBottom: 4 }}>Recharges de crédits</h2>
          <p className="muted" style={{ marginBottom: 24 }}>Sans expiration. Ajoutés instantanément à votre compte.</p>
        </div>
        <div className="packs-grid">
          {PACKS.map(p => (
            <div key={p.id} className={`pack ${p.featured ? 'featured' : ''}`}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted" style={{ fontSize: 13 }}>{p.label}</span>
                {p.featured && <span className="badge badge-outline">Populaire</span>}
              </div>
              <p className="pack-credits tabular">{p.credits}<span className="muted" style={{ fontSize: 14, fontWeight: 400, marginLeft: 6 }}>crédits</span></p>
              <p className="pack-price">{p.price}€</p>
              <p className="pack-meta">Sans expiration · {(p.price / p.credits).toFixed(2)}€ par crédit</p>
              <button className="btn btn-secondary btn-block" style={{ marginTop: 8 }} onClick={() => setShowCheckout({ type: 'pack', pack: p })}>
                Acheter
              </button>
            </div>
          ))}
        </div>

        {showCheckout && (
          <Checkout
            data={showCheckout}
            onClose={() => setShowCheckout(null)}
            onSuccess={() => {
              if (showCheckout.type === 'pro') { upgrade(); toast('Bienvenue dans Pro !'); }
              else { addPack(showCheckout.pack.credits); toast(`+${showCheckout.pack.credits} crédits ajoutés`); }
              setShowCheckout(null);
            }}
          />
        )}
        {ToastEl}
      </div>
    </>
  );
}
