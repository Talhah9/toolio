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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.RESEND_API_KEY) {
    console.error('[subscribe-newsletter] Missing RESEND_API_KEY');
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
      console.error('[subscribe-newsletter] DB insert error:', error.message, error);
      return res.status(500).json({ error: 'Failed to save subscriber' });
    }
    // 23505 = unique violation (already subscribed) — still send the email
  } catch (err) {
    console.error('[subscribe-newsletter] DB error:', err.message, err.stack);
    return res.status(500).json({ error: 'Database error' });
  }

  // ── 2. Send confirmation email via Resend ───────────────────
  try {
    const response = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Savvly <onboarding@resend.dev>',
        to: [normalizedEmail],
        subject: 'Bienvenue dans le club des entrepreneurs — Savvly',
        html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#4F46E5,#6D28D9);padding:40px 40px 32px;text-align:center;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:rgba(255,255,255,0.7);margin-bottom:12px;">SAVVLY</div>
      <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;line-height:1.3;">Bienvenue dans le club !</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">Bonjour,</p>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
        Merci d'avoir rejoint le club des entrepreneurs Savvly. Vous recevrez bientôt des ressources exclusives pour développer votre activité freelance.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">
        En attendant, découvrez nos outils IA pour freelances — contrats, devis, posts LinkedIn et plus encore.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://savvly.co" style="display:inline-block;background:linear-gradient(135deg,#4F46E5,#6D28D9);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;">
          Essayer Savvly gratuitement →
        </a>
      </div>
      <p style="margin:0;font-size:13px;color:#9CA3AF;text-align:center;">
        Créez vos contrats, devis et posts LinkedIn en 30 secondes avec l'IA.
      </p>
    </div>
    <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9CA3AF;">© 2026 Savvly · <a href="https://savvly.co" style="color:#9CA3AF;">savvly.co</a></p>
    </div>
  </div>
</body>
</html>`,
      }),
    });

    const json = await response.json();
    if (!response.ok) {
      console.error('[subscribe-newsletter] Resend error:', json);
      return res.status(500).json({ error: json.message || 'Failed to send email' });
    }

    console.log('[subscribe-newsletter] sent to:', normalizedEmail, '| id:', json.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('[subscribe-newsletter] fetch error:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
}
