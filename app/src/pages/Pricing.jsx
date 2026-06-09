import { useState, useEffect } from 'react';
import { AppHeader } from '../components/AppHeader';
import { Checkout } from '../components/Checkout';
import { Glyph } from '../components/Glyph';
import { PlanBadge } from '../components/PlanBadge';
import { PACKS } from '../data/catalog';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { useCurrency } from '../hooks/useCurrency';

export function Pricing() {
  const { credits, plan, isPro, user, session } = useApp();
  const { t } = useLang();
  const { format, convert } = useCurrency();
  const [showCheckout, setShowCheckout] = useState(null);
  const [renewalDate, setRenewalDate] = useState(null);
  const [cancelAt, setCancelAt] = useState(null);

  useEffect(() => {
    if (!user?.email || !isPro) return;
    fetch('/api/subscription-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ userId: session?.user?.id, userEmail: user.email }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.renewalDate) setRenewalDate(json.renewalDate);
        if (json.cancelAt) { setCancelAt(json.cancelAt); setRenewalDate(null); }
      })
      .catch(() => {});
  }, [user, isPro]);

  return (
    <>
      <AppHeader />
      <div className="page-pad">
        <div style={{ marginBottom: 32 }}>
          <h1 className="h1" style={{ marginBottom: 6 }}>{t('pricing.title')}</h1>
          <p className="muted">{t('pricing.subtitle')}</p>
        </div>

        {/* Current plan summary */}
        <div className="kv-list" style={{ marginBottom: isPro && cancelAt ? 12 : 40 }}>
          <div className="kv-row">
            <span className="k">{t('pricing.current-plan')}</span>
            <span className="v">{plan === 'pro' ? 'Pro' : 'Free'}</span>
            <PlanBadge plan={plan} />
          </div>
          <div className="kv-row">
            <span className="k">{t('pricing.credits-left')}</span>
            <span className="v tabular">{credits} {t('header.credits')}</span>
            <span className="muted" style={{ fontSize: 13 }}>
              {plan === 'free' ? t('pricing.free.renewal') : !cancelAt ? t('pricing.pro.renewal') : ''}
            </span>
          </div>
          {isPro && cancelAt ? (
            <div className="kv-row">
              <span className="k">Accès Pro jusqu'au</span>
              <span className="v" style={{ color: '#D97706', fontWeight: 500 }}>{cancelAt}</span>
              <span />
            </div>
          ) : (
            <div className="kv-row">
              <span className="k">{t('pricing.next-renewal')}</span>
              <span className="v">{!isPro ? '—' : renewalDate || '—'}</span>
              <span className="muted" style={{ fontSize: 13 }}>{plan === 'pro' ? t('pricing.pro.billing') : t('pricing.no-billing')}</span>
            </div>
          )}
        </div>
        {isPro && cancelAt && (
          <p style={{ fontSize: 13, color: '#D97706', marginBottom: 40 }}>
            Ton abonnement sera résilié le {cancelAt}. Tu gardes l'accès Pro jusqu'à cette date.
          </p>
        )}

        {/* Plans */}
        <div style={{ marginBottom: 16 }}>
          <h2 className="h2" style={{ marginBottom: 4 }}>{t('pricing.plans.title')}</h2>
          <p className="muted" style={{ marginBottom: 24 }}>{t('pricing.plans.subtitle')}</p>
        </div>
        <div className="pricing-grid" style={{ marginBottom: 64 }}>
          <div className="plan">
            <div>
              <h3 className="plan-name">{t('pricing.free.name')}</h3>
              <p className="muted" style={{ fontSize: 13, margin: '0 0 24px' }}>{t('pricing.free.tagline')}</p>
              <p className="plan-price">{t('pricing.free.price')}<small>{t('pricing.free.period')}</small></p>
            </div>
            <ul className="plan-features">
              <li><Glyph name="check" size={14} /><span>{t('pricing.free.f1')}</span></li>
              <li><Glyph name="check" size={14} /><span>{t('pricing.free.f2')}</span></li>
              <li><Glyph name="check" size={14} /><span>{t('pricing.free.f3')}</span></li>
            </ul>
            {plan === 'free'
              ? <button className="btn btn-secondary btn-lg btn-block" disabled>{t('pricing.free.current')}</button>
              : <button className="btn btn-secondary btn-lg btn-block">{t('pricing.free.downgrade')}</button>
            }
          </div>

          <div className="plan featured">
            <div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3 className="plan-name">{t('pricing.pro.name')}</h3>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>{t('pricing.pro.recommended')}</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: '0 0 24px' }}>{t('pricing.pro.tagline')}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <p className="plan-price" style={{ margin: 0 }}>{format(15)}<small style={{ color: 'rgba(255,255,255,0.6)' }}>{t('pricing.pro.period')}</small></p>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>{format(49)}</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{t('pricing.pro.promo-note')}</p>
            </div>
            <ul className="plan-features" style={{ color: 'rgba(255,255,255,0.85)' }}>
              <li><Glyph name="check" size={14} /><span>{t('pricing.pro.f1')}</span></li>
              <li><Glyph name="check" size={14} /><span>{t('pricing.pro.f2')}</span></li>
              <li><Glyph name="check" size={14} /><span>{t('pricing.pro.f3')}</span></li>
              <li><Glyph name="check" size={14} /><span>{t('pricing.pro.f4')}</span></li>
            </ul>
            {plan === 'pro'
              ? <button className="btn btn-block btn-lg" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }} disabled>{t('pricing.pro.current')}</button>
              : <button className="btn btn-block btn-lg" style={{ background: '#fff', color: 'var(--fg)' }} onClick={() => setShowCheckout({ type: 'pro' })}>{t('pricing.pro.cta')}</button>
            }
          </div>
        </div>

        {/* Packs */}
        <div style={{ marginBottom: 16 }}>
          <h2 className="h2" style={{ marginBottom: 4 }}>{t('pricing.packs.title')}</h2>
          <p className="muted" style={{ marginBottom: 24 }}>{t('pricing.packs.subtitle')}</p>
        </div>
        <div className="packs-grid">
          {PACKS.map(p => (
            <div key={p.id} className={`pack ${p.featured ? 'featured' : ''}`}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted" style={{ fontSize: 13 }}>{p.label}</span>
                {p.featured && <span className="badge badge-outline">{t('pricing.packs.popular')}</span>}
              </div>
              <p className="pack-credits tabular">{p.credits}<span className="muted" style={{ fontSize: 14, fontWeight: 400, marginLeft: 6 }}>{t('header.credits')}</span></p>
              <p className="pack-price">{format(p.price)}</p>
              <p className="pack-meta">{t('pricing.packs.no-expiry')} · {(convert(p.price) / p.credits).toFixed(2)}{t('pricing.packs.per-credit')}</p>
              <button className="btn btn-secondary btn-block" style={{ marginTop: 8 }} onClick={() => setShowCheckout({ type: 'pack', pack: p })}>
                {t('pricing.packs.buy')}
              </button>
            </div>
          ))}
        </div>

        {showCheckout && (
          <Checkout
            data={showCheckout}
            onClose={() => setShowCheckout(null)}
          />
        )}
      </div>
    </>
  );
}
