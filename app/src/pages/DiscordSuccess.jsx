import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';

const DISCORD_LINK = 'https://discord.gg/8DvYb5uB6X';

const DISCORD_ICON_LARGE = (
  <svg viewBox="0 0 24 24" fill="white" width="40" height="40" style={{ display: 'block', margin: '0 auto 12px' }} aria-hidden="true">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.079.11 18.1.128 18.115a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.026c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

export function DiscordSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const sessionId = params.get('session_id');

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return; }
    fetch(`/api/verify-discord-session?session_id=${encodeURIComponent(sessionId)}`)
      .then(r => r.json())
      .then(({ paid }) => setStatus(paid ? 'success' : 'error'))
      .catch(() => setStatus('error'));
  }, [sessionId]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0F0F1A 0%, #1E1E3A 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`@keyframes _dspin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ marginBottom: 40, cursor: 'pointer' }} onClick={() => navigate('/')}>
        <Logo />
      </div>

      <div style={{ background: '#fff', borderRadius: 24, padding: 'clamp(32px, 5vw, 48px) clamp(24px, 5vw, 40px)', maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}>

        {status === 'loading' && (
          <>
            <div style={{ width: 40, height: 40, border: '3px solid #5865F2', borderTopColor: 'transparent', borderRadius: '50%', animation: '_dspin 0.8s linear infinite', margin: '0 auto 20px' }} />
            <p style={{ color: '#6B7280', fontSize: 15, margin: 0 }}>Vérification du paiement…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F0F1A', margin: '0 0 12px' }}>Bienvenue dans le club !</h1>
            <p style={{ fontSize: 15, color: '#4B4B6A', lineHeight: 1.65, margin: '0 0 32px' }}>
              Ton accès est confirmé. Clique ci-dessous pour rejoindre les 220+ freelances sur Discord.
              Un email avec ce lien t'a aussi été envoyé.
            </p>

            <a
              href={DISCORD_LINK}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', background: '#5865F2', borderRadius: 16, padding: '24px 20px', textDecoration: 'none', marginBottom: 20 }}
            >
              {DISCORD_ICON_LARGE}
              <span style={{ color: '#fff', fontSize: 17, fontWeight: 800 }}>Rejoindre maintenant →</span>
            </a>

            <button
              onClick={() => navigate('/')}
              style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 13, cursor: 'pointer' }}
            >
              Retour à l'accueil
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F0F1A', margin: '0 0 12px' }}>Paiement non trouvé</h1>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.65, margin: '0 0 24px' }}>
              Si tu viens d'effectuer un paiement, vérifie ton email — le lien Discord t'a été envoyé directement.
              En cas de problème :{' '}
              <a href="mailto:hello@savvly.co" style={{ color: '#5865F2' }}>hello@savvly.co</a>
            </p>
            <button
              onClick={() => navigate('/')}
              style={{ background: '#5865F2', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              Retour à l'accueil
            </button>
          </>
        )}
      </div>
    </div>
  );
}
