import Stripe from 'stripe';

export const config = { maxDuration: 10 };

const VALID_PRICE_IDS = new Set([
  'price_1TWwVeAFTm9a9DATGNn4FO2g', // Pro EUR €49/mo
  'price_1TYNvyAFTm9a9DATmtwE5E3a', // Pro USD $54/mo
  'price_1TWwWxAFTm9a9DATtpAaaemv', // Small EUR €9
  'price_1TYNysAFTm9a9DATBZcZOazQ', // Small USD $10
  'price_1TWwZRAFTm9a9DATOmAb6KjN', // Medium EUR €19
  'price_1TYNzlAFTm9a9DATXgRbnCBd', // Medium USD $21
  'price_1TWwa2AFTm9a9DATrycG9Lqj', // Large EUR €39
  'price_1TYO08AFTm9a9DATfAi1nkTO', // Large USD $42
]);

const VALID_MODES = new Set(['subscription', 'payment']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { priceId, mode, userId, userEmail, credits } = req.body;

  if (!priceId || !mode || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!VALID_PRICE_IDS.has(priceId)) {
    return res.status(400).json({ error: 'Invalid price ID' });
  }
  if (!VALID_MODES.has(mode)) {
    return res.status(400).json({ error: 'Invalid mode' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userEmail || undefined,
      client_reference_id: userId,
      metadata: { userId, credits: String(credits ?? 0) },
      success_url: 'https://savvly.co/dashboard?payment=success',
      cancel_url: 'https://savvly.co/pricing',
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[create-checkout-session] Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
