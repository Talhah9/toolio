import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';
import { CHANNELS } from '../../lib/communityUtils';

const POST_TYPE_IDS = ['discussion', 'question', 'partage', 'offre'];

export function CreatePost() {
  const navigate = useNavigate();
  const { user } = useApp();
  const { t } = useLang();
  const [channel, setChannel] = useState('');
  const [type, setType] = useState('discussion');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9\-_]/g, '');
      if (tag && !tags.includes(tag) && tags.length < 5) {
        setTags([...tags, tag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag) => setTags(tags.filter(x => x !== tag));

  const handleSubmit = async () => {
    if (!title.trim()) { setError(t('community.create.error.title')); return; }
    if (!channel) { setError(t('community.create.error.channel')); return; }
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('community_posts')
      .insert({
        author_id: user.id,
        channel,
        type,
        title: title.trim(),
        content: content.trim() || null,
        tags,
      })
      .select('id')
      .single();

    if (err) { setError(err.message); setLoading(false); return; }

    // XP +20 for posting
    await supabase.rpc('add_xp', { p_user_id: user.id, p_amount: 20 }).catch(() => {});

    navigate(`/community/feed/${data.id}`);
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    padding: '10px 12px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginBottom: 8,
    display: 'block',
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        {t('community.create.back')}
      </button>

      <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 32px', letterSpacing: '-0.02em' }}>
        {t('community.create.title')}
        <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 700, color: '#fad02c', background: 'rgba(250,208,44,0.12)', border: '1px solid rgba(250,208,44,0.25)', borderRadius: 100, padding: '2px 10px' }}>
          +20 XP
        </span>
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Channel */}
        <div>
          <label style={labelStyle}>{t('community.create.channel.label')}</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CHANNELS.map(ch => (
              <button
                key={ch.id}
                onClick={() => setChannel(ch.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 100,
                  border: `1px solid ${channel === ch.id ? 'rgba(79,70,229,0.6)' : 'rgba(255,255,255,0.1)'}`,
                  background: channel === ch.id ? 'rgba(79,70,229,0.15)' : 'rgba(255,255,255,0.03)',
                  color: channel === ch.id ? '#818CF8' : 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  fontWeight: channel === ch.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {ch.icon} {ch.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div>
          <label style={labelStyle}>{t('community.create.type.label')}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {POST_TYPE_IDS.map(pt => (
              <button
                key={pt}
                onClick={() => setType(pt)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: `1px solid ${type === pt ? 'rgba(250,208,44,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  background: type === pt ? 'rgba(250,208,44,0.1)' : 'rgba(255,255,255,0.03)',
                  color: type === pt ? '#fad02c' : 'rgba(255,255,255,0.45)',
                  fontSize: 12,
                  fontWeight: type === pt ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {t(`community.create.type.${pt}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label style={labelStyle}>{t('community.create.title-field.label')}</label>
          <input
            style={inputStyle}
            placeholder={t('community.create.title-field.placeholder')}
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={200}
            onFocus={e => e.target.style.borderColor = 'rgba(129,140,248,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {/* Content */}
        <div>
          <label style={labelStyle}>{t('community.create.content.label')} <span style={{ opacity: 0.5, textTransform: 'none', letterSpacing: 0 }}>{t('community.create.content.optional')}</span></label>
          <textarea
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
            placeholder={t('community.create.content.placeholder')}
            value={content}
            onChange={e => setContent(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'rgba(129,140,248,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {/* Tags */}
        <div>
          <label style={labelStyle}>{t('community.create.tags.label')} <span style={{ opacity: 0.5, textTransform: 'none', letterSpacing: 0 }}>{t('community.create.tags.hint')}</span></label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: tags.length ? 8 : 0 }}>
            {tags.map(t => (
              <span key={t} style={{ fontSize: 11, background: 'rgba(79,70,229,0.15)', color: '#818CF8', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 100, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                #{t}
                <button onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', color: '#818CF8', cursor: 'pointer', padding: 0, fontSize: 13, lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
          {tags.length < 5 && (
            <input
              style={inputStyle}
              placeholder={t('community.create.tags.placeholder')}
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
              onFocus={e => e.target.style.borderColor = 'rgba(129,140,248,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          )}
        </div>

        {error && (
          <div style={{ fontSize: 13, color: '#F87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '10px 14px' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            background: loading ? 'rgba(79,70,229,0.4)' : 'linear-gradient(135deg, #4F46E5, #6D28D9)',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 14,
            fontWeight: 800,
            padding: '14px 24px',
            cursor: loading ? 'default' : 'pointer',
            transition: 'opacity 0.15s',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          {loading ? t('community.create.submitting') : t('community.create.submit')}
        </button>
      </div>
    </div>
  );
}
