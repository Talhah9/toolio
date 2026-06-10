import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 10 };

const SKIP_PREFIXES = ['/admin', '/api'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { path, referrer } = req.body ?? {};
  if (!path || typeof path !== 'string') return res.status(400).json({ error: 'Missing path' });

  if (SKIP_PREFIXES.some(p => path.startsWith(p))) return res.json({ ok: true });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Missing env vars' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    await supabase.from('page_views').insert({
      path: path.slice(0, 500),
      referrer: referrer ? String(referrer).slice(0, 500) : null,
      user_agent: req.headers['user-agent']?.slice(0, 300) ?? null,
      country: req.headers['x-vercel-ip-country'] ?? null,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[track-visit] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
