// Labels and descriptions are in i18n: community.channel.{id}.label / .desc
export const CHANNELS = [
  { id: 'lancements', icon: '🚀' },
  { id: 'tips',       icon: '💡' },
  { id: 'questions',  icon: '❓' },
  { id: 'revenus',    icon: '💰' },
  { id: 'collabs',    icon: '🤝' },
  { id: 'rants',      icon: '😤' },
  { id: 'remote',     icon: '🌍' },
];

export function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)     return 'à l\'instant';
  if (diff < 3600)   return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400)  return `il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function getChannel(id) {
  return CHANNELS.find(c => c.id === id) ?? null;
}

// Optimistic vote update for a post list
export function applyVoteToPost(posts, postId, oldVote, newVote) {
  return posts.map(p => {
    if (p.id !== postId) return p;
    let up = p.upvotes;
    if (oldVote === 1) up--;
    if (newVote === 1) up++;
    return { ...p, upvotes: up };
  });
}
