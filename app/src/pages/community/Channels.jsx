import { useNavigate } from 'react-router-dom';
import { CHANNELS } from '../../lib/communityUtils';

export function Channels() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
          Channels
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: '6px 0 0' }}>
          Rejoins la conversation dans le bon canal
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {CHANNELS.map(ch => (
          <button
            key={ch.id}
            onClick={() => navigate(`/community/feed?channel=${ch.id}`)}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
              padding: '20px 18px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s',
              color: '#fff',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(129,140,248,0.4)';
              e.currentTarget.style.background = 'rgba(79,70,229,0.08)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12, lineHeight: 1 }}>{ch.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.01em' }}>
              {ch.label}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              {ch.desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
