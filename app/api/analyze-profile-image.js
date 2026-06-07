import Anthropic from '@anthropic-ai/sdk';
import { applySecurityHeaders, verifyAuth } from './_security.js';

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const { userId, imageBase64, mediaType = 'image/jpeg' } = req.body || {};

  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 required' });
  }

  const verifiedId = await verifyAuth(req, res, userId);
  if (!verifiedId) return;

  // Strip data URL prefix if present (e.g. "data:image/png;base64,...")
  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Data },
          },
          {
            type: 'text',
            text: `This is a screenshot of a LinkedIn profile. Extract and summarize the following information if visible:
- Full name and headline / job title
- About / summary section
- Current position and company
- Key skills or endorsements
- Recent posts or activity visible
- Education or certifications visible
- Any notable achievements or metrics mentioned

Be concise. Return plain text only, no markdown. Max 400 words.`,
          },
        ],
      }],
    });

    const profileSummary = message.content[0]?.text?.trim() || '';
    console.log('[analyze-profile-image] summary length:', profileSummary.length, '| userId:', verifiedId);
    return res.status(200).json({ profileSummary });
  } catch (err) {
    console.error('[analyze-profile-image] error:', err.message);
    return res.status(500).json({ error: 'Image analysis failed. Please try without the screenshot.' });
  }
}
