import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const missing = [];
  if (!process.env.STRIPE_SECRET_KEY)         missing.push('STRIPE_SECRET_KEY');
  if (!process.env.SUPABASE_URL)              missing.push('SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.RESEND_API_KEY)            missing.push('RESEND_API_KEY');
  if (missing.length) return res.status(500).json({ error: `Missing env vars: ${missing.join(', ')}` });

  const { firstName, lastName, phone, description } = req.body ?? {};
  if (!phone || !description) return res.status(400).json({ error: 'Missing phone or description' });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Resolve user from JWT
    const jwt = req.headers.authorization?.replace('Bearer ', '');
    if (!jwt) return res.status(401).json({ error: 'Missing authorization' });
    const { data: { user } } = await supabase.auth.getUser(jwt);
    if (!user?.id) return res.status(401).json({ error: 'Invalid token' });

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, stripe_customer_id, email, coaching_claimed')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.plan !== 'pro') return res.status(403).json({ error: 'Pro plan required' });
    if (profile.coaching_claimed) return res.status(409).json({ error: 'Coaching already claimed' });

    // Verify 60-day eligibility
    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: profile.email || user.email, limit: 1 });
      customerId = customers.data[0]?.id ?? null;
    }
    if (!customerId) return res.status(403).json({ error: 'No Stripe customer found' });

    const charges = await stripe.charges.list({ customer: customerId, limit: 100 });
    const firstCharge = charges.data
      .filter(c => c.paid && c.amount > 0)
      .sort((a, b) => a.created - b.created)[0];

    if (!firstCharge) return res.status(403).json({ error: 'No payment found' });

    const daysSince = Math.floor((Date.now() / 1000 - firstCharge.created) / 86400);
    if (daysSince < 60) return res.status(403).json({ error: `Not yet eligible — ${60 - daysSince} days remaining` });

    const email = profile.email || user.email;

    // Send notification email to admin
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Savvly <hello@savvly.co>',
        reply_to: email,
        to: ['talhahally974@gmail.com'],
        subject: '🎯 Nouvelle demande de coaching gratuit — Savvly',
        html: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <h2 style="color: #4F46E5;">Nouvelle demande de coaching gratuit</h2>
  <table style="width:100%; border-collapse: collapse;">
    <tr><td style="padding: 8px 0; color: #6B7280;">Prénom</td><td><strong>${firstName || '—'}</strong></td></tr>
    <tr><td style="padding: 8px 0; color: #6B7280;">Nom</td><td><strong>${lastName || '—'}</strong></td></tr>
    <tr><td style="padding: 8px 0; color: #6B7280;">Email</td><td><strong>${email}</strong></td></tr>
    <tr><td style="padding: 8px 0; color: #6B7280;">Téléphone</td><td><strong>${phone}</strong></td></tr>
    <tr><td style="padding: 8px 0; color: #6B7280;">Objectif</td><td><strong>${description}</strong></td></tr>
    <tr><td style="padding: 8px 0; color: #6B7280;">Membre depuis</td><td><strong>${daysSince} jours</strong></td></tr>
  </table>
</div>`,
      }),
    }).catch(e => console.error('[claim-coaching] email error:', e.message));

    // Mark coaching as claimed
    await supabase.from('profiles').update({ coaching_claimed: true }).eq('id', user.id);

    return res.json({ success: true });
  } catch (err) {
    console.error('[claim-coaching] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
