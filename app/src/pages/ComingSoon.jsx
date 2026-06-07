import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Glyph } from '../components/Glyph';

export function ComingSoon() {
  const navigate = useNavigate();

  return (
    <>
      <AppHeader />
      <div
        className="page-pad"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 72px)' }}
      >
        <div style={{ textAlign: 'center', maxWidth: 460 }}>
          <div style={{ fontSize: 52, marginBottom: 20, lineHeight: 1 }}>🚀</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 14px', lineHeight: 1.2 }}>
            Bientôt disponible
          </h1>
          <p style={{ fontSize: 16, color: 'var(--fg-2)', lineHeight: 1.65, margin: '0 0 36px' }}>
            La communauté des entrepreneurs arrive très bientôt.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <a
              href="mailto:talhahally974@gmail.com?subject=Liste d'attente — Communauté Savvly"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--accent)', color: '#fff', borderRadius: 10,
                padding: '13px 28px', fontWeight: 700, fontSize: 15,
                textDecoration: 'none', letterSpacing: '0.01em',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Rejoindre la liste d'attente →
            </a>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/dashboard')}
              style={{ fontSize: 14, color: 'var(--fg-3)' }}
            >
              <Glyph name="arrow-left" size={12} /> Retour au dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
