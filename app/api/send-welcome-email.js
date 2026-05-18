export const config = { maxDuration: 10 };

const RESEND_API = 'https://api.resend.com/emails';

const COPY = {
  en: {
    subject: 'Welcome to Toolio 🎉',
    heading: 'Welcome to Toolio',
    intro: 'Your account is ready. You have <strong>50 free credits</strong> to get started — no credit card needed.',
    toolsHeading: 'Try these first',
    tools: [
      { name: 'LinkedIn Post', desc: 'Write a high-impact LinkedIn post in seconds.' },
      { name: 'Quote (Devis)',  desc: 'Generate a professional freelance quote instantly.' },
      { name: 'Follow-Up',      desc: 'Write a polished follow-up email to a prospect.' },
    ],
    cta: 'Start now',
    footer: 'You received this email because you signed up for Toolio.',
  },
  fr: {
    subject: 'Bienvenue sur Toolio 🎉',
    heading: 'Bienvenue sur Toolio',
    intro: 'Votre compte est prêt. Vous avez <strong>50 crédits offerts</strong> pour commencer — sans carte bancaire.',
    toolsHeading: 'Commencez par ces outils',
    tools: [
      { name: 'Post LinkedIn',  desc: 'Rédigez un post LinkedIn percutant en quelques secondes.' },
      { name: 'Devis',          desc: 'Générez un devis freelance professionnel instantanément.' },
      { name: 'Mail de relance', desc: 'Rédigez un email de relance soigné pour un prospect.' },
    ],
    cta: 'Commencer',
    footer: 'Vous recevez cet email car vous vous êtes inscrit sur Toolio.',
  },
};

function buildHtml(copy, name, dashboardUrl) {
  const firstName = name?.split(' ')[0] || '';
  const toolRows = copy.tools.map(tool => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
        <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#111827;">${tool.name}</p>
        <p style="margin:0;font-size:13px;color:#6b7280;">${tool.desc}</p>
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="padding:32px 32px 24px;border-bottom:1px solid #f3f4f6;">
            <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#111827;">Toolio</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${firstName ? `<p style="margin:0 0 16px;font-size:16px;color:#111827;">Hi ${firstName},</p>` : ''}
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">${copy.intro}</p>

            <p style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;">${copy.toolsHeading}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              ${toolRows}
            </table>

            <a href="${dashboardUrl}"
               style="display:inline-block;padding:12px 28px;background:#111827;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
              ${copy.cta} →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">${copy.footer}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, name, lang } = req.body ?? {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const copy = COPY[lang] ?? COPY.en;
  const dashboardUrl = 'https://app-alpha-rose-89.vercel.app/dashboard';

  try {
    const response = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Toolio <onboarding@resend.dev>',
        to: [email],
        subject: copy.subject,
        html: buildHtml(copy, name, dashboardUrl),
      }),
    });

    const json = await response.json();
    if (!response.ok) {
      console.error('[send-welcome-email] Resend error:', json);
      return res.status(500).json({ error: json.message || 'Failed to send email' });
    }

    console.log('[send-welcome-email] sent to:', email, '| id:', json.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('[send-welcome-email] fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
