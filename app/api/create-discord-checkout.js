import Stripe from 'stripe';

export const config = { maxDuration: 10 };

const DISCORD_PRICE_ID = process.env.STRIPE_DISCORD_PRICE_ID;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://savvly.co';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!DISCORD_PRICE_ID) {
    console.error('[create-discord-checkout] STRIPE_DISCORD_PRICE_ID env var missing');
    return res.status(500).json({ error: 'Discord checkout not configured — add STRIPE_DISCORD_PRICE_ID to env vars' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: DISCORD_PRICE_ID, quantity: 1 }],
      subscription_data: { metadata: { type: 'discord_access' } },
      metadata: { type: 'discord_access' },
      success_url: `${SITE_URL}/discord-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/#discord`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[create-discord-checkout] Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
