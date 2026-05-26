import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';
import { PostCard } from './PostCard';
import { CHANNELS, getChannel, applyVoteToPost } from '../../lib/communityUtils';

export function Feed() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useApp();
  const { t } = useLang();

  const channelParam = searchParams.get('channel') ?? '';
  const [filter, setFilter] = useState('latest');
  const [posts, setPosts] = useState([]);
  const [votesMap, setVotesMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Inline composer state
  const [composerFocused, setComposerFocused] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('community_posts')
      .select('id, author_id, channel, type, title, content, tags, upvotes, comments_count, created_at, profiles(first_name, last_name, email)');

    if (channelParam) q = q.eq('channel', channelParam);
    if (filter === 'questions') q = q.eq('type', 'question');
    if (filter === 'top') q = q.order('upvotes', { ascending: false });
    else q = q.order('created_at', { ascending: false });

    q = q.limit(50);

    const { data } = await q;
    setPosts(data ?? []);
    setLoading(false);
  }, [channelParam, filter]);

  const fetchVotes = useCallback(async (postIds) => {
    if (!user || !postIds.length) return;
    const { data } = await supabase
      .from('community_votes')
      .select('post_id, vote')
      .eq('user_id', user.id)
      .in('post_id', postIds);
    const map = {};
    (data ?? []).forEach(v => { map[v.post_id] = v.vote; });
    setVotesMap(map);
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (posts.length) fetchVotes(posts.map(p => p.id));
  }, [posts, fetchVotes]);

  const handleVote = async (postId, authorId, newVote) => {
    const existing = votesMap[postId] ?? null;
    const isSame = existing === newVote;

    // Optimistic update
    const nextVote = isSame ? null : newVote;
    setVotesMap(m => ({ ...m, [postId]: nextVote }));
    setPosts(ps => applyVoteToPost(ps, postId, existing, nextVote));

    if (isSame) {
      await supabase.from('community_votes').delete().eq('user_id', user.id).eq('post_id', postId);
      if (existing === 1) {
        await supabase.rpc('decrement_post_upvote', { p_post_id: postId, p_author_id: authorId }).catch(() => {});
      }
    } else {
      await supabase.from('community_votes').upsert(
        { user_id: user.id, post_id: postId, vote: newVote },
        { onConflict: 'user_id,post_id' }
      );
      if (newVote === 1 && existing !== 1) {
        await supabase.rpc('increment_post_upvote', { p_post_id: postId, p_author_id: authorId }).catch(() => {});
      } else if (existing === 1 && newVote !== 1) {
        await supabase.rpc('decrement_post_upvote', { p_post_id: postId, p_author_id: authorId }).catch(() => {});
      }
    }
  };

  const activeCh = getChannel(channelParam);

  return (
    <div style={{ maxWidth: 740, margin: '0 auto', padding: '40px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
            {activeCh ? `${activeCh.icon} ${t(`community.channel.${activeCh.id}.label`)}` : t('community.feed.title')}
          </h1>
          {activeCh && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>{t(`community.channel.${activeCh.id}.desc`)}</p>
          )}
        </div>
        {channelParam && (
          <button
            onClick={() => setSearchParams({})}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', padding: '6px 12px' }}
          >
            {t('community.feed.all-channels')}
          </button>
        )}
      </div>

      {/* Channel filter pills */}
      {!channelParam && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {CHANNELS.map(ch => (
            <button
              key={ch.id}
              onClick={() => setSearchParams({ channel: ch.id })}
              style={{
                padding: '5px 12px',
                borderRadius: 100,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.45)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(129,140,248,0.4)'; e.currentTarget.style.color = '#818CF8'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
            >
              {ch.icon} {t(`community.channel.${ch.id}.label`)}
            </button>
          ))}
        </div>
      )}

      {/* Inline composer */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${composerFocused ? 'rgba(129,140,248,0.4)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
        onClick={() => navigate('/community/create')}
        onMouseEnter={() => setComposerFocused(true)}
        onMouseLeave={() => setComposerFocused(false)}
      >
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #818CF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
          {user?.email?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
          {t('community.feed.composer.placeholder')}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, background: 'rgba(79,70,229,0.15)', color: '#818CF8', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 100, padding: '4px 12px', flexShrink: 0 }}>
          {t('community.feed.composer.btn')}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 0 }}>
        {[
          { id: 'latest',    labelKey: 'community.feed.filter.latest' },
          { id: 'top',       labelKey: 'community.feed.filter.top' },
          { id: 'questions', labelKey: 'community.feed.filter.questions' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: filter === f.id ? '2px solid #818CF8' : '2px solid transparent',
              color: filter === f.id ? '#818CF8' : 'rgba(255,255,255,0.4)',
              fontSize: 13,
              fontWeight: filter === f.id ? 700 : 500,
              cursor: 'pointer',
              padding: '8px 16px',
              marginBottom: -1,
              transition: 'color 0.15s',
            }}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {/* Post list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 100, borderRadius: 12, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: 'rgba(255,255,255,0.25)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🌐</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{t('community.feed.empty.title')}</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>{t('community.feed.empty.sub')}</div>
          <button
            onClick={() => navigate('/community/create')}
            style={{ marginTop: 20, background: 'linear-gradient(135deg, #4F46E5, #6D28D9)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 800, padding: '10px 22px', cursor: 'pointer' }}
          >
            {t('community.feed.empty.cta')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              userVote={votesMap[post.id] ?? null}
              onVote={handleVote}
            />
          ))}
        </div>
      )}
    </div>
  );
}
