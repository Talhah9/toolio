import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';

const NAV_ITEMS = [
  { label: 'Accueil',            path: '/community',          icon: '🏠', exact: true },
  { label: 'Feed',               path: '/community/feed',     icon: '💬' },
  { label: 'Channels',           path: '/community/channels', icon: '📺' },
  { label: 'Poster une mission', path: '/community/post',     icon: '📢' },
  { label: 'Trouver une mission',path: '/community/find',     icon: '🔍' },
];

function XPBadge({ xp = 0 }) {
  const level =
    xp >= 2000 ? { name: 'Légende', color: '#fad02c' } :
    xp >= 500  ? { name: 'Expert',  color: '#F97316' } :
    xp >= 100  ? { name: 'Explorer',color: '#60A5FA' } :
                 { name: 'Starter', color: '#6B7280' };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: level.color, background: `${level.color}18`, border: `1px solid ${level.color}40`, borderRadius: 100, padding: '2px 8px' }}>
      {level.name} · {xp} XP
    </span>
  );
}

export function CommunityLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useApp();
  const { t } = useLang();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (item) => item.exact
    ? location.pathname === item.path
    : location.pathname.startsWith(item.path);

  const initial = user?.email?.[0]?.toUpperCase() ?? '?';
  const emailShort = user?.email?.split('@')[0] ?? '';

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: '#0A0A0A', color: '#fff' }}>

      {/* ── DESKTOP SIDEBAR ──────────────────────────────────────── */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: '#111111',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px',
        position: 'sticky',
        top: 0,
        height: '100dvh',
        overflowY: 'auto',
      }} className="comm-sidebar">

        {/* Back to Savvly */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '6px 8px', borderRadius: 8, marginBottom: 20, width: 'fit-content', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
        >
          ← Savvly
        </button>

        {/* Community logo */}
        <div style={{ paddingLeft: 8, marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            Savvly
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em' }}>
            <span style={{ color: '#818CF8' }}>Community</span>
          </div>
        </div>

        {/* Create post CTA */}
        <button
          onClick={() => navigate('/community/create')}
          style={{
            background: 'linear-gradient(135deg, #4F46E5, #6D28D9)',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 13,
            fontWeight: 800,
            padding: '10px 14px',
            cursor: 'pointer',
            marginBottom: 16,
            width: '100%',
            textAlign: 'center',
            letterSpacing: '0.02em',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          + Créer un post
        </button>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const active = !item.soon && item.path && isActive(item);
            return (
              <button
                key={item.label}
                onClick={() => { if (item.path && !item.soon) { navigate(item.path); setMobileOpen(false); } }}
                disabled={item.soon}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 10px',
                  borderRadius: 8,
                  border: 'none',
                  borderLeft: active ? '2px solid #4F46E5' : '2px solid transparent',
                  background: active ? 'rgba(79,70,229,0.12)' : 'transparent',
                  color: active ? '#818CF8' : item.soon ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.55)',
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  cursor: item.soon ? 'default' : 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.15s',
                  paddingLeft: active ? 8 : 10,
                }}
                onMouseEnter={e => { if (!active && !item.soon) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 15, lineHeight: 1 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.soon && (
                  <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', borderRadius: 4, padding: '2px 5px', letterSpacing: '0.04em' }}>
                    SOON
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User info */}
        {user && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16, marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 8px' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #818CF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {initial}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {emailShort}
              </div>
              <XPBadge xp={0} />
            </div>
          </div>
        )}
      </aside>

      {/* ── MOBILE TOP BAR ───────────────────────────────────────── */}
      <div className="comm-mobile-bar">
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
          ← Savvly
        </button>
        <span style={{ fontWeight: 900, fontSize: 16, color: '#818CF8' }}>Community</span>
        <button onClick={() => setMobileOpen(o => !o)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, fontSize: 18, lineHeight: 1 }}>
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)' }} onClick={() => setMobileOpen(false)}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 260, height: '100%', background: '#111', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => { navigate('/dashboard'); setMobileOpen(false); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left', padding: '6px 8px', marginBottom: 16 }}>
              ← Retour Savvly
            </button>
            {NAV_ITEMS.map(item => {
              const active = !item.soon && item.path && isActive(item);
              return (
                <button key={item.label} onClick={() => { if (item.path && !item.soon) { navigate(item.path); setMobileOpen(false); } }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 8, border: 'none', borderLeft: active ? '2px solid #4F46E5' : '2px solid transparent', background: active ? 'rgba(79,70,229,0.12)' : 'transparent', color: active ? '#818CF8' : item.soon ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)', fontWeight: active ? 700 : 500, fontSize: 14, cursor: item.soon ? 'default' : 'pointer', textAlign: 'left', width: '100%' }}>
                  <span>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.soon && <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '2px 5px' }}>SOON</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
