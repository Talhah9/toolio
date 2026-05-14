import OpenAI from 'openai';

export const config = { maxDuration: 60 };

// DALL-E 3 only supports these three sizes
const SIZE_MAP = {
  '1584x396':  '1792x1024', // banner → landscape (closest available)
  '1080x1080': '1024x1024', // square → exact
  '1080x1350': '1024x1792', // portrait → exact
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

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const dalleSize = SIZE_MAP[size] || '1024x1024';
    const styleDesc = STYLE_SUFFIX[style] || '';
    const fullPrompt = styleDesc ? `${prompt}. ${styleDesc}` : prompt;

    console.log('[image] userId:', userId, '| size:', dalleSize, '| style:', style);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: fullPrompt,
      n: 1,
      size: dalleSize,
      quality: 'standard',
    });

    const url = response.data[0]?.url;
    if (!url) throw new Error('No image URL in DALL-E response');

    console.log('[image] success');
    res.json({ url });
  } catch (err) {
    console.error('[image] Error:', err.message);
    res.status(500).json({ error: err.message || 'Image generation failed' });
  }
}
