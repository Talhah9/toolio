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

    // Check active subscription first
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
    if (subs.data.length) {
      const sub = subs.data[0];
      const periodEnd = new Date(sub.current_period_end * 1000);
      const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      if (sub.cancel_at_period_end) {
        return res.json({ renewalDate: null, cancelAt: fmt(periodEnd), isCancelling: true });
      }
      return res.json({ renewalDate: fmt(periodEnd), cancelAt: null, isCancelling: false });
    }

    // No active sub — check recently cancelled (schedule-cancelled, still within paid period)
    const cancelledSubs = await stripe.subscriptions.list({ customer: customerId, status: 'canceled', limit: 1 });
    if (cancelledSubs.data.length) {
      const sub = cancelledSubs.data[0];
      const periodEndMs = sub.current_period_end * 1000;
      if (periodEndMs > Date.now()) {
        const periodEnd = new Date(periodEndMs);
        const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
        return res.json({ renewalDate: null, cancelAt: fmt(periodEnd), isCancelling: true });
      }
    }

    return res.json({ renewalDate: null, cancelAt: null, isCancelling: false });
  } catch (err) {
    console.error('[subscription-status] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
