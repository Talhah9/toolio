import { useNavigate, useLocation } from 'react-router-dom';
import { Glyph } from './Glyph';
import { useLang } from '../context/LanguageContext';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLang();

  const isActive = (path) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard' || location.pathname.startsWith('/tools/')
      : location.pathname === path;

  return (
    <nav className="mobile-bottom-nav">
      <button
        className={`mobile-nav-item ${isActive('/dashboard') ? 'active' : ''}`}
        onClick={() => navigate('/dashboard')}
      >
        <Glyph name="home" size={20} />
        <span>{t('mobile.tools')}</span>
      </button>
      <button
        className={`mobile-nav-item ${isActive('/pricing') ? 'active' : ''}`}
        onClick={() => navigate('/pricing')}
      >
        <Glyph name="billing" size={20} />
        <span>{t('mobile.plan')}</span>
      </button>
      <button
        className={`mobile-nav-item ${isActive('/account') ? 'active' : ''}`}
        onClick={() => navigate('/account')}
      >
        <Glyph name="account" size={20} />
        <span>{t('mobile.account')}</span>
      </button>
    </nav>
  );
}
