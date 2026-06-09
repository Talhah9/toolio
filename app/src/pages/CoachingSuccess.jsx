import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Glyph } from '../components/Glyph';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

const THEME_LABELS = {
  strategie:    'Stratégie & positionnement',
  tarification: 'Tarification & offres',
  acquisition:  'Acquisition clients',
  probleme:     'Problème spécifique',
  lancement:    "Lancement d'activité",
};

export function CoachingSuccess() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('coaching_bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setBooking(data));
  }, [user]);

  return (
    <>
      <AppHeader />
      <div className="page-pad">
        <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', paddingTop: 32 }}>

          {/* Icon */}
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#10B981' }}>
            <Glyph name="check-circle" size={28} />
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Votre consultation est confirmée !
          </h1>

          <p style={{ fontSize: 15, color: 'var(--fg-2)', marginBottom: 36, lineHeight: 1.7 }}>
            Un expert Savvly va vous contacter sous 24h sur{' '}
            <strong>{user?.email}</strong>
            {booking?.phone ? <> ou au <strong>{booking.phone}</strong></> : ''}.
          </p>

          {/* Booking summary */}
          <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 32, textAlign: 'left' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>
              Récapitulatif
            </p>
            <div className="kv-list">
              {booking?.theme && (
                <div className="kv-row">
                  <span className="k">Thématique</span>
                  <span className="v">{THEME_LABELS[booking.theme] || booking.theme}</span>
                </div>
              )}
              {booking?.phone && (
                <div className="kv-row">
                  <span className="k">Téléphone</span>
                  <span className="v">{booking.phone}</span>
                </div>
              )}
              <div className="kv-row">
                <span className="k">Durée</span>
                <span className="v">1 heure</span>
              </div>
              <div className="kv-row">
                <span className="k">Format</span>
                <span className="v">Appel vidéo</span>
              </div>
              <div className="kv-row">
                <span className="k">Suivi</span>
                <span className="v">Email 7 jours post-séance</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-accent"
            style={{ padding: '12px 32px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Retour au dashboard
          </button>

        </div>
      </div>
    </>
  );
}
