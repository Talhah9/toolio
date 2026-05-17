import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { priceId, mode, userId, userEmail, credits } = req.body;

  if (!priceId || !mode || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userEmail || undefined,
      client_reference_id: userId,
      metadata: { userId, credits: String(credits ?? 0) },
      success_url: 'https://app-alpha-rose-89.vercel.app/dashboard?payment=success',
      cancel_url: 'https://app-alpha-rose-89.vercel.app/pricing',
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[create-checkout-session] Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
