import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useLang } from '../../context/LanguageContext';

const LEADERBOARD = [
  { name: 'Sophie M.', xp: 2840, badge: '👑' },
  { name: 'Thomas R.', xp: 1920, badge: '🔥' },
  { name: 'Léa D.',    xp: 1430, badge: '🔥' },
  { name: 'Marc C.',   xp: 890,  badge: '🌟' },
  { name: 'Inès B.',   xp: 640,  badge: '🌟' },
];

const LEVELS = [
  { icon: '⚡', name: 'Starter',  range: '0 – 100 XP',   color: '#6B7280' },
  { icon: '🌟', name: 'Explorer', range: '100 – 500 XP',  color: '#60A5FA' },
  { icon: '🔥', name: 'Expert',   range: '500 – 2k XP',   color: '#F97316' },
  { icon: '👑', name: 'Légende',  range: '2000+ XP',      color: '#fad02c' },
];

const BADGES_DEMO = ['🏆 Première mission', '⚡ Membre actif', '🤝 5 connexions', '🚀 Top 10', '💎 Pro membre'];

export function CommunityHome() {
  const navigate = useNavigate();
  const { t } = useLang();
  const reduce = useReducedMotion();

  const fadeUp = (delay = 0) => reduce ? {} : {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1], delay },
  };

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', color: '#fff' }}>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <div className="comm-dot-grid" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px 80px' }}>
        {/* Purple glow blobs */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(250,208,44,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 900, width: '100%', margin: '0 auto' }}>
          {/* Badge */}
          <motion.div {...fadeUp(0)} style={{ marginBottom: 24 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.35)', borderRadius: 100, padding: '6px 16px', fontSize: 12, fontWeight: 700, color: '#818CF8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              🚀 {t('landing.community.badge')}
            </span>
          </motion.div>

          {/* Hero title */}
          <motion.h1 {...fadeUp(0.05)} style={{ fontSize: 'clamp(36px, 6vw, 80px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 20px', background: 'linear-gradient(135deg, #fff 40%, #818CF8 80%, #fad02c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t('community.home.hero.title')}
          </motion.h1>

          <motion.p {...fadeUp(0.1)} style={{ fontSize: 'clamp(15px, 2vw, 20px)', color: 'rgba(255,255,255,0.55)', margin: '0 0 48px', maxWidth: 560 }}>
            {t('community.home.hero.sub')}
          </motion.p>

          {/* Floating stats */}
          <motion.div {...fadeUp(0.15)} style={{ display: 'flex', gap: 32, marginBottom: 48, flexWrap: 'wrap' }}>
            {[
              { value: '247', label: t('community.home.stats.missions') },
              { value: '1,200+', label: t('community.home.stats.members') },
              { value: '4.9 ★', label: t('community.home.stats.rating') },
            ].map((s) => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{s.value}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.label}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA cards */}
          <motion.div {...fadeUp(0.2)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Post card */}
            <motion.div
              onClick={() => navigate('/community/post')}
              whileHover={reduce ? {} : { scale: 1.02, y: -4 }}
              whileTap={reduce ? {} : { scale: 0.98 }}
              style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 20, padding: '40px 32px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 20%, rgba(99,102,241,0.2), transparent 60%)', pointerEvents: 'none' }} />
              <div style={{ fontSize: 40, marginBottom: 16 }}>📢</div>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 900, margin: '0 0 10px', lineHeight: 1.1, color: '#fff' }}>{t('community.home.card.post.title')}</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 32px' }}>{t('community.home.card.post.sub')}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#818CF8', fontWeight: 700, fontSize: 14 }}>
                {t('community.home.card.post.action')}
                <motion.span animate={reduce ? {} : { x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>→</motion.span>
              </div>
            </motion.div>

            {/* Find card */}
            <motion.div
              onClick={() => navigate('/community/find')}
              whileHover={reduce ? {} : { scale: 1.02, y: -4 }}
              whileTap={reduce ? {} : { scale: 0.98 }}
              style={{ background: '#fad02c', border: '1px solid rgba(250,208,44,0.6)', borderRadius: 20, padding: '40px 32px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 80%, rgba(0,0,0,0.06), transparent 60%)', pointerEvents: 'none' }} />
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 900, margin: '0 0 10px', lineHeight: 1.1, color: '#0A0A0A' }}>{t('community.home.card.find.title')}</h2>
              <p style={{ color: 'rgba(0,0,0,0.5)', fontSize: 14, margin: '0 0 32px' }}>{t('community.home.card.find.sub')}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0A0A0A', fontWeight: 700, fontSize: 14 }}>
                {t('community.home.card.find.action')}
                <motion.span animate={reduce ? {} : { x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.3 }}>→</motion.span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ── GAMIFICATION SECTION ──────────────────────────────── */}
      <div style={{ background: '#111111', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div
            initial={reduce ? {} : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div style={{ marginBottom: 48 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fad02c', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t('community.home.gamif.eyebrow')}</span>
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 44px)', fontWeight: 900, margin: '12px 0 12px', letterSpacing: '-0.02em' }}>{t('community.home.gamif.title')}</h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15 }}>{t('community.home.gamif.sub')}</p>
            </div>

            {/* Levels grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 48 }}>
              {LEVELS.map((lv, i) => (
                <motion.div
                  key={lv.name}
                  initial={reduce ? {} : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${lv.color}30`, borderRadius: 14, padding: '24px 16px', textAlign: 'center' }}
                >
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{lv.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: lv.color, marginBottom: 4 }}>{lv.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{lv.range}</div>
                </motion.div>
              ))}
            </div>

            {/* Badges */}
            <div style={{ marginBottom: 48 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('community.home.gamif.badges')}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {BADGES_DEMO.map((b, i) => (
                  <motion.span
                    key={b}
                    initial={reduce ? {} : { opacity: 0, scale: 0.85 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    style={{ background: 'rgba(250,208,44,0.07)', border: '1px solid rgba(250,208,44,0.25)', borderRadius: 100, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#fad02c' }}
                  >
                    {b}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('community.home.gamif.leaderboard')}</div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                {LEADERBOARD.map((entry, i) => (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: i < LEADERBOARD.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <span style={{ width: 24, fontWeight: 900, fontSize: 13, color: i === 0 ? '#fad02c' : 'rgba(255,255,255,0.3)' }}>#{i + 1}</span>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: `hsl(${i * 60}, 60%, 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {entry.name[0]}
                    </div>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{entry.name}</span>
                    <span style={{ fontSize: 20 }}>{entry.badge}</span>
                    <span style={{ fontWeight: 800, fontSize: 14, color: i === 0 ? '#fad02c' : 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>{entry.xp.toLocaleString()} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
