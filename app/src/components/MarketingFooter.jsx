import { Logo } from './Logo';

export function MarketingFooter() {
  return (
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
}
