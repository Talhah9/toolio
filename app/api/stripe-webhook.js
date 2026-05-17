import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 60, api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  // Log env var presence on every invocation (values never logged)
  const envPresent = {
    STRIPE_SECRET_KEY:         !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET:     !!process.env.STRIPE_WEBHOOK_SECRET,
    SUPABASE_URL:              !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  console.log('[stripe-webhook] env vars present:', JSON.stringify(envPresent));

  if (req.method !== 'POST') return res.status(405).end();

  // Fail fast with a clear message if any env var is missing
  const missing = Object.entries(envPresent).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    console.error('[stripe-webhook] MISSING env vars:', missing.join(', '));
    return res.status(500).json({ error: `Missing env vars: ${missing.join(', ')}` });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const rawBody = await getRawBody(req);
    const sig = req.headers['stripe-signature'];
    console.log('[stripe-webhook] rawBody.length:', rawBody.length, '| sig present:', !!sig);

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('[stripe-webhook] Signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook signature error: ${err.message}` });
    }

    console.log('[stripe-webhook] Event type:', event.type, '| id:', event.id);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId  = session.metadata?.userId || session.client_reference_id;
      const credits = parseInt(session.metadata?.credits || '0', 10);

      console.log('[stripe-webhook] session:', session.id, '| mode:', session.mode,
        '| userId:', userId, '| credits metadata:', credits,
        '| payment_status:', session.payment_status);

      if (!userId) {
        console.error('[stripe-webhook] No userId in metadata or client_reference_id — cannot credit account');
        return res.json({ received: true });
      }

      // Idempotency check — insert session ID; if it already exists, skip processing
      const { error: insertError } = await supabase
        .from('processed_payments')
        .insert({ session_id: session.id });

      if (insertError) {
        if (insertError.code === '23505') {
          // Unique violation — this session was already processed
          console.log('[stripe-webhook] Duplicate session', session.id, '— skipping');
          return res.json({ received: true });
        }
        // Unexpected insert error — log but continue so credits aren't silently lost
        console.error('[stripe-webhook] processed_payments insert error:', JSON.stringify(insertError));
      }

      if (session.mode === 'payment' && credits > 0) {
        console.log('[stripe-webhook] Calling add_credits for user', userId, 'amount', credits);
        const { data, error } = await supabase.rpc('add_credits', {
          p_user_id: userId,
          p_amount:  credits,
        });
        if (error) {
          console.error('[stripe-webhook] add_credits RPC error:', JSON.stringify(error));
        } else {
          console.log('[stripe-webhook] add_credits success, result:', JSON.stringify(data));
        }
      }

      if (session.mode === 'subscription') {
        console.log('[stripe-webhook] Upgrading user', userId, 'to pro with 500 credits');
        const { error } = await supabase
          .from('profiles')
          .update({ plan: 'pro', balance: 500, updated_at: new Date().toISOString() })
          .eq('id', userId);
        if (error) {
          console.error('[stripe-webhook] profiles update error:', JSON.stringify(error));
        } else {
          console.log('[stripe-webhook] plan set to pro, balance set to 500 for user', userId);
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[stripe-webhook] Unhandled error:', err.message);
    console.error('[stripe-webhook] Stack:', err.stack);
    res.status(500).json({ error: err.message });
  }
}
