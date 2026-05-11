// Toolio — Glyph icons + UI primitives
// Each glyph is an original monochrome geometric shape, drawn from primitives only.
// Style: 1.5 stroke, 16x16 viewBox, currentColor.

const Glyph = ({ name, size = 16 }) => {
  const s = size;
  const stroke = 1.5;
  const props = { width: s, height: s, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };

  switch (name) {
    // 1. Audit CRO + SEO — bullseye/target
    case 'audit':
      return (
        <svg {...props}>
          <circle cx="8" cy="8" r="6" />
          <circle cx="8" cy="8" r="3" />
          <circle cx="8" cy="8" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      );
    // 2. Fiches produits — stacked rectangles
    case 'product':
      return (
        <svg {...props}>
          <rect x="2.5" y="5" width="11" height="8" rx="1" />
          <path d="M4.5 3.5h7" />
          <path d="M2.5 8h11" />
        </svg>
      );
    // 3. Concurrents — two overlapping diamonds (compare)
    case 'compete':
      return (
        <svg {...props}>
          <path d="M5.5 2.5l3 3-3 3-3-3 3-3z" />
          <path d="M10.5 7.5l3 3-3 3-3-3 3-3z" />
        </svg>
      );
    // 4. CGV / Mentions légales — document with seal
    case 'legal':
      return (
        <svg {...props}>
          <path d="M3.5 2.5h6l3 3v8a0 0 0 0 1 0 0h-9z" />
          <path d="M9.5 2.5v3h3" />
          <path d="M5.5 9h5" />
          <path d="M5.5 11h3" />
        </svg>
      );
    // 5. Contrat freelance — handshake abstraction (two arrows meeting)
    case 'contract':
      return (
        <svg {...props}>
          <path d="M2 8h4l1.5 1.5L9 8h5" />
          <path d="M5 5l-3 3 3 3" />
          <path d="M11 5l3 3-3 3" />
        </svg>
      );
    // 6. Facture PDF — receipt with zigzag bottom
    case 'invoice':
      return (
        <svg {...props}>
          <path d="M3.5 2.5h9v11l-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1z" />
          <path d="M5.5 5.5h5" />
          <path d="M5.5 8h5" />
        </svg>
      );
    // 7. Statut juridique — branching paths / decision
    case 'status':
      return (
        <svg {...props}>
          <circle cx="8" cy="3" r="1.2" />
          <circle cx="3.5" cy="13" r="1.2" />
          <circle cx="12.5" cy="13" r="1.2" />
          <path d="M8 4.2v3M8 7.5l-4 4M8 7.5l4 4" />
        </svg>
      );
    // 8. Contenu LinkedIn — speech bubble with dots
    case 'linkedin-content':
      return (
        <svg {...props}>
          <path d="M2.5 4a1.5 1.5 0 0 1 1.5-1.5h8A1.5 1.5 0 0 1 13.5 4v5A1.5 1.5 0 0 1 12 10.5H6.5L4 13v-2.5h0A1.5 1.5 0 0 1 2.5 9z" />
          <circle cx="6" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
          <circle cx="8" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
          <circle cx="10" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
        </svg>
      );
    // 9. Optimisation profil LinkedIn — concentric squares (refine)
    case 'linkedin-profile':
      return (
        <svg {...props}>
          <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
          <circle cx="8" cy="6.5" r="1.5" />
          <path d="M5 12c0-1.5 1.3-2.5 3-2.5s3 1 3 2.5" />
        </svg>
      );

    // Nav / utility
    case 'home':
      return <svg {...props}><path d="M2.5 7.5l5.5-5 5.5 5v6h-4v-4h-3v4h-4z" /></svg>;
    case 'account':
      return <svg {...props}><circle cx="8" cy="5.5" r="2.5" /><path d="M3 13.5c0-2.5 2.2-4 5-4s5 1.5 5 4" /></svg>;
    case 'billing':
      return <svg {...props}><rect x="2" y="4" width="12" height="9" rx="1.5" /><path d="M2 7h12" /><path d="M5 11h2" /></svg>;
    case 'logout':
      return <svg {...props}><path d="M9 3.5H4.5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1H9" /><path d="M11 5.5l2.5 2.5L11 10.5" /><path d="M7 8h6.5" /></svg>;
    case 'sparkle':
      return <svg {...props}><path d="M8 2v4M8 10v4M2 8h4M10 8h4" /></svg>;
    case 'check':
      return <svg {...props}><path d="M3 8.5l3 3 7-7" /></svg>;
    case 'check-circle':
      return <svg {...props}><circle cx="8" cy="8" r="6" /><path d="M5.5 8l2 2 3-4" /></svg>;
    case 'x':
      return <svg {...props}><path d="M4 4l8 8M12 4l-8 8" /></svg>;
    case 'arrow-right':
      return <svg {...props}><path d="M3 8h10M9 4l4 4-4 4" /></svg>;
    case 'chevron-right':
      return <svg {...props}><path d="M6 3l5 5-5 5" /></svg>;
    case 'chevron-down':
      return <svg {...props}><path d="M3 6l5 5 5-5" /></svg>;
    case 'copy':
      return <svg {...props}><rect x="5" y="5" width="8" height="8" rx="1" /><path d="M11 5V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1" /></svg>;
    case 'refresh':
      return <svg {...props}><path d="M2 8a6 6 0 0 1 10.5-4M14 8a6 6 0 0 1-10.5 4" /><path d="M12.5 1.5v3h-3M3.5 14.5v-3h3" /></svg>;
    case 'lock':
      return <svg {...props}><rect x="3" y="7" width="10" height="7" rx="1" /><path d="M5 7V5a3 3 0 0 1 6 0v2" /></svg>;
    case 'eye':
      return <svg {...props}><path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" /><circle cx="8" cy="8" r="1.5" /></svg>;
    case 'card':
      return <svg {...props}><rect x="2" y="4" width="12" height="9" rx="1.5" /><path d="M2 7h12" /></svg>;
    case 'shield':
      return <svg {...props}><path d="M8 2L3 4v4c0 3 2 5 5 6 3-1 5-3 5-6V4z" /></svg>;
    case 'menu':
      return <svg {...props}><path d="M3 5h10M3 8h10M3 11h10" /></svg>;
    case 'plus':
      return <svg {...props}><path d="M8 3v10M3 8h10" /></svg>;
    case 'arrow-left':
      return <svg {...props}><path d="M13 8H3M7 4L3 8l4 4" /></svg>;
    case 'star':
      return <svg {...props}><path d="M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.2 4.4 13.1l.7-4-2.9-2.8 4-.6z" /></svg>;
    case 'lightning':
      return <svg {...props}><path d="M9 1.5L3 9h4l-1 5.5 6-7.5H8z" /></svg>;
    default:
      return <svg {...props}><rect x="3" y="3" width="10" height="10" rx="1" /></svg>;
  }
};

// Logo wordmark
const Logo = ({ size = 17 }) => (
  <span className="logo" style={{ fontSize: size }}>
    Toolio<span className="logo-dot" />
  </span>
);

// Tool catalog — single source of truth
const TOOLS = [
  { id: 'audit', name: 'Audit CRO + SEO', short: 'Audit', desc: 'Analyse votre site et identifie les leviers de conversion et de référencement.', credits: 15, plan: 'pro', glyph: 'audit' },
  { id: 'products', name: 'Fiches produits en masse', short: 'Fiches produits', desc: 'Génère des fiches produits optimisées pour la conversion à partir d\u2019un CSV.', credits: 5, plan: 'pro', glyph: 'product', unit: 'fiche' },
  { id: 'compete', name: 'Analyse de concurrents', short: 'Concurrents', desc: 'Décortique le positionnement, l\u2019offre et les mots-clés de vos concurrents.', credits: 15, plan: 'pro', glyph: 'compete' },
  { id: 'legal', name: 'CGV & mentions légales', short: 'CGV', desc: 'Génère vos CGV et mentions légales conformes au droit français.', credits: 10, plan: 'pro', glyph: 'legal' },
  { id: 'contract', name: 'Contrat freelance', short: 'Contrat', desc: 'Crée un contrat de prestation freelance personnalisé et sécurisé.', credits: 10, plan: 'pro', glyph: 'contract' },
  { id: 'invoice', name: 'Générateur de facture', short: 'Facture', desc: 'Édite une facture PDF prête à envoyer en moins d\u2019une minute.', credits: 5, plan: 'free', glyph: 'invoice' },
  { id: 'status', name: 'Choix du statut juridique', short: 'Statut', desc: 'Compare les statuts (micro, EI, SASU, EURL) selon votre projet.', credits: 5, plan: 'free', glyph: 'status' },
  { id: 'linkedin-content', name: 'Contenu LinkedIn', short: 'LinkedIn', desc: 'Rédige des posts LinkedIn engageants adaptés à votre niche et votre ton.', credits: 10, plan: 'free', glyph: 'linkedin-content' },
  { id: 'linkedin-profile', name: 'Optimisation profil LinkedIn', short: 'Profil LinkedIn', desc: 'Réécrit titre, à-propos et expériences pour maximiser votre visibilité.', credits: 10, plan: 'pro', glyph: 'linkedin-profile' },
];

// Credit packs
const PACKS = [
  { id: 'small', credits: 100, price: 9, label: 'Small' },
  { id: 'medium', credits: 250, price: 19, label: 'Medium', featured: true },
  { id: 'large', credits: 600, price: 39, label: 'Large' },
];

// Toast helper (very simple, single-instance)
const useToast = () => {
  const [msg, setMsg] = React.useState(null);
  const show = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 2200);
  };
  const ToastEl = msg ? (
    <div className="toast">
      <Glyph name="check" size={14} />
      {msg}
    </div>
  ) : null;
  return [show, ToastEl];
};

// Marketing Nav
const MarketingNav = ({ navigate, page }) => (
  <header className="mk-nav">
    <div className="container mk-nav-inner">
      <a onClick={() => navigate('landing')} style={{ cursor: 'pointer' }}>
        <Logo />
      </a>
      <nav className="mk-nav-links">
        <a onClick={() => navigate('landing', { scrollTo: 'tools' })} style={{ cursor: 'pointer' }}>Outils</a>
        <a onClick={() => navigate('landing', { scrollTo: 'pricing' })} style={{ cursor: 'pointer' }}>Tarifs</a>
        <a onClick={() => navigate('auth')} style={{ cursor: 'pointer' }}>Connexion</a>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('auth', { mode: 'register' })}>
          Essayer gratuitement
        </button>
      </nav>
    </div>
  </header>
);

const MarketingFooter = () => (
  <footer className="mk-footer">
    <div className="container">
      <div className="mk-footer-grid">
        <div>
          <Logo />
          <p className="muted" style={{ fontSize: 13, marginTop: 12, maxWidth: 280 }}>
            La boîte à outils IA des freelances et e-commerçants français.
          </p>
        </div>
        <div className="mk-footer-col">
          <h4>Produit</h4>
          <ul>
            <li><a>Outils</a></li>
            <li><a>Tarifs</a></li>
            <li><a>Changelog</a></li>
            <li><a>Roadmap</a></li>
          </ul>
        </div>
        <div className="mk-footer-col">
          <h4>Ressources</h4>
          <ul>
            <li><a>Documentation</a></li>
            <li><a>Guides</a></li>
            <li><a>Support</a></li>
          </ul>
        </div>
        <div className="mk-footer-col">
          <h4>Légal</h4>
          <ul>
            <li><a>Conditions</a></li>
            <li><a>Confidentialité</a></li>
            <li><a>Mentions légales</a></li>
          </ul>
        </div>
      </div>
      <div className="mk-footer-bottom">
        <span>© 2026 Toolio — Fait à Paris</span>
        <span>Conforme RGPD</span>
      </div>
    </div>
  </footer>
);

// Tool icon block (the glyph + optional label)
const ToolIcon = ({ tool, size = 'md' }) => (
  <span className={`glyph ${size === 'lg' ? 'glyph-lg' : ''}`}>
    <Glyph name={tool.glyph} size={size === 'lg' ? 20 : 16} />
  </span>
);

// Plan badge
const PlanBadge = ({ plan }) =>
  plan === 'free'
    ? <span className="badge badge-free">Free</span>
    : <span className="badge badge-pro">Pro</span>;

// Sidebar nav (dashboard)
const Sidebar = ({ page, navigate, user, plan }) => (
  <aside className="sidebar">
    <div className="sidebar-logo">
      <Logo />
    </div>

    <div className="sidebar-section">Général</div>
    <div className={`sidebar-item ${page === 'dashboard' ? 'active' : ''}`} onClick={() => navigate('dashboard')}>
      <Glyph name="home" />
      <span>Dashboard</span>
    </div>

    <div className="sidebar-section">Outils</div>
    {TOOLS.map(t => (
      <div
        key={t.id}
        className={`sidebar-item ${page === 'tool' ? 'active' : ''}`}
        onClick={() => navigate('tool', { toolId: t.id })}
        title={t.name}
      >
        <Glyph name={t.glyph} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.short}</span>
        {t.plan === 'pro' && plan === 'free' && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--accent)' }}>Pro</span>
        )}
      </div>
    ))}

    <div style={{ flex: 1 }} />

    <div className="sidebar-section">Compte</div>
    <div className={`sidebar-item ${page === 'pricing' ? 'active' : ''}`} onClick={() => navigate('pricing')}>
      <Glyph name="billing" />
      <span>Plan & crédits</span>
    </div>
    <div className={`sidebar-item ${page === 'account' ? 'active' : ''}`} onClick={() => navigate('account')}>
      <Glyph name="account" />
      <span>Profil</span>
    </div>
    <div className="sidebar-item" onClick={() => navigate('landing')}>
      <Glyph name="logout" />
      <span>Déconnexion</span>
    </div>
  </aside>
);

// App header (logged-in)
const AppHeader = ({ user, credits, plan, navigate, lowCreditThreshold = 50 }) => {
  const low = credits < lowCreditThreshold;
  const crit = credits < 20;
  return (
    <div className="app-header">
      <div className="row" style={{ gap: 8 }}>
        <span className="muted" style={{ fontSize: 13 }}>Bonjour, {user.firstName}</span>
      </div>
      <div className="row" style={{ gap: 12 }}>
        <span className={`credits-pill ${crit ? 'crit' : low ? 'low' : ''}`}>
          <span className="dot" />
          <span className="tabular">{credits}</span>
          <span className="muted" style={{ fontSize: 12 }}>crédits</span>
        </span>
        {plan === 'free' ? (
          <button className="btn btn-accent btn-sm" onClick={() => navigate('pricing')}>
            Passer au Pro
          </button>
        ) : (
          <span className="badge badge-pro" style={{ height: 24, padding: '0 10px' }}>Pro</span>
        )}
        <div className="user-chip" onClick={() => navigate('account')}>
          <span className="avatar">{user.firstName[0]}{user.lastName[0]}</span>
        </div>
      </div>
    </div>
  );
};

// Export to window
Object.assign(window, { Glyph, Logo, TOOLS, PACKS, useToast, MarketingNav, MarketingFooter, ToolIcon, PlanBadge, Sidebar, AppHeader });
