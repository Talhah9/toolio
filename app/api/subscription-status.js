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
    if (!customers.data.length) return res.json({ renewalDate: null });

    const customerId = customers.data[0].id;
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
    if (!subs.data.length) return res.json({ renewalDate: null });

    const periodEnd = new Date(subs.data[0].current_period_end * 1000);
    const dd = String(periodEnd.getDate()).padStart(2, '0');
    const mm = String(periodEnd.getMonth() + 1).padStart(2, '0');
    const yyyy = periodEnd.getFullYear();
    return res.json({ renewalDate: `${dd}/${mm}/${yyyy}` });
  } catch (err) {
    console.error('[subscription-status] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
