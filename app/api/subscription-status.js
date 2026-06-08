import Stripe from 'stripe';

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userEmail } = req.body ?? {};
  if (!userEmail) return res.status(400).json({ error: 'Missing userEmail' });

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (!customers.data.length) return res.json({ renewalDate: null, cancelAt: null, isCancelling: false });

    const customerId = customers.data[0].id;

    const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

    // Check active subscription first
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
    if (subs.data.length) {
      const sub = subs.data[0];
      const periodEnd = new Date(sub.current_period_end * 1000);
      if (sub.cancel_at_period_end) {
        // Use sub.cancel_at (absolute cancellation timestamp set by Stripe) when available,
        // falling back to current_period_end which should be the same value.
        const cancelTs = sub.cancel_at ? sub.cancel_at * 1000 : sub.current_period_end * 1000;
        return res.json({ renewalDate: null, cancelAt: fmt(new Date(cancelTs)), isCancelling: true });
      }
      return res.json({ renewalDate: fmt(periodEnd), cancelAt: null, isCancelling: false });
    }

    // No active sub — check recently cancelled (schedule-cancelled, still within paid period)
    const cancelledSubs = await stripe.subscriptions.list({ customer: customerId, status: 'canceled', limit: 3 });
    for (const sub of cancelledSubs.data) {
      const periodEndMs = sub.current_period_end * 1000;
      if (periodEndMs > Date.now()) {
        return res.json({ renewalDate: null, cancelAt: fmt(new Date(periodEndMs)), isCancelling: true });
      }
    }

    return res.json({ renewalDate: null, cancelAt: null, isCancelling: false });
  } catch (err) {
    console.error('[subscription-status] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
