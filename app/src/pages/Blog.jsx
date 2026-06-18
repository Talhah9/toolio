import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { MarketingFooter } from '../components/MarketingFooter';
import { Logo } from '../components/Logo';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const CATEGORIES = ['Tous', 'Juridique', 'Finances', 'LinkedIn', 'Prospection', 'Admin', 'IA'];

const CATEGORY_COLORS = {
  Juridique:   { bg: '#EDE9FE', text: '#5B21B6' },
  Finances:    { bg: '#D1FAE5', text: '#065F46' },
  LinkedIn:    { bg: '#DBEAFE', text: '#1E40AF' },
  Prospection: { bg: '#FEF3C7', text: '#92400E' },
  Admin:       { bg: '#FCE7F3', text: '#9D174D' },
  IA:          { bg: '#F0F9FF', text: '#0C4A6E' },
};

function CategoryBadge({ category }) {
  const colors = CATEGORY_COLORS[category] || { bg: '#F3F4F6', text: '#374151' };
  return (
    <span style={{ display: 'inline-block', background: colors.bg, color: colors.text, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 100, letterSpacing: 0.3 }}>
      {category}
    </span>
  );
}

function PostCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
      <article style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '28px 24px', height: '100%', display: 'flex', flexDirection: 'column', gap: 14, transition: 'box-shadow 0.18s, transform 0.18s', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <CategoryBadge category={post.category} />
          <span style={{ color: '#9CA3AF', fontSize: 12 }}>{post.read_time} min</span>
        </div>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F0F1A', lineHeight: 1.35 }}>{post.title}</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6B7280', lineHeight: 1.65, flexGrow: 1 }}>{post.excerpt}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4F46E5', fontSize: 13, fontWeight: 700 }}>
          Lire l'article <span aria-hidden="true">→</span>
        </div>
      </article>
    </Link>
  );
}

export function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = 'Blog Savvly — Guides pratiques pour freelances';
    const meta = document.querySelector('meta[name="description"]');
    const prev = meta?.content;
    if (meta) meta.content = 'Guides pratiques, conseils juridiques, LinkedIn et prospection pour freelances français. Tous les articles Savvly.';
    return () => { document.title = 'Savvly'; if (meta && prev) meta.content = prev; };
  }, []);

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, category, read_time, published_at')
      .order('published_at', { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false); });
  }, []);

  const filtered = posts.filter(p => {
    const matchCat = activeCategory === 'Tous' || p.category === activeCategory;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link to="/" style={{ textDecoration: 'none' }}><Logo /></Link>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <Link to="/outils/contrat-freelance" style={{ color: '#6B7280', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>Outils</Link>
            <Link to="/auth" style={{ background: '#4F46E5', color: '#fff', padding: '8px 18px', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Essai gratuit</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0F0F1A 0%, #1E1B4B 100%)', padding: '64px 24px 56px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(79,70,229,0.2)', color: '#A5B4FC', fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 100, marginBottom: 20, border: '1px solid rgba(165,180,252,0.3)' }}>
          Blog Savvly
        </div>
        <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, color: '#fff', lineHeight: 1.15 }}>
          Guides pratiques pour freelances
        </h1>
        <p style={{ margin: '0 auto', maxWidth: 520, color: '#A5B4FC', fontSize: 16, lineHeight: 1.7 }}>
          Juridique, LinkedIn, prospection, administratif — tout ce dont tu as besoin pour développer ton activité freelance.
        </p>
        <div style={{ marginTop: 32, maxWidth: 480, margin: '32px auto 0' }}>
          <input
            type="text"
            placeholder="Rechercher un article…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 20px', borderRadius: 12, border: 'none', fontSize: 15, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)', color: '#0F0F1A' }}
          />
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 4, overflowX: 'auto', padding: '12px 0', scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{ padding: '7px 16px', borderRadius: 100, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600, transition: 'all 0.15s', background: activeCategory === cat ? '#4F46E5' : 'transparent', color: activeCategory === cat ? '#fff' : '#6B7280' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: '_bspin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <style>{`@keyframes _bspin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#9CA3AF', fontSize: 15 }}>Chargement des articles…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ color: '#9CA3AF', fontSize: 16 }}>Aucun article trouvé.</p>
          </div>
        ) : (
          <>
            <p style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 28 }}>{filtered.length} article{filtered.length > 1 ? 's' : ''}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {filtered.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          </>
        )}
      </div>

      <MarketingFooter />
    </div>
  );
}
