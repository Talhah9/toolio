import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const RESEND_API = 'https://api.resend.com/emails';

function resendHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` };
}

async function sendEmail(to, subject, html) {
  if (!to) return;
  await fetch(RESEND_API, {
    method: 'POST',
    headers: resendHeaders(),
    body: JSON.stringify({ from: 'Savvly <hello@savvly.co>', reply_to: 'hello@savvly.co', to: [to], subject, html }),
  }).catch(e => console.error('[stripe-webhook] email error:', subject, e.message));
}

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
          await sendEmail(
            session.customer_email,
            '✅ Vos crédits ont été ajoutés — Savvly',
            `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#10B981,#059669);padding:40px;text-align:center;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:rgba(255,255,255,0.7);margin-bottom:12px;">SAVVLY</div>
      <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;">✅ ${credits} crédits ajoutés</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
        Votre achat a bien été pris en compte. <strong>${credits} crédits</strong> ont été ajoutés à votre compte Savvly.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="https://savvly.co/dashboard" style="display:inline-block;background:linear-gradient(135deg,#4F46E5,#6D28D9);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;">
          Utiliser mes crédits →
        </a>
      </div>
    </div>
    <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9CA3AF;">© 2026 Savvly · <a href="https://savvly.co" style="color:#9CA3AF;">savvly.co</a></p>
    </div>
  </div>
</body></html>`
          );
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
          await sendEmail(
            session.customer_email,
            '🚀 Bienvenue dans Savvly Pro !',
            `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#4F46E5,#6D28D9);padding:40px;text-align:center;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:rgba(255,255,255,0.7);margin-bottom:12px;">SAVVLY</div>
      <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;">Bienvenue dans Savvly Pro 🚀</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">Votre abonnement Pro est actif. Voici ce qui est maintenant disponible :</p>
      <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#374151;line-height:2.2;">
        <li><strong>500 crédits</strong> ajoutés à votre compte</li>
        <li>Accès à tous les outils Pro (Contrats, Audit, Mission Finder…)</li>
        <li>Générations illimitées selon votre solde de crédits</li>
        <li>Support prioritaire</li>
      </ul>
      <div style="text-align:center;margin:28px 0;">
        <a href="https://savvly.co/dashboard" style="display:inline-block;background:linear-gradient(135deg,#4F46E5,#6D28D9);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;">
          Accéder à mon tableau de bord →
        </a>
      </div>
    </div>
    <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9CA3AF;">© 2026 Savvly · <a href="https://savvly.co" style="color:#9CA3AF;">savvly.co</a></p>
    </div>
  </div>
</body></html>`
          );
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
              from: 'Savvly <hello@savvly.co>',
              reply_to: 'hello@savvly.co',
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
                from: 'Savvly <hello@savvly.co>',
                reply_to: 'hello@savvly.co',
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

    // ── Subscription cancelled ─────────────────────────────────
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const customerId = sub.customer;
      console.log('[stripe-webhook] subscription.deleted | customer:', customerId);

      // Find user by stripe_customer_id or via metadata
      const userId = sub.metadata?.userId;
      let userEmail = null;

      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
        if (profile) {
          // Downgrade to free plan
          await supabase
            .from('profiles')
            .update({ plan: 'free', updated_at: new Date().toISOString() })
            .eq('id', userId);
          console.log('[stripe-webhook] downgraded user', userId, 'to free');
        }
      }

      // Get customer email from Stripe
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const customer = await stripe.customers.retrieve(customerId);
        if (customer && !customer.deleted) userEmail = customer.email;
      } catch (e) {
        console.error('[stripe-webhook] failed to retrieve customer:', e.message);
      }

      if (userEmail) {
        await sendEmail(
          userEmail,
          'Votre abonnement Savvly Pro a été annulé',
          `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#1f2937;padding:40px;text-align:center;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:rgba(255,255,255,0.5);margin-bottom:12px;">SAVVLY</div>
      <h1 style="margin:0;font-size:24px;font-weight:800;color:#fff;">Votre abonnement Pro est annulé</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
        Votre abonnement Savvly Pro a bien été annulé. Votre compte a été repassé en offre gratuite.
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.7;">
        Vous conservez l'accès aux outils gratuits. Vos données et historique restent disponibles.
        Pour toute question, contactez-nous à <a href="mailto:talhahally974@gmail.com" style="color:#4F46E5;">talhahally974@gmail.com</a>.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="https://savvly.co/pricing" style="display:inline-block;background:linear-gradient(135deg,#4F46E5,#6D28D9);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;">
          Réactiver mon abonnement →
        </a>
      </div>
    </div>
    <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9CA3AF;">© 2026 Savvly · <a href="https://savvly.co" style="color:#9CA3AF;">savvly.co</a></p>
    </div>
  </div>
</body></html>`
        );
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[stripe-webhook] Unhandled error:', err.message);
    console.error('[stripe-webhook] Stack:', err.stack);
    res.status(500).json({ error: err.message });
  }
}
