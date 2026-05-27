import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Glyph } from '../components/Glyph';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

const COACHING_PRICE_ID = 'price_1TbdLgAFTm9a9DAT4JM34CQP';

const THEMES = [
  { id: 'strategie',    label: '🎯 Stratégie & positionnement' },
  { id: 'tarification', label: '💰 Tarification & offres' },
  { id: 'acquisition',  label: '📈 Acquisition clients' },
  { id: 'probleme',     label: '🔧 Problème spécifique' },
  { id: 'lancement',    label: "🚀 Lancement d'activité" },
];

export function Coaching() {
  const navigate = useNavigate();
  const { user, session } = useApp();
  const [theme, setTheme] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const inFlight = useRef(false);

  const handleSubmit = async () => {
    if (!theme)              { setError('Choisissez une thématique.'); return; }
    if (!description.trim()) { setError('Décrivez votre situation.'); return; }
    if (!phone.trim())       { setError('Renseignez votre numéro de téléphone.'); return; }
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError('');

    try {
      // 1. Upload PDF if present
      let pdfUrl = null;
      if (pdfFile) {
        const fileName = `${user.id}/${Date.now()}-${pdfFile.name}`;
        const { error: uploadErr } = await supabase.storage
          .from('coaching-pdfs')
          .upload(fileName, pdfFile, { upsert: false });
        if (uploadErr) throw new Error('Erreur upload PDF : ' + uploadErr.message);
        const { data: { publicUrl } } = supabase.storage.from('coaching-pdfs').getPublicUrl(fileName);
        pdfUrl = publicUrl;
      }

      // 2. Insert booking
      const { data: booking, error: bookingErr } = await supabase
        .from('coaching_bookings')
        .insert({ user_id: user.id, theme, description: description.trim(), phone: phone.trim(), pdf_url: pdfUrl, status: 'pending' })
        .select('id')
        .single();
      if (bookingErr) throw new Error(bookingErr.message);

      // 3. Stripe checkout
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: COACHING_PRICE_ID,
          mode: 'payment',
          userId: user.id,
          userEmail: user.email,
          credits: 0,
          coachingData: { bookingId: booking.id, theme, phone: phone.trim() },
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      window.location.href = json.url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      inFlight.current = false;
    }
  };

  return (
    <>
      <AppHeader />
      <div className="page-pad">
        <div style={{ maxWidth: 660, margin: '0 auto' }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            <a href="https://talhahally.com/" target="_blank" rel="noreferrer" style={{ flexShrink: 0 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #818CF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff', cursor: 'pointer', transition: 'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                T
              </div>
            </a>
            <div>
              <h1 style={{ fontSize: 21, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                Réservez une consultation avec Talhah Ally
              </h1>
              <p style={{ margin: '0 0 6px', color: 'var(--fg-2)', fontSize: 14 }}>
                Coach business — 1h de consultation à 80€
              </p>
              <a href="https://talhahally.com/" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Voir mon profil →
              </a>
            </div>
          </div>

          {/* ── Subtitle ── */}
          <p style={{ fontSize: 15, color: 'var(--fg-2)', marginBottom: 28, lineHeight: 1.7 }}>
            Structurez votre activité, résolvez vos blocages concrets, établissez une stratégie claire et un plan d'action.
          </p>

          {/* ── Benefits ── */}
          <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>Ce que vous obtenez</p>
            {[
              '1h de consultation individuelle par appel vidéo',
              "Un plan d'action concret à l'issue de la séance",
              'Suivi par email pendant 7 jours après la consultation',
            ].map((benefit, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: i < 2 ? 12 : 0 }}>
                <span style={{ color: '#10B981', flexShrink: 0, marginTop: 1 }}><Glyph name="check" size={14} /></span>
                <span style={{ fontSize: 14 }}>{benefit}</span>
              </div>
            ))}
          </div>

          {/* ── Form ── */}
          <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 24px', letterSpacing: '-0.01em' }}>
              Formulaire de réservation
            </h2>

            {/* Theme */}
            <div className="field">
              <label className="label">
                Thématique <span style={{ color: 'var(--error, #EF4444)', fontWeight: 700 }}>*</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {THEMES.map(th => (
                  <label
                    key={th.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, border: `1px solid ${theme === th.id ? 'rgba(79,70,229,0.5)' : 'var(--border)'}`, background: theme === th.id ? 'rgba(79,70,229,0.06)' : 'transparent', transition: 'all 0.15s' }}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={th.id}
                      checked={theme === th.id}
                      onChange={() => setTheme(th.id)}
                      style={{ accentColor: '#4F46E5', width: 15, height: 15, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 14, fontWeight: theme === th.id ? 600 : 400 }}>{th.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="field" style={{ marginTop: 20 }}>
              <label className="label">
                Description du problème <span style={{ color: 'var(--error, #EF4444)', fontWeight: 700 }}>*</span>
              </label>
              <textarea
                className="input"
                style={{ minHeight: 110, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                placeholder="Décrivez votre situation en quelques lignes"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* Phone */}
            <div className="field" style={{ marginTop: 20 }}>
              <label className="label">
                Téléphone <span style={{ color: 'var(--error, #EF4444)', fontWeight: 700 }}>*</span>
              </label>
              <input
                className="input"
                type="tel"
                placeholder="+33 6 12 34 56 78"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            {/* PDF */}
            <div className="field" style={{ marginTop: 20 }}>
              <label className="label">
                Document <span style={{ color: 'var(--fg-3)', fontWeight: 400 }}>(optionnel — brief, business plan…)</span>
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                style={{ border: '1px dashed var(--border)', borderRadius: 8, padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(79,70,229,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <Glyph name="legal" size={15} />
                <span style={{ fontSize: 13, color: 'var(--fg-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pdfFile ? pdfFile.name : 'Partagez un document si utile (brief, business plan, etc.)'}
                </span>
                {pdfFile && (
                  <button
                    onClick={e => { e.stopPropagation(); setPdfFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                    style={{ background: 'none', border: 'none', color: 'var(--fg-3)', cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1, flexShrink: 0 }}
                  >×</button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={e => setPdfFile(e.target.files[0] || null)}
                style={{ display: 'none' }}
              />
            </div>

            {error && (
              <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, color: '#EF4444' }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn btn-accent"
              style={{ width: '100%', marginTop: 24, padding: '14px', fontSize: 15, fontWeight: 800, opacity: loading ? 0.6 : 1, cursor: loading ? 'default' : 'pointer', letterSpacing: '0.01em' }}
            >
              {loading ? 'Redirection vers le paiement...' : 'Réserver ma consultation — 80€'}
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--fg-3)', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Glyph name="lock" size={12} /> Paiement sécurisé via Stripe
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
