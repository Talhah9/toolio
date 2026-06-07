import { useNavigate, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { Glyph } from './Glyph';
import { TOOLS, getToolText } from '../data/catalog';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { plan, signOut, user } = useApp();
  const { lang, t } = useLang();

  const isActive = (path) => location.pathname === path;
  const isToolActive = () => location.pathname.startsWith('/tools/');
  const isAdmin = user?.email === 'talhahally974@gmail.com';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Logo />
      </div>

      <div className="sidebar-section">{t('nav.section.general')}</div>
      <div
        className={`sidebar-item ${isActive('/dashboard') ? 'active' : ''}`}
        onClick={() => navigate('/dashboard')}
      >
        <Glyph name="home" />
        <span>{t('nav.dashboard')}</span>
      </div>

      <div className="sidebar-section">{t('nav.section.tools')}</div>
      {TOOLS.map(tool => {
        const { short } = getToolText(tool, lang);
        return (
          <div
            key={tool.id}
            className={`sidebar-item ${isToolActive() && location.pathname === `/tools/${tool.id}` ? 'active' : ''}`}
            onClick={() => navigate(`/tools/${tool.id}`)}
            title={short}
          >
            <Glyph name={tool.glyph} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{short}</span>
            {tool.franceOnly && (
              <span style={{ marginLeft: 'auto', fontSize: 11 }} title="France only">🇫🇷</span>
            )}
            {tool.plan === 'pro' && plan === 'free' && !tool.franceOnly && (
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--accent)' }}>Pro</span>
            )}
          </div>
        );
      })}

      <div style={{ flex: 1 }} />

      {/* Community — coming soon */}
      <div
        className="sidebar-item"
        onClick={() => navigate('/community')}
        style={{ color: 'var(--fg-3)', borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4, opacity: 0.65, cursor: 'default' }}
      >
        <Glyph name="community" />
        <span>{t('nav.community')}</span>
        <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 800, background: '#6B7280', color: '#fff', borderRadius: 4, padding: '1px 5px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Bientôt</span>
      </div>

      <div className="sidebar-section">{t('nav.section.account')}</div>
      <div
        className={`sidebar-item ${isActive('/history') ? 'active' : ''}`}
        onClick={() => navigate('/history')}
      >
        <Glyph name="clock" />
        <span>{t('nav.history')}</span>
      </div>
      <div
        className={`sidebar-item ${isActive('/pricing') ? 'active' : ''}`}
        onClick={() => navigate('/pricing')}
      >
        <Glyph name="billing" />
        <span>{t('nav.plan')}</span>
      </div>
      <div
        className={`sidebar-item ${isActive('/coaching') ? 'active' : ''}`}
        onClick={() => navigate('/coaching')}
      >
        <Glyph name="calendar" />
        <span>{t('nav.coaching')}</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, background: 'rgba(250,208,44,0.14)', color: '#fad02c', border: '1px solid rgba(250,208,44,0.3)', borderRadius: 4, padding: '1px 6px', letterSpacing: '0.02em' }}>80€</span>
      </div>
      <div
        className={`sidebar-item ${isActive('/account') ? 'active' : ''}`}
        onClick={() => navigate('/account')}
      >
        <Glyph name="account" />
        <span>{t('nav.profile')}</span>
      </div>
      {isAdmin && (
        <div
          className={`sidebar-item ${isActive('/admin') ? 'active' : ''}`}
          onClick={() => navigate('/admin')}
        >
          <Glyph name="shield" />
          <span>Admin</span>
        </div>
      )}
      <div className="sidebar-item" onClick={async () => { await signOut(); navigate('/'); }}>
        <Glyph name="logout" />
        <span>{t('nav.logout')}</span>
      </div>
    </aside>
  );
}
