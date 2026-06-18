import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from './_security.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, userEmail } = req.body ?? {};
  if (!userId || !userEmail) {
    return res.status(400).json({ error: 'Missing userId or userEmail' });
  }

  if (!await verifyAuth(req, res, userId)) return;

  const missing = [];
  if (!process.env.STRIPE_SECRET_KEY)         missing.push('STRIPE_SECRET_KEY');
  if (!process.env.SUPABASE_URL)              missing.push('SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) {
    console.error('[delete-account] missing env vars:', missing.join(', '));
    return res.status(500).json({ error: `Missing env vars: ${missing.join(', ')}` });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // ── Stripe cleanup ─────────────────────────────────────────
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (customers.data.length) {
      const customerId = customers.data[0].id;

      // Cancel any active subscriptions immediately
      const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 10 });
      for (const sub of subs.data) {
        await stripe.subscriptions.cancel(sub.id);
        console.log('[delete-account] cancelled subscription', sub.id);
      }

      // Delete the customer record
      await stripe.customers.del(customerId);
      console.log('[delete-account] deleted Stripe customer', customerId);
    } else {
      console.log('[delete-account] no Stripe customer found for', userEmail, '— skipping Stripe cleanup');
    }

    // ── Supabase auth deletion (cascades to profiles / credits / generations) ──
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('[delete-account] auth.admin.deleteUser error:', deleteError.message);
      return res.status(500).json({ error: deleteError.message });
    }

    console.log('[delete-account] deleted auth user', userId);
    res.json({ success: true });
  } catch (err) {
    console.error('[delete-account] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
