import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 10 };

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { generationId, userId } = req.body ?? {};
  if (!generationId || !userId) {
    return res.status(400).json({ error: 'Missing generationId or userId' });
  }

  const { data: current, error: fetchErr } = await supabase
    .from('generations')
    .select('saved')
    .eq('id', generationId)
    .eq('user_id', userId)
    .single();

  if (fetchErr) return res.status(404).json({ error: 'Generation not found' });

  const { data, error } = await supabase
    .from('generations')
    .update({ saved: !current.saved })
    .eq('id', generationId)
    .eq('user_id', userId)
    .select('saved')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ saved: data.saved });
}
