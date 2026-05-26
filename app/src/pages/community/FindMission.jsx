import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useLang } from '../../context/LanguageContext';

const REMOTE_ICONS = { remote: '🌐', hybrid: '🏢', onsite: '📍' };

function MissionCard({ mission, index, t }) {
  const navigate = useNavigate();
  const daysAgo = Math.floor((Date.now() - new Date(mission.created_at)) / 86400000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => navigate(`/community/mission/${mission.id}`)}
      style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(79,70,229,0.4)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ display: 'inline-block', background: mission.type === 'offer' ? 'rgba(79,70,229,0.15)' : 'rgba(250,208,44,0.12)', border: `1px solid ${mission.type === 'offer' ? 'rgba(79,70,229,0.35)' : 'rgba(250,208,44,0.3)'}`, borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: mission.type === 'offer' ? '#818CF8' : '#fad02c', whiteSpace: 'nowrap' }}>
          {mission.type === 'offer' ? '📢 Mission' : '🔍 Disponible'}
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {daysAgo === 0 ? "Aujourd'hui" : `il y a ${daysAgo}j`}
        </span>
      </div>

      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{mission.title}</h3>

      {mission.description && (
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {mission.description}
        </p>
      )}

      {mission.skills?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {mission.skills.slice(0, 4).map(s => (
            <span key={s} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '2px 10px', fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{s}</span>
          ))}
          {mission.skills.length > 4 && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>+{mission.skills.length - 4}</span>}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
        {mission.budget && <span style={{ fontSize: 13, fontWeight: 700, color: '#4ADE80' }}>{mission.budget}</span>}
        {mission.duration && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>⏱ {mission.duration}</span>}
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>{REMOTE_ICONS[mission.remote]} {mission.remote === 'remote' ? 'Remote' : mission.remote === 'hybrid' ? 'Hybride' : mission.location || 'Sur site'}</span>
      </div>

      <button onClick={e => { e.stopPropagation(); navigate(`/community/mission/${mission.id}`); }}
        style={{ background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 10, padding: '10px 16px', color: '#818CF8', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginTop: 4 }}>
        {t('community.find.view')} →
      </button>
    </motion.div>
  );
}

export function FindMission() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    let q = supabase.from('missions').select('*').eq('status', 'active').order('created_at', { ascending: false });
    supabase.from('missions').select('*').eq('status', 'active').order('created_at', { ascending: false })
      .then(({ data }) => { setMissions(data ?? []); setLoading(false); });
  }, []);

  const filtered = missions.filter(m => {
    const matchType = typeFilter === 'all' || m.type === typeFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || m.title.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q) || m.skills?.some(s => s.toLowerCase().includes(q));
    return matchType && matchSearch;
  });

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', color: '#fff' }}>
      {/* Header */}
      <div className="comm-dot-grid" style={{ padding: '40px 24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <button onClick={() => navigate('/community')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← {t('community.mission.back')}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>{t('community.find.title')}</h1>
            <button onClick={() => navigate('/community/post')} style={{ background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {t('community.find.post-cta')}
            </button>
          </div>

          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('community.find.search.placeholder')}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 18px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 16 }}
          />

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { id: 'all', label: t('community.find.filter.all') },
              { id: 'offer', label: t('community.find.filter.offer') },
              { id: 'search', label: t('community.find.filter.search') },
            ].map(f => (
              <button key={f.id} onClick={() => setTypeFilter(f.id)}
                style={{ padding: '7px 16px', borderRadius: 100, border: `1px solid ${typeFilter === f.id ? '#4F46E5' : 'rgba(255,255,255,0.1)'}`, background: typeFilter === f.id ? 'rgba(79,70,229,0.2)' : 'transparent', color: typeFilter === f.id ? '#818CF8' : 'rgba(255,255,255,0.45)', fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 80 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4F46E5', margin: '0 auto 12px', animation: 'pulse 1s infinite' }} />
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 80 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p>{t('community.find.empty')}</p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            <AnimatePresence>
              {filtered.map((m, i) => <MissionCard key={m.id} mission={m} index={i} t={t} />)}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
