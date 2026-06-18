import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { MarketingNav } from '../components/MarketingNav';
import { MarketingFooter } from '../components/MarketingFooter';
import { TOOLS, getToolText } from '../data/catalog';

const SLUG_TO_ID = {
  'contrat-freelance':      'contract',
  'devis-professionnel':    'devis',
  'posts-linkedin':         'linkedin-content',
  'cgv-mentions-legales':   'legal',
  'prospection-outreach':   'prospection',
  'analyse-concurrents':    'compete',
  'audit-seo-cro':          'audit',
  'relance-client':         'relance',
  'calculateur-urssaf':     'urssaf',
  'statut-juridique':       'statut',
  'mission-finder':         'mission-finder',
  'linkedin-intelligence':  'linkedin-intel',
  'generateur-images':      'image',
  'convertisseur-fichiers': 'converter',
};

const FAQS = {
  contract: [
    { q: 'Le contrat est-il légalement valide ?', a: 'Le contrat généré s\'appuie sur les standards du droit français des prestations de services. Pour les missions à forts enjeux, faites-le relire par un avocat.' },
    { q: 'Puis-je modifier le contrat après génération ?', a: 'Oui, le texte est entièrement éditable. Copiez-le dans Word, Google Docs ou votre éditeur préféré avant de l\'envoyer.' },
    { q: 'Quelles informations dois-je avoir sous la main ?', a: 'Nom et SIRET du client, description de la mission, tarif, délais de livraison et conditions de paiement.' },
  ],
  devis: [
    { q: 'Le devis est-il exportable en PDF ?', a: 'Oui, directement depuis Savvly. Le PDF est prêt à envoyer à votre client, avec votre logo et vos coordonnées.' },
    { q: 'Puis-je ajouter plusieurs lignes de prestation ?', a: 'Absolument. Le générateur supporte autant de lignes que nécessaire avec calcul automatique des totaux et de la TVA.' },
    { q: 'Comment gérer la TVA en micro-entreprise ?', a: 'Cochez "Franchise en base de TVA" et la mention légale obligatoire sera ajoutée automatiquement sur votre devis.' },
  ],
  'linkedin-content': [
    { q: 'Le contenu généré sera-t-il original ?', a: 'Oui. Chaque post est généré selon vos paramètres (ton, sujet, format) et est unique. Vous pouvez demander plusieurs variantes.' },
    { q: 'Quels formats de posts sont disponibles ?', a: 'Storytelling, liste à puces, opinion tranchée et question engageante. Choisissez le format adapté à votre objectif.' },
    { q: "L'IA connaît-elle l'algorithme LinkedIn ?", a: "Oui, les posts sont optimisés pour le taux d'engagement LinkedIn : hook fort en première ligne, structure aérée, call-to-action." },
  ],
  legal: [
    { q: 'Mes CGV seront-elles conformes à la loi française ?', a: 'Les documents s\'appuient sur le Code de la consommation et le RGPD. Pour une conformité maximale, faites-les vérifier par un juriste.' },
    { q: 'De quoi ai-je besoin pour générer mes CGV ?', a: 'Votre statut juridique, votre activité, vos conditions de vente et le type de clients (BtoB ou BtoC).' },
    { q: 'Puis-je utiliser ces documents directement sur mon site ?', a: 'Oui, les documents sont fournis en texte prêt à copier-coller ou en PDF téléchargeable.' },
  ],
  relance: [
    { q: 'Quand envoyer une relance ?', a: 'Généralement 3 à 7 jours après la date d\'échéance, puis à nouveau 2 semaines plus tard si pas de réponse.' },
    { q: 'Le message sera-t-il agressif ?', a: 'Vous choisissez le ton : cordial, ferme ou urgent. Le message reste toujours professionnel pour préserver la relation client.' },
    { q: 'Puis-je relancer une proposition ignorée ?', a: "Oui, l'outil génère des relances pour factures impayées ET pour propositions commerciales sans réponse." },
  ],
  compete: [
    { q: "Quels concurrents puis-je analyser ?", a: "Tout site web public. Entrez l'URL et choisissez les angles d'analyse (positionnement, SEO, contenu, offre)." },
    { q: "L'analyse est-elle actualisée ?", a: "L'IA analyse les données publiques disponibles au moment de la requête. Relancez mensuellement pour un suivi régulier." },
    { q: "Quels secteurs sont couverts ?", a: "Tous les secteurs. L'outil est particulièrement efficace pour les freelances en marketing, design, développement et conseil." },
  ],
  audit: [
    { q: "Combien de temps prend un audit ?", a: "Environ 60 secondes. L'IA analyse votre site et génère un rapport avec score, recommandations et actions prioritaires." },
    { q: "L'audit remplace-t-il un expert SEO ?", a: "Il vous donne une base solide et des actions prioritaires claires. Pour une stratégie complète, combinez-le avec du conseil expert." },
    { q: "Quels éléments sont analysés ?", a: "Vitesse, structure des URLs, balises méta, maillage interne, taux de conversion et expérience utilisateur mobile." },
  ],
  prospection: [
    { q: "Les messages seront-ils personnalisés ?", a: "Oui, l'IA prend en compte votre niche, votre cible et votre proposition de valeur pour générer des messages authentiques, pas des templates génériques." },
    { q: "Combien de variantes reçoit-on ?", a: "3 variantes de messages + une séquence de relance. Testez et gardez ce qui convertit le mieux." },
    { q: "Quels canaux sont couverts ?", a: "Email, LinkedIn et messages directs. Chaque canal a son style adapté par l'IA." },
  ],
  urssaf: [
    { q: "Les taux sont-ils à jour pour 2026 ?", a: "Oui, les taux URSSAF 2026 sont intégrés. Micro-entreprise, SASU, EURL — tous les régimes sont couverts." },
    { q: "Puis-je simuler plusieurs niveaux de CA ?", a: "Oui. Faites glisser le curseur de CA pour voir instantanément l'impact sur vos cotisations et votre revenu net." },
    { q: "Les dates d'échéances sont-elles incluses ?", a: "Oui, le rapport inclut un calendrier de vos prochaines échéances selon votre régime de déclaration (mensuel ou trimestriel)." },
  ],
  statut: [
    { q: "Comment l'outil choisit-il le bon statut ?", a: "Il analyse votre CA prévisionnel, votre activité, vos objectifs et votre situation personnelle pour recommander le statut le plus adapté." },
    { q: "La recommandation est-elle définitive ?", a: "C'est une orientation basée sur vos réponses. Consultez un expert-comptable avant de créer votre structure juridique." },
    { q: "Puis-je comparer micro-entreprise, SASU et EURL ?", a: "Oui, l'outil présente un comparatif clair avec avantages, inconvénients et seuils de rentabilité pour chaque statut." },
  ],
  'mission-finder': [
    { q: "Quelles plateformes sont couvertes ?", a: "Malt, Comet, Upwork, LinkedIn, Fiverr et les plateformes spécialisées selon votre secteur. L'IA vous recommande celles adaptées à votre profil." },
    { q: "L'outil trouve-t-il des missions directement ?", a: "Non, il génère une stratégie personnalisée et des pitches optimisés pour chaque plateforme. Vous postulez avec les bonnes armes." },
    { q: "C'est adapté à tous les secteurs ?", a: "Oui — développement, design, marketing, rédaction, conseil, finance. La stratégie est personnalisée selon votre expertise." },
  ],
  'linkedin-intel': [
    { q: "De quoi ai-je besoin pour l'audit ?", a: "Votre URL de profil LinkedIn et l'URL de 1 à 3 profils concurrents. L'IA fait le reste." },
    { q: "Le plan de contenu est-il prêt à publier ?", a: "Vous recevez 30 idées de posts avec angle, format et accroche rédigés. Il ne reste qu'à personnaliser et publier." },
    { q: "À quelle fréquence utiliser cet outil ?", a: "Une fois par mois pour recalibrer votre stratégie et identifier les nouvelles opportunités de contenu dans votre niche." },
  ],
  image: [
    { q: "Quels formats d'images sont disponibles ?", a: "Visuels pour posts LinkedIn, bannières de profil, images de couverture et illustrations d'articles. Tous en haute résolution." },
    { q: "Puis-je adapter le style à ma marque ?", a: "Oui, précisez vos couleurs, votre ton et votre style. L'IA génère un visuel cohérent avec votre identité visuelle." },
    { q: "Les images sont-elles libres de droits ?", a: "Oui, les images générées vous appartiennent et sont libres de droits pour un usage commercial." },
  ],
  converter: [
    { q: "Quels formats sont pris en charge ?", a: "PNG, JPG, JPEG → PDF ; DOCX → PDF. La conversion est 100% locale dans votre navigateur — aucun fichier n'est envoyé sur nos serveurs." },
    { q: "Y a-t-il une limite de taille de fichier ?", a: "Les fichiers jusqu'à 20 Mo sont supportés. Compressez d'abord vos images pour les documents plus lourds." },
    { q: "Mes fichiers sont-ils confidentiels ?", a: "Absolument. La conversion se fait entièrement dans votre navigateur, aucune donnée n'est transmise à nos serveurs." },
  ],
};

function useSeo(title, description) {
  useEffect(() => {
    const prev = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta ? meta.getAttribute('content') : '';
    document.title = title;
    if (meta) meta.setAttribute('content', description);
    return () => {
      document.title = prev;
      if (meta) meta.setAttribute('content', prevDesc);
    };
  }, [title, description]);
}

function FAQAccordion({ faqs }) {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {faqs.map((item, i) => (
        <div key={i} style={{ borderBottom: '1px solid #E5E7EB' }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: 15, color: '#0F0F1A', gap: 16 }}
          >
            <span>{item.q}</span>
            <span style={{ fontSize: 20, color: '#4F46E5', flexShrink: 0, transition: 'transform 0.2s', transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)', display: 'inline-block' }}>+</span>
          </button>
          {open === i && (
            <p style={{ color: '#4B4B6A', fontSize: 14, lineHeight: 1.75, paddingBottom: 18, margin: 0 }}>{item.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export function ToolLanding() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const toolId = SLUG_TO_ID[slug];
  const tool = toolId ? TOOLS.find(t => t.id === toolId) : null;

  const text = tool ? getToolText(tool, 'fr') : null;
  useSeo(
    tool ? `${text.name} IA gratuit — Savvly | Toolkit freelance` : 'Savvly',
    tool ? `${text.intro} Essayez gratuitement sur Savvly, le toolkit IA pour freelances.` : ''
  );

  if (!tool) return <Navigate to="/" replace />;

  const faqs = FAQS[toolId] || [];
  const accent = tool.accent || '#4F46E5';
  const isFree = tool.plan === 'free';

  return (
    <>
      <MarketingNav />

      {/* ── HERO ── */}
      <section aria-label="Présentation de l'outil" style={{ background: 'linear-gradient(135deg, #0F0F1A 0%, #1E1E3A 100%)', padding: 'clamp(60px, 8vw, 100px) 24px', position: 'relative', overflow: 'hidden' }}>
        {/* bg glow */}
        <div aria-hidden="true" style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`, pointerEvents: 'none' }} />

        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <nav aria-label="Fil d'Ariane" style={{ marginBottom: 24 }}>
            <ol style={{ display: 'flex', justifyContent: 'center', gap: 6, listStyle: 'none', margin: 0, padding: 0, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              <li><Link to="/" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Savvly</Link></li>
              <li aria-hidden="true">›</li>
              <li><Link to="/#tools" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Outils</Link></li>
              <li aria-hidden="true">›</li>
              <li style={{ color: 'rgba(255,255,255,0.7)' }}>{text.name}</li>
            </ol>
          </nav>

          {/* Badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: isFree ? 'rgba(16,185,129,0.15)' : 'rgba(79,70,229,0.2)', border: `1px solid ${isFree ? 'rgba(16,185,129,0.3)' : 'rgba(79,70,229,0.4)'}`, borderRadius: 100, padding: '4px 12px', fontSize: 11, fontWeight: 800, color: isFree ? '#10B981' : '#818CF8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {isFree ? '✓ Gratuit' : 'Pro'}
            </span>
            {tool.franceOnly && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 100, padding: '4px 12px', fontSize: 11, fontWeight: 800, color: '#60A5FA', letterSpacing: '0.08em' }}>
                🇫🇷 France
              </span>
            )}
            {!isFree && tool.credits > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 100, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                {tool.credits} crédits / utilisation
              </span>
            )}
          </div>

          <h1 style={{ fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 900, color: '#fff', margin: '0 0 20px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {text.name} <span style={{ color: accent }}>IA</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, margin: '0 auto 36px', maxWidth: 580 }}>
            {text.intro}
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/auth?mode=register')}
              style={{ background: accent, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: `0 8px 24px ${accent}55` }}
            >
              Essayer gratuitement →
            </button>
            <button
              onClick={() => navigate('/#pricing')}
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '14px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
            >
              Voir les tarifs
            </button>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section aria-label="Fonctionnalités" style={{ background: '#fff', padding: 'clamp(60px, 8vw, 96px) 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{ display: 'inline-block', background: `${accent}18`, color: accent, borderRadius: 100, padding: '4px 14px', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Ce que vous obtenez</span>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, color: '#0F0F1A', margin: 0, letterSpacing: '-0.02em' }}>
              Tout ce dont vous avez besoin,<br />généré en quelques secondes
            </h2>
          </div>
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, listStyle: 'none', margin: 0, padding: 0 }}>
            {text.features.map((feat, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 14, padding: '20px 22px' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: accent, color: '#fff', fontSize: 14, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: 15, color: '#1E1E3A', lineHeight: 1.55, fontWeight: 500 }}>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section aria-label="Comment ça fonctionne" style={{ background: '#F5F5F7', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', padding: 'clamp(60px, 8vw, 96px) 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{ display: 'inline-block', background: `${accent}18`, color: accent, borderRadius: 100, padding: '4px 14px', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Simple & rapide</span>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, color: '#0F0F1A', margin: 0, letterSpacing: '-0.02em' }}>
              3 étapes, résultat en 60 secondes
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              { num: '1', title: 'Décrivez votre besoin', desc: 'Remplissez le formulaire en 30 secondes avec les informations essentielles de votre mission.' },
              { num: '2', title: "L'IA génère votre document", desc: "Notre IA produit un résultat professionnel en quelques secondes, adapté à votre contexte exact." },
              { num: '3', title: 'Exportez ou copiez', desc: "Téléchargez en PDF, copiez le texte ou sauvegardez dans votre historique Savvly." },
            ].map((step, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '28px 24px', position: 'relative' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: accent, color: '#fff', fontSize: 18, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F0F1A', margin: '0 0 8px' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      {faqs.length > 0 && (
        <section aria-label="Questions fréquentes" style={{ background: '#fff', padding: 'clamp(60px, 8vw, 96px) 24px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span style={{ display: 'inline-block', background: `${accent}18`, color: accent, borderRadius: 100, padding: '4px 14px', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>FAQ</span>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, color: '#0F0F1A', margin: 0, letterSpacing: '-0.02em' }}>
                Questions fréquentes
              </h2>
            </div>
            <FAQAccordion faqs={faqs} />
          </div>
        </section>
      )}

      {/* ── FINAL CTA ── */}
      <section aria-label="Appel à l'action" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', padding: 'clamp(60px, 8vw, 96px) 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 900, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Prêt à gagner du temps ?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', margin: '0 0 32px', lineHeight: 1.65 }}>
            Rejoignez +1 200 freelances qui utilisent Savvly pour générer leurs documents en quelques secondes.
          </p>
          <button
            onClick={() => navigate('/auth?mode=register')}
            style={{ background: '#fff', color: '#4F46E5', border: 'none', borderRadius: 12, padding: '15px 32px', fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
          >
            Commencer gratuitement →
          </button>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 16 }}>Premier mois à 15€ · Sans engagement</p>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
