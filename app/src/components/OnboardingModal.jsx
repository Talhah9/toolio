import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

const TOTAL = 5;

const FEATURED_TOOLS = [
  { icon: '🔗', name: 'LinkedIn Content', tagline: 'Posts qui engagent' },
  { icon: '🖼️', name: "Générateur d'image", tagline: 'Visuels pro en secondes' },
  { icon: '📄', name: 'CGV & Docs juridiques', tagline: 'Conformes droit français' },
  { icon: '💼', name: 'Générateur de devis', tagline: 'Prêt à envoyer en 2 min' },
  { icon: '🔍', name: 'Audit CRO + SEO', tagline: "Analyse n'importe quel site" },
  { icon: '🤝', name: 'Contrat freelance', tagline: 'Protège-toi juridiquement' },
];

const slideVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

export function OnboardingModal() {
  const [step, setStep] = useState(1);
  const { credits, completeOnboarding } = useApp();
  const navigate = useNavigate();

  const handleSkip = () => completeOnboarding();

  const handleNext = () => {
    if (step < TOTAL) {
      setStep(s => s + 1);
    }
  };

  const handleFinish = async () => {
    await completeOnboarding();
    navigate('/tools/linkedin-content');
  };

  return (
    <div className="modal-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="modal"
        style={{ maxWidth: 560, width: '92%' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="muted" style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.04em' }}>
            Étape {step} / {TOTAL}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '2px 10px', fontSize: 12, color: 'var(--fg-4)' }}
            onClick={handleSkip}
          >
            Passer
          </button>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, padding: '0 24px 20px', justifyContent: 'center' }}>
          {Array.from({ length: TOTAL }, (_, i) => (
            <motion.div
              key={i}
              animate={{ width: i + 1 === step ? 20 : 7, background: i < step ? 'var(--accent)' : 'var(--border)' }}
              transition={{ duration: 0.25 }}
              style={{ height: 7, borderRadius: 99 }}
            />
          ))}
        </div>

        {/* Step content with slide animation */}
        <div className="modal-body" style={{ overflow: 'hidden', minHeight: 240 }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >

              {/* ── Step 1 — Welcome ─────────────────────────── */}
              {step === 1 && (
                <div style={{ textAlign: 'center', padding: '8px 8px 16px' }}>
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
                    style={{ fontSize: 52, marginBottom: 16 }}
                  >
                    👋
                  </motion.div>
                  <h3 className="h3" style={{ marginBottom: 10 }}>Bienvenue sur Savvly</h3>
                  <p className="muted" style={{ fontSize: 14, lineHeight: 1.65, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                    Le toolkit IA conçu pour les freelances et solopreneurs.
                    13 outils pour gagner du temps, trouver des clients et développer ton business.
                  </p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 99, background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.18)', color: '#4F46E5', fontWeight: 700, fontSize: 15 }}>
                    🎁 {credits ?? 50} crédits offerts pour commencer
                  </div>
                </div>
              )}

              {/* ── Step 2 — Tools ───────────────────────────── */}
              {step === 2 && (
                <div>
                  <h3 className="h3" style={{ marginBottom: 6 }}>13 outils IA à ta disposition</h3>
                  <p className="muted" style={{ fontSize: 13, marginBottom: 20 }}>
                    Génère des posts LinkedIn viraux, crée tes CGV en 30 secondes, rédige des contrats pro, analyse tes concurrents, génère des visuels...
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {FEATURED_TOOLS.map(({ icon, name, tagline }) => (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--bg-soft, #F8F8FA)', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{name}</div>
                          <div style={{ fontSize: 11, color: 'var(--fg-4)' }}>{tagline}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 3 — Community ───────────────────────── */}
              {step === 3 && (
                <div style={{ textAlign: 'center', padding: '8px 8px 16px' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
                  <h3 className="h3" style={{ marginBottom: 10 }}>Rejoins 200+ freelances</h3>
                  <p className="muted" style={{ fontSize: 14, lineHeight: 1.65, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                    Accède au Club des Entrepreneurs — ateliers mensuels sur l'IA, Claude Code, LinkedIn, trouver des clients.
                    Une communauté active pour ne jamais avancer seul.
                  </p>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { completeOnboarding(); navigate('/community'); }}
                    style={{ fontSize: 13 }}
                  >
                    Accéder à la communauté →
                  </button>
                </div>
              )}

              {/* ── Step 4 — Coaching ────────────────────────── */}
              {step === 4 && (
                <div style={{ borderRadius: 14, background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', padding: '24px 22px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
                  <h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 10, color: '#fff' }}>
                    🎯 Un coaching 1:1 offert après 2 mois
                  </h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, marginBottom: 20 }}>
                    Après 2 mois d'abonnement, tu débloques une session de coaching gratuit avec un expert qui a accompagné +150 freelances.
                    Positionnement, stratégie clients, TJM, LinkedIn — on analyse ton cas et tu repars avec un plan d'action concret.
                  </p>
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fad02c', color: '#0A0A0A', borderRadius: 99, padding: '6px 16px', fontWeight: 700, fontSize: 13 }}
                  >
                    🔒 Se débloque dans 60 jours
                  </motion.div>
                </div>
              )}

              {/* ── Step 5 — Go ──────────────────────────────── */}
              {step === 5 && (
                <div style={{ textAlign: 'center', padding: '8px 8px 16px' }}>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.08 }}
                    style={{ fontSize: 52, marginBottom: 16 }}
                  >
                    🎉
                  </motion.div>
                  <h3 className="h3" style={{ marginBottom: 10 }}>C'est parti !</h3>
                  <p className="muted" style={{ fontSize: 14, lineHeight: 1.65, marginBottom: 28, maxWidth: 380, margin: '0 auto 28px' }}>
                    Tu as {credits ?? 50} crédits gratuits pour tester les outils.
                    Commence par générer ton premier post LinkedIn ou analyser ton site — ça prend 30 secondes.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                    <button
                      className="btn btn-primary"
                      style={{ minWidth: 220 }}
                      onClick={handleFinish}
                    >
                      Essayer LinkedIn Content →
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--fg-3)', fontSize: 13 }}
                      onClick={() => { completeOnboarding(); navigate('/dashboard'); }}
                    >
                      Explorer tous les outils
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step < TOTAL && (
          <div className="modal-foot" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleNext}>
              Suivant →
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
