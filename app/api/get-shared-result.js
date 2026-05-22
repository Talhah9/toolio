import { createClient } from '@supabase/supabase-js';
import { applySecurityHeaders } from './_security.js';

export default async function handler(req, res) {
  applySecurityHeaders(res);

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const url  = process.env.SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(500).json({ error: 'Server not configured' });

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from('generations')
    .select('id, tool_id, output, name, created_at')
    .eq('id', id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Not found' });

  return res.status(200).json(data);
}
