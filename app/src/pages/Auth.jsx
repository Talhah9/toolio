import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Glyph } from '../components/Glyph';
import { useApp } from '../context/AppContext';

export function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, signInWithGoogle } = useApp();

  const [mode, setMode] = useState(searchParams.get('mode') || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmSent, setConfirmSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await signIn(email, password);
        navigate('/dashboard');
      } else {
        const needsConfirmation = await signUp(email, password, name);
        if (needsConfirmation) {
          setConfirmSent(true);
          setLoading(false);
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      // OAuth redirect handles navigation
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (confirmSent) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <Logo size={20} />
            </a>
          </div>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
          <h2 className="h2" style={{ marginBottom: 8 }}>Vérifiez vos emails.</h2>
          <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>
            Un lien de confirmation a été envoyé à <b>{email}</b>. Cliquez dessus pour activer votre compte.
          </p>
          <button className="btn btn-secondary btn-block" onClick={() => setConfirmSent(false)}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <Logo size={20} />
          </a>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>
            Connexion
          </button>
          <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>
            Inscription
          </button>
        </div>

        <h1 className="h2" style={{ marginBottom: 6 }}>
          {mode === 'login' ? 'Bon retour.' : 'Créez votre compte.'}
        </h1>
        <p className="muted" style={{ marginBottom: 24, fontSize: 13 }}>
          {mode === 'login' ? 'Reprenez là où vous en étiez.' : '50 crédits offerts. Aucune carte demandée.'}
        </p>

        <button className="btn btn-secondary btn-lg btn-block" onClick={handleGoogle} disabled={loading}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14.7 8.16c0-.55-.05-1.07-.14-1.58H8v3h3.76c-.16.85-.65 1.57-1.39 2.05v1.7h2.25c1.32-1.21 2.08-3 2.08-5.17z" fill="#4285F4"/>
            <path d="M8 15c1.88 0 3.46-.62 4.62-1.68l-2.25-1.7c-.62.42-1.42.66-2.37.66-1.82 0-3.36-1.23-3.91-2.88H1.77v1.76C2.93 13.49 5.27 15 8 15z" fill="#34A853"/>
            <path d="M4.09 9.4c-.14-.42-.22-.86-.22-1.32 0-.46.08-.9.22-1.32V5H1.77C1.28 5.94 1 7 1 8.08c0 1.08.28 2.14.77 3.08l2.32-1.76z" fill="#FBBC05"/>
            <path d="M8 4c1.03 0 1.95.35 2.67 1.04l2-2C11.46 1.95 9.88 1 8 1 5.27 1 2.93 2.51 1.77 4.92l2.32 1.76C4.64 5.23 6.18 4 8 4z" fill="#EA4335"/>
          </svg>
          Continuer avec Google
        </button>

        <div className="divider-text">OU</div>

        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="field">
              <label className="label">Nom</label>
              <input className="input" placeholder="Léa Marchand" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div className="field">
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="vous@exemple.fr" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="label" style={{ marginBottom: 0 }}>Mot de passe</label>
              {mode === 'login' && <a className="muted" style={{ fontSize: 12, cursor: 'pointer' }}>Oublié&nbsp;?</a>}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-4)', display: 'flex' }}
              >
                <Glyph name="eye" size={14} />
              </button>
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--warn-fg)', background: 'var(--warn-bg)', border: '1px solid var(--warn-border)', borderRadius: 'var(--radius)', padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? 'Connexion…' : (mode === 'login' ? 'Se connecter' : 'Créer mon compte')}
          </button>
        </form>

        <p className="muted" style={{ fontSize: 12, textAlign: 'center', marginTop: 24 }}>
          {mode === 'register' && (
            <>
              En vous inscrivant, vous acceptez nos{' '}
              <a style={{ textDecoration: 'underline', cursor: 'pointer' }}>conditions</a>
              {' '}et notre{' '}
              <a style={{ textDecoration: 'underline', cursor: 'pointer' }}>politique de confidentialité</a>.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
