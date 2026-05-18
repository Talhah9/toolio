import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Glyph } from '../components/Glyph';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

export function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, signInWithGoogle, resetPassword, updatePassword } = useApp();
  const { t, lang } = useLang();

  // Check hash synchronously so the first render already shows the reset form.
  // Supabase fires PASSWORD_RECOVERY during getSession() in AppContext (which runs
  // before this component mounts), so the event is gone by the time our listener
  // registers. Reading the hash directly avoids that race.
  const [mode, setMode] = useState(() => {
    if (window.location.hash.includes('type=recovery')) return 'reset';
    return searchParams.get('mode') || 'login';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState('');
  const [confirmSent, setConfirmSent] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // Fallback: catch PASSWORD_RECOVERY if it fires after mount
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
        setError('');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if ((mode === 'register' || mode === 'reset') && password !== confirmPassword) {
      setError(t('auth.password.mismatch'));
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        setSigningIn(true);
        setTimeout(() => navigate('/dashboard'), 1200);
      } else if (mode === 'register') {
        const needsConfirmation = await signUp(email, password, name, lang);
        if (needsConfirmation) {
          setConfirmSent(true);
        } else {
          navigate('/dashboard');
        }
        setLoading(false);
      } else if (mode === 'reset') {
        await updatePassword(password);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const submitForgot = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await resetPassword(email);
      setForgotSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const ErrorBanner = ({ msg }) => msg ? (
    <div style={{ color: 'var(--warn-fg)', background: 'var(--warn-bg)', border: '1px solid var(--warn-border)', borderRadius: 'var(--radius)', padding: '10px 12px', fontSize: 13, marginBottom: 16 }}>
      {msg}
    </div>
  ) : null;

  // ── Post-login transition ────────────────────────────────────
  if (signingIn) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#fff', zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28,
      }}>
        <style>{`@keyframes tlspin{to{transform:rotate(360deg)}}`}</style>
        <Logo size={24} />
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          border: '2.5px solid var(--border)',
          borderTopColor: 'var(--accent)',
          animation: 'tlspin 0.7s linear infinite',
        }} />
      </div>
    );
  }

  // ── Email confirmation sent ──────────────────────────────────
  if (confirmSent) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><Logo size={20} /></a>
          </div>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
          <h2 className="h2" style={{ marginBottom: 8 }}>{t('auth.check-email')}</h2>
          <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>{email}</p>
          <button className="btn btn-secondary btn-block" onClick={() => setConfirmSent(false)}>
            ← {t('auth.login')}
          </button>
        </div>
      </div>
    );
  }

  // ── Forgot password ──────────────────────────────────────────
  if (mode === 'forgot') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><Logo size={20} /></a>
          </div>
          {forgotSent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
              <h2 className="h2" style={{ marginBottom: 8 }}>{t('auth.forgot.sent')}</h2>
              <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>{email}</p>
              <button className="btn btn-secondary btn-block" onClick={() => { setMode('login'); setForgotSent(false); setError(''); }}>
                ← {t('auth.login')}
              </button>
            </div>
          ) : (
            <>
              <h1 className="h2" style={{ marginBottom: 6 }}>{t('auth.forgot.title')}</h1>
              <p className="muted" style={{ marginBottom: 24, fontSize: 13 }}>{t('auth.forgot.desc')}</p>
              <form onSubmit={submitForgot}>
                <div className="field">
                  <label className="label">{t('auth.email')}</label>
                  <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <ErrorBanner msg={error} />
                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                  {loading ? '…' : t('auth.forgot.btn')}
                </button>
              </form>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 16, width: '100%' }} onClick={() => { setMode('login'); setError(''); }}>
                ← {t('auth.login')}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Reset password ───────────────────────────────────────────
  if (mode === 'reset') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><Logo size={20} /></a>
          </div>
          <h1 className="h2" style={{ marginBottom: 6 }}>{t('auth.reset.title')}</h1>
          <p className="muted" style={{ marginBottom: 24, fontSize: 13 }}></p>
          <form onSubmit={submit}>
            <div className="field">
              <label className="label">{t('auth.reset.new-password')}</label>
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
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-4)', display: 'flex' }}>
                  <Glyph name="eye" size={14} />
                </button>
              </div>
            </div>
            <div className="field">
              <label className="label">{t('auth.password.confirm')}</label>
              <input
                className="input"
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <ErrorBanner msg={error} />
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
              {loading ? '…' : t('auth.reset.btn')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Login / Register ─────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><Logo size={20} /></a>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>
            {t('auth.login')}
          </button>
          <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>
            {t('auth.register')}
          </button>
        </div>

        <h1 className="h2" style={{ marginBottom: 6 }}>
          {mode === 'login' ? 'Welcome back.' : 'Create your account.'}
        </h1>
        <p className="muted" style={{ marginBottom: 24, fontSize: 13 }}>
          {mode === 'login' ? 'Pick up where you left off.' : '50 credits included. No card required.'}
        </p>

        <button className="btn btn-secondary btn-lg btn-block" onClick={handleGoogle} disabled={loading}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14.7 8.16c0-.55-.05-1.07-.14-1.58H8v3h3.76c-.16.85-.65 1.57-1.39 2.05v1.7h2.25c1.32-1.21 2.08-3 2.08-5.17z" fill="#4285F4"/>
            <path d="M8 15c1.88 0 3.46-.62 4.62-1.68l-2.25-1.7c-.62.42-1.42.66-2.37.66-1.82 0-3.36-1.23-3.91-2.88H1.77v1.76C2.93 13.49 5.27 15 8 15z" fill="#34A853"/>
            <path d="M4.09 9.4c-.14-.42-.22-.86-.22-1.32 0-.46.08-.9.22-1.32V5H1.77C1.28 5.94 1 7 1 8.08c0 1.08.28 2.14.77 3.08l2.32-1.76z" fill="#FBBC05"/>
            <path d="M8 4c1.03 0 1.95.35 2.67 1.04l2-2C11.46 1.95 9.88 1 8 1 5.27 1 2.93 2.51 1.77 4.92l2.32 1.76C4.64 5.23 6.18 4 8 4z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="divider-text">OR</div>

        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="field">
              <label className="label">{t('auth.name')}</label>
              <input className="input" placeholder="Léa Marchand" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div className="field">
            <label className="label">{t('auth.email')}</label>
            <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="label" style={{ marginBottom: 0 }}>{t('auth.password')}</label>
              {mode === 'login' && (
                <a className="muted" style={{ fontSize: 12, cursor: 'pointer' }} onClick={() => { setMode('forgot'); setError(''); }}>
                  {t('auth.forgot.link')}
                </a>
              )}
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
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-4)', display: 'flex' }}>
                <Glyph name="eye" size={14} />
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="field">
              <label className="label">{t('auth.password.confirm')}</label>
              <input
                className="input"
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <ErrorBanner msg={error} />

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? '…' : (mode === 'login' ? t('auth.login') : t('auth.register'))}
          </button>
        </form>

        <p className="muted" style={{ fontSize: 12, textAlign: 'center', marginTop: 24 }}>
          {mode === 'register' && (
            <>
              By signing up, you agree to our{' '}
              <a style={{ textDecoration: 'underline', cursor: 'pointer' }}>terms</a>
              {' '}and{' '}
              <a style={{ textDecoration: 'underline', cursor: 'pointer' }}>privacy policy</a>.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
