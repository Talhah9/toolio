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

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

        // If this was a promo checkout, create a subscription schedule so that
        // after 1 billing cycle (phase 1 at promo price) it switches to the normal price (phase 2).
        const { promoPriceId, normalPriceId } = session.metadata || {};
        if (session.subscription && promoPriceId && normalPriceId) {
          try {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
            const schedule = await stripe.subscriptionSchedules.create({
              from_subscription: session.subscription,
            });
            // Phase 1 spans the current billing period (already paid promo price).
            // Phase 2 switches to normal price and continues indefinitely.
            await stripe.subscriptionSchedules.update(schedule.id, {
              end_behavior: 'release',
              phases: [
                {
                  start_date: schedule.phases[0].start_date,
                  end_date:   schedule.phases[0].end_date,
                  items: [{ price: promoPriceId, quantity: 1 }],
                },
                {
                  items: [{ price: normalPriceId, quantity: 1 }],
                },
              ],
            });
            console.log('[stripe-webhook] subscription schedule created | schedule:', schedule.id,
              '| promo:', promoPriceId, '→ normal:', normalPriceId);
          } catch (schedErr) {
            // Non-fatal: user already has Pro — schedule failure just means no auto price-switch
            console.error('[stripe-webhook] schedule creation failed (non-fatal):', schedErr.message);
          }
        }
      }
    }

    // ── Coaching booking handling ──────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const coachingBookingId = session.metadata?.coachingBookingId;

      if (coachingBookingId) {
        console.log('[stripe-webhook] Coaching booking:', coachingBookingId);

        const THEME_LABELS = {
          strategie:    'Stratégie & positionnement',
          tarification: 'Tarification & offres',
          acquisition:  'Acquisition clients',
          probleme:     'Problème spécifique',
          lancement:    "Lancement d'activité",
        };

        // 1. Update booking status
        const { data: booking } = await supabase
          .from('coaching_bookings')
          .update({ status: 'paid', stripe_session_id: session.id })
          .eq('id', coachingBookingId)
          .select('*, profiles:user_id(first_name, last_name, email)')
          .maybeSingle();

        if (booking) {
          const clientEmail = session.customer_email || booking.profiles?.email || '';
          const clientName  = booking.profiles?.first_name || clientEmail.split('@')[0] || 'Client';
          const themeLabel  = THEME_LABELS[booking.theme] || booking.theme || '';
          const RESEND_API  = 'https://api.resend.com/emails';
          const headers     = { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` };

          // 2. Notify Talhah
          await fetch(RESEND_API, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              from: 'Savvly <onboarding@resend.dev>',
              to: ['talhahally974@gmail.com'],
              subject: `🎯 Nouvelle consultation réservée — ${themeLabel}`,
              html: `
                <h2>Nouvelle consultation réservée sur Savvly</h2>
                <p><strong>Client :</strong> ${clientName} (${clientEmail})</p>
                <p><strong>Téléphone :</strong> ${booking.phone}</p>
                <p><strong>Thématique :</strong> ${themeLabel}</p>
                <p><strong>Situation :</strong></p>
                <blockquote style="border-left:3px solid #4F46E5;padding-left:12px;color:#555">${booking.description?.replace(/\n/g, '<br>') || ''}</blockquote>
                ${booking.pdf_url ? `<p><strong>Document :</strong> <a href="${booking.pdf_url}">Télécharger le PDF</a></p>` : '<p><strong>Document :</strong> Aucun</p>'}
                <p style="color:#888;font-size:12px">Session Stripe : ${session.id}</p>
              `,
            }),
          }).catch(e => console.error('[stripe-webhook] coaching notify email error:', e.message));

          // 3. Confirm to client
          if (clientEmail) {
            await fetch(RESEND_API, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                from: 'Savvly <onboarding@resend.dev>',
                to: [clientEmail],
                subject: '✅ Votre consultation avec Talhah Ally est confirmée',
                html: `
                  <h2>Votre consultation est confirmée !</h2>
                  <p>Bonjour ${clientName},</p>
                  <p>Votre consultation d'1 heure avec Talhah Ally est bien réservée.</p>
                  <p>Talhah vous contactera <strong>sous 24h</strong> à l'adresse <strong>${clientEmail}</strong>${booking.phone ? ` ou au <strong>${booking.phone}</strong>` : ''}.</p>
                  <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
                  <p><strong>Thématique :</strong> ${themeLabel}</p>
                  <p><strong>Durée :</strong> 1 heure — appel vidéo</p>
                  <p><strong>Suivi :</strong> Email pendant 7 jours post-séance</p>
                  <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
                  <p style="color:#888;font-size:13px">L'équipe Savvly</p>
                `,
              }),
            }).catch(e => console.error('[stripe-webhook] coaching confirm email error:', e.message));
          }
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
