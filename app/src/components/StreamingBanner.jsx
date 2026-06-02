import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLang } from '../context/LanguageContext';

export default function StreamingBanner({ loading, hasOutput }) {
  const { lang } = useLang();
  const [phase, setPhase] = useState('hidden'); // 'hidden' | 'generating' | 'done'
  const prevLoadingRef = useRef(false);

  useEffect(() => {
    if (loading && hasOutput) {
      setPhase('generating');
    } else if (!loading && prevLoadingRef.current && hasOutput) {
      setPhase('done');
      const timer = setTimeout(() => setPhase('hidden'), 2000);
      return () => clearTimeout(timer);
    } else if (!loading && !hasOutput) {
      setPhase('hidden');
    }
    prevLoadingRef.current = loading;
  }, [loading, hasOutput]);

  return (
    <AnimatePresence>
      {phase !== 'hidden' && (
        <motion.div
          key="streaming-banner"
          initial={{ height: 0 }}
          animate={{ height: 36 }}
          exit={{ height: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          style={{ overflow: 'hidden', flexShrink: 0 }}
        >
          <div style={{
            height: 36,
            background: phase === 'done' ? 'rgba(34,197,94,0.1)' : 'rgba(79,70,229,0.1)',
            borderBottom: `1px solid ${phase === 'done' ? 'rgba(34,197,94,0.3)' : 'rgba(79,70,229,0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
          }}>
            {phase === 'generating' ? (
              <>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4F46E5' }}>
                  <span style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    border: '2px solid #4F46E5',
                    borderTopColor: 'transparent',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block',
                    flexShrink: 0,
                  }} />
                  {lang === 'fr' ? 'Génération en cours...' : 'Generating...'}
                </span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4F46E5', animation: 'pulse 1s infinite', flexShrink: 0 }} />
              </>
            ) : (
              <>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                  ✓ {lang === 'fr' ? 'Prêt !' : 'Ready!'}
                </span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
