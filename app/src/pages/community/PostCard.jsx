import { useNavigate } from 'react-router-dom';
import { timeAgo, getChannel } from '../../lib/communityUtils';

export function PostCard({ post, userVote, onVote }) {
  const navigate = useNavigate();
  const ch = getChannel(post.channel);

  const handleVote = (e, v) => {
    e.stopPropagation();
    onVote(post.id, post.author_id, v);
  };

  return (
    <div
      onClick={() => navigate(`/community/feed/${post.id}`)}
      style={{
        display: 'flex',
        gap: 12,
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(129,140,248,0.35)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
      }}
    >
      {/* Vote column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 32 }}>
        <button
          onClick={e => handleVote(e, 1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
            color: userVote === 1 ? '#818CF8' : 'rgba(255,255,255,0.3)',
            padding: '2px 4px',
            borderRadius: 4,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { if (userVote !== 1) e.currentTarget.style.color = '#818CF8'; }}
          onMouseLeave={e => { if (userVote !== 1) e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
        >
          ▲
        </button>
        <span style={{ fontSize: 13, fontWeight: 800, color: userVote === 1 ? '#818CF8' : userVote === -1 ? '#F87171' : 'rgba(255,255,255,0.6)', minWidth: 24, textAlign: 'center' }}>
          {post.upvotes ?? 0}
        </span>
        <button
          onClick={e => handleVote(e, -1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
            color: userVote === -1 ? '#F87171' : 'rgba(255,255,255,0.3)',
            padding: '2px 4px',
            borderRadius: 4,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { if (userVote !== -1) e.currentTarget.style.color = '#F87171'; }}
          onMouseLeave={e => { if (userVote !== -1) e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
        >
          ▼
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          {ch && (
            <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(79,70,229,0.18)', color: '#818CF8', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 100, padding: '2px 8px', letterSpacing: '0.03em' }}>
              {ch.icon} {ch.label}
            </span>
          )}
          {post.type && post.type !== 'discussion' && (
            <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(250,208,44,0.12)', color: '#fad02c', border: '1px solid rgba(250,208,44,0.25)', borderRadius: 100, padding: '2px 8px' }}>
              {post.type}
            </span>
          )}
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>
            {timeAgo(post.created_at)}
          </span>
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 4, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {post.title}
        </div>

        {post.content && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {post.content}
          </div>
        )}

        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {post.tags.slice(0, 4).map(tag => (
              <span key={tag} style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.05)', borderRadius: 4, padding: '2px 6px' }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {post.comments_count ?? 0} commentaires
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
            par {post.profiles?.first_name || post.profiles?.email?.split('@')[0] || 'anonyme'}
          </span>
        </div>
      </div>
    </div>
  );
}
