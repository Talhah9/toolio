import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@supabase/supabase-js';
import { MarketingFooter } from '../components/MarketingFooter';
import { Logo } from '../components/Logo';
import { usePageSeo } from '../utils/seo';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const TOOL_URLS = {
  contract:        { path: '/outils/contrat-freelance',      label: 'Générer mon contrat' },
  legal:           { path: '/outils/cgv-mentions-legales',   label: 'Créer mes documents légaux' },
  devis:           { path: '/outils/devis-professionnel',    label: 'Créer mon devis' },
  relance:         { path: '/outils/relance-client',         label: 'Rédiger ma relance' },
  urssaf:          { path: '/outils/calculateur-urssaf',     label: 'Calculer mes cotisations' },
  'linkedin-content': { path: '/outils/posts-linkedin',      label: 'Créer mes posts LinkedIn' },
  'linkedin-intel':{ path: '/outils/linkedin-intelligence',  label: 'Analyser mon LinkedIn' },
  'mission-finder':{ path: '/outils/mission-finder',         label: 'Trouver des missions' },
  prospection:     { path: '/outils/prospection-outreach',   label: 'Générer mes messages de prospection' },
  statut:          { path: '/outils/statut-juridique',       label: 'Trouver mon statut idéal' },
};

const CATEGORY_COLORS = {
  Juridique:   { bg: '#EDE9FE', text: '#5B21B6' },
  Finances:    { bg: '#D1FAE5', text: '#065F46' },
  LinkedIn:    { bg: '#DBEAFE', text: '#1E40AF' },
  Prospection: { bg: '#FEF3C7', text: '#92400E' },
  Admin:       { bg: '#FCE7F3', text: '#9D174D' },
  IA:          { bg: '#F0F9FF', text: '#0C4A6E' },
};

const mdComponents = {
  h1: ({ children }) => <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F0F1A', margin: '0 0 32px', lineHeight: 1.2 }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F0F1A', margin: '48px 0 16px', paddingTop: 8 }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1E1E3A', margin: '32px 0 12px' }}>{children}</h3>,
  p:  ({ children }) => <p style={{ fontSize: 16, color: '#374151', lineHeight: 1.8, margin: '0 0 20px' }}>{children}</p>,
  ul: ({ children }) => <ul style={{ margin: '0 0 20px', paddingLeft: 24 }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: '0 0 20px', paddingLeft: 24 }}>{children}</ol>,
  li: ({ children }) => <li style={{ fontSize: 15, color: '#374151', lineHeight: 1.75, marginBottom: 6 }}>{children}</li>,
  strong: ({ children }) => <strong style={{ color: '#0F0F1A', fontWeight: 700 }}>{children}</strong>,
  em: ({ children }) => <em style={{ color: '#4B5563', fontStyle: 'italic' }}>{children}</em>,
  blockquote: ({ children }) => (
    <blockquote style={{ borderLeft: '4px solid #4F46E5', paddingLeft: 20, margin: '24px 0', background: '#F5F3FF', borderRadius: '0 12px 12px 0', padding: '20px 24px' }}>
      {children}
    </blockquote>
  ),
  code: ({ children, inline }) => inline
    ? <code style={{ background: '#F3F4F6', padding: '2px 7px', borderRadius: 5, fontSize: 13, fontFamily: 'monospace', color: '#4F46E5' }}>{children}</code>
    : <pre style={{ background: '#1E1E3A', padding: '20px 24px', borderRadius: 12, overflow: 'auto', margin: '20px 0' }}><code style={{ color: '#E5E7EB', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.7 }}>{children}</code></pre>,
  table: ({ children }) => <div style={{ overflowX: 'auto', margin: '24px 0' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>{children}</table></div>,
  th: ({ children }) => <th style={{ padding: '10px 16px', background: '#F3F4F6', color: '#374151', fontWeight: 700, textAlign: 'left', borderBottom: '2px solid #E5E7EB' }}>{children}</th>,
  td: ({ children }) => <td style={{ padding: '10px 16px', borderBottom: '1px solid #F3F4F6', color: '#374151' }}>{children}</td>,
  a: ({ href, children }) => <a href={href} style={{ color: '#4F46E5', textDecoration: 'underline', fontWeight: 500 }} target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}>{children}</a>,
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '40px 0' }} />,
};

export function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  usePageSeo(post ? {
    title: post.title,
    description: post.meta_description,
    path: `/blog/${post.slug}`,
    type: 'article',
  } : { title: '', description: '', path: `/blog/${slug}` });

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); setLoading(false); return; }
        setPost(data);
        setLoading(false);
      });
    return () => { document.title = 'Savvly'; };
  }, [slug]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes _bpspin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 36, height: 36, border: '3px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: '_bpspin 0.8s linear infinite' }} />
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'system-ui, sans-serif' }}>
      <p style={{ fontSize: 18, color: '#374151' }}>Article introuvable.</p>
      <button onClick={() => navigate('/blog')} style={{ background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>← Retour au blog</button>
    </div>
  );

  const toolInfo = post.related_tool ? TOOL_URLS[post.related_tool] : null;
  const catColors = CATEGORY_COLORS[post.category] || { bg: '#F3F4F6', text: '#374151' };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 24px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link to="/" style={{ textDecoration: 'none' }}><Logo /></Link>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <Link to="/blog" style={{ color: '#6B7280', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>← Blog</Link>
            <Link to="/auth" style={{ background: '#4F46E5', color: '#fff', padding: '8px 18px', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Essai gratuit</Link>
          </div>
        </div>
      </nav>

      {/* Article header */}
      <div style={{ background: 'linear-gradient(135deg, #0F0F1A 0%, #1E1B4B 100%)', padding: '56px 24px 48px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{ background: catColors.bg, color: catColors.text, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100 }}>{post.category}</span>
            <span style={{ color: '#9CA3AF', fontSize: 13 }}>{post.read_time} min de lecture</span>
          </div>
          <h1 style={{ margin: '0 0 20px', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{post.title}</h1>
          <p style={{ margin: 0, color: '#A5B4FC', fontSize: 16, lineHeight: 1.65 }}>{post.excerpt}</p>
        </div>
      </div>

      {/* Article body */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>
        <article>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {post.content}
          </ReactMarkdown>
        </article>

        {/* Related tool CTA */}
        {toolInfo && (
          <div style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', borderRadius: 20, padding: '36px 32px', marginTop: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <h3 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 800, color: '#fff' }}>Gagner du temps avec Savvly</h3>
            <p style={{ margin: '0 0 24px', color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 1.6 }}>
              Arrête de le faire manuellement. L'IA Savvly le génère en 2 minutes.
            </p>
            <Link
              to={toolInfo.path}
              style={{ display: 'inline-block', background: '#fff', color: '#4F46E5', padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 800, textDecoration: 'none' }}
            >
              {toolInfo.label} →
            </Link>
          </div>
        )}

        {/* Back to blog */}
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link to="/blog" style={{ color: '#4F46E5', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            ← Voir tous les articles
          </Link>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
