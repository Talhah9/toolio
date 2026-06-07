import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Glyph } from '../components/Glyph';

const LINKEDIN_URL = 'https://www.linkedin.com/in/talhah-ally-75b0b1175/';

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" style={{ flexShrink: 0 }}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

const COACHING_PRICE_ID = 'price_1TbdLgAFTm9a9DAT4JM34CQP';
const THEME_IDS = ['strategie', 'tarification', 'acquisition', 'probleme', 'lancement'];

export function Coaching() {
  const navigate = useNavigate();
  const { user, session } = useApp();
  const { t } = useLang();
  const [theme, setTheme] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const inFlight = useRef(false);

  const handleSubmit = async () => {
    if (!theme)              { setError(t('coaching.error.theme')); return; }
    if (!description.trim()) { setError(t('coaching.error.description')); return; }
    if (!phone.trim())       { setError(t('coaching.error.phone')); return; }
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError('');

    try {
      // 1. Upload PDF if present
      const uid = session.user.id;
      let pdfUrl = null;
      if (pdfFile) {
        const fileName = `${uid}/${Date.now()}-${pdfFile.name}`;
        const { error: uploadErr } = await supabase.storage
          .from('coaching-pdfs')
          .upload(fileName, pdfFile, { upsert: false });
        if (uploadErr) throw new Error(t('coaching.error.pdf') + ': ' + uploadErr.message);
        const { data: { publicUrl } } = supabase.storage.from('coaching-pdfs').getPublicUrl(fileName);
        pdfUrl = publicUrl;
      }

      // 2. Create booking via backend API (service role bypasses RLS)
      const bookingRes = await fetch('/api/create-coaching-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: uid, theme, description: description.trim(), phone: phone.trim(), pdfUrl }),
      });
      const bookingJson = await bookingRes.json();
      if (bookingJson.error) throw new Error(bookingJson.error);

      // 3. Stripe checkout
      const checkoutRes = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: COACHING_PRICE_ID,
          mode: 'payment',
          userId: uid,
          userEmail: user.email,
          credits: 0,
          coachingData: { bookingId: bookingJson.id, theme, phone: phone.trim() },
        }),
      });
      const checkoutJson = await checkoutRes.json();
      if (checkoutJson.error) throw new Error(checkoutJson.error);
      window.location.href = checkoutJson.url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      inFlight.current = false;
    }
  };

  return (
    <>
      <style>{`
        @media (max-width: 600px) {
          .coaching-header-row { flex-direction: column; align-items: flex-start; overflow: hidden; }
          .coaching-header-row h1 { word-break: break-word; max-width: 100%; overflow: hidden; }
          .coaching-header-row p { max-width: 100%; }
          .coaching-benefits { padding: 14px 16px !important; }
          .coaching-form-card { padding: 16px !important; overflow: hidden; }
        }
      `}</style>
      <AppHeader />
      <div className="page-pad">
        <div style={{ maxWidth: 660, margin: '0 auto' }}>

          {/* ── Header ── */}
          <div className="coaching-header-row" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" style={{ flexShrink: 0 }}>
              <div
                style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #818CF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff', cursor: 'pointer', transition: 'opacity 0.15s', letterSpacing: '-0.02em' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                TA
              </div>
            </a>
            <div>
              <h1 style={{ fontSize: 21, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                {t('coaching.page.title')}
              </h1>
              <p style={{ margin: '0 0 10px', color: 'var(--fg-2)', fontSize: 14 }}>
                {t('coaching.page.tagline')}
              </p>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0A66C2', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <LinkedInIcon />
                Voir le profil LinkedIn →
              </a>
            </div>
          </div>

          {/* ── Subtitle ── */}
          <p style={{ fontSize: 15, color: 'var(--fg-2)', marginBottom: 28, lineHeight: 1.7 }}>
            {t('coaching.page.subtitle')}
          </p>

          {/* ── Benefits ── */}
          <div className="coaching-benefits" style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>
              {t('coaching.benefits.title')}
            </p>
            {['b1', 'b2', 'b3'].map((key, i) => (
              <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: i < 2 ? 12 : 0 }}>
                <span style={{ color: '#10B981', flexShrink: 0, marginTop: 1 }}><Glyph name="check" size={14} /></span>
                <span style={{ fontSize: 14 }}>{t(`coaching.benefits.${key}`)}</span>
              </div>
            ))}
          </div>

          {/* ── Form ── */}
          <div className="coaching-form-card" style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 24px', letterSpacing: '-0.01em' }}>
              {t('coaching.form.title')}
            </h2>

            {/* Theme */}
            <div className="field">
              <label className="label">
                {t('coaching.form.theme.label')} <span style={{ color: 'var(--error, #EF4444)', fontWeight: 700 }}>*</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', overflowX: 'hidden' }}>
                {THEME_IDS.map(id => (
                  <label
                    key={id}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, border: `1px solid ${theme === id ? 'rgba(79,70,229,0.5)' : 'var(--border)'}`, background: theme === id ? 'rgba(79,70,229,0.06)' : 'transparent', transition: 'all 0.15s', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={id}
                      checked={theme === id}
                      onChange={() => setTheme(id)}
                      style={{ accentColor: '#4F46E5', width: 15, height: 15, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 14, fontWeight: theme === id ? 600 : 400 }}>{t(`coaching.theme.${id}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="field" style={{ marginTop: 20 }}>
              <label className="label">
                {t('coaching.form.description.label')} <span style={{ color: 'var(--error, #EF4444)', fontWeight: 700 }}>*</span>
              </label>
              <textarea
                className="input"
                style={{ minHeight: 110, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, width: '100%', maxWidth: '100%' }}
                placeholder={t('coaching.form.description.placeholder')}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* Phone */}
            <div className="field" style={{ marginTop: 20 }}>
              <label className="label">
                {t('coaching.form.phone.label')} <span style={{ color: 'var(--error, #EF4444)', fontWeight: 700 }}>*</span>
              </label>
              <input
                className="input"
                type="tel"
                placeholder="+33 6 12 34 56 78"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{ width: '100%', maxWidth: '100%' }}
              />
            </div>

            {/* PDF */}
            <div className="field" style={{ marginTop: 20 }}>
              <label className="label">
                {t('coaching.form.document.label')}{' '}
                <span style={{ color: 'var(--fg-3)', fontWeight: 400 }}>{t('coaching.form.document.optional')}</span>
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                style={{ border: '1px dashed var(--border)', borderRadius: 8, padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'border-color 0.15s', width: '100%', boxSizing: 'border-box' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(79,70,229,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <Glyph name="legal" size={15} />
                <span style={{ fontSize: 13, color: 'var(--fg-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pdfFile ? pdfFile.name : t('coaching.form.document.placeholder')}
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
              {loading ? t('coaching.form.submitting') : t('coaching.form.submit')}
            </button>

            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 10, padding: '12px', border: '2px solid #4F46E5', borderRadius: 10, color: '#4F46E5', fontWeight: 700, fontSize: 14, textDecoration: 'none', transition: 'background 0.15s', background: 'transparent', boxSizing: 'border-box' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,70,229,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <LinkedInIcon />
              Contacter directement sur LinkedIn
            </a>

            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--fg-3)', marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Glyph name="lock" size={12} /> {t('coaching.form.secure')}
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
