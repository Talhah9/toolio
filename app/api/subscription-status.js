import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 30 };

// Resolves a Stripe customer ID for a user.
// Primary: stripe_customer_id column in profiles (never changes even if email changes).
// Fallback: search Stripe by email, then persist the found ID back to DB.
async function resolveCustomerId(stripe, supabase, userId, userEmail) {
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.stripe_customer_id) {
      return profile.stripe_customer_id;
    }

    // Not stored yet — search by email and persist for future calls
    const email = profile?.email || userEmail;
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      const customerId = customers.data[0]?.id;
      if (customerId) {
        await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);
        console.log('[subscription-status] stripe_customer_id persisted for user', userId);
        return customerId;
      }
    }
    return null;
  }

  // No userId — last resort email-only search
  if (userEmail) {
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    return customers.data[0]?.id || null;
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, userEmail } = req.body ?? {};
  if (!userId && !userEmail) return res.status(400).json({ error: 'Missing userId or userEmail' });

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

    const customerId = await resolveCustomerId(stripe, supabase, userId, userEmail);
    if (!customerId) return res.json({ renewalDate: null, cancelAt: null, isCancelling: false });

    const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

    // Fetch all active subscriptions and pick the one with the latest period end.
    // A customer may have an old promo sub (period_end June 1) alongside a renewed
    // normal-price sub (period_end July 1) — always use the most current one.
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 5 });
    if (subs.data.length) {
      const sub = subs.data.sort((a, b) => b.current_period_end - a.current_period_end)[0];
      const periodEnd = new Date(sub.current_period_end * 1000);
      if (sub.cancel_at_period_end) {
        const cancelTs = sub.cancel_at ? sub.cancel_at * 1000 : sub.current_period_end * 1000;
        return res.json({ renewalDate: null, cancelAt: fmt(new Date(cancelTs)), isCancelling: true });
      }
      return res.json({ renewalDate: fmt(periodEnd), cancelAt: null, isCancelling: false });
    }

    // No active sub — check recently cancelled (still within paid period)
    const cancelledSubs = await stripe.subscriptions.list({ customer: customerId, status: 'canceled', limit: 5 });
    const activeCancelled = cancelledSubs.data
      .filter(s => s.current_period_end * 1000 > Date.now())
      .sort((a, b) => b.current_period_end - a.current_period_end);
    if (activeCancelled.length) {
      const sub = activeCancelled[0];
      const cancelTs = sub.cancel_at ? sub.cancel_at * 1000 : sub.current_period_end * 1000;
      return res.json({ renewalDate: null, cancelAt: fmt(new Date(cancelTs)), isCancelling: true });
    }

    return res.json({ renewalDate: null, cancelAt: null, isCancelling: false });
  } catch (err) {
    console.error('[subscription-status] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
