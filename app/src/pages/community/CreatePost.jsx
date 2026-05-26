import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { CHANNELS } from '../../lib/communityUtils';

const POST_TYPES = [
  { id: 'discussion', label: 'Discussion' },
  { id: 'question',   label: 'Question' },
  { id: 'partage',    label: 'Partage' },
  { id: 'offre',      label: 'Offre' },
];

export function CreatePost() {
  const navigate = useNavigate();
  const { user } = useApp();
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
      const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9\-_]/g, '');
      if (t && !tags.includes(t) && tags.length < 5) {
        setTags([...tags, t]);
      }
      setTagInput('');
    }
  };

  const removeTag = (t) => setTags(tags.filter(x => x !== t));

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Le titre est requis.'); return; }
    if (!channel) { setError('Choisis un channel.'); return; }
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('community_posts')
      .insert({
        author_id: user.id,
        author_email: user.email,
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
        ← Retour
      </button>

      <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 32px', letterSpacing: '-0.02em' }}>
        Créer un post
        <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 700, color: '#fad02c', background: 'rgba(250,208,44,0.12)', border: '1px solid rgba(250,208,44,0.25)', borderRadius: 100, padding: '2px 10px' }}>
          +20 XP
        </span>
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Channel */}
        <div>
          <label style={labelStyle}>Channel</label>
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
          <label style={labelStyle}>Type</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {POST_TYPES.map(pt => (
              <button
                key={pt.id}
                onClick={() => setType(pt.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: `1px solid ${type === pt.id ? 'rgba(250,208,44,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  background: type === pt.id ? 'rgba(250,208,44,0.1)' : 'rgba(255,255,255,0.03)',
                  color: type === pt.id ? '#fad02c' : 'rgba(255,255,255,0.45)',
                  fontSize: 12,
                  fontWeight: type === pt.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {pt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label style={labelStyle}>Titre *</label>
          <input
            style={inputStyle}
            placeholder="De quoi tu parles ?"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={200}
            onFocus={e => e.target.style.borderColor = 'rgba(129,140,248,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {/* Content */}
        <div>
          <label style={labelStyle}>Contenu <span style={{ opacity: 0.5, textTransform: 'none', letterSpacing: 0 }}>(optionnel)</span></label>
          <textarea
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
            placeholder="Développe ta pensée..."
            value={content}
            onChange={e => setContent(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'rgba(129,140,248,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {/* Tags */}
        <div>
          <label style={labelStyle}>Tags <span style={{ opacity: 0.5, textTransform: 'none', letterSpacing: 0 }}>(Entrée pour ajouter, 5 max)</span></label>
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
              placeholder="ex: react, freelance, prix..."
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
          {loading ? 'Publication...' : 'Publier le post'}
        </button>
      </div>
    </div>
  );
}
