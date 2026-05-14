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
  audit:              1800,
  compete:            1800,
  legal:              4000,
  contract:           2000,
  'linkedin-content': 1000,
  devis:              1000,
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

  const { toolId, input, userId } = req.body ?? {};
  if (!toolId || !input || !userId) {
    return res.status(400).json({ error: 'Missing toolId, input, or userId' });
  }

  const systemPrompt = SYSTEM_PROMPTS[toolId];
  if (!systemPrompt) {
    return res.status(400).json({ error: `Unknown tool: ${toolId}` });
  }

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

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: MAX_TOKENS[toolId] ?? 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
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
