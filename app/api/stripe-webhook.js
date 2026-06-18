import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const RESEND_API = 'https://api.resend.com/emails';

function resendHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` };
}

const safeToISO = (timestamp) => {
  if (!timestamp || isNaN(timestamp)) return null
  const date = new Date(Number(timestamp) * 1000)
  if (isNaN(date.getTime())) return null
  return date.toISOString()
}

// Find the Supabase user for a given Stripe customer ID.
// Primary path: stripe_customer_id column. Fallback: look up by customer email
// and then persist stripe_customer_id so future events use the fast path.
async function findUserByCustomer(supabase, stripe, customerId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  if (profile?.id) return profile.id;

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer?.deleted || !customer?.email) return null;
    const { data: emailProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', customer.email)
      .maybeSingle();
    if (emailProfile?.id) {
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', emailProfile.id);
      console.log('[stripe-webhook] findUserByCustomer | linked stripe_customer_id via email:', customer.email);
      return emailProfile.id;
    }
  } catch (e) {
    console.error('[stripe-webhook] findUserByCustomer fallback error:', e.message);
  }
  return null;
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

    // Price IDs that unlock Savvly Pro (all regions + promo variants)
    const PRO_PRICE_IDS = [
      'price_1TWwVeAFTm9a9DATGNn4FO2g', // EUR 49€ normal
      'price_1TbG6eAFTm9a9DATlWDutoHI', // EUR 15€ promo first month
      'price_1TYNvyAFTm9a9DATmtwE5E3a', // USD $54 normal
      'price_1TbG7JAFTm9a9DATFk8BiFSv', // USD $17 promo first month
    ];

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // ── Discord club subscription ─────────────────────────────
      if (session.metadata?.type === 'discord_access') {
        const customerEmail = session.customer_details?.email || session.customer_email;
        console.log('[stripe-webhook] discord_access | email:', customerEmail);

        // Save to newsletter_subscribers (ignore duplicate)
        if (customerEmail) {
          const { error: nlErr } = await supabase
            .from('newsletter_subscribers')
            .insert({ email: customerEmail.trim().toLowerCase(), source: 'discord_club' });
          if (nlErr && nlErr.code !== '23505') {
            console.error('[stripe-webhook] discord_access newsletter insert error:', nlErr.message);
          }
        }

        if (customerEmail) {
          // 1. Discord welcome email
          await sendEmail(
            customerEmail,
            'Bienvenue dans le club Savvly 🎉',
            `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#5865F2;padding:40px;text-align:center;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:rgba(255,255,255,0.7);margin-bottom:12px;">SAVVLY</div>
      <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;">Bienvenue dans le club 🎉</h1>
    </div>
    <div style="padding:36px 40px;text-align:center;">
      <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
        Ton accès au club Discord Savvly est confirmé. Clique ci-dessous pour rejoindre les <strong>220+ freelances</strong> qui avancent ensemble.
      </p>
      <a href="https://discord.gg/8DvYb5uB6X" style="display:inline-block;background:#5865F2;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;">
        Rejoindre le Discord →
      </a>
      <p style="margin:24px 0 0;font-size:13px;color:#9CA3AF;">
        Ou copie ce lien : <a href="https://discord.gg/8DvYb5uB6X" style="color:#5865F2;">discord.gg/8DvYb5uB6X</a>
      </p>
      <p style="margin:16px 0 0;font-size:12px;color:#9CA3AF;">Pour résilier, contacte-nous à <a href="mailto:hello@savvly.co" style="color:#5865F2;">hello@savvly.co</a></p>
    </div>
    <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9CA3AF;">© 2026 Savvly · <a href="https://savvly.co" style="color:#9CA3AF;">savvly.co</a></p>
    </div>
  </div>
</body></html>`
          );

          // 2. Send the 23 PDF resources
          const resources = [
            { n: 1,  name: 'Stack IA — Comment choisir et combiner Gemini, ChatGPT &amp; Claude',      url: 'https://ockrknnienwjoercifxq.supabase.co/storage/v1/object/public/Ressources/Ressource_Stack_IA__Comment_choisir_et_combiner_Gemini_ChatGPT__Claude.pdf' },
            { n: 2,  name: 'Claude Skills',                                                             url: 'https://ockrknnienwjoercifxq.supabase.co/storage/v1/object/public/Ressources/Ressource_Claude_skills.pdf' },
            { n: 3,  name: 'Claude x LinkedIn',                                                         url: 'https://ockrknnienwjoercifxq.supabase.co/storage/v1/object/public/Ressources/Ressource_Claude_x_LinkedIn.pdf' },
            { n: 4,  name: 'Claude — Ressource complète',                                               url: 'https://ockrknnienwjoercifxq.supabase.co/storage/v1/object/public/Ressources/Ressource__Claude.pdf' },
            { n: 5,  name: 'Formation — Prospection LinkedIn automatisée par l\'IA',                    url: 'https://ockrknnienwjoercifxq.supabase.co/storage/v1/object/public/Ressources/Ressource__FORMATION__Prospection_LinkedIn_automatise_par_lIA.pdf' },
            { n: 6,  name: 'Pack Prompts ChatGPT Business',                                             url: 'https://ockrknnienwjoercifxq.supabase.co/storage/v1/object/public/Ressources/Ressource_Pack_Prompts_ChatGPT_Business.pdf' },
            { n: 7,  name: 'Pack Prompts Gemini Business',                                              url: 'https://ockrknnienwjoercifxq.supabase.co/storage/v1/object/public/Ressources/Ressource_Pack_Prompts_Gemini_Business.pdf' },
            { n: 8,  name: 'Pack Prompts Claude Business',                                              url: 'https://ockrknnienwjoercifxq.supabase.co/storage/v1/object/public/Ressources/Ressource_Pack_Prompts_Claude_Business.pdf' },
            { n: 9,  name: 'Automatiser ta Newsletter avec l\'IA',                                      url: 'https://ockrknnienwjoercifxq.supabase.co/storage/v1/object/public/Ressources/Ressource__Automatiser_ta_Newsletter_avec_lIA.pdf' },
            { n: 10, name: 'Apollo.io — Scraping d\'email B2B',                                         url: 'https://ockrknnienwjoercifxq.supabase.co/storage/v1/object/public/Ressources/Ressource__Apollo.io_-_scraping_demail_b2b.pdf' },
          ];
          const resourceRows = resources.map(r => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #F3F4F6;vertical-align:middle;">
        <table cellpadding="0" cellspacing="0" width="100%"><tr>
          <td style="vertical-align:middle;width:32px;"><div style="width:28px;height:28px;border-radius:50%;background:#5865F2;color:#fff;font-size:12px;font-weight:800;text-align:center;line-height:28px;">${r.n}</div></td>
          <td style="padding-left:12px;vertical-align:middle;"><span style="font-size:13px;font-weight:600;color:#111827;">${r.name}</span></td>
          <td style="text-align:right;vertical-align:middle;white-space:nowrap;padding-left:12px;"><a href="${r.url}" style="display:inline-block;background:#5865F2;color:#fff;text-decoration:none;font-size:12px;font-weight:700;padding:6px 14px;border-radius:6px;">Télécharger →</a></td>
        </tr></table>
      </td>
    </tr>`).join('');

          await sendEmail(
            customerEmail,
            'Vos ressources offertes avec le club Savvly — 10 PDFs',
            `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px 48px;"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
    <tr><td style="background:#5865F2;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
      <p style="margin:0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.02em;">Savvly</p>
    </td></tr>
    <tr><td style="background:#fff;padding:40px 40px 28px;text-align:center;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:900;color:#0F172A;">Tes 10 ressources sont là 🎁</h1>
      <p style="margin:0;font-size:15px;color:#6B7280;line-height:1.6;">Offertes avec ton abonnement au club Savvly.</p>
    </td></tr>
    <tr><td style="background:#fff;padding:0 40px 8px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">${resourceRows}</table>
    </td></tr>
    <tr><td style="background:#fff;padding:28px 40px 36px;text-align:center;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
      <p style="margin:0 0 20px;font-size:14px;color:#6B7280;line-height:1.6;">Ces ressources t'appartiennent. N'oublie pas de rejoindre le Discord aussi !</p>
      <a href="https://discord.gg/8DvYb5uB6X" style="display:inline-block;background:#5865F2;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;">Rejoindre le Discord →</a>
    </td></tr>
    <tr><td style="background:#F9FAFB;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border:1px solid #e5e7eb;border-top:none;">
      <p style="margin:0;font-size:12px;color:#9CA3AF;">© 2026 Savvly · <a href="https://savvly.co" style="color:#9CA3AF;">savvly.co</a></p>
    </td></tr>
  </table>
  </td></tr></table>
</body></html>`
          );
        }
        return res.json({ received: true });
      }

      const userId  = session.metadata?.userId || session.client_reference_id;
      const credits = parseInt(session.metadata?.credits || '0', 10);

      // Retrieve line items to get the actual price ID used
      let priceIds = [];
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
        priceIds = lineItems.data.map(item => item.price?.id).filter(Boolean);
      } catch (liErr) {
        console.error('[stripe-webhook] failed to list line items:', liErr.message);
      }

      const isProPurchase = session.mode === 'subscription' || priceIds.some(id => PRO_PRICE_IDS.includes(id));

      console.log('[stripe-webhook] session:', session.id,
        '| mode:', session.mode,
        '| userId:', userId,
        '| credits metadata:', credits,
        '| payment_status:', session.payment_status,
        '| priceIds:', priceIds.join(', ') || '(none)',
        '| isProPurchase:', isProPurchase);

      if (!userId) {
        console.error('[stripe-webhook] No userId in metadata or client_reference_id — cannot credit account');
        return res.json({ received: true });
      }

      // Always persist stripe_customer_id on any successful checkout
      if (session.customer) {
        await supabase.from('profiles').update({ stripe_customer_id: session.customer }).eq('id', userId);
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

      if (session.mode === 'payment' && credits > 0 && !isProPurchase) {
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

      if (isProPurchase) {
        console.log('[stripe-webhook] Pro upgrade triggered for user', userId,
          '| priceIds:', priceIds.join(', ') || '(none)',
          '| mode:', session.mode);
        const { error } = await supabase
          .from('profiles')
          .update({ plan: 'pro', stripe_customer_id: session.customer, cancel_at: null, credits_expire_at: null })
          .eq('id', userId);
        if (error) {
          console.error('[stripe-webhook] profiles update error:', JSON.stringify(error));
        } else {
          console.log('[stripe-webhook] plan set to pro for user', userId);
          const { error: creditsError } = await supabase
            .rpc('add_credits', { p_user_id: userId, p_amount: 500 });
          if (creditsError) {
            console.error('[stripe-webhook] add_credits (pro) error:', JSON.stringify(creditsError));
          } else {
            console.log('[stripe-webhook] 500 credits added for user', userId);
          }
          await sendEmail(
            session.customer_email,
            'Votre abonnement Pro Savvly est actif',
            `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#4F46E5,#6D28D9);padding:40px;text-align:center;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:rgba(255,255,255,0.7);margin-bottom:12px;">SAVVLY</div>
      <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;">Bienvenue dans Savvly Pro !</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">Votre abonnement Pro est actif. Vous avez accès à tous les outils + <strong>500 crédits par mois</strong>.</p>
      <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.7;">Premier mois à 15€, puis 49€/mois. Résiliable à tout moment depuis votre compte.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="https://savvly.co/dashboard" style="display:inline-block;background:linear-gradient(135deg,#4F46E5,#6D28D9);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;">
          Accéder à mon dashboard →
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

    // ── Subscription updated (cancellation scheduled or reactivated) ─
    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object;
      const prev = event.data.previous_attributes || {};
      const upUserId = await findUserByCustomer(supabase, stripe, sub.customer);
      if (upUserId) {
        if (sub.cancel_at_period_end && sub.current_period_end) {
          // Cancellation scheduled — the API endpoint already wrote cancel_at to DB; just log
          console.log('[stripe-webhook] sub.updated | cancellation scheduled (log only), period_end:', safeToISO(sub.current_period_end));
        } else if (!sub.cancel_at_period_end && prev.cancel_at_period_end === true) {
          // Genuine reactivation: was cancel_at_period_end=true, now false
          await supabase.from('profiles').update({ cancel_at: null }).eq('id', upUserId);
          console.log('[stripe-webhook] sub.updated | reactivated, cancel_at cleared');
        } else {
          console.log('[stripe-webhook] sub.updated | no cancel_at change needed',
            '| cancel_at_period_end:', sub.cancel_at_period_end,
            '| prev.cancel_at_period_end:', prev.cancel_at_period_end);
        }
      }
    }

    // ── Subscription ended ─────────────────────────────────────
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const customerId = sub.customer;
      console.log('[stripe-webhook] subscription.deleted | customer:', customerId);

      const userId = await findUserByCustomer(supabase, stripe, customerId);
      console.log('[stripe-webhook] subscription.deleted | userId:', userId, '| period_end:', safeToISO(sub.current_period_end) ?? 'unknown');

      let userEmail = null;
      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (customer && !customer.deleted) userEmail = customer.email;
      } catch (e) {
        console.error('[stripe-webhook] failed to retrieve customer:', e.message);
      }

      const periodEndMs = sub.current_period_end * 1000;
      // Credits expire 90 days after the paid period ends; fall back to now if timestamp missing
      const creditsExpireSecs = (sub.current_period_end || Math.floor(Date.now() / 1000)) + 90 * 24 * 60 * 60;
      const creditsExpireAt = safeToISO(creditsExpireSecs);
      const periodStillActive = periodEndMs > Date.now();

      if (userId) {
        if (periodStillActive) {
          // Subscription deleted immediately (e.g. schedule cancelled) but user has paid time left.
          // Set plan=free in DB but store cancel_at so the frontend keeps showing Pro features
          // until the period actually ends. The email is NOT sent yet.
          const cancelAt = safeToISO(sub.current_period_end);
          await supabase
            .from('profiles')
            .update({ plan: 'free', cancel_at: cancelAt, credits_expire_at: creditsExpireAt })
            .eq('id', userId);
          console.log('[stripe-webhook] sub.deleted | period_end future — plan=free, Pro access kept until:', cancelAt);
        } else {
          // Period has ended — full downgrade now
          await supabase
            .from('profiles')
            .update({ plan: 'free', cancel_at: null, credits_expire_at: creditsExpireAt })
            .eq('id', userId);
          console.log('[stripe-webhook] sub.deleted | period past — downgraded to free, credits_expire_at:', creditsExpireAt);
        }
      }

      // Send "subscription ended" email only when the paid period is actually over
      if (!periodStillActive && userEmail) {
        await sendEmail(
          userEmail,
          'Votre abonnement Savvly Pro a pris fin',
          `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#1f2937;padding:40px;text-align:center;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:rgba(255,255,255,0.5);margin-bottom:12px;">SAVVLY</div>
      <h1 style="margin:0;font-size:24px;font-weight:800;color:#fff;">Votre abonnement Pro a pris fin</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
        Votre période Pro est terminée. Votre compte est maintenant sur le plan gratuit.
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.7;">
        Vos crédits restants sont conservés et utilisables pendant encore <strong>90 jours</strong>.
        Vos données et historique restent disponibles. Vous pouvez réactiver Pro à tout moment.
        Pour toute question : <a href="mailto:hello@savvly.co" style="color:#4F46E5;">hello@savvly.co</a>.
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
