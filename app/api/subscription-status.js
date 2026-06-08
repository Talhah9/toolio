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

    // Prefer JWT auth; fall back to body params for backwards compat
    let userId = req.body?.userId;
    let userEmail = req.body?.userEmail;
    const jwt = req.headers.authorization?.replace('Bearer ', '');
    if (jwt) {
      const { data: { user } } = await supabase.auth.getUser(jwt).catch(() => ({ data: {} }));
      if (user?.id) { userId = user.id; userEmail = user.email; }
    }

    if (!userId && !userEmail) return res.status(400).json({ error: 'Missing userId or userEmail' });

    // Resolve Stripe customer: profiles.stripe_customer_id first, email fallback
    let customerId = null;
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id, email')
        .eq('id', userId)
        .maybeSingle();

      customerId = profile?.stripe_customer_id ?? null;
      if (!customerId) {
        const email = profile?.email || userEmail;
        if (email) {
          const customers = await stripe.customers.list({ email, limit: 1 });
          customerId = customers.data[0]?.id ?? null;
          if (customerId) {
            await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);
            console.log('[subscription-status] stripe_customer_id persisted for user', userId);
          }
        }
      }
    } else if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      customerId = customers.data[0]?.id ?? null;
    }

    if (!customerId) return res.json({ renewalDate: null, cancelAt: null, isCancelling: false });

    const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    const nowSec = Math.floor(Date.now() / 1000);

    // Only active subs with a future period_end; pick the one furthest into the future
    const activeSubs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 10 });
    const validActive = activeSubs.data
      .filter(s => s.current_period_end > nowSec)
      .sort((a, b) => b.current_period_end - a.current_period_end);

    console.log('[subscription-status] active subs:', activeSubs.data.length, 'valid:', validActive.length,
      validActive.map(s => ({ id: s.id, period_end: s.current_period_end, cancel_at_period_end: s.cancel_at_period_end })));

    if (validActive.length) {
      const sub = validActive[0];
      const periodEnd = new Date(sub.current_period_end * 1000);
      if (sub.cancel_at_period_end) {
        const cancelTs = sub.cancel_at ? sub.cancel_at * 1000 : sub.current_period_end * 1000;
        return res.json({ renewalDate: null, cancelAt: fmt(new Date(cancelTs)), isCancelling: true });
      }
      return res.json({ renewalDate: fmt(periodEnd), cancelAt: null, isCancelling: false });
    }

    // No active sub — check recently canceled (still within paid period)
    const cancelledSubs = await stripe.subscriptions.list({ customer: customerId, status: 'canceled', limit: 10 });
    const activeCancelled = cancelledSubs.data
      .filter(s => s.current_period_end > nowSec)
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
