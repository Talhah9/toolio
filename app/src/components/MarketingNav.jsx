import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { Glyph } from './Glyph';

export function MarketingNav() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <header className="mk-nav" style={{ position: 'sticky' }}>
      <div className="container mk-nav-inner">
        <a onClick={() => go('/')} style={{ cursor: 'pointer' }}>
          <Logo />
        </a>

        {/* Desktop nav */}
        <nav className="mk-nav-links">
          <a onClick={() => go('/#tools')} style={{ cursor: 'pointer' }}>Outils</a>
          <a onClick={() => go('/#pricing')} style={{ cursor: 'pointer' }}>Tarifs</a>
          <a onClick={() => go('/auth')} style={{ cursor: 'pointer' }}>Connexion</a>
          <button className="btn btn-primary btn-sm" onClick={() => go('/auth?mode=register')}>
            Essayer gratuitement
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="mk-nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          <Glyph name={menuOpen ? 'x' : 'menu'} size={18} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="mk-nav-mobile-menu">
          <a className="mk-nav-mobile-item" onClick={() => go('/#tools')}>Outils</a>
          <a className="mk-nav-mobile-item" onClick={() => go('/#pricing')}>Tarifs</a>
          <a className="mk-nav-mobile-item" onClick={() => go('/auth')}>Connexion</a>
          <button
            className="btn btn-primary btn-lg btn-block"
            style={{ marginTop: 8 }}
            onClick={() => go('/auth?mode=register')}
          >
            Essayer gratuitement
          </button>
        </div>
      )}
    </header>
  );
}
