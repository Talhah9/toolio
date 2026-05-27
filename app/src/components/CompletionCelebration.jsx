import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const DURATION_MS = 4000;

const PARTICLES = [
  { color: '#4F46E5', tx:   0, ty: -80 },
  { color: '#818CF8', tx:  57, ty: -57 },
  { color: '#F59E0B', tx:  80, ty:   0 },
  { color: '#10B981', tx:  57, ty:  57 },
  { color: '#4F46E5', tx:   0, ty:  80 },
  { color: '#818CF8', tx: -57, ty:  57 },
  { color: '#F59E0B', tx: -80, ty:   0 },
  { color: '#10B981', tx: -57, ty: -57 },
  { color: '#A78BFA', tx:  30, ty: -88 },
  { color: '#FBBF24', tx: -30, ty:  88 },
];

export function CompletionCelebration({ onPdf, onFullscreen, onClose, t }) {
  const [progress, setProgress] = useState(100);
  const frameRef = useRef(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / DURATION_MS) * 100);
      setProgress(pct);
      if (elapsed < DURATION_MS) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        onClose();
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [onClose]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
      <style>{`
        @keyframes cc-burst {
          0%   { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--cc-tx), var(--cc-ty)) scale(0); opacity: 0; }
        }
      `}</style>

      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        style={{
          position: 'relative',
          background: '#1a1a2e',
          border: '1px solid rgba(79,70,229,0.5)',
          boxShadow: '0 0 60px rgba(79,70,229,0.25)',
          borderRadius: 16,
          padding: '32px 28px 24px',
          maxWidth: 380,
          width: '100%',
          textAlign: 'center',
          zIndex: 1,
        }}
      >
        {/* Particle burst — centered on the emoji area */}
        <div aria-hidden style={{ position: 'absolute', top: 60, left: '50%', width: 0, height: 0, pointerEvents: 'none' }}>
          {PARTICLES.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 8, height: 8,
                marginLeft: -4, marginTop: -4,
                borderRadius: '50%',
                background: p.color,
                '--cc-tx': `${p.tx}px`,
                '--cc-ty': `${p.ty}px`,
                animation: `cc-burst 0.85s cubic-bezier(0, 0.9, 0.57, 1) ${i * 0.04}s both`,
              }}
            />
          ))}
        </div>

        <button
          onClick={onClose}
          aria-label="Close"
          style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: '4px 8px' }}
        >×</button>

        <div style={{ fontSize: 42, lineHeight: 1, marginBottom: 14 }}>✨</div>

        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          {t('celebration.title')}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.5 }}>
          {t('celebration.subtitle')}
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          {onPdf && (
            <button
              onClick={() => { onPdf(); onClose(); }}
              style={{ flex: 1, padding: '10px 14px', background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.4)', borderRadius: 8, color: '#818CF8', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              ↓ {t('celebration.pdf')}
            </button>
          )}
          <button
            onClick={() => { onFullscreen(); onClose(); }}
            style={{ flex: 1, padding: '10px 14px', background: 'linear-gradient(135deg, #4F46E5, #6D5EF7)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            ⤢ {t('celebration.fullscreen')}
          </button>
        </div>

        <div style={{ marginTop: 20, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #4F46E5, #818CF8)', transition: 'none' }} />
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
          {t('celebration.dismiss')}
        </p>
      </motion.div>
    </div>
  );
}
