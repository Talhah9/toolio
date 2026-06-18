import Stripe from 'stripe';
import { verifyAuth } from './_security.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, userEmail } = req.body ?? {};
  if (!userId || !userEmail) {
    return res.status(400).json({ error: 'Missing userId or userEmail' });
  }

  if (!await verifyAuth(req, res, userId)) return;

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[payment-history] STRIPE_SECRET_KEY not set');
    return res.status(500).json({ error: 'Payment service not configured' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Find Stripe customer by email (created automatically for subscriptions)
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (!customers.data.length) {
      console.log('[payment-history] no Stripe customer for', userEmail);
      return res.json({ payments: [] });
    }

    const customerId = customers.data[0].id;
    console.log('[payment-history] customer:', customerId, '| email:', userEmail);

    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 20,
    });

    const fmt = (n) => `€${(n / 100).toFixed(2)}`;
    const fmtDate = (ts) => {
      const d = new Date(ts * 1000);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    const payments = sessions.data
      .filter(s => s.payment_status === 'paid')
      .map(s => {
        const credits = parseInt(s.metadata?.credits || '0', 10);
        let description;
        if (s.mode === 'subscription') {
          description = 'Savvly Pro';
        } else if (credits > 0) {
          description = `Pack — ${credits} credits`;
        } else {
          description = 'Credit top-up';
        }
        return {
          date:        fmtDate(s.created),
          description,
          amount:      fmt(s.amount_total ?? 0),
          status:      'Paid',
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    console.log('[payment-history] returning', payments.length, 'payments');
    res.json({ payments });
  } catch (err) {
    console.error('[payment-history] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
