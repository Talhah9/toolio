import Anthropic from '@anthropic-ai/sdk';
import { applySecurityHeaders, verifyAuth, checkCredits, rateLimit } from './_security.js';

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

const COMPLETION_INSTRUCTION = '\n\nAlways complete your response fully. Never truncate mid-sentence or mid-section. Output all requested sections even if they are brief.';

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

ANALYZE ONLY THIS CONTENT. Do not invent, assume or add information not present in these tags.
If a piece of information is not in the content, say "Not visible on site" instead of guessing.
Quote specific phrases from the site when possible to prove your analysis is grounded in reality.

STRICT RULES:
1. ONLY analyze what is inside the <WEBSITE_CONTENT> tags — nothing else
2. Do NOT use generic industry information, SEO trends, or assumptions about the sector
3. Do NOT invent services, keywords, or positioning that are not explicitly found in the content
4. If you cannot find specific information, write "Not visible on site" — never fabricate
5. Every claim must come directly from the website content, with a quoted phrase as evidence
6. Focus exclusively on: homepage copy, services/offer, pricing, positioning language
7. If web search returns unrelated articles or generic results, IGNORE them — focus only on the provided content

Start your response with [SCORE:XX] on its own line (0-100 threat score based ONLY on what you actually found).
Format with clear sections: POSITIONING, OFFER STRUCTURE, KEYWORDS, CONTENT STRATEGY, WEAKNESSES TO EXPLOIT, YOUR MOVE.
End with a "YOUR MOVE" section with 2-3 concrete, specific tactics to differentiate from this particular competitor.`,

  legal: `You are a legal expert specialising in French and international business law for freelancers and small businesses.
Generate complete, ready-to-use legal documents — not templates with placeholders.
Include all legally required clauses for the jurisdiction specified.
Structure each document with numbered sections and a clear title.
Write in professional but accessible language.`,

  contract: `You are a freelance contract specialist. Generate complete, professional service agreements.
Include all standard clauses: parties, scope of work, deliverables, timeline, compensation, payment schedule, revisions policy, intellectual property, confidentiality, termination, governing law, and signature blocks.
Use the specific details provided — do not leave placeholder text.
Format clearly with numbered sections.`,

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

const MAX_TOKENS = {
  audit:              2500,
  compete:            3000,
  legal:              3500,
  contract:           3500,
  'linkedin-content':  600,
  devis:               800,
  relance:             400,
  'linkedin-intel':   4000,
  prospection:        1200,
  'mission-finder':   3500,
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

Provide a complete competitive analysis.`;
    }

    case 'legal': {
      const DOC_LABELS = {
        tos:     'Terms of Service',
        privacy: 'Privacy Policy',
        notice:  'Legal Notice',
        cookies: 'Cookie Policy',
      };
      const docList = Array.isArray(input.docs) && input.docs.length > 0
        ? input.docs.map(d => DOC_LABELS[d] ?? d).join(', ')
        : 'Terms of Service, Privacy Policy';
      return `Company name: ${input.company}
Business type: ${input.type || 'not specified'}
Country/jurisdiction: ${input.country || 'not specified'}
Address: ${input.address || 'not specified'}
Business activity: ${input.activity || 'not specified'}
Documents needed: ${docList}

Generate the complete requested legal documents.`;
    }

    case 'contract':
      return `Client name: ${input.client}
Client company: ${input.clientCompany || 'N/A'}
Mission: ${input.mission}
Rate: ${input.rate ? `€${input.rate} ${input.rateType}` : 'not specified'}
Duration: ${input.duration ? `${input.duration} ${input.durationUnit}` : 'not specified'}
Deliverables: ${input.deliverables || 'as described in mission'}
Payment terms: ${input.paymentTerms || '30 days'}

Generate a complete freelance service agreement.`;

    case 'linkedin-content':
      return `Topic: ${input.topic}
Tone: ${input.tone}
Format: ${input.format}

Write a LinkedIn post.`;

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

${input.imageBase64 ? 'A screenshot of the LinkedIn profile has been attached.' : 'No profile screenshot provided.'}

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

  // ── 2. toolId whitelist ───────────────────────────────────────
  if (!KNOWN_TOOLS.has(toolId)) {
    return res.status(400).json({ error: `Unknown tool: ${toolId}` });
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

  const basePrompt = SYSTEM_PROMPTS[toolId];

  const FORMAT_INSTRUCTION = '\n\nFormatting rules: Use ## headings to separate major sections. Use bullet points for lists. Use markdown tables where data has multiple dimensions. Be specific and actionable — include real names, numbers, percentages, and concrete examples. Avoid generic advice.';
  const DETAIL_INSTRUCTION = (toolId === 'audit' || toolId === 'compete') ? '\n\nInclude specific numbers, percentages, and concrete examples wherever possible.' : '';
  const calloutInstruction = (toolId === 'audit' || toolId === 'compete' || toolId === 'linkedin-intel') ? CALLOUT_INSTRUCTION : '';
  const langInstruction = lang === 'fr' ? '\n\nAlways respond in French.' : '\n\nAlways respond in English.';
  const systemPrompt = basePrompt + FORMAT_INSTRUCTION + DETAIL_INSTRUCTION + calloutInstruction + ASCII_INSTRUCTION + COMPLETION_INSTRUCTION + langInstruction;

  let userMessage;
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    userMessage = buildUserMessage(toolId, input);

    console.log('[generate] toolId:', toolId, '| userId:', userId, '| max_tokens:', MAX_TOKENS[toolId] ?? 2048, '| prompt length:', userMessage.length);

    // Extra diagnostic logging for the legal tool
    if (toolId === 'legal') {
      console.log('[generate] legal raw input:', JSON.stringify(input));
      console.log('[generate] legal userMessage:\n', userMessage);
    }
    if (toolId === 'linkedin-intel') {
      console.log('[generate] linkedin-intel max_tokens:', MAX_TOKENS[toolId]);
    }

    // Vision support for linkedin-intel: attach image when screenshot is provided
    let userContent = (toolId === 'linkedin-intel' && input.imageBase64)
      ? [
          { type: 'image', source: { type: 'base64', media_type: input.imageMediaType || 'image/jpeg', data: input.imageBase64 } },
          { type: 'text', text: userMessage },
        ]
      : userMessage;

    // For compete: pre-fetch the competitor page and inject its content as primary source.
    // On failure (anti-bot, timeout, etc.) fall back to web search — do NOT hard-error here.
    let competePageFetched = false;
    if (toolId === 'compete' && input.competitorUrl) {
      const pageContent = await fetchPageContent(input.competitorUrl);
      if (pageContent && pageContent.length >= 100) {
        console.log('[generate] page fetch ok | url:', input.competitorUrl, '| chars:', pageContent.length);
        userContent = `<WEBSITE_CONTENT>\n${pageContent}\n</WEBSITE_CONTENT>\n\n${userContent}`;
        competePageFetched = true;
      } else {
        console.log('[generate] page fetch failed or too short | url:', input.competitorUrl, '| chars:', pageContent?.length ?? 0, '— will rely on web search');
      }
    }

    // Set SSE headers before starting the stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // compete, audit, and linkedin-intel: try web search first, fall back to regular stream
    if (toolId === 'compete' || toolId === 'audit' || toolId === 'linkedin-intel') {
      let webText = null;
      try {
        webText = await runWithWebSearch(anthropic, systemPrompt, userContent, MAX_TOKENS[toolId] ?? 2048);
        console.log('[generate] web_search success | toolId:', toolId, '| output length:', webText?.length ?? 0);
      } catch (wsErr) {
        console.error('[generate] web_search failed | toolId:', toolId, '|', wsErr.message);
      }

      if (webText) {
        const CHUNK = 40;
        for (let i = 0; i < webText.length; i += CHUNK) {
          res.write(`data: ${JSON.stringify({ text: webText.slice(i, i + CHUNK) })}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      // Both fetch and web search failed for compete — surface an error via SSE
      if (toolId === 'compete' && !competePageFetched) {
        res.write(`data: ${JSON.stringify({ error: 'Unable to fetch site content. Please try again.' })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
      // audit / linkedin-intel (or compete with page content) — fall through to regular stream
    }

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: MAX_TOKENS[toolId] ?? 2048,
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
