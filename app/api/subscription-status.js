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
    let profile = null;
    if (userId) {
      const { data: _profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id, email, cancel_at')
        .eq('id', userId)
        .maybeSingle();
      profile = _profile;

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

    const fmt = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    if (!customerId) {
      const dbCancelAt = profile?.cancel_at ? new Date(profile.cancel_at) : null;
      if (dbCancelAt && dbCancelAt.getTime() > Date.now()) {
        return res.json({ renewalDate: null, cancelAt: fmt(dbCancelAt), isCancelling: true });
      }
      return res.json({ renewalDate: null, cancelAt: null, isCancelling: false });
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const minSec = nowSec + 86400; // must have > 24 h remaining

    const SAVVLY_PRICE_IDS = new Set([
      'price_1TWwVeAFTm9a9DATGNn4FO2g', // Pro EUR 49€
      'price_1TbG6eAFTm9a9DATlWDutoHI', // Pro first month 15€
      'price_1TYNvyAFTm9a9DATmtwE5E3a', // Pro USD $54
      'price_1TbG7JAFTm9a9DATFk8BiFSv', // Pro first month $17
    ]);

    const allSubs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 });

    console.log('[subscription-status] all subs for', customerId, ':', allSubs.data.map(s => ({
      id: s.id,
      status: s.status,
      period_end: new Date(s.current_period_end * 1000).toISOString(),
      prices: s.items.data.map(i => i.price.id),
    })));

    const isSavvlySub = (s) => s.items.data.some(i => SAVVLY_PRICE_IDS.has(i.price.id));

    // Active/trialing, future period_end (>24 h), Savvly price only
    const validActive = allSubs.data
      .filter(s => (s.status === 'active' || s.status === 'trialing') && s.current_period_end > minSec && isSavvlySub(s))
      .sort((a, b) => b.current_period_end - a.current_period_end);

    console.log('[subscription-status] valid savvly subs:', validActive.map(s => s.id));

    if (validActive.length) {
      const sub = validActive[0];
      const periodEnd = new Date(sub.current_period_end * 1000);
      if (sub.cancel_at_period_end) {
        const cancelTs = sub.cancel_at ? sub.cancel_at * 1000 : sub.current_period_end * 1000;
        return res.json({ renewalDate: null, cancelAt: fmt(new Date(cancelTs)), isCancelling: true });
      }
      return res.json({ renewalDate: fmt(periodEnd), cancelAt: null, isCancelling: false });
    }

    // No active Savvly sub — check recently canceled (still within paid period)
    const activeCancelled = allSubs.data
      .filter(s => s.status === 'canceled' && s.current_period_end > nowSec && isSavvlySub(s))
      .sort((a, b) => b.current_period_end - a.current_period_end);
    if (activeCancelled.length) {
      const sub = activeCancelled[0];
      const cancelTs = sub.cancel_at ? sub.cancel_at * 1000 : sub.current_period_end * 1000;
      return res.json({ renewalDate: null, cancelAt: fmt(new Date(cancelTs)), isCancelling: true });
    }

    // Last resort: use DB cancel_at if it's still in the future (survives customer migrations)
    const dbCancelAt = userId && profile?.cancel_at ? new Date(profile.cancel_at) : null;
    if (dbCancelAt && dbCancelAt.getTime() > Date.now()) {
      const cancelAtStr = fmt(dbCancelAt);
      console.log('[subscription-status] falling back to DB cancel_at for', customerId, '→', cancelAtStr);
      return res.json({ renewalDate: null, cancelAt: cancelAtStr, isCancelling: true });
    }

    console.log('[subscription-status] no valid Savvly sub for', customerId);
    return res.json({ renewalDate: null, cancelAt: null, isCancelling: false });
  } catch (err) {
    console.error('[subscription-status] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
