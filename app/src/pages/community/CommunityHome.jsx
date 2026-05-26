import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useLang } from '../../context/LanguageContext';

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

    </div>
  );
}
