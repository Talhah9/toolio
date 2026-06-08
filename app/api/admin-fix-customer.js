import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 30 };

// One-shot repair endpoint — deleted after use.
// Protected by a static token so it can't be called by anyone else.
const SECRET = 'fix-cid-2026';

export default async function handler(req, res) {
  if (req.query.token !== SECRET) return res.status(401).json({ error: 'Unauthorized' });

  const email = req.query.email || 'talhahally974@gmail.com';

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Find Stripe customer
    const customers = await stripe.customers.list({ email, limit: 5 });
    if (!customers.data.length) {
      return res.json({ ok: false, error: 'No Stripe customer found for ' + email });
    }

    const results = [];
    for (const customer of customers.data) {
      // Get their active subscriptions
      const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 3 });
      const subSummary = subs.data.map(s => ({
        id: s.id,
        status: s.status,
        cancel_at_period_end: s.cancel_at_period_end,
        current_period_end: new Date(s.current_period_end * 1000).toISOString(),
        schedule: s.schedule,
      }));

      // Update Supabase
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('email', email);

      results.push({
        customerId: customer.id,
        customerCreated: new Date(customer.created * 1000).toISOString(),
        subscriptions: subSummary,
        dbUpdated: !dbErr,
        dbError: dbErr?.message ?? null,
      });
    }

    return res.json({ ok: true, email, results });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
