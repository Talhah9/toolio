import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export function AppHeader() {
  const navigate = useNavigate();
  const { user, credits, plan } = useApp();

  const low = credits < 50;
  const crit = credits < 20;

  return (
    <div className="app-header">
      <div className="row" style={{ gap: 8 }}>
        <span className="muted" style={{ fontSize: 13 }}>Bonjour, {user.firstName}</span>
      </div>
      <div className="row" style={{ gap: 12 }}>
        <span className={`credits-pill ${crit ? 'crit' : low ? 'low' : ''}`}>
          <span className="dot" />
          <span className="tabular">{credits}</span>
          <span className="muted" style={{ fontSize: 12 }}>crédits</span>
        </span>
        {plan === 'free' ? (
          <button className="btn btn-accent btn-sm" onClick={() => navigate('/pricing')}>
            Passer au Pro
          </button>
        ) : (
          <span className="badge badge-pro" style={{ height: 24, padding: '0 10px' }}>Pro</span>
        )}
        <div className="user-chip" onClick={() => navigate('/account')}>
          <span className="avatar">{user.firstName[0]}{user.lastName[0]}</span>
        </div>
      </div>
    </div>
  );
}
