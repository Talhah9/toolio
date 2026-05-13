import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { Glyph } from './Glyph';
import { useLang } from '../context/LanguageContext';

export function MarketingNav() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang, toggleLang, t } = useLang();

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
          <a onClick={() => go('/#tools')} style={{ cursor: 'pointer' }}>{t('nav.tools')}</a>
          <a onClick={() => go('/#pricing')} style={{ cursor: 'pointer' }}>{t('nav.pricing')}</a>
          <button
            onClick={toggleLang}
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.04em',
              padding: '4px 12px',
              borderRadius: 20,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--fg-2)',
              cursor: 'pointer',
            }}
          >
            {lang === 'en' ? 'FR' : 'EN'}
          </button>
          <a onClick={() => go('/auth')} style={{ cursor: 'pointer' }}>{t('nav.login')}</a>
          <button className="btn btn-primary btn-sm" onClick={() => go('/auth?mode=register')}>
            {t('nav.cta')}
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="mk-nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <Glyph name={menuOpen ? 'x' : 'menu'} size={18} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="mk-nav-mobile-menu">
          <a className="mk-nav-mobile-item" onClick={() => go('/#tools')}>{t('nav.tools')}</a>
          <a className="mk-nav-mobile-item" onClick={() => go('/#pricing')}>{t('nav.pricing')}</a>
          <a className="mk-nav-mobile-item" onClick={() => go('/auth')}>{t('nav.login')}</a>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={() => { toggleLang(); setMenuOpen(false); }}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '8px 16px',
                borderRadius: 20,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--fg-2)',
                cursor: 'pointer',
                flex: 1,
              }}
            >
              {lang === 'en' ? '🇫🇷 FR' : '🇬🇧 EN'}
            </button>
            <button
              className="btn btn-primary btn-lg"
              style={{ flex: 3 }}
              onClick={() => go('/auth?mode=register')}
            >
              {t('nav.cta')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
