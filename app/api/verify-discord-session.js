import Stripe from 'stripe';

export const config = { maxDuration: 10 };

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { session_id } = req.query;
  if (!session_id || !session_id.startsWith('cs_')) {
    return res.status(400).json({ paid: false, error: 'Invalid session_id' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['payment_intent'] });
    const paid = session.payment_status === 'paid' && session.metadata?.type === 'discord_access';
    res.json({ paid });
  } catch (err) {
    console.error('[verify-discord-session] error:', err.message);
    res.status(400).json({ paid: false, error: err.message });
  }
}
