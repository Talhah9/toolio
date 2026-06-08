import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 20 };

const RESEND_API = 'https://api.resend.com/emails';

function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function handler(req, res) {
  // ── Env debug (visible in Vercel function logs) ─────────────
  console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
  console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
  console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.RESEND_API_KEY) {
    console.error('NEWSLETTER ERROR: Missing RESEND_API_KEY');
    return res.status(500).json({ error: 'Missing RESEND_API_KEY' });
  }

  const { email } = req.body ?? {};
  if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // ── 1. Insert subscriber ────────────────────────────────────
  try {
    const admin = getAdminClient();
    const { error } = await admin
      .from('newsletter_subscribers')
      .insert({ email: normalizedEmail, source: 'landing' });

    if (error && error.code !== '23505') {
      console.error('NEWSLETTER ERROR (DB insert):', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return res.status(500).json({ error: 'Failed to save subscriber: ' + error.message });
    }
    // 23505 = unique violation (already subscribed) — still send the email
  } catch (err) {
    console.error('NEWSLETTER ERROR (DB catch):', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    return res.status(500).json({ error: err.message });
  }

  // ── 2. Send confirmation email via Resend ───────────────────
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
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="vertical-align:middle;width:32px;">
              <div style="width:28px;height:28px;border-radius:50%;background:#4F46E5;color:#fff;font-size:12px;font-weight:800;text-align:center;line-height:28px;flex-shrink:0;">${r.n}</div>
            </td>
            <td style="padding-left:12px;vertical-align:middle;">
              <span style="font-size:13px;font-weight:600;color:#111827;">${r.name}</span>
            </td>
            <td style="text-align:right;vertical-align:middle;white-space:nowrap;padding-left:12px;">
              <a href="${r.url}" style="display:inline-block;background:#4F46E5;color:#fff;text-decoration:none;font-size:12px;font-weight:700;padding:6px 14px;border-radius:6px;">Télécharger →</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join('');

  try {
    const response = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Savvly <hello@savvly.co>',
        reply_to: 'hello@savvly.co',
        to: [normalizedEmail],
        subject: '🎁 Vos 10 ressources gratuites sont là — Savvly',
        html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px 48px;">
    <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

      <!-- Header -->
      <tr><td style="background:#4F46E5;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
        <p style="margin:0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.02em;">Savvly<span style="color:rgba(255,255,255,0.5);">.</span></p>
      </td></tr>

      <!-- Hero -->
      <tr><td style="background:#fff;padding:40px 40px 28px;text-align:center;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
        <div style="font-size:40px;margin-bottom:16px;">🎁</div>
        <h1 style="margin:0 0 12px;font-size:24px;font-weight:900;color:#0F172A;letter-spacing:-0.02em;">Vos ressources sont arrivées</h1>
        <p style="margin:0;font-size:15px;color:#6B7280;line-height:1.6;">10 ressources testées et approuvées pour booster votre business.</p>
      </td></tr>

      <!-- Resources list -->
      <tr><td style="background:#fff;padding:0 40px 8px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
          ${resourceRows}
        </table>
      </td></tr>

      <!-- Divider + CTA -->
      <tr><td style="background:#fff;padding:28px 40px 36px;text-align:center;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
        <p style="margin:0 0 20px;font-size:14px;color:#6B7280;line-height:1.6;">
          Ces ressources vous sont offertes par <strong style="color:#111827;">Savvly</strong>.<br>
          Découvrez aussi nos outils IA pour freelances — contrats, devis, posts LinkedIn.
        </p>
        <a href="https://savvly.co" style="display:inline-block;background:#4F46E5;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;">
          Découvrez Savvly gratuitement →
        </a>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#F9FAFB;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border:1px solid #e5e7eb;border-top:none;">
        <p style="margin:0;font-size:12px;color:#9CA3AF;">
          © 2026 Savvly · <a href="https://savvly.co" style="color:#9CA3AF;text-decoration:none;">savvly.co</a>
          &nbsp;·&nbsp;
          <a href="https://savvly.co" style="color:#9CA3AF;text-decoration:none;">Se désabonner</a>
        </p>
      </td></tr>

    </table>
    </td></tr>
  </table>
</body>
</html>`,
      }),
    });

    const json = await response.json();
    if (!response.ok) {
      console.error('NEWSLETTER ERROR (Resend):', {
        status: response.status,
        body: json,
      });
      return res.status(500).json({ error: json.message || 'Failed to send email' });
    }

    console.log('[subscribe-newsletter] sent to:', normalizedEmail, '| id:', json.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('NEWSLETTER ERROR (Resend catch):', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    res.status(500).json({ error: err.message });
  }
}
