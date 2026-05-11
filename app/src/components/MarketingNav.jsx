import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';

export function MarketingNav() {
  const navigate = useNavigate();

  return (
    <header className="mk-nav">
      <div className="container mk-nav-inner">
        <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Logo />
        </a>
        <nav className="mk-nav-links">
          <a onClick={() => navigate('/#tools')} style={{ cursor: 'pointer' }}>Outils</a>
          <a onClick={() => navigate('/#pricing')} style={{ cursor: 'pointer' }}>Tarifs</a>
          <a onClick={() => navigate('/auth')} style={{ cursor: 'pointer' }}>Connexion</a>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/auth?mode=register')}>
            Essayer gratuitement
          </button>
        </nav>
      </div>
    </header>
  );
}
