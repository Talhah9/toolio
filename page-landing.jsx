// Toolio — Landing page (logged out)

const Landing = ({ navigate }) => {
  React.useEffect(() => {
    if (window.__pendingScrollTo) {
      const id = window.__pendingScrollTo;
      window.__pendingScrollTo = null;
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <>
      <MarketingNav navigate={navigate} page="landing" />

      {/* HERO */}
      <section className="hero">
        <div className="container-narrow">
          <span className="hero-eyebrow">
            <span className="pill">Nouveau</span>
            <span>9 outils IA, un seul abonnement</span>
          </span>
          <h1 className="h-display">
            La boîte à outils IA des freelances&nbsp;français.
          </h1>
          <p className="hero-sub">
            Audits, contenus, contrats, factures. Toolio remplace une demi-douzaine d'abonnements en un seul, à un prix juste.
          </p>
          <div className="hero-cta">
            <button className="btn btn-accent btn-lg" onClick={() => navigate('auth', { mode: 'register' })}>
              Essayer gratuitement
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => {
              const el = document.getElementById('tools');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}>
              Voir les outils
            </button>
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 20 }}>
            50 crédits offerts. Sans carte bancaire.
          </p>
        </div>
      </section>

      {/* MOCK SCREENSHOT */}
      <section style={{ padding: '0 0 64px' }}>
        <div className="container">
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 8,
            background: 'var(--bg-soft)'
          }}>
            <LandingDashboardPreview />
          </div>
        </div>
      </section>

      {/* TOOLS GRID */}
      <section id="tools" className="section">
        <div className="container">
          <div className="section-hd">
            <span className="eyebrow">Les outils</span>
            <h2 className="h1" style={{ maxWidth: 600 }}>Tout ce dont vous avez besoin pour avancer.</h2>
            <p className="muted" style={{ maxWidth: 560 }}>
              Neuf outils pensés pour les freelances et e-commerçants. Trois sont gratuits, six débloqués avec Pro.
            </p>
          </div>
          <div className="tools-grid">
            {TOOLS.map(t => (
              <div key={t.id} className="tool-card" onClick={() => navigate('auth', { mode: 'register' })}>
                <div className="tool-card-head">
                  <ToolIcon tool={t} size="lg" />
                  <PlanBadge plan={t.plan} />
                </div>
                <h3 className="tool-card-title">{t.name}</h3>
                <p className="tool-card-desc">{t.desc}</p>
                <div className="tool-card-foot">
                  <span className="tabular">{t.credits} crédits{t.unit ? ` / ${t.unit}` : ''}</span>
                  <Glyph name="arrow-right" size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-hd">
            <span className="eyebrow">Tarifs</span>
            <h2 className="h1">Simple. Sans surprise.</h2>
            <p className="muted">Commencez gratuitement, passez Pro quand vous êtes prêt.</p>
          </div>

          <div className="pricing-grid">
            {/* Free */}
            <div className="plan">
              <div>
                <h3 className="plan-name">Free</h3>
                <p className="muted" style={{ fontSize: 13, marginTop: 0, marginBottom: 24 }}>Pour découvrir.</p>
                <p className="plan-price">0€<small>/ mois</small></p>
              </div>
              <ul className="plan-features">
                <li><Glyph name="check" size={14} /><span>50 crédits offerts à l'inscription</span></li>
                <li><Glyph name="check" size={14} /><span>3 outils gratuits</span></li>
                <li><Glyph name="check" size={14} /><span>Facture, statut juridique, contenu LinkedIn</span></li>
                <li><Glyph name="check" size={14} /><span>Recharges à la demande</span></li>
              </ul>
              <button className="btn btn-secondary btn-lg btn-block" onClick={() => navigate('auth', { mode: 'register' })}>
                Commencer gratuitement
              </button>
            </div>

            {/* Pro */}
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
                <li><Glyph name="check" size={14} /><span>500 crédits par mois</span></li>
                <li><Glyph name="check" size={14} /><span>Accès aux 9 outils</span></li>
                <li><Glyph name="check" size={14} /><span>Audits CRO/SEO illimités dans la limite des crédits</span></li>
                <li><Glyph name="check" size={14} /><span>Historique complet</span></li>
                <li><Glyph name="check" size={14} /><span>Support prioritaire</span></li>
              </ul>
              <button className="btn btn-block btn-lg" style={{ background: '#fff', color: 'var(--fg)' }} onClick={() => navigate('auth', { mode: 'register' })}>
                Passer au Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CREDIT PACKS */}
      <section className="section">
        <div className="container">
          <div className="section-hd">
            <span className="eyebrow">Recharges</span>
            <h2 className="h1">Besoin de plus ? Rechargez à la carte.</h2>
            <p className="muted">Les crédits achetés ne s'expirent jamais.</p>
          </div>
          <div className="packs-grid" style={{ maxWidth: 880, margin: '0 auto' }}>
            {PACKS.map(p => (
              <div key={p.id} className={`pack ${p.featured ? 'featured' : ''}`}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="muted" style={{ fontSize: 13 }}>{p.label}</span>
                  {p.featured && <span className="badge badge-outline">Populaire</span>}
                </div>
                <p className="pack-credits tabular">{p.credits}<span className="muted" style={{ fontSize: 14, fontWeight: 400, marginLeft: 6 }}>crédits</span></p>
                <p className="pack-price">{p.price}€ <span className="muted">— soit {(p.price / p.credits).toFixed(2)}€ / crédit</span></p>
                <p className="pack-meta">Sans expiration · Ajoutés instantanément</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section" style={{ paddingTop: 32 }}>
        <div className="container-narrow text-center">
          <h2 className="h1" style={{ marginBottom: 16 }}>Commencez en deux minutes.</h2>
          <p className="muted" style={{ marginBottom: 32 }}>50 crédits offerts. Aucune carte demandée.</p>
          <button className="btn btn-accent btn-lg" onClick={() => navigate('auth', { mode: 'register' })}>
            Créer mon compte
          </button>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
};

// Compact dashboard preview shown on the landing page
const LandingDashboardPreview = () => (
  <div style={{
    background: 'var(--bg)',
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid var(--border)',
    display: 'grid',
    gridTemplateColumns: '180px 1fr',
    height: 420,
  }}>
    <div style={{ padding: 12, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12 }}>
      <div style={{ padding: '6px 8px 12px' }}><Logo size={14} /></div>
      {[
        { name: 'Dashboard', icon: 'home', active: true },
        { name: 'Audit CRO', icon: 'audit' },
        { name: 'Fiches produits', icon: 'product' },
        { name: 'Concurrents', icon: 'compete' },
        { name: 'CGV', icon: 'legal' },
        { name: 'Contrat', icon: 'contract' },
        { name: 'Facture', icon: 'invoice' },
      ].map((it, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 8px', borderRadius: 4,
          background: it.active ? 'var(--bg-hover)' : 'transparent',
          color: it.active ? 'var(--fg)' : 'var(--fg-3)',
          fontWeight: it.active ? 500 : 400,
        }}>
          <Glyph name={it.icon} size={12} />
          <span>{it.name}</span>
        </div>
      ))}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 44, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', fontSize: 12 }}>
        <span className="muted">Bonjour, Léa</span>
        <span className="row" style={{ gap: 8 }}>
          <span className="credits-pill" style={{ height: 24, fontSize: 11 }}><span className="dot" />320 crédits</span>
          <span className="avatar" style={{ width: 22, height: 22, fontSize: 10 }}>LM</span>
        </span>
      </div>
      <div style={{ padding: 16, flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 12 }}>Vos outils</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {TOOLS.slice(0, 6).map(t => (
            <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 96 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="glyph" style={{ width: 24, height: 24 }}><Glyph name={t.glyph} size={13} /></span>
                <PlanBadge plan={t.plan} />
              </div>
              <div style={{ fontWeight: 600, color: 'var(--fg)' }}>{t.short}</div>
              <div style={{ color: 'var(--fg-4)', fontSize: 10, marginTop: 'auto' }}>{t.credits} crédits</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

window.Landing = Landing;
