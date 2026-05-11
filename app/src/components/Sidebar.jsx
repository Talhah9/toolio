import { useNavigate, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { Glyph } from './Glyph';
import { TOOLS } from '../data/catalog';
import { useApp } from '../context/AppContext';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, plan, signOut } = useApp();

  const isActive = (path) => location.pathname === path;
  const isToolActive = () => location.pathname.startsWith('/tools/');

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Logo />
      </div>

      <div className="sidebar-section">Général</div>
      <div
        className={`sidebar-item ${isActive('/dashboard') ? 'active' : ''}`}
        onClick={() => navigate('/dashboard')}
      >
        <Glyph name="home" />
        <span>Dashboard</span>
      </div>

      <div className="sidebar-section">Outils</div>
      {TOOLS.map(t => (
        <div
          key={t.id}
          className={`sidebar-item ${isToolActive() && location.pathname === `/tools/${t.id}` ? 'active' : ''}`}
          onClick={() => navigate(`/tools/${t.id}`)}
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
      <div
        className={`sidebar-item ${isActive('/pricing') ? 'active' : ''}`}
        onClick={() => navigate('/pricing')}
      >
        <Glyph name="billing" />
        <span>Plan & crédits</span>
      </div>
      <div
        className={`sidebar-item ${isActive('/account') ? 'active' : ''}`}
        onClick={() => navigate('/account')}
      >
        <Glyph name="account" />
        <span>Profil</span>
      </div>
      <div className="sidebar-item" onClick={async () => { await signOut(); navigate('/'); }}>
        <Glyph name="logout" />
        <span>Déconnexion</span>
      </div>
    </aside>
  );
}
