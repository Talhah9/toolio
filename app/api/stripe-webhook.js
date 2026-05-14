import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId || session.client_reference_id;
    const credits = parseInt(session.metadata?.credits || '0', 10);

    if (!userId) {
      console.error('[stripe-webhook] No userId in session metadata');
      return res.json({ received: true });
    }

    if (session.mode === 'payment' && credits > 0) {
      const { error } = await supabase.rpc('add_credits', {
        p_user_id: userId,
        p_amount: credits,
      });
      if (error) console.error('[stripe-webhook] add_credits error:', error.message);
      else console.log('[stripe-webhook] Added', credits, 'credits to user', userId);
    }

    if (session.mode === 'subscription') {
      const { error } = await supabase
        .from('profiles')
        .update({ plan: 'pro', updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) console.error('[stripe-webhook] update plan error:', error.message);
      else console.log('[stripe-webhook] Upgraded user', userId, 'to pro');
    }
  }

  res.json({ received: true });
}
