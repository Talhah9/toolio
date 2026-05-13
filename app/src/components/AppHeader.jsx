import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';

export function AppHeader() {
  const navigate = useNavigate();
  const { user, credits, plan } = useApp();
  const { lang, toggleLang, t } = useLang();

  const low = credits < 50;
  const crit = credits < 20;

  return (
    <div className="app-header">
      <div className="row" style={{ gap: 8 }}>
        <span className="muted" style={{ fontSize: 13 }}>{t('header.hello')} {user.firstName || user.email}</span>
      </div>
      <div className="row" style={{ gap: 12 }}>
        <button
          onClick={toggleLang}
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.04em',
            padding: '3px 10px',
            borderRadius: 20,
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--fg-2)',
            cursor: 'pointer',
            lineHeight: 1.6,
          }}
        >
          {lang === 'en' ? 'FR' : 'EN'}
        </button>
        <span className={`credits-pill ${crit ? 'crit' : low ? 'low' : ''}`}>
          <span className="dot" />
          <span className="tabular">{credits}</span>
          <span className="muted" style={{ fontSize: 12 }}>{t('header.credits')}</span>
        </span>
        {plan === 'free' ? (
          <span className="app-header-upgrade">
            <button className="btn btn-accent btn-sm" onClick={() => navigate('/pricing')}>
              {t('header.upgrade')}
            </button>
          </span>
        ) : (
          <span className="badge badge-pro" style={{ height: 24, padding: '0 10px' }}>Pro</span>
        )}
        <div className="user-chip" onClick={() => navigate('/account')}>
          <span className="avatar">{(user.firstName || user.email)[0].toUpperCase()}{user.lastName?.[0]?.toUpperCase() ?? ''}</span>
        </div>
      </div>
    </div>
  );
}
