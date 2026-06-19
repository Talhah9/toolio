import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

    // Resolve user from JWT
    const jwt = req.headers.authorization?.replace('Bearer ', '');
    if (!jwt) return res.status(401).json({ error: 'Missing authorization' });
    const { data: { user } } = await supabase.auth.getUser(jwt);
    if (!user?.id) return res.status(401).json({ error: 'Invalid token' });

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, stripe_customer_id, email, coaching_claimed, subscription_started_at')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.plan !== 'pro') {
      return res.json({ eligible: false, coaching_claimed: false, days_since_first_payment: 0, days_remaining: 60 });
    }

    if (profile.coaching_claimed) {
      return res.json({ eligible: false, coaching_claimed: true, days_since_first_payment: 999, days_remaining: 0 });
    }

    // Prefer the canonical start date stored in profiles (immune to Stripe customer changes)
    if (profile.subscription_started_at) {
      const startTs = new Date(profile.subscription_started_at).getTime() / 1000;
      const daysSince = Math.floor((Date.now() / 1000 - startTs) / 86400);
      const daysRemaining = Math.max(0, 60 - daysSince);
      const eligible = daysSince >= 60;
      console.log('[coaching-eligibility] using subscription_started_at:', { userId: user.id, subscription_started_at: profile.subscription_started_at, daysSince });
      return res.json({ eligible, coaching_claimed: false, days_since_first_payment: daysSince, days_remaining: daysRemaining });
    }

    // Fallback: derive start date from first successful Stripe charge
    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: profile.email || user.email, limit: 1 });
      customerId = customers.data[0]?.id ?? null;
    }
    if (!customerId) {
      return res.json({ eligible: false, coaching_claimed: false, days_since_first_payment: 0, days_remaining: 60 });
    }

    const charges = await stripe.charges.list({ customer: customerId, limit: 100 });
    const firstCharge = charges.data
      .filter(c => c.paid && c.amount > 0)
      .sort((a, b) => a.created - b.created)[0];

    if (!firstCharge) {
      return res.json({ eligible: false, coaching_claimed: false, days_since_first_payment: 0, days_remaining: 60 });
    }

    const daysSince = Math.floor((Date.now() / 1000 - firstCharge.created) / 86400);
    const daysRemaining = Math.max(0, 60 - daysSince);
    const eligible = daysSince >= 60;

    // Persist start date so future customer changes don't reset the clock
    await supabase
      .from('profiles')
      .update({ subscription_started_at: new Date(firstCharge.created * 1000).toISOString() })
      .eq('id', user.id);

    console.log('[coaching-eligibility] derived from Stripe, saved subscription_started_at:', { userId: user.id, firstChargeDate: new Date(firstCharge.created * 1000).toISOString(), daysSince });
    return res.json({ eligible, coaching_claimed: false, days_since_first_payment: daysSince, days_remaining: daysRemaining });
  } catch (err) {
    console.error('[coaching-eligibility] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
