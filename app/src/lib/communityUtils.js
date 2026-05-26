export const CHANNELS = [
  { id: 'lancements', label: 'Lancements',        icon: '🚀', desc: 'Partage tes lancements et actualités.' },
  { id: 'tips',       label: 'Tips & Ressources',  icon: '💡', desc: 'Astuces, outils et ressources utiles.' },
  { id: 'questions',  label: 'Questions',          icon: '❓', desc: 'Pose tes questions à la communauté.' },
  { id: 'revenus',    label: 'Revenus & Tarifs',   icon: '💰', desc: 'Partage tes tarifs et revenus.' },
  { id: 'collabs',    label: 'Collaborations',     icon: '🤝', desc: 'Trouve des partenaires.' },
  { id: 'rants',      label: 'Rants',              icon: '😤', desc: 'Exprime-toi librement.' },
  { id: 'remote',     label: 'Remote & Lifestyle', icon: '🌍', desc: 'Vie nomade et remote.' },
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
