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
        className={`mobile-nav-item ${location.pathname.startsWith('/community') ? 'active' : ''}`}
        onClick={() => navigate('/community')}
        style={{ position: 'relative' }}
      >
        <Glyph name="community" size={20} />
        <span style={{ fontSize: 10 }}>{t('mobile.community')}</span>
        <span style={{ position: 'absolute', top: 6, right: 'calc(50% - 16px)', width: 6, height: 6, borderRadius: '50%', background: '#4F46E5' }} />
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
