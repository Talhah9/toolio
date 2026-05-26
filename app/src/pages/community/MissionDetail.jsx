import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';

const REMOTE_ICONS = { remote: '🌐', hybrid: '🏢', onsite: '📍' };
const REMOTE_LABELS = { remote: 'Remote', hybrid: 'Hybride', onsite: 'Sur site' };

export function MissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();
  const { t } = useLang();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    supabase.from('missions').select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); }
        else { setMission(data); }
        setLoading(false);
      });

    // Increment views (non-critical)
    supabase.rpc('increment_mission_views', { p_id: id }).catch(() => {});
  }, [id]);

  const isOwner = user?.id === mission?.user_id;
  const daysAgo = mission ? Math.floor((Date.now() - new Date(mission.created_at)) / 86400000) : 0;

  if (loading) {
    return (
      <div style={{ background: '#0A0A0A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4F46E5', animation: 'pulse 1s infinite' }} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ background: '#0A0A0A', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🔍</div>
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Mission introuvable.</p>
        <button onClick={() => navigate('/community/find')} style={{ background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>
          ← {t('community.mission.back')}
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', color: '#fff', padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <button onClick={() => navigate('/community/find')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← {t('community.mission.back')}
        </button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          {/* Type badge + meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ background: mission.type === 'offer' ? 'rgba(79,70,229,0.15)' : 'rgba(250,208,44,0.12)', border: `1px solid ${mission.type === 'offer' ? 'rgba(79,70,229,0.35)' : 'rgba(250,208,44,0.3)'}`, borderRadius: 100, padding: '4px 14px', fontSize: 12, fontWeight: 700, color: mission.type === 'offer' ? '#818CF8' : '#fad02c' }}>
              {mission.type === 'offer' ? '📢 ' + t('community.mission.type.offer') : '🔍 ' + t('community.mission.type.search')}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              {daysAgo === 0 ? "Aujourd'hui" : `il y a ${daysAgo} jour${daysAgo > 1 ? 's' : ''}`}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
              👁 {mission.views} {t('community.mission.views')}
            </span>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, margin: '0 0 32px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{mission.title}</h1>

          {/* Info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
            {[
              { icon: '💰', label: 'Budget', value: mission.budget || '—' },
              { icon: '⏱', label: 'Durée', value: mission.duration || '—' },
              { icon: REMOTE_ICONS[mission.remote], label: 'Remote', value: REMOTE_LABELS[mission.remote] + (mission.location ? ` · ${mission.location}` : '') },
            ].map(info => (
              <div key={info.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 14px' }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>{info.icon}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{info.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{info.value}</div>
              </div>
            ))}
          </div>

          {/* Skills */}
          {mission.skills?.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Compétences</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {mission.skills.map(s => (
                  <span key={s} style={{ background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.25)', borderRadius: 100, padding: '5px 14px', fontSize: 13, fontWeight: 600, color: '#818CF8' }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {mission.description && (
            <div style={{ marginBottom: 40 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Description</h3>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 24px' }}>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', whiteSpace: 'pre-wrap' }}>{mission.description}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {!isOwner && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
                onClick={() => {/* future: open contact modal */}}
              >
                {t('community.mission.contact')} →
              </motion.button>
            )}
            {isOwner && (
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', padding: '14px 0', display: 'flex', alignItems: 'center' }}>
                ✏️ C'est votre mission
              </span>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
