import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, userEmail } = req.body ?? {};
  if (!userId || !userEmail) {
    return res.status(400).json({ error: 'Missing userId or userEmail' });
  }

  const missing = [];
  if (!process.env.STRIPE_SECRET_KEY)         missing.push('STRIPE_SECRET_KEY');
  if (!process.env.SUPABASE_URL)              missing.push('SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) {
    console.error('[cancel-subscription] missing env vars:', missing.join(', '));
    return res.status(500).json({ error: `Missing env vars: ${missing.join(', ')}` });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Find Stripe customer by email
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (!customers.data.length) {
      console.log('[cancel-subscription] no Stripe customer for', userEmail);
      return res.status(404).json({ error: 'No active subscription found' });
    }
    const customerId = customers.data[0].id;

    // Find active subscription
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
    if (!subs.data.length) {
      console.log('[cancel-subscription] no active subscription for customer', customerId);
      return res.status(404).json({ error: 'No active subscription found' });
    }
    const sub = subs.data[0];

    // Cancel at period end
    await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
    console.log('[cancel-subscription] set cancel_at_period_end for sub', sub.id);

    // Format access-until date from current_period_end
    const d = new Date(sub.current_period_end * 1000);
    const cancelAt = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

    // Update profile in Supabase
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ plan: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (dbError) {
      console.error('[cancel-subscription] profiles update error:', JSON.stringify(dbError));
    } else {
      console.log('[cancel-subscription] profiles.plan set to cancelled for user', userId);
    }

    res.json({ success: true, cancelAt });
  } catch (err) {
    console.error('[cancel-subscription] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
