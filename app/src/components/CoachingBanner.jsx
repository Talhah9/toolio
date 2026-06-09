import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

const AVANTAGES = [
  'Positionnement & TJM',
  'Stratégie pour trouver des clients',
  'Actions concrètes immédiates',
  'Analyse de ton profil LinkedIn',
  'Ateliers de groupe inclus',
];

const PROGRESS_AVANTAGES = ['Positionnement & TJM', 'Stratégie clients', 'Actions concrètes', 'Analyse LinkedIn'];

export function CoachingBanner() {
  const { isPro, user, session } = useApp();
  const [status, setStatus] = useState(null);
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

  // Case 3 — already claimed
  if (status.coaching_claimed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #BBF7D0', marginBottom: 16, fontSize: 13 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2.5 7l3 3 6-6" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span style={{ color: '#15803D', fontWeight: 500 }}>Coaching réservé — on te contacte bientôt.</span>
      </div>
    );
  }

  // Case 1 — not yet eligible
  if (!status.eligible) {
    const pct = Math.min(100, Math.round((status.days_since_first_payment / 60) * 100));
    return (
      <div style={{ padding: '14px 18px', borderRadius: 12, background: '#F9F9FB', border: '1px solid var(--border)', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--fg-2)', fontWeight: 600 }}>
            🎯 Coaching 1:1 gratuit disponible dans <strong style={{ color: 'var(--fg)' }}>{status.days_remaining} jours</strong>
          </span>
          <span style={{ fontSize: 11, color: 'var(--fg-4)', fontWeight: 500 }}>{pct} / 100%</span>
        </div>
        <div style={{ height: 5, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', marginBottom: 10 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #4F46E5, #7C3AED)' }}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 14px' }}>
          {PROGRESS_AVANTAGES.map(a => (
            <span key={a} style={{ fontSize: 11, color: 'var(--fg-4)' }}>· {a}</span>
          ))}
        </div>
      </div>
    );
  }

  // Case 2 — eligible
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          marginBottom: 20,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          padding: '22px 24px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6, lineHeight: 1.3 }}>
          🎯 Ton coaching 1:1 gratuit est disponible !
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16, lineHeight: 1.55 }}>
          Tu es membre depuis plus de 2 mois. Réserve ta session avec un expert qui a accompagné +150 freelances.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', marginBottom: 18 }}>
          {AVANTAGES.map(a => (
            <span key={a} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 6l2.5 2.5L10 3" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {a}
            </span>
          ))}
        </div>

        <motion.button
          onClick={() => setShowModal(true)}
          whileHover={{ background: '#fce96a' }}
          style={{ background: '#fad02c', color: '#0A0A0A', border: 'none', borderRadius: 10, padding: '11px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer', letterSpacing: '0.01em' }}
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
      setTimeout(onSuccess, 2400);
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
        exit={{ opacity: 0, scale: 0.94, y: 8 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        style={{ background: '#fff', borderRadius: 18, padding: '28px 28px 24px', maxWidth: 500, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        {done ? <SuccessState /> : (
          <>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Réserver mon coaching 1:1 gratuit</h3>
              <p style={{ fontSize: 13, color: 'var(--fg-3)' }}>On te contacte sous 48h pour fixer le créneau.</p>
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
                placeholder="Ex: je veux trouver mes premiers clients, définir mon TJM, améliorer mon profil LinkedIn..."
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
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      style={{ textAlign: 'center', padding: '20px 0' }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.08 }}
        style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}
      >
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
          <path d="M5 13l5.5 5.5 10.5-10.5" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
      <h3 style={{ fontWeight: 800, fontSize: 19, marginBottom: 10 }}>Demande envoyée ! 🎉</h3>
      <p style={{ fontSize: 14, color: 'var(--fg-3)', lineHeight: 1.6 }}>
        On te contacte sous 48h pour convenir d'un créneau.<br />
        Prépare tes questions 🚀
      </p>
    </motion.div>
  );
}
