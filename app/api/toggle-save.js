import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 10 };

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { generationId, userId, name } = req.body ?? {};
  if (!generationId || !userId) {
    return res.status(400).json({ error: 'Missing generationId or userId' });
  }

  console.log('[toggle-save] generationId:', generationId, '| userId:', userId, '| name:', name);

  const { data: current, error: fetchErr } = await supabase
    .from('generations')
    .select('saved')
    .eq('id', generationId)
    .eq('user_id', userId)
    .single();

  if (fetchErr) {
    console.error('[toggle-save] fetch error:', fetchErr.message, fetchErr.code);
    return res.status(404).json({ error: 'Generation not found', detail: fetchErr.message });
  }

  console.log('[toggle-save] current saved:', current.saved);

  const newSaved = !current.saved;
  const updateData = { saved: newSaved };
  if (newSaved && name) updateData.name = name;

  console.log('[toggle-save] updating to:', updateData);

  const { data, error } = await supabase
    .from('generations')
    .update(updateData)
    .eq('id', generationId)
    .eq('user_id', userId)
    .select('saved, name')
    .single();

  if (error) {
    console.error('[toggle-save] update error:', error.message, error.code);
    return res.status(500).json({ error: error.message });
  }

  console.log('[toggle-save] success | saved:', data.saved, '| name:', data.name);
  res.json({ saved: data.saved, name: data.name ?? null });
}
