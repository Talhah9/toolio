import OpenAI from 'openai';

export const config = { maxDuration: 60 };

// DALL-E 3 supports exactly these three sizes
const SIZE_MAP = {
  '1584x396':  '1792x1024',
  '1080x1080': '1024x1024',
  '1080x1350': '1024x1792',
};

const STYLE_SUFFIX = {
  photorealistic: 'photorealistic, ultra-detailed, professional photography, 4K',
  illustration:   'digital illustration, vibrant colors, artistic, clean lines',
  minimalist:     'minimalist design, white background, simple elegant shapes, clean',
  bold:           'bold graphic design, high contrast, vivid saturated colors, striking visual',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!process.env.OPENAI_API_KEY) {
    console.error('[image] OPENAI_API_KEY not set');
    return res.status(500).json({ error: 'Image service not configured' });
  }

  const { prompt, style, size, userId } = req.body ?? {};
  if (!prompt || !userId) {
    return res.status(400).json({ error: 'Missing prompt or userId' });
  }

  const keyPrefix = process.env.OPENAI_API_KEY.slice(0, 8);
  console.log('[image] key prefix:', keyPrefix, '| userId:', userId, '| size:', size, '| style:', style);

  const dalleSize = SIZE_MAP[size] || '1024x1024';
  const styleDesc = STYLE_SUFFIX[style] || '';
  const fullPrompt = styleDesc ? `${prompt}. ${styleDesc}` : prompt;

  console.log('[image] dalleSize:', dalleSize, '| promptLength:', fullPrompt.length);

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: fullPrompt,
      n: 1,
      size: dalleSize,
      quality: 'standard',
    });

    const url = response.data?.[0]?.url;
    if (!url) {
      console.error('[image] No URL in response:', JSON.stringify(response));
      throw new Error('No image URL in DALL-E response');
    }

    console.log('[image] success');
    res.json({ url });
  } catch (err) {
    // OpenAI SDK wraps API errors as APIError with .status and .error
    const status  = err.status ?? 500;
    const errBody = err.error  ?? null;
    const errMsg  = errBody?.message ?? err.message ?? 'Image generation failed';

    console.error('[image] OpenAI error | status:', status, '| key prefix:', keyPrefix);
    console.error('[image] err.message:', err.message);
    console.error('[image] err.error (full):', JSON.stringify(errBody, null, 2));
    console.error('[image] err.error.type:', errBody?.type);
    console.error('[image] err.error.code:', errBody?.code);
    console.error('[image] err.error.param:', errBody?.param);
    console.error('[image] err.headers:', JSON.stringify(err.headers ?? null));

    res.status(status >= 400 && status < 600 ? status : 500).json({ error: errMsg });
  }
}
