import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from './_security.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, userEmail } = req.body ?? {};
  if (!userId || !userEmail) {
    return res.status(400).json({ error: 'Missing userId or userEmail' });
  }

  if (!await verifyAuth(req, res, userId)) return;

  const missing = [];
  if (!process.env.STRIPE_SECRET_KEY)         missing.push('STRIPE_SECRET_KEY');
  if (!process.env.SUPABASE_URL)              missing.push('SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) {
    console.error('[cancel-subscription] missing env vars:', missing.join(', '));
    return res.status(500).json({ error: `Missing env vars: ${missing.join(', ')}` });
  }

  console.log('[cancel-sub] userId:', userId);
  console.log('[cancel-sub] userEmail:', userEmail);

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Resolve Stripe customer: profiles.stripe_customer_id first, email fallback
    console.log('[cancel-sub] Looking for Stripe customer...');
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .maybeSingle();
    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      customerId = customers.data[0]?.id;
      if (customerId) {
        await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);
        console.log('[cancel-sub] stripe_customer_id persisted for user', userId);
      }
    }
    if (!customerId) {
      console.log('[cancel-sub] no Stripe customer for', userEmail);
      return res.status(404).json({ error: 'No active subscription found' });
    }
    console.log('[cancel-sub] customerId:', customerId);

    // Find the most current active/trialing subscription (highest future current_period_end)
    console.log('[cancel-sub] Looking for subscription...');
    const nowSec = Math.floor(Date.now() / 1000);
    const allSubs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 });
    const validSubs = allSubs.data
      .filter(s => (s.status === 'active' || s.status === 'trialing') && s.current_period_end > nowSec)
      .sort((a, b) => b.current_period_end - a.current_period_end);
    if (!validSubs.length) {
      console.log('[cancel-sub] no active subscription for customer', customerId);
      return res.status(404).json({ error: 'No active subscription found' });
    }
    const subscriptionId = validSubs[0].id;
    console.log('[cancel-sub] found subscriptionId:', subscriptionId, '| period_end:', validSubs[0].current_period_end);

    // Get the full subscription (includes schedule field)
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log('[cancel-sub] schedule:', subscription.schedule);

    if (subscription.schedule) {
      // Release the schedule (detaches it without cancelling the subscription),
      // then mark the subscription to end at the current period boundary.
      // Using cancel() instead would terminate the sub immediately, firing
      // subscription.deleted and dropping the user to free right away.
      await stripe.subscriptionSchedules.release(subscription.schedule);
      console.log('[cancel-sub] schedule released:', subscription.schedule);
      await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
      console.log('[cancel-sub] subscription set to cancel at period end (post-release)');
    } else {
      // No schedule — cancel directly at period end
      await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
      console.log('[cancel-sub] subscription set to cancel at period end');
    }

    // Period end — user keeps Pro access until this date
    const periodEnd = new Date(subscription.current_period_end * 1000);
    const cancelAt = periodEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    console.log('[cancel-sub] cancelAt:', cancelAt);

    // Store scheduled cancellation date — plan and credits unchanged until period end
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ cancel_at: periodEnd.toISOString() })
      .eq('id', userId);
    if (dbError) console.error('[cancel-sub] profiles update error:', JSON.stringify(dbError));

    console.log('[cancel-sub] cancel_at stored, plan/credits unchanged until period end');

    // Send cancellation confirmation email
    const recipientEmail = profile?.email || userEmail;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Savvly <hello@savvly.co>',
        reply_to: 'hello@savvly.co',
        to: [recipientEmail],
        subject: 'Confirmation de résiliation — Savvly',
        html: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <h2 style="color: #0A0A0A;">Résiliation confirmée</h2>
  <p>Bonjour,</p>
  <p>Ta résiliation a bien été prise en compte.</p>
  <p>Tu gardes ton accès <strong>Pro</strong> jusqu'au <strong>${cancelAt}</strong>.</p>
  <p>Après cette date, ton compte passera automatiquement en version gratuite.</p>
  <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
  <p style="color: #6B7280; font-size: 14px;">
    Tu peux réactiver ton abonnement à tout moment depuis ton espace compte.<br/>
    Une question ? Réponds à cet email.
  </p>
  <p style="color: #6B7280; font-size: 14px;">L'équipe Savvly</p>
</div>`,
      }),
    }).catch(e => console.error('[cancel-sub] email error:', e.message));

    res.json({ success: true, canceled: true, access_until: subscription.current_period_end, cancelAt });
  } catch (err) {
    console.error('[cancel-sub] unhandled error:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
}
