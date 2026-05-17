import OpenAI from 'openai';
import { applySecurityHeaders, verifyAuth, checkCredits, rateLimit } from './_security.js';

export const config = { maxDuration: 60 };

const IMAGE_CREDITS = 20;
const MAX_PROMPT_LENGTH = 5000;

// gpt-image-1 supported sizes
const SIZE_MAP = {
  '1584x396':  '1536x1024', // banner → landscape
  '1080x1080': '1024x1024', // square
  '1080x1350': '1024x1536', // portrait
};

const STYLE_SUFFIX = {
  photorealistic: 'photorealistic, ultra-detailed, professional photography, 4K',
  illustration:   'digital illustration, vibrant colors, artistic, clean lines',
  minimalist:     'minimalist design, white background, simple elegant shapes, clean',
  bold:           'bold graphic design, high contrast, vivid saturated colors, striking visual',
};

export default async function handler(req, res) {
  applySecurityHeaders(res);

  if (req.method !== 'POST') return res.status(405).end();

  if (!process.env.OPENAI_API_KEY) {
    console.error('[image] OPENAI_API_KEY not set');
    return res.status(500).json({ error: 'Image service not configured' });
  }

  const { prompt, style, size, userId } = req.body ?? {};

  // ── 1. Input presence + validation ────────────────────────────
  if (!prompt || !userId) {
    return res.status(400).json({ error: 'Missing prompt or userId' });
  }
  if (typeof prompt !== 'string' || prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({ error: 'Invalid prompt' });
  }

  // ── 2. Authentication ─────────────────────────────────────────
  const verifiedId = await verifyAuth(req, res, userId);
  if (!verifiedId) return;

  // ── 3. Rate limiting ──────────────────────────────────────────
  if (!rateLimit(res, verifiedId)) return;

  // ── 4. Server-side credit check ───────────────────────────────
  if (!(await checkCredits(res, verifiedId, IMAGE_CREDITS))) return;

  const keyPrefix = process.env.OPENAI_API_KEY.slice(0, 8);
  const imgSize   = SIZE_MAP[size] || '1024x1024';
  const styleDesc = STYLE_SUFFIX[style] || '';
  const fullPrompt = styleDesc ? `${prompt}. ${styleDesc}` : prompt;

  console.log('[image] key prefix:', keyPrefix, '| userId:', userId, '| size:', imgSize, '| style:', style, '| promptLength:', fullPrompt.length);

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: fullPrompt,
      n: 1,
      size: imgSize,
      quality: 'medium',
    });

    console.log('[image] raw response keys:', Object.keys(response));
    console.log('[image] data[0] keys:', Object.keys(response.data?.[0] ?? {}));

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      console.error('[image] No b64_json in response:', JSON.stringify(response));
      throw new Error('No image data in response');
    }

    console.log('[image] success | b64 length:', b64.length);
    res.json({ image: b64 });
  } catch (err) {
    const status  = err.status ?? 500;
    const errBody = err.error  ?? null;
    const errMsg  = errBody?.message ?? err.message ?? 'Image generation failed';

    console.error('[image] error | status:', status, '| key prefix:', keyPrefix);
    console.error('[image] err.message:', err.message);
    console.error('[image] err.error (full):', JSON.stringify(errBody, null, 2));
    console.error('[image] err.error.type:', errBody?.type);
    console.error('[image] err.error.code:', errBody?.code);
    console.error('[image] err.headers:', JSON.stringify(err.headers ?? null));

    res.status(status >= 400 && status < 600 ? status : 500).json({ error: errMsg });
  }
}
