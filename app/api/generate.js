import Anthropic from '@anthropic-ai/sdk';

export const config = { maxDuration: 60 };

const SYSTEM_PROMPTS = {
  audit: `You are an expert SEO & CRO auditor. Analyze websites and return structured audit reports.
Use ✅ (good), ⚠️ (needs work), ❌ (critical) status indicators for each section.
For each issue, provide a specific "→ Action:" fix with concrete metrics where possible.
End with a numbered "PRIORITY ACTIONS" list of the top 3 fixes.
Format cleanly with clear section headers and dividers.`,

  compete: `You are a competitive intelligence expert for freelancers and small businesses.
Analyze competitor positioning, offer structure, keywords, content strategy, and weaknesses.
Provide specific, actionable intelligence — not generic advice.
End with a "YOUR MOVE" section with 2–3 concrete tactics to differentiate.
Format with clear sections: POSITIONING, OFFER STRUCTURE, KEYWORDS, CONTENT STRATEGY, WEAKNESSES TO EXPLOIT, YOUR MOVE.`,

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
Include: quote number, date, validity period (30 days), "From" and "To" sections, a formatted table of line items (description, qty, unit price, total), subtotal, VAT calculation, total, and payment terms.
Use the exact figures provided. Format for easy reading.
Output only the quote document.`,

  'linkedin-intel': `You are a LinkedIn growth strategist for freelancers and independent consultants.
Analyse the provided LinkedIn profile and return a structured intelligence report using EXACTLY these section markers:

[SECTION:PROFILE_AUDIT]
Audit the profile: headline, about section, experience, featured content, skills, photo. Use ✅ / ⚠️ / ❌ for each element. Provide specific improvement recommendations for each issue.

[SECTION:COMPETITOR_ANALYSIS]
Analyse the competitor profiles provided. Compare positioning, content strategy, engagement tactics, and differentiation opportunities. If no competitors provided, suggest 3 types of profiles to monitor in this niche.

[SECTION:HOT_TOPICS]
List 8–10 high-engagement topic areas for this niche with a brief rationale for each. Include content angles that are underserved.

[SECTION:CONTENT_PLAN]
Provide a 30-day LinkedIn content calendar. Group by week (Week 1–4). For each week: 3 post ideas with format (storytelling/opinion/tips/question) and hook line. Keep it actionable.

[SECTION:READY_POSTS]
Write 3 complete, ready-to-publish LinkedIn posts for this profile. Each post should use a different format. Apply the goal and niche provided. Output only the posts separated by "---".

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
Provide a 10-point profile optimisation checklist covering: LinkedIn headline formula, About section structure, experience bullet points, featured section, skills & endorsements, keywords to use, portfolio/projects, recommendations, profile URL, and activity signal. Use ✅ / ⚠️ / ❌ for priority.

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
  audit:              1000,
  compete:            1000,
  legal:              1500,
  contract:           1500,
  'linkedin-content':  600,
  devis:               800,
  'linkedin-intel':   4096,
  prospection:        1200,
  'mission-finder':   2000,
};

function buildUserMessage(toolId, input) {
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
        ? input.lines.filter(l => l.desc).map(l => `- ${l.desc}: qty ${l.qty || 1} × €${l.price || 0}`).join('\n')
        : '';
      return `Client: ${input.clientName}${input.clientCompany ? ` (${input.clientCompany})` : ''}
${input.clientEmail ? `Email: ${input.clientEmail}` : ''}

Services:
${lines || '(no line items provided)'}

VAT rate: ${input.vatRate || '0%'}
Payment terms: ${input.paymentTerms || 'Net 30 days'}
${input.notes ? `Notes: ${input.notes}` : ''}

Generate a professional quote document.`;
    }

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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[generate] ANTHROPIC_API_KEY not set');
    return res.status(500).json({ error: 'AI service not configured' });
  }

  const { toolId, input, userId, lang } = req.body ?? {};
  if (!toolId || !input || !userId) {
    return res.status(400).json({ error: 'Missing toolId, input, or userId' });
  }

  const basePrompt = SYSTEM_PROMPTS[toolId];
  if (!basePrompt) {
    return res.status(400).json({ error: `Unknown tool: ${toolId}` });
  }
  const langInstruction = lang === 'fr' ? '\n\nAlways respond in French.' : '\n\nAlways respond in English.';
  const systemPrompt = basePrompt + langInstruction;

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
    const userContent = (toolId === 'linkedin-intel' && input.imageBase64)
      ? [
          { type: 'image', source: { type: 'base64', media_type: input.imageMediaType || 'image/jpeg', data: input.imageBase64 } },
          { type: 'text', text: userMessage },
        ]
      : userMessage;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: MAX_TOKENS[toolId] ?? 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });

    const output = message.content[0]?.text ?? '';
    console.log('[generate] success | output length:', output.length, '| stop_reason:', message.stop_reason);

    res.json({ output });
  } catch (err) {
    const status   = err.status  ?? 500;
    const errBody  = err.error   ?? null;
    const errMsg   = errBody?.message ?? err.message ?? 'Generation failed';

    console.error('[generate] error | toolId:', toolId, '| http status:', status, '| message:', err.message);
    console.error('[generate] err.error (full):', JSON.stringify(errBody, null, 2));
    if (userMessage) {
      console.error('[generate] userMessage that caused error:\n', userMessage);
    }

    res.status(status >= 400 && status < 600 ? status : 500).json({ error: errMsg });
  }
}
