import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { applySecurityHeaders, verifyAuth, checkCredits, rateLimit } from './_security.js';

const RESEND_API = 'https://api.resend.com/emails';
const LOW_CREDITS_THRESHOLD = 20;
const WARN_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function checkLowCreditsAndWarn(userId, costJustUsed) {
  try {
    const admin = getAdminClient();

    // Get current balance and last warning timestamp in parallel
    const [creditsRes, profileRes, userRes] = await Promise.all([
      admin.from('credits').select('balance').eq('user_id', userId).single(),
      admin.from('profiles').select('last_credits_warning').eq('id', userId).single(),
      admin.auth.admin.getUserById(userId),
    ]);

    if (creditsRes.error || !creditsRes.data) return;
    const postBalance = creditsRes.data.balance - costJustUsed;
    if (postBalance >= LOW_CREDITS_THRESHOLD) return;

    // Check cooldown
    const lastWarning = profileRes.data?.last_credits_warning;
    if (lastWarning) {
      const elapsed = Date.now() - new Date(lastWarning).getTime();
      if (elapsed < WARN_COOLDOWN_MS) return;
    }

    const email = userRes.data?.user?.email;
    if (!email) return;

    // Send warning email
    await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Savvly <onboarding@resend.dev>',
        to: [email],
        subject: '⚠️ Il vous reste moins de 20 crédits sur Savvly',
        html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#F59E0B,#EF4444);padding:40px 40px 32px;text-align:center;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:rgba(255,255,255,0.8);margin-bottom:12px;">SAVVLY</div>
      <h1 style="margin:0;font-size:24px;font-weight:800;color:#fff;line-height:1.3;">Votre solde est presque épuisé</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">Il vous reste <strong>moins de ${postBalance < 0 ? 0 : postBalance} crédits</strong> sur votre compte Savvly.</p>
      <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">Pour continuer à générer vos contrats, devis et contenus LinkedIn sans interruption, rechargez votre solde ou passez à l'offre Pro (crédits illimités).</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin:28px 0;">
        <a href="https://savvly.co/dashboard" style="display:inline-block;background:linear-gradient(135deg,#4F46E5,#6D28D9);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:10px;">Acheter des crédits</a>
        <a href="https://savvly.co/dashboard" style="display:inline-block;background:#fff;color:#4F46E5;text-decoration:none;font-weight:700;font-size:14px;padding:13px 28px;border-radius:10px;border:2px solid #4F46E5;">Passer Pro →</a>
      </div>
      <p style="margin:0;font-size:13px;color:#9CA3AF;text-align:center;">L'offre Pro inclut des crédits illimités et des fonctionnalités avancées.</p>
    </div>
    <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9CA3AF;">© 2026 Savvly · <a href="https://savvly.co" style="color:#9CA3AF;">savvly.co</a></p>
    </div>
  </div>
</body>
</html>`,
      }),
    });

    // Update last_credits_warning timestamp
    await admin.from('profiles').update({ last_credits_warning: new Date().toISOString() }).eq('id', userId);

    console.log('[generate] low-credits warning sent to:', email, '| balance:', postBalance);
  } catch (err) {
    console.error('[generate] low-credits warning failed:', err.message);
  }
}

export const config = { maxDuration: 60 };

// Authoritative credit costs — single source of truth server-side.
const TOOL_CREDITS = {
  audit:             15,
  compete:           15,
  legal:              0,
  contract:           0,
  'linkedin-content': 10,
  devis:              5,
  relance:            5,
  statut:             0,
  urssaf:             0,
  'linkedin-intel':  35,
  prospection:       10,
  'mission-finder':  30,
};

const KNOWN_TOOLS = new Set(Object.keys(TOOL_CREDITS));
const MAX_FIELD_LENGTH = 5000;

// Appended to every system prompt.
const ASCII_INSTRUCTION = '\n\nIMPORTANT: Do not use emoji or special unicode characters, EXCEPT in blockquote callouts. For callouts ONLY you may use these four: ✅ ⚠️ 💡 🚨 — place one at the start of a blockquote line (> ✅ Good: ...). Do not use any other emoji or unicode. For section dividers use --- instead.';

const CALLOUT_INSTRUCTION = '\n\nUse blockquote callouts to highlight key insights (sparingly, max 3 per response): > ✅ Good: [finding] | > ⚠️ Warning: [finding] | > 💡 Tip: [recommendation] | > 🚨 Critical: [issue].';

const COMPLETION_INSTRUCTION = '\n\nNever truncate your response. Always complete your full answer. If you reach the end of a section, finish it completely before stopping. Output all requested sections even if they are brief. Never end mid-sentence or mid-list.';

const SYSTEM_PROMPTS = {
  audit: `You are an expert SEO & CRO auditor. Be concise — every section must fit within a tight token budget.
Rules:
- Start your entire response with [SCORE:XX] on its own line (0-100 overall score for this site)
- Use [OK] / [WARN] / [ERR] per finding
- Max 3 bullet points per section
- Max 2 sentences per bullet point
- Output ALL 5 sections — do not stop early

Structure your response using EXACTLY these section markers in this order:

[SECTION:TECHNICAL]
Title tags, meta descriptions, H1/H2 structure, schema markup. 3 findings max.

[SECTION:CONTENT]
Keyword relevance, content depth, internal linking, image alt text. 3 findings max.

[SECTION:PERFORMANCE]
LCP, CLS, render-blocking resources, image optimization. 3 findings max.

[SECTION:CONVERSION]
Above-the-fold clarity, CTA copy, trust signals, mobile UX. 3 findings max.

[SECTION:ACTIONS]
Top 5 priority fixes ranked by impact. Number each. One sentence per action.

Do not add any text before [SCORE:XX] or after the last section.`,

  compete: `You are analyzing a specific competitor website. The website content is provided between <WEBSITE_CONTENT> tags.

Analyze ONLY the content inside <WEBSITE_CONTENT>. Never invent numbers, prices, claims, features or services not explicitly present in that content.
If specific information is not in the content, write "Not visible on site" — never guess or fabricate.
Quote exact phrases from the content to prove each claim.

STRICT RULES:
1. ONLY use what is inside <WEBSITE_CONTENT> — no outside knowledge, no assumptions
2. NEVER invent numbers, prices, percentages, or statistics not found verbatim in the content
3. NEVER add generic industry context or typical competitor behaviour
4. Every claim requires a direct quote from the content as evidence
5. If a section has no data, list what is "Not visible on site" rather than padding with guesses

Start your response with [SCORE:XX] on its own line (0-100 threat score based ONLY on what you actually found).
Format with clear sections: POSITIONING, OFFER STRUCTURE, KEYWORDS, CONTENT STRATEGY, WEAKNESSES TO EXPLOIT, YOUR MOVE.
End with a "YOUR MOVE" section with 2-3 concrete tactics grounded in what you actually found on the site.`,

  legal: `You are an expert French legal document writer specializing in CGV, Privacy Policies, and Mentions Légales.
Generate ONLY the articles indicated in the user message. Be concise but legally complete.
Maximum 3 paragraphs per article. Never truncate mid-sentence. Always finish the last article completely before stopping.
Never add preamble or conclusion outside the article headings.
Use ## for article headings, ### for sub-points if needed. Start directly with the first ## heading.
CRITICAL: Always write in French. This is a French legal document.`,

  'legal-template': `Tu es un juriste spécialisé en droit français pour indépendants et freelances. Ta tâche est de reformuler une description d'activité en termes professionnels adaptés à un document juridique, et si demandé, de rédiger une clause spécifique. Réponds UNIQUEMENT dans le format exact demandé. Toujours en français. Sois précis et adapté au type d'entreprise.`,

  contract: `You are a freelance contract specialist. Generate complete, professional service agreements.
Include all standard clauses: parties, scope of work, deliverables, timeline, compensation, payment schedule, revisions policy, intellectual property, confidentiality, termination, governing law, and signature blocks.
Use the specific details provided — do not leave placeholder text.
Format clearly with numbered sections.
Use EXACTLY the date provided in the user message for all date references. Never invent or assume dates.`,

  'contract-template': `Tu es un expert en rédaction de contrats de prestation pour freelances français. Reformule les descriptions de mission de manière professionnelle et juridiquement précise. Réponds UNIQUEMENT dans le format exact demandé. Toujours en français.`,

  'linkedin-content': `You are a LinkedIn content expert for freelancers and independent consultants.
Write engaging LinkedIn posts optimised for reach and engagement.
Match the requested tone and format exactly.
Use short paragraphs, strategic line breaks, and a strong opening hook.
Stay under 3000 characters.
End with a clear call-to-action or discussion prompt.
Output only the post — no preamble, no "Here is your post:" framing.`,

  devis: `You are a professional quote generator for freelancers.
Create clean, formatted quote documents that are ready to send to clients.
Include: a quote number (DEVIS-YYYY-NNN format), the exact date provided, validity period (30 days from provided date), a "Prestataire" (From) section and a "Client" (To) section, a formatted table of line items (description, qty, unit price, total), subtotal, VAT calculation, total, and payment terms with exact due date calculated from the provided date.
CRITICAL: Use the EXACT prices and quantities provided — never round, modify or recalculate any figure. Copy them verbatim.
CRITICAL: Use the exact date provided for the quote date. Calculate payment due dates from that exact date.
Output only the quote document — no preamble or explanation.`,

  relance: `You are an expert at writing professional payment follow-up messages for freelancers.
Generate a follow-up message based EXACTLY on the user's situation. Use the exact amount, invoice number, delay and context provided.
Never invent names, invoice numbers, amounts or dates not provided by the user. Never use placeholder or example text.
Write a subject line and body. Output only the message — no preamble, no explanation.`,

  'linkedin-intel': `You are a LinkedIn growth strategist for freelancers and independent consultants.
Analyse the provided LinkedIn profile and return a structured report. You MUST output ALL 5 sections — stay concise so you finish within the token budget.

[SECTION:PROFILE_AUDIT]
Audit 6 elements: headline, about, experience, featured, skills, photo. Use [OK]/[WARN]/[ERR] + one-sentence recommendation per element. Max 6 items.

[SECTION:COMPETITOR_ANALYSIS]
If competitors provided: 2–3 key differentiators each + one tactical takeaway. If none: suggest 3 profile types to watch. Max 8 bullet points total.

[SECTION:HOT_TOPICS]
List 6 high-engagement topic areas for this niche. One line each: topic + why it resonates.

[SECTION:CONTENT_PLAN]
List 6 post ideas tailored to this profile and niche. For each idea use EXACTLY this format:
Idea N: [topic/angle]
Format: [storytelling | list | opinion | question]
Angle: [one sentence on the specific perspective to take]

[SECTION:READY_POSTS]
5 post ideas tailored to this profile. For each idea use exactly this format:
Idea N: [topic/angle]
Format: [storytelling | list | opinion | question]
Hook: [opening line only — max 15 words]

Do not add any text before [SECTION:PROFILE_AUDIT] or after the last section.`,

  prospection: `You are an expert in B2B prospecting and cold outreach for freelancers.
Generate personalised outreach messages using EXACTLY these section markers:

[SECTION:VERSION_A]
Write a professional, warm outreach message. Focus on the prospect's potential pain point and the value you bring. Keep it under 150 words. No generic openers like "I hope this message finds you well."

[SECTION:VERSION_B]
Write a shorter, more direct version (under 80 words). Lead with the problem, not your credentials.

[SECTION:VERSION_C]
Write a curiosity-driven version that opens with a provocative question or surprising insight specific to their industry. Under 120 words.

[SECTION:FOLLOWUP_D3]
Write a Day 3 follow-up message (under 60 words). Reference the initial message briefly. Add a new piece of value or a different angle.

[SECTION:FOLLOWUP_D7]
Write a Day 7 follow-up message (under 50 words). Lighter tone. Leave the door open without pressure.

Adapt tone, vocabulary, and examples to the specified channel and tone style.
Do not add any text before [SECTION:VERSION_A] or after the last section.`,

  'mission-finder': `You are a freelance career strategist with deep knowledge of the French and international freelance market.
Generate actionable, specific recommendations (not generic advice).
Include real platform names, real search operators, real company types.
Structure output with EXACTLY these section markers:

[SECTION:PLATFORMS]
List 6–8 platforms ranked by fit for this profile. For each: platform name, why it fits, conversion tip, and typical mission budget range. Include both French platforms (Malt, Comet, Freelance.com, Crème de la Crème, Kicklox, Talent.io) and international ones (Toptal, Upwork, LinkedIn, etc.) as relevant.

[SECTION:BOOLEAN_SEARCH]
Provide 4–6 ready-to-use LinkedIn boolean search strings tailored to this profile. Format each as a copyable string. Add a tip on how to use LinkedIn's filters (location, company size, date posted) to narrow results. Also include 2–3 Google X-ray search strings for finding decision-makers.

[SECTION:PROFILE_TIPS]
Provide a 10-point profile optimisation checklist covering: LinkedIn headline formula, About section structure, experience bullet points, featured section, skills & endorsements, keywords to use, portfolio/projects, recommendations, profile URL, and activity signal. Use [OK] / [WARN] / [ERR] for priority.

[SECTION:TARGET_COMPANIES]
Define 4–5 company archetypes to target (e.g. "Series A SaaS startup 10–50 people"). For each: why they hire freelancers, how to find them (LinkedIn filters, Crunchbase, Welcome to the Jungle, etc.), who to contact (title/role), and best outreach timing.

[SECTION:MESSAGES]
Write 3 ready-to-send outreach templates: one for LinkedIn DM (under 120 words), one for email (subject line + body), one for Malt platform messaging. Each should be personalised to the profile's niche and TJM level. Add a note on when to follow up.

Do not add any text before [SECTION:PLATFORMS] or after the last section.`,
};

const AUDIT_CHECK_LABELS = {
  'tool.audit.check.titles':   'Title tags & meta descriptions',
  'tool.audit.check.headings': 'H1/H2 heading structure',
  'tool.audit.check.speed':    'Page speed & Core Web Vitals',
  'tool.audit.check.cta':      'CTA placement & conversion rate',
  'tool.audit.check.mobile':   'Mobile responsiveness',
  'tool.audit.check.links':    'Internal linking structure',
  'tool.audit.check.alt':      'Image alt text & accessibility',
  'tool.audit.check.schema':   'Schema markup & structured data',
};

const DISABLED_TOOLS = new Set(['audit', 'compete']);

const MAX_TOKENS = {
  audit:              4000,
  compete:            4000,
  legal:              1200,
  contract:           4000,
  'linkedin-content': 2000,
  devis:              2000,
  relance:            1000,
  statut:             1000,
  urssaf:             1000,
  'linkedin-intel':   4000,
  prospection:        4000,
  'mission-finder':   4000,
};

const LEGAL_SECTION_SPECS = {
  tos: {
    SECTION_1: {
      title: "Articles 1-2 — Identification & Champ d'application",
      instruction: "Write ARTICLE 1 (Identification du vendeur : dénomination sociale, forme juridique, adresse complète, SIRET si applicable, email de contact, numéro de TVA si applicable) and ARTICLE 2 (Champ d'application : objet des présentes CGV, acceptation par le client lors de toute commande, applicabilité exclusive). Write each article in full. Start each with ## Article N — [title].",
    },
    SECTION_2: {
      title: 'Articles 3-4 — Services & Formation du contrat',
      instruction: "Write ARTICLE 3 (Services proposés : description détaillée des prestations, catalogue de services, caractéristiques essentielles, délais d'exécution habituels) and ARTICLE 4 (Formation du contrat : processus de commande étape par étape, devis et bon de commande, date de formation du contrat, droit de rétractation 14 jours pour les consommateurs conformément à l'article L.221-18 du Code de la consommation). Write each article in full. Start each with ## Article N — [title].",
    },
    SECTION_3: {
      title: 'Articles 5-6 — Tarifs & Paiement',
      instruction: "Write ARTICLE 5 (Tarifs : prix HT et TTC, taux de TVA applicable, grille tarifaire, modalités de révision des prix, nécessité d'un devis préalable) and ARTICLE 6 (Paiement : modalités acceptées, délais, acompte éventuel, pénalités de retard conformément aux articles L.441-10 et L.441-11 du Code de commerce — taux légal + 10 points, indemnité forfaitaire de 40€ pour frais de recouvrement, clause de réserve de propriété). Write each article in full. Start each with ## Article N — [title].",
    },
    SECTION_4: {
      title: 'Articles 7-9 — Exécution & Propriété intellectuelle & Responsabilité',
      instruction: "Write ARTICLE 7 (Exécution des prestations : délais, conditions d'exécution, obligations mutuelles du prestataire et du client, force majeure, sous-traitance éventuelle), ARTICLE 8 (Propriété intellectuelle : droits d'auteur sur les livrables, conditions de cession complète à réception du paiement intégral, droits d'utilisation accordés, garantie d'éviction, interdiction de revente) and ARTICLE 9 (Responsabilité : plafonnement au montant de la commande, exclusion des dommages indirects, force majeure, garantie de conformité légale). Write each article in full. Start each with ## Article N — [title].",
    },
    SECTION_5: {
      title: 'Articles 10-11 — Données personnelles & Protection des données',
      instruction: "Generate ONLY Articles 10 to 11. Be concise but legally complete. Maximum 3 paragraphs per article. Never truncate mid-sentence. Always finish the last article completely before stopping.\n\nARTICLE 10 (Données personnelles : responsable du traitement, catégories de données collectées, finalités de traitement, base légale RGPD pour chaque finalité, durées de conservation).\nARTICLE 11 (Protection des données et droits : droits des personnes — accès, rectification, effacement, portabilité, opposition — modalités d'exercice par email, délai de réponse 30 jours, droit de saisir la CNIL à www.cnil.fr, mesures de sécurité techniques et organisationnelles). Start each with ## Article N — [title].",
    },
    SECTION_6: {
      title: 'Articles 12-14 — Résiliation & Droit applicable & Litiges',
      instruction: "Generate ONLY Articles 12 to 14. Be concise but legally complete. Maximum 3 paragraphs per article. Never truncate mid-sentence. Always finish the last article completely before stopping.\n\nARTICLE 12 (Résiliation : conditions et modalités, préavis requis, conséquences de la résiliation — facturation prorata temporis du travail réalisé, restitution des éléments, résiliation anticipée pour faute après mise en demeure restée sans effet sous 15 jours).\nARTICLE 13 (Droit applicable : les présentes CGV sont soumises au droit français, langue française fait foi, hiérarchie des normes).\nARTICLE 14 (Règlement des litiges : tentative de règlement amiable préalable obligatoire dans un délai de 30 jours, médiation de la consommation conformément aux articles L.616-1 et R.616-1 du Code de la consommation si applicable, à défaut attribution de compétence au tribunal de commerce du siège du prestataire). Start each with ## Article N — [title].",
    },
  },
  privacy: {
    SECTION_1: {
      title: 'Collecte des données & Base légale (RGPD)',
      instruction: "Write the following sections of a French Privacy Policy (Politique de Confidentialité RGPD) :\n\n## 1. Responsable du traitement\nIdentité complète, adresse, email de contact du responsable du traitement.\n\n## 2. Données collectées\nListe exhaustive de tous les types de données collectées (nom, prénom, email, téléphone, adresse, données de navigation, cookies, données de paiement, etc.) avec la méthode de collecte pour chacune.\n\n## 3. Finalités et bases légales\nPour chaque finalité de traitement, préciser : la finalité, la base légale RGPD (consentement Art.6(1)(a), exécution d'un contrat Art.6(1)(b), intérêt légitime Art.6(1)(f), obligation légale Art.6(1)(c)), les catégories de données concernées. Write each section in full.",
    },
    SECTION_2: {
      title: 'Droits des personnes & Conservation des données & Cookies',
      instruction: "Write :\n\n## 4. Durées de conservation\nPour chaque catégorie de données, préciser la durée de conservation exacte et sa justification légale.\n\n## 5. Droits des personnes\nDescription détaillée de tous les droits RGPD : droit d'accès, rectification, effacement (droit à l'oubli), limitation du traitement, portabilité, opposition, droit de ne pas faire l'objet d'une décision automatisée. Pour chaque droit : comment l'exercer (email, adresse postale), délai de réponse (30 jours), droit de réclamation auprès de la CNIL (www.cnil.fr).\n\n## 6. Cookies et traceurs\nTypes de cookies (essentiels, analytiques, marketing), leur finalité, leur durée de vie, mécanisme de consentement, et méthode d'opt-out. Write each section in full.",
    },
    SECTION_3: {
      title: 'Sécurité & Transferts & Modifications & Contact',
      instruction: "Write :\n\n## 7. Sécurité des données\nMesures techniques et organisationnelles de sécurité mises en œuvre (chiffrement TLS, HTTPS, contrôle d'accès, sauvegardes, etc.).\n\n## 8. Partage et transferts de données\nListe des sous-traitants tiers (hébergeur, analytics, paiement, emailing, etc.) et tout transfert hors UE avec les garanties applicables (décisions d'adéquation, clauses contractuelles types).\n\n## 9. Modifications de la politique\nComment et quand les utilisateurs seront notifiés des mises à jour, date d'entrée en vigueur de la version actuelle.\n\n## 10. Contact\nCoordonnées complètes pour toute demande relative à la vie privée (email, adresse postale, délai de réponse). Write each section in full.",
    },
  },
  notice: {
    SECTION_1: {
      title: 'Éditeur du site & Hébergeur',
      instruction: "Write the French Mentions Légales (conformément à la loi n°2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique) :\n\n## Éditeur du site\nInformations complètes : dénomination sociale, forme juridique, capital social (si applicable), adresse du siège social, numéro SIRET/RCS, numéro de TVA intracommunautaire (si applicable), email, téléphone, directeur de la publication (nom et qualité).\n\n## Hébergeur\nCoordonnées de l'hébergeur : nom de la société, adresse, contact.\n\n## Activité\nBrève description de l'objet du site web et de l'activité principale de la société. Write each section in full with all legally required information.",
    },
    SECTION_2: {
      title: 'Propriété intellectuelle & Responsabilité & Loi applicable',
      instruction: "Write :\n\n## Propriété intellectuelle\nTout le contenu du site (textes, images, logos, vidéos, structure) est la propriété exclusive de la société, protégé par le Code de la propriété intellectuelle. Conditions de reproduction et d'utilisation. Politique relative aux liens hypertextes.\n\n## Limitation de responsabilité\nExactitude des informations (meilleur effort, sans garantie), disponibilité du site (maintenance, pannes), liens vers des sites tiers (non responsable du contenu externe), force majeure.\n\n## Loi applicable et juridiction\nLe droit français régit ce site. Législation applicable (loi LCEN, RGPD, Code de la consommation selon applicable). Juridiction compétente (tribunaux français). Résolution des litiges (tentative amiable préalable obligatoire). Write each section in full with all legally required mentions.",
    },
  },
};

function buildBaseMessage(toolId, input) {
  switch (toolId) {
    case 'audit': {
      const focusAreas = Array.isArray(input.checks)
        ? input.checks.map(k => AUDIT_CHECK_LABELS[k] ?? k).join(', ')
        : 'all areas';
      return `Website to audit: ${input.url}\nFocus areas: ${focusAreas}\n\nProvide a complete SEO & CRO audit report.`;
    }

    case 'compete': {
      const focus = Array.isArray(input.focus) ? input.focus.join(', ') : 'all areas';
      return `Competitor website: ${input.competitorUrl}
${input.yourUrl ? `My website: ${input.yourUrl}` : ''}
Analysis focus: ${focus}

Provide a complete competitive analysis based solely on the <WEBSITE_CONTENT> provided.`;
    }

    case 'legal': {
      if (input.mode === 'template') {
        const needsClause = input.docType === 'tos' || input.docType === 'all';
        const clauseLines = needsClause
          ? '\n[TITLE]titre de la clause Article 11 (5 mots max)[/TITLE]\n[CLAUSE]2-3 phrases de contenu juridique spécifique à cette activité[/CLAUSE]'
          : '';
        return `Activité du prestataire : ${input.activity || 'non précisée'}
Type d'entreprise : ${input.legalType || 'non précisé'}
Document à générer : ${input.docType || 'tos'}

Reformulez l'activité en 2 phrases professionnelles adaptées à un document juridique français.
Répondez EXACTEMENT dans ce format :
[ACTIVITY]description reformulée[/ACTIVITY]${clauseLines}`;
      }

      const baseCtx = `Date : ${input.today || new Date().toLocaleDateString('fr-FR')}
Entreprise : ${input.company}
Forme juridique : ${input.type || 'non précisé'}
Pays / juridiction : ${input.country || 'France'}
Adresse : ${input.address || 'non précisée'}
Activité : ${input.activity || 'non précisée'}`;

      const docType = input.docType || 'tos';
      const sectionKey = input.sectionKey;

      if (sectionKey && LEGAL_SECTION_SPECS[docType]?.[sectionKey]) {
        const spec = LEGAL_SECTION_SPECS[docType][sectionKey];
        const DOC_NAMES = {
          tos: 'CGV — Conditions Générales de Vente',
          privacy: 'Politique de Confidentialité (RGPD)',
          notice: 'Mentions Légales',
        };
        return `${baseCtx}

Document : ${DOC_NAMES[docType] || docType}
Section à rédiger : ${spec.title}

${spec.instruction}`;
      }

      // Fallback (no sectionKey — legacy path)
      const DOC_LABELS = {
        tos:     'CGV — Conditions Générales de Vente (minimum 12 articles)',
        privacy: 'Politique de Confidentialité complète (RGPD)',
        notice:  'Mentions Légales complètes',
        all:     'Les trois documents complets séparés par ---',
      };
      return `${baseCtx}\n\nDocument à générer : ${DOC_LABELS[docType] || DOC_LABELS.tos}`;
    }

    case 'contract': {
      if (input.mode === 'template') {
        return `Mission décrite par le prestataire : ${input.mission || 'non précisée'}

Reformulez cette description en 2-3 phrases professionnelles adaptées à un contrat de prestation de services français.
Répondez EXACTEMENT dans ce format : [MISSION]mission reformulée[/MISSION]`;
      }
      return `Today's date: ${input.today || new Date().toLocaleDateString('fr-FR')}
Client name: ${input.client}
Client company: ${input.clientCompany || 'N/A'}
Mission: ${input.mission}
Rate: ${input.rate ? `€${input.rate} ${input.rateType}` : 'not specified'}
Duration: ${input.duration ? `${input.duration} ${input.durationUnit}` : 'not specified'}
Deliverables: ${input.deliverables || 'as described in mission'}
Payment terms: ${input.paymentTerms || '30 days'}

Generate a complete freelance service agreement.`;
    }

    case 'linkedin-content': {
      const styleSection = input.styleContext
        ? `\nUser's own LinkedIn posts (REPLICATE their exact tone, vocabulary, sentence structure, hook style — do not imitate the topic, only the style):\n"""\n${input.styleContext}\n"""\n`
        : '';
      return `Topic: ${input.topic}
Tone: ${input.tone}
Format: ${input.format}
${styleSection}
Write a LinkedIn post.`;
    }

    case 'devis': {
      const lines = Array.isArray(input.lines)
        ? input.lines.filter(l => l.desc).map(l => `- ${l.desc}: qty ${l.qty || 1} x EUR${l.price || 0}`).join('\n')
        : '';
      const prestataire = [
        input.prestataireNom     ? `Nom: ${input.prestataireNom}` : null,
        input.prestataireEmail   ? `Email: ${input.prestataireEmail}` : null,
        input.prestataireTel     ? `Tel: ${input.prestataireTel}` : null,
        input.prestataireAdresse ? `Adresse: ${input.prestataireAdresse}` : null,
      ].filter(Boolean).join('\n');
      return `Quote date: ${input.today || ''}

Prestataire (From):
${prestataire || '(not provided)'}

Client (To): ${input.clientName}${input.clientCompany ? ` — ${input.clientCompany}` : ''}
${input.clientEmail ? `Email: ${input.clientEmail}` : ''}

Services:
${lines || '(no line items provided)'}

VAT rate: ${input.vatRate || '0%'}
Payment terms: ${input.paymentTerms || 'Net 30 days'}
${input.notes ? `Notes: ${input.notes}` : ''}

Generate a professional quote document.`;
    }

    case 'relance':
      return `Situation: ${input.context}
Tone: ${input.tone}

Write a payment follow-up message.`;

    case 'linkedin-intel': {
      const competitors = Array.isArray(input.competitors) && input.competitors.filter(Boolean).length > 0
        ? `Competitor profiles to analyse:\n${input.competitors.filter(Boolean).map(c => `- ${c}`).join('\n')}`
        : 'No competitor profiles provided.';
      return `LinkedIn profile URL: ${input.profileUrl || 'not provided'}
Niche / activity: ${input.niche || 'not specified'}
Main goal on LinkedIn: ${input.goal || 'increase visibility'}
${competitors}

${input.profileSummary ? `Profile screenshot analysis:\n${input.profileSummary}` : 'No profile screenshot provided.'}

Perform a complete LinkedIn intelligence analysis.`;
    }

    case 'prospection': {
      return `Freelancer niche / service: ${input.niche}
Ideal target client: ${input.target}
Outreach channel: ${input.channel || 'LinkedIn DM'}
Tone style: ${input.tone || 'Professional'}
${input.pain ? `Main pain point to address: ${input.pain}` : ''}

Generate all outreach messages and follow-ups.`;
    }

    case 'mission-finder': {
      return `Expertise / stack: ${input.expertise}
Target daily rate (TJM): ${input.tjm ? `€${input.tjm}/day` : 'not specified'}
Experience level: ${input.experience || 'Confirmed'}
Work preference: ${input.workPreference || 'Remote'}
Location: ${input.location || 'not specified'}
${input.sector ? `Sector preference: ${input.sector}` : ''}
Goal: ${input.goal || 'Both'}

Generate a complete mission-finding strategy.`;
    }

    default:
      return JSON.stringify(input);
  }
}

function buildUserMessage(toolId, input) {
  const base = buildBaseMessage(toolId, input);
  if (input._sectionKey) {
    return `${base}\n\nREGENERATE ONLY the [SECTION:${input._sectionKey}] section. Output ONLY the content for that section — no section marker, no other sections.`;
  }
  return base;
}

// Fetches a competitor URL server-side and extracts readable text from the HTML.
// Returns null on any failure so callers can silently skip.
async function fetchPageContent(url, maxChars = 4000) {
  try {
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.5',
      },
    });
    if (!resp.ok) {
      console.warn('[fetchPageContent] non-ok status:', resp.status, url);
      return null;
    }
    const html = await resp.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<head[\s\S]*?<\/head>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxChars);
    console.log('[compete] fetched content length:', text.length);
    return text || null;
  } catch (err) {
    console.warn('[fetchPageContent] failed for', url, ':', err.message);
    return null;
  }
}

// Agentic loop for tools that use web_search_20250305.
// Runs up to 5 turns: if the model calls web_search, Anthropic executes the search
// server-side and we pass the tool_result back to continue. Falls back to null on error.
async function runWithWebSearch(anthropic, systemPrompt, userContent, maxTokens) {
  const messages = [{ role: 'user', content: userContent }];
  let fullText = '';

  for (let turn = 0; turn < 5; turn++) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages,
    });

    for (const block of response.content) {
      if (block.type === 'text') fullText += block.text;
    }

    if (response.stop_reason !== 'tool_use') break;

    // Continue the agentic loop: add assistant turn + empty tool results
    // (Anthropic handles actual search execution server-side)
    messages.push({ role: 'assistant', content: response.content });
    const toolResults = response.content
      .filter(b => b.type === 'tool_use')
      .map(b => ({ type: 'tool_result', tool_use_id: b.id, content: '' }));
    if (!toolResults.length) break;
    messages.push({ role: 'user', content: toolResults });
  }

  return fullText.trim() || null;
}

export default async function handler(req, res) {
  applySecurityHeaders(res);

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[generate] ANTHROPIC_API_KEY not set');
    return res.status(500).json({ error: 'AI service not configured' });
  }

  const { toolId, input, userId, lang } = req.body ?? {};

  // ── 1. Input presence ─────────────────────────────────────────
  if (!toolId || !input || !userId) {
    return res.status(400).json({ error: 'Missing toolId, input, or userId' });
  }

  // ── 2. toolId whitelist + disabled check ─────────────────────
  if (!KNOWN_TOOLS.has(toolId)) {
    return res.status(400).json({ error: `Unknown tool: ${toolId}` });
  }
  if (DISABLED_TOOLS.has(toolId)) {
    return res.status(503).json({ error: 'This tool is coming soon and is not yet available.' });
  }

  // ── 3. Input field validation ─────────────────────────────────
  for (const [key, val] of Object.entries(input)) {
    if (val === null || val === undefined) continue;
    if (Array.isArray(val)) continue; // arrays (checks, docs, lines, competitors) — not validated as strings
    if (typeof val !== 'string' && typeof val !== 'number' && typeof val !== 'boolean') {
      return res.status(400).json({ error: `Invalid field: ${key}` });
    }
    if (typeof val === 'string' && val.length > MAX_FIELD_LENGTH) {
      return res.status(400).json({ error: `Field "${key}" exceeds maximum length` });
    }
  }

  // ── 4. Authentication ─────────────────────────────────────────
  const verifiedId = await verifyAuth(req, res, userId);
  if (!verifiedId) return; // verifyAuth already sent the response

  // ── 5. Rate limiting ──────────────────────────────────────────
  if (!rateLimit(res, verifiedId)) return;

  // ── 6. Server-side credit check ───────────────────────────────
  const cost = TOOL_CREDITS[toolId];
  if (!(await checkCredits(res, verifiedId, cost))) return;

  const templateMode = input.mode === 'template';
  const effectivePromptKey = templateMode ? `${toolId}-template` : toolId;
  const basePrompt = SYSTEM_PROMPTS[effectivePromptKey] || SYSTEM_PROMPTS[toolId];
  const maxTokens = templateMode
    ? (toolId === 'legal' ? 400 : toolId === 'contract' ? 200 : MAX_TOKENS[toolId] ?? 2048)
    : (MAX_TOKENS[toolId] ?? 2048);

  const FORMAT_INSTRUCTION = '\n\nFormatting rules: Use ## headings to separate major sections. Use bullet points for lists. Use markdown tables where data has multiple dimensions. Be specific and actionable — include real names, numbers, percentages, and concrete examples. Avoid generic advice.';
  const DETAIL_INSTRUCTION = (toolId === 'audit' || toolId === 'compete') ? '\n\nInclude specific numbers, percentages, and concrete examples wherever possible.' : '';
  const calloutInstruction = (toolId === 'audit' || toolId === 'compete' || toolId === 'linkedin-intel') ? CALLOUT_INSTRUCTION : '';
  const langInstruction = lang === 'fr' ? '\n\nAlways respond in French.' : '\n\nAlways respond in English.';
  const systemPrompt = templateMode
    ? basePrompt
    : basePrompt + FORMAT_INSTRUCTION + DETAIL_INSTRUCTION + calloutInstruction + ASCII_INSTRUCTION + COMPLETION_INSTRUCTION + langInstruction;

  let userMessage;
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2 });
    userMessage = buildUserMessage(toolId, input);

    console.log('[generate] toolId:', toolId, '| userId:', userId, '| max_tokens:', maxTokens, '| templateMode:', templateMode, '| prompt length:', userMessage.length);

    // Extra diagnostic logging for the legal tool
    if (toolId === 'legal') {
      console.log('[generate] legal raw input:', JSON.stringify(input));
      console.log('[generate] legal userMessage:\n', userMessage);
    }
    if (toolId === 'linkedin-intel') {
      console.log('[generate] linkedin-intel max_tokens:', MAX_TOKENS[toolId]);
    }

    let userContent = userMessage;

    // For compete: build WEBSITE_CONTENT from (1) user-pasted context or (2) HTML fetch.
    // No web search for compete — it causes hallucinations with mixed external data.
    if (toolId === 'compete' && input.competitorUrl) {
      let websiteContent = null;

      if (input.additionalContext && input.additionalContext.trim().length >= 50) {
        // User pasted the site content directly — most reliable source
        websiteContent = input.additionalContext.trim();
        console.log('[generate] compete using user-provided context | chars:', websiteContent.length);
      } else {
        // Attempt server-side HTML fetch
        const pageContent = await fetchPageContent(input.competitorUrl);
        if (pageContent && pageContent.length >= 100) {
          websiteContent = pageContent;
          console.log('[generate] compete page fetch ok | url:', input.competitorUrl, '| chars:', websiteContent.length);
        } else {
          console.log('[generate] compete page fetch failed or too short | url:', input.competitorUrl, '| chars:', pageContent?.length ?? 0);
        }
      }

      if (websiteContent) {
        userContent = `<WEBSITE_CONTENT>\n${websiteContent}\n</WEBSITE_CONTENT>\n\n${userContent}`;
      } else {
        // No content at all — tell the user via SSE before any stream starts
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        const msg = "We couldn't access this site's content directly. Try copying and pasting the homepage text in the **Additional context** field below for a more accurate analysis.";
        res.write(`data: ${JSON.stringify({ text: msg })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
    }

    // Set SSE headers before starting the stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // audit and linkedin-intel: use web search for real-time data
    if (toolId === 'audit' || toolId === 'linkedin-intel') {
      let webText = null;
      try {
        webText = await runWithWebSearch(anthropic, systemPrompt, userContent, maxTokens);
        console.log('[generate] web_search success | toolId:', toolId, '| output length:', webText?.length ?? 0);
      } catch (wsErr) {
        console.error('[generate] web_search failed, falling back to stream | toolId:', toolId, '|', wsErr.message);
      }

      if (webText) {
        const CHUNK = 40;
        for (let i = 0; i < webText.length; i += CHUNK) {
          res.write(`data: ${JSON.stringify({ text: webText.slice(i, i + CHUNK) })}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        res.end();
        checkLowCreditsAndWarn(verifiedId, cost);
        return;
      }
      // Fall through to regular streaming below
    }

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    const finalMsg = await stream.finalMessage();
    console.log('[generate] success | output length:', finalMsg.content[0]?.text?.length ?? 0, '| stop_reason:', finalMsg.stop_reason);
    res.write('data: [DONE]\n\n');
    res.end();
    checkLowCreditsAndWarn(verifiedId, cost);

  } catch (err) {
    const status   = err.status  ?? 500;
    const errBody  = err.error   ?? null;
    const errMsg   = errBody?.message ?? err.message ?? 'Generation failed';

    console.error('[generate] error | toolId:', toolId, '| http status:', status, '| message:', err.message);
    console.error('[generate] err.error (full):', JSON.stringify(errBody, null, 2));
    if (userMessage) {
      console.error('[generate] userMessage that caused error:\n', userMessage);
    }

    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
      res.end();
    } else {
      res.status(status >= 400 && status < 600 ? status : 500).json({ error: errMsg });
    }
  }
}
