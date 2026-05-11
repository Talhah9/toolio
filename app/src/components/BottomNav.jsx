import { useNavigate, useLocation } from 'react-router-dom';
import { Glyph } from './Glyph';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

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
        <span>Outils</span>
      </button>
      <button
        className={`mobile-nav-item ${isActive('/pricing') ? 'active' : ''}`}
        onClick={() => navigate('/pricing')}
      >
        <Glyph name="billing" size={20} />
        <span>Plan</span>
      </button>
      <button
        className={`mobile-nav-item ${isActive('/account') ? 'active' : ''}`}
        onClick={() => navigate('/account')}
      >
        <Glyph name="account" size={20} />
        <span>Compte</span>
      </button>
    </nav>
  );
}
