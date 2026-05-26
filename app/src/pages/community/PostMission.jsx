import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';

const REMOTE_OPTIONS = ['remote', 'hybrid', 'onsite'];

export function PostMission() {
  const navigate = useNavigate();
  const { user } = useApp();
  const { t } = useLang();

  const [type, setType] = useState('offer');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState([]);
  const [budget, setBudget] = useState('');
  const [duration, setDuration] = useState('');
  const [remote, setRemote] = useState('remote');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addSkill = (raw) => {
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    const next = [...new Set([...skills, ...parts])];
    setSkills(next);
    setSkillInput('');
  };

  const onSkillKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (skillInput.trim()) addSkill(skillInput);
    }
  };

  const removeSkill = (s) => setSkills(prev => prev.filter(x => x !== s));

  const submit = async () => {
    if (!title.trim()) { setError(t('community.post.error.title')); return; }
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.from('missions').insert({
        user_id: user.id,
        type,
        title: title.trim(),
        description: description.trim() || null,
        skills: skills.length ? skills : null,
        budget: budget.trim() || null,
        duration: duration.trim() || null,
        remote,
        location: remote !== 'remote' ? location.trim() || null : null,
      });
      if (err) throw err;
      navigate('/community/find');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', color: '#fff', padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <button onClick={() => navigate('/community')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← {t('community.mission.back')}
          </button>
          <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>{t('community.post.title')}</h1>
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}
        >
          {/* Type selector */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{t('community.post.type.label')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(['offer', 'search']).map(opt => (
                <button key={opt} type="button" onClick={() => setType(opt)}
                  style={{ padding: '14px 16px', borderRadius: 12, border: `1px solid ${type === opt ? '#4F46E5' : 'rgba(255,255,255,0.1)'}`, background: type === opt ? 'rgba(79,70,229,0.15)' : 'transparent', color: type === opt ? '#818CF8' : 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {t(`community.post.type.${opt}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>{t('community.post.mission-title.label')} <span style={{ color: '#4F46E5' }}>*</span></label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t('community.post.mission-title.placeholder')} style={inputStyle} />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>{t('community.post.description.label')}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t('community.post.description.placeholder')} rows={4} style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }} />
          </div>

          {/* Skills */}
          <div>
            <label style={labelStyle}>{t('community.post.skills.label')}</label>
            {skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {skills.map(s => (
                  <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 100, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#818CF8' }}>
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} style={{ background: 'none', border: 'none', color: '#818CF8', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
                  </span>
                ))}
              </div>
            )}
            <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={onSkillKey} onBlur={() => { if (skillInput.trim()) addSkill(skillInput); }} placeholder={t('community.post.skills.placeholder')} style={inputStyle} />
          </div>

          {/* Budget + Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>{t('community.post.budget.label')}</label>
              <input value={budget} onChange={e => setBudget(e.target.value)} placeholder={t('community.post.budget.placeholder')} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('community.post.duration.label')}</label>
              <input value={duration} onChange={e => setDuration(e.target.value)} placeholder={t('community.post.duration.placeholder')} style={inputStyle} />
            </div>
          </div>

          {/* Remote */}
          <div>
            <label style={labelStyle}>{t('community.post.remote.label')}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {REMOTE_OPTIONS.map(opt => (
                <button key={opt} type="button" onClick={() => setRemote(opt)}
                  style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `1px solid ${remote === opt ? '#fad02c' : 'rgba(255,255,255,0.1)'}`, background: remote === opt ? 'rgba(250,208,44,0.1)' : 'transparent', color: remote === opt ? '#fad02c' : 'rgba(255,255,255,0.45)', fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {t(`community.post.remote.${opt}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Location (only if not full remote) */}
          {remote !== 'remote' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.25 }}>
              <label style={labelStyle}>{t('community.post.location.label')}</label>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder={t('community.post.location.placeholder')} style={inputStyle} />
            </motion.div>
          )}

          {error && <p style={{ color: '#F87171', fontSize: 13, margin: 0 }}>{error}</p>}

          <button onClick={submit} disabled={loading}
            style={{ background: '#fad02c', color: '#0A0A0A', border: 'none', borderRadius: 12, padding: '16px 24px', fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s' }}>
            {loading ? '...' : t('community.post.btn')}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: 'rgba(255,255,255,0.5)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 8,
};

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '12px 14px',
  color: '#fff',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};
