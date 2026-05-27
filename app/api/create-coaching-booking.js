import { createClient } from '@supabase/supabase-js';
import { verifyAuth, applySecurityHeaders } from './_security.js';

export const config = { maxDuration: 10 };

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, theme, description, phone, pdfUrl } = req.body ?? {};

  if (!userId || !theme || !description || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const verifiedId = await verifyAuth(req, res, userId);
  if (!verifiedId) return;

  const admin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data: booking, error } = await admin
    .from('coaching_bookings')
    .insert({
      user_id: userId,
      theme,
      description: description.trim(),
      phone: phone.trim(),
      pdf_url: pdfUrl ?? null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[create-coaching-booking] insert error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json({ id: booking.id });
}
