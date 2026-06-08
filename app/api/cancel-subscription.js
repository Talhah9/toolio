import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, userEmail } = req.body ?? {};
  if (!userId || !userEmail) {
    return res.status(400).json({ error: 'Missing userId or userEmail' });
  }

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

    // Find Stripe customer by email
    console.log('[cancel-sub] Looking for Stripe customer...');
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (!customers.data.length) {
      console.log('[cancel-sub] no Stripe customer for', userEmail);
      return res.status(404).json({ error: 'No active subscription found' });
    }
    const customerId = customers.data[0].id;
    console.log('[cancel-sub] customerId:', customerId);

    // Find active subscription
    console.log('[cancel-sub] Looking for subscription...');
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
    if (!subs.data.length) {
      console.log('[cancel-sub] no active subscription for customer', customerId);
      return res.status(404).json({ error: 'No active subscription found' });
    }
    const subscriptionId = subs.data[0].id;
    console.log('[cancel-sub] found subscriptionId:', subscriptionId);

    // Get the full subscription (includes schedule field)
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log('[cancel-sub] schedule:', subscription.schedule);

    if (subscription.schedule) {
      // Cancel the schedule first
      await stripe.subscriptionSchedules.cancel(subscription.schedule);
      console.log('[cancel-sub] schedule cancelled:', subscription.schedule);
    } else {
      // No schedule — cancel directly at period end
      await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
      console.log('[cancel-sub] subscription set to cancel at period end');
    }

    // Period end — user keeps Pro access until this date
    const periodEnd = new Date(subscription.current_period_end * 1000);
    const cancelAt = `${String(periodEnd.getDate()).padStart(2, '0')}/${String(periodEnd.getMonth() + 1).padStart(2, '0')}/${periodEnd.getFullYear()}`;
    console.log('[cancel-sub] cancelAt:', cancelAt);

    // Store scheduled cancellation date — plan and credits unchanged until period end
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ cancel_at: periodEnd.toISOString() })
      .eq('id', userId);
    if (dbError) console.error('[cancel-sub] profiles update error:', JSON.stringify(dbError));

    console.log('[cancel-sub] cancel_at stored, plan/credits unchanged until period end');

    // Send cancellation confirmation email
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Savvly <hello@savvly.co>',
        reply_to: 'hello@savvly.co',
        to: [userEmail],
        subject: 'Résiliation confirmée — Savvly',
        html: `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#1f2937;padding:40px;text-align:center;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:rgba(255,255,255,0.5);margin-bottom:12px;">SAVVLY</div>
      <h1 style="margin:0;font-size:24px;font-weight:800;color:#fff;">Résiliation confirmée</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">Votre résiliation a bien été prise en compte.</p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">Vous gardez l'accès Pro jusqu'au <strong>${cancelAt}</strong>. Vos crédits sont conservés pendant cette période.</p>
      <p style="margin:0 0 28px;font-size:14px;color:#6B7280;line-height:1.7;">Vous pouvez réactiver votre abonnement à tout moment depuis votre compte.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="https://savvly.co/dashboard" style="display:inline-block;background:linear-gradient(135deg,#4F46E5,#6D28D9);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;">
          Réactiver mon abonnement →
        </a>
      </div>
    </div>
    <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9CA3AF;">© 2026 Savvly · <a href="https://savvly.co" style="color:#9CA3AF;">savvly.co</a></p>
    </div>
  </div>
</body></html>`,
      }),
    }).catch(e => console.error('[cancel-sub] email error:', e.message));

    res.json({ success: true, cancelAt });
  } catch (err) {
    console.error('[cancel-sub] unhandled error:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
}
