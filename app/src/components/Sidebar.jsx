import { useNavigate, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { Glyph } from './Glyph';
import { TOOLS, getToolText } from '../data/catalog';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { plan, signOut } = useApp();
  const { lang, t } = useLang();

  const isActive = (path) => location.pathname === path;
  const isToolActive = () => location.pathname.startsWith('/tools/');

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
        className={`sidebar-item ${isActive('/account') ? 'active' : ''}`}
        onClick={() => navigate('/account')}
      >
        <Glyph name="account" />
        <span>{t('nav.profile')}</span>
      </div>
      <div className="sidebar-item" onClick={async () => { await signOut(); navigate('/'); }}>
        <Glyph name="logout" />
        <span>{t('nav.logout')}</span>
      </div>
    </aside>
  );
}
