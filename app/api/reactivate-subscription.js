import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from './_security.js';

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, userEmail } = req.body ?? {};
  if (!userId || !userEmail) return res.status(400).json({ error: 'Missing userId or userEmail' });

  if (!await verifyAuth(req, res, userId)) return;

  const missing = [];
  if (!process.env.STRIPE_SECRET_KEY)         missing.push('STRIPE_SECRET_KEY');
  if (!process.env.SUPABASE_URL)              missing.push('SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) return res.status(500).json({ error: `Missing env vars: ${missing.join(', ')}` });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .maybeSingle();
    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      customerId = customers.data[0]?.id;
      if (customerId) {
        await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);
        console.log('[reactivate] stripe_customer_id persisted for user', userId);
      }
    }
    if (!customerId) {
      return res.status(404).json({ error: 'No Stripe customer found' });
    }

    // Active subscription with cancel_at_period_end=true — can be reversed
    const activeSubs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
    if (activeSubs.data.length && activeSubs.data[0].cancel_at_period_end) {
      const updated = await stripe.subscriptions.update(activeSubs.data[0].id, { cancel_at_period_end: false });
      console.log('[reactivate] Stripe subscription reactivated:', activeSubs.data[0].id);
      await supabase.from('profiles').update({ cancel_at: null }).eq('id', userId);
      const fmt = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      const renewalDate = fmt(new Date(updated.current_period_end * 1000));
      return res.json({ success: true, renewalDate });
    }

    // No active subscription (schedule-cancelled) — can't reactivate, redirect to pricing
    console.log('[reactivate] No active cancellable subscription — redirecting to pricing');
    return res.json({ success: false, redirectToPricing: true });
  } catch (err) {
    console.error('[reactivate-subscription] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
