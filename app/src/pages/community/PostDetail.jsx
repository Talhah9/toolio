import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { timeAgo, getChannel } from '../../lib/communityUtils';

export function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();

  const [post, setPost] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentVotes, setCommentVotes] = useState({});
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [{ data: p }, { data: v }, { data: cs }] = await Promise.all([
        supabase.from('community_posts').select('*').eq('id', postId).single(),
        user ? supabase.from('community_votes').select('vote').eq('user_id', user.id).eq('post_id', postId).maybeSingle() : { data: null },
        supabase.from('community_comments').select('*').eq('post_id', postId).order('created_at'),
      ]);
      setPost(p);
      setUserVote(v?.vote ?? null);
      setComments(cs ?? []);
      setLoading(false);

      // fetch comment votes
      if (user && cs?.length) {
        const { data: cv } = await supabase
          .from('community_votes')
          .select('comment_id, vote')
          .eq('user_id', user.id)
          .in('comment_id', cs.map(c => c.id));
        const map = {};
        (cv ?? []).forEach(v => { map[v.comment_id] = v.vote; });
        setCommentVotes(map);
      }
    };
    load();
  }, [postId, user]);

  const handlePostVote = async (newVote) => {
    const isSame = userVote === newVote;
    const nextVote = isSame ? null : newVote;
    const delta = (isSame ? -(newVote) : newVote) - (isSame ? 0 : (userVote === 1 ? -1 : userVote === -1 ? 0 : 0));

    setUserVote(nextVote);
    setPost(p => ({ ...p, upvotes: (p.upvotes ?? 0) + (nextVote === 1 ? 1 : 0) + (isSame && newVote === 1 ? -1 : 0) + (!isSame && userVote === 1 ? -1 : 0) }));

    // Simpler approach: recalculate
    setPost(p => {
      let up = p.upvotes ?? 0;
      if (userVote === 1) up--;
      if (nextVote === 1) up++;
      return { ...p, upvotes: up };
    });

    if (isSame) {
      await supabase.from('community_votes').delete().eq('user_id', user.id).eq('post_id', postId);
      if (newVote === 1) await supabase.rpc('decrement_post_upvote', { p_post_id: postId, p_author_id: post.author_id }).catch(() => {});
    } else {
      await supabase.from('community_votes').upsert({ user_id: user.id, post_id: postId, vote: newVote }, { onConflict: 'user_id,post_id' });
      if (newVote === 1 && userVote !== 1) await supabase.rpc('increment_post_upvote', { p_post_id: postId, p_author_id: post.author_id }).catch(() => {});
      if (userVote === 1 && newVote !== 1) await supabase.rpc('decrement_post_upvote', { p_post_id: postId, p_author_id: post.author_id }).catch(() => {});
    }
  };

  const handleCommentVote = async (commentId, authorId, newVote) => {
    const existing = commentVotes[commentId] ?? null;
    const isSame = existing === newVote;
    const nextVote = isSame ? null : newVote;
    setCommentVotes(m => ({ ...m, [commentId]: nextVote }));

    if (isSame) {
      await supabase.from('community_votes').delete().eq('user_id', user.id).eq('comment_id', commentId);
    } else {
      await supabase.from('community_votes').upsert({ user_id: user.id, comment_id: commentId, vote: newVote }, { onConflict: 'user_id,comment_id' });
      if (newVote === 1 && existing !== 1) {
        await supabase.rpc('add_xp', { p_user_id: authorId, p_amount: 2 }).catch(() => {});
      }
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    const { data } = await supabase
      .from('community_comments')
      .insert({ post_id: postId, author_id: user.id, author_email: user.email, content: newComment.trim() })
      .select('*')
      .single();

    if (data) {
      setComments(cs => [...cs, data]);
      setNewComment('');
      await supabase.rpc('increment_comments_count', { p_post_id: postId }).catch(() => {});
      await supabase.rpc('add_xp', { p_user_id: user.id, p_amount: 5 }).catch(() => {});
    }
    setSubmitting(false);
  };

  const reportPost = async () => {
    if (reported) return;
    await supabase.from('community_reports').insert({ reporter_id: user.id, post_id: postId, reason: 'inappropriate' });
    setReported(true);
  };

  const ch = post ? getChannel(post.channel) : null;

  if (loading) return (
    <div style={{ maxWidth: 740, margin: '0 auto', padding: '60px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
      Chargement...
    </div>
  );

  if (!post) return (
    <div style={{ maxWidth: 740, margin: '0 auto', padding: '60px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
      Post introuvable.
      <br />
      <button onClick={() => navigate('/community/feed')} style={{ marginTop: 16, background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '8px 16px', fontSize: 13 }}>
        Retour au feed
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 740, margin: '0 auto', padding: '40px 24px' }}>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        ← Feed
      </button>

      {/* Post */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 20px 16px', marginBottom: 24 }}>
        {/* Metadata row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {ch && (
            <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(79,70,229,0.18)', color: '#818CF8', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 100, padding: '2px 10px' }}>
              {ch.icon} {ch.label}
            </span>
          )}
          {post.type && post.type !== 'discussion' && (
            <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(250,208,44,0.1)', color: '#fad02c', border: '1px solid rgba(250,208,44,0.25)', borderRadius: 100, padding: '2px 10px' }}>
              {post.type}
            </span>
          )}
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>
            {post.author_email?.split('@')[0]} · {timeAgo(post.created_at)}
          </span>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
          {post.title}
        </h1>

        {post.content && (
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 16, whiteSpace: 'pre-wrap' }}>
            {post.content}
          </div>
        )}

        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {post.tags.map(t => (
              <span key={t} style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.05)', borderRadius: 4, padding: '3px 8px' }}>
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Vote row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => handlePostVote(1)}
              style={{ background: userVote === 1 ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${userVote === 1 ? 'rgba(129,140,248,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, color: userVote === 1 ? '#818CF8' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '5px 10px', transition: 'all 0.15s' }}
            >
              ▲ {post.upvotes ?? 0}
            </button>
            <button
              onClick={() => handlePostVote(-1)}
              style={{ background: userVote === -1 ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${userVote === -1 ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 6, color: userVote === -1 ? '#F87171' : 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '5px 10px', transition: 'all 0.15s' }}
            >
              ▼
            </button>
          </div>

          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {comments.length} commentaires
          </span>

          <button
            onClick={reportPost}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: reported ? '#fad02c' : 'rgba(255,255,255,0.2)', fontSize: 11, cursor: reported ? 'default' : 'pointer', padding: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => { if (!reported) e.currentTarget.style.color = '#F87171'; }}
            onMouseLeave={e => { if (!reported) e.currentTarget.style.color = 'rgba(255,255,255,0.2)'; }}
          >
            {reported ? '✓ Signalé' : 'Signaler'}
          </button>
        </div>
      </div>

      {/* Comment composer */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px', marginBottom: 24 }}>
        <textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Ajoute un commentaire..."
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#fff',
            fontSize: 13,
            padding: '10px 12px',
            outline: 'none',
            resize: 'none',
            minHeight: 72,
            fontFamily: 'inherit',
            lineHeight: 1.6,
            boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(129,140,248,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            onClick={submitComment}
            disabled={!newComment.trim() || submitting}
            style={{
              background: !newComment.trim() || submitting ? 'rgba(79,70,229,0.3)' : 'linear-gradient(135deg, #4F46E5, #6D28D9)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              padding: '8px 18px',
              cursor: !newComment.trim() || submitting ? 'default' : 'pointer',
            }}
          >
            {submitting ? 'Envoi...' : 'Commenter +5 XP'}
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {comments.map(c => (
          <div key={c.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #818CF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {c.author_email?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                {c.author_email?.split('@')[0]}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>
                {timeAgo(c.created_at)}
              </span>
            </div>

            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 10, whiteSpace: 'pre-wrap' }}>
              {c.content}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => handleCommentVote(c.id, c.author_id, 1)}
                style={{ background: 'none', border: 'none', color: commentVotes[c.id] === 1 ? '#818CF8' : 'rgba(255,255,255,0.25)', fontSize: 12, cursor: 'pointer', padding: '2px 6px', borderRadius: 4, transition: 'color 0.15s' }}
              >
                ▲
              </button>
              <button
                onClick={() => handleCommentVote(c.id, c.author_id, -1)}
                style={{ background: 'none', border: 'none', color: commentVotes[c.id] === -1 ? '#F87171' : 'rgba(255,255,255,0.25)', fontSize: 12, cursor: 'pointer', padding: '2px 6px', borderRadius: 4, transition: 'color 0.15s' }}
              >
                ▼
              </button>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
            Sois le premier à commenter
          </div>
        )}
      </div>
    </div>
  );
}
