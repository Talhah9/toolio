import Stripe from 'stripe';

export const config = { maxDuration: 30 };

// ONE-USE endpoint — delete after running.
// Call: GET /api/_admin-customer-init?token=savvly-init-2026
export default async function handler(req, res) {
  if (req.query.token !== 'savvly-init-2026') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY' });
  }
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const customer = await stripe.customers.create({
      email: 'talhahally974@gmail.com',
      name: 'Talhah Ally',
      metadata: { project: 'savvly' },
    });
    console.log('Nouveau customer ID:', customer.id);
    return res.json({ success: true, customerId: customer.id });
  } catch (err) {
    console.error('customer create error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
