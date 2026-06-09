import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

const CHECK_SVG = (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
    <path d="M2.5 6.5l3 3 5-5" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BULLETS = [
  'Positionne ton offre et ton TJM',
  'Stratégie pour trouver des clients',
  'Actions concrètes à mettre en place immédiatement',
  'Analyse de ton profil LinkedIn',
];

export function CoachingBanner() {
  const { isPro, user, session } = useApp();
  const [status, setStatus] = useState(null); // null = loading
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isPro || !session?.access_token) return;
    fetch('/api/coaching-eligibility', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    })
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [isPro, session?.access_token]);

  if (!isPro || !status) return null;

  // Already claimed
  if (status.coaching_claimed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #BBF7D0', marginBottom: 16, fontSize: 13 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2.5 7l3 3 6-6" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span style={{ color: '#15803D', fontWeight: 500 }}>Coaching gratuit réservé — on te contacte sous 48h.</span>
      </div>
    );
  }

  // Not yet eligible — progress bar
  if (!status.eligible) {
    const pct = Math.min(100, Math.round((status.days_since_first_payment / 60) * 100));
    return (
      <div style={{ padding: '12px 16px', borderRadius: 10, background: '#F8F8FA', border: '1px solid var(--border)', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--fg-2)', fontWeight: 500 }}>
            🎯 Coaching 1:1 gratuit disponible dans <strong>{status.days_remaining} jours</strong>
          </span>
          <span style={{ fontSize: 11, color: 'var(--fg-4)' }}>{pct}%</span>
        </div>
        <div style={{ height: 4, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #4F46E5, #7C3AED)', transition: 'width 0.6s ease' }} />
        </div>
      </div>
    );
  }

  // Eligible — CTA banner
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          marginBottom: 20,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #4F46E5 0%, #6D28D9 100%)',
          padding: '20px 24px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle glow */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
          🎯 Ton coaching 1:1 gratuit est disponible !
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 14, lineHeight: 1.5 }}>
          Tu es abonné depuis plus de 2 mois. Réserve ta session avec un expert qui a accompagné +150 freelances.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', marginBottom: 18 }}>
          {BULLETS.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true"><path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              {b}
            </div>
          ))}
        </div>

        <motion.button
          onClick={() => setShowModal(true)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{ background: '#fad02c', color: '#1C1917', border: 'none', borderRadius: 10, padding: '11px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer', letterSpacing: '0.01em' }}
        >
          Réserver mon coaching gratuit →
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <BookingModal
            user={user}
            session={session}
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false);
              setStatus(prev => ({ ...prev, coaching_claimed: true }));
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function BookingModal({ user, session, onClose, onSuccess }) {
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!phone.trim() || !description.trim()) {
      setError('Remplis tous les champs obligatoires.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/claim-coaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ firstName, lastName, phone, description }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Erreur');
      setDone(true);
      setTimeout(onSuccess, 2200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.22 }}
        style={{ background: '#fff', borderRadius: 16, padding: '28px 28px 24px', maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        {done ? (
          <SuccessState />
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Réserver mon coaching gratuit</h3>
              <p style={{ fontSize: 13, color: 'var(--fg-3)' }}>On te contacte sous 48h pour convenir d'un créneau.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">Prénom</label>
                <input className="input" value={firstName} onChange={e => setFirstName(e.target.value)} disabled={submitting} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">Nom</label>
                <input className="input" value={lastName} onChange={e => setLastName(e.target.value)} disabled={submitting} />
              </div>
            </div>
            <div className="field" style={{ margin: '0 0 12px' }}>
              <label className="label">Email</label>
              <input className="input" value={user?.email || ''} readOnly style={{ opacity: 0.6, cursor: 'default' }} />
            </div>
            <div className="field" style={{ margin: '0 0 12px' }}>
              <label className="label">Téléphone *</label>
              <input className="input" placeholder="+33 6 12 34 56 78" value={phone} onChange={e => setPhone(e.target.value)} disabled={submitting} />
            </div>
            <div className="field" style={{ margin: '0 0 20px' }}>
              <label className="label">Sur quoi veux-tu travailler ? *</label>
              <textarea
                className="input"
                rows={4}
                placeholder="Ex : je veux structurer mon offre, trouver mes premiers clients, optimiser mon TJM..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={submitting}
                style={{ resize: 'vertical' }}
              />
            </div>

            {error && <p style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>Annuler</button>
              <button
                className="btn"
                style={{ background: '#4F46E5', color: '#fff', borderColor: '#4F46E5' }}
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? '…' : 'Envoyer ma demande →'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function SuccessState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ textAlign: 'center', padding: '16px 0' }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
        style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12l5 5 9-9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
      <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Demande envoyée !</h3>
      <p style={{ fontSize: 14, color: 'var(--fg-3)', lineHeight: 1.6 }}>
        On te contacte sous 48h pour convenir d'un créneau.<br />
        Prépare tes questions 🚀
      </p>
    </motion.div>
  );
}
