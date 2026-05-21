const COPY = {
  en: {
    subject: 'Welcome to Savvly 🎉',
    tagline: 'Every tool a savvy freelancer needs. Powered by AI.',
    hero: (firstName) => firstName ? `Welcome ${firstName} 👋` : 'Welcome 👋',
    heroSub: "You have <strong style=\"color:#4F46E5;\">50 credits</strong> to get started. No card needed.",
    toolsHeading: 'Start with these',
    tools: [
      {
        emoji: '✍️',
        name: 'LinkedIn Post',
        badge: 'Free',
        desc: 'Write your first viral post',
      },
      {
        emoji: '📄',
        name: 'Quote Generator',
        badge: 'Free',
        desc: 'Send a professional quote in 60s',
      },
      {
        emoji: '📩',
        name: 'Follow-Up',
        badge: 'Free',
        desc: 'Never chase a client again',
      },
    ],
    cta: 'Start for free →',
    creditsNote: 'Your 50 credits <strong>never expire</strong>. Use them anytime.',
    footerLine1: 'You received this email because you created a Savvly account.',
    unsubscribe: 'Unsubscribe',
    legal: '© 2026 Savvly. All rights reserved.',
  },
  fr: {
    subject: 'Bienvenue sur Savvly 🎉',
    tagline: 'Tous les outils dont un freelance avisé a besoin. Propulsé par l'IA.',
    hero: (firstName) => firstName ? `Bienvenue ${firstName} 👋` : 'Bienvenue 👋',
    heroSub: "Vous avez <strong style=\"color:#4F46E5;\">50 crédits</strong> pour commencer. Sans carte bancaire.",
    toolsHeading: 'Commencez par ces outils',
    tools: [
      {
        emoji: '✍️',
        name: 'Post LinkedIn',
        badge: 'Gratuit',
        desc: 'Rédigez votre premier post viral',
      },
      {
        emoji: '📄',
        name: 'Générateur de devis',
        badge: 'Gratuit',
        desc: 'Envoyez un devis pro en 60 secondes',
      },
      {
        emoji: '📩',
        name: 'Mail de relance',
        badge: 'Gratuit',
        desc: 'Ne relancez plus jamais un client',
      },
    ],
    cta: 'Commencer gratuitement →',
    creditsNote: 'Vos 50 crédits <strong>n\'expirent jamais</strong>. Utilisez-les quand vous voulez.',
    footerLine1: 'Vous recevez cet email car vous avez créé un compte Savvly.',
    unsubscribe: 'Se désabonner',
    legal: '© 2026 Savvly. Tous droits réservés.',
  },
};

export function welcomeEmailSubject(lang) {
  return (COPY[lang] ?? COPY.en).subject;
}

export function welcomeEmailHtml({ firstName, lang }) {
  const c = COPY[lang] ?? COPY.en;
  const DASHBOARD = 'https://app-alpha-rose-89.vercel.app/dashboard';

  const toolCards = c.tools.map(tool => `
        <tr>
          <td style="padding:0 0 12px;">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#fafafa;border:1px solid #efefef;border-radius:10px;">
              <tr>
                <td style="padding:16px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align:middle;">
                        <span style="font-size:22px;line-height:1;">${tool.emoji}</span>
                      </td>
                      <td style="padding-left:14px;vertical-align:middle;">
                        <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#0a0a0a;">${tool.name}
                          <span style="display:inline-block;margin-left:8px;padding:2px 8px;background:#f0fdf4;color:#16a34a;font-size:11px;font-weight:600;border-radius:20px;">${tool.badge}</span>
                        </p>
                        <p style="margin:0;font-size:13px;color:#6b7280;">${tool.desc}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="${lang === 'fr' ? 'fr' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${c.subject}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:#f3f4f6;padding:32px 16px 48px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width:600px;">

          <!-- ── HEADER ─────────────────────────────────────────── -->
          <tr>
            <td style="background:#0a0a0a;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">
                Savvly<span style="color:#4F46E5;">.</span>
              </p>
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.45);letter-spacing:0.02em;">
                ${c.tagline}
              </p>
            </td>
          </tr>

          <!-- ── HERO ───────────────────────────────────────────── -->
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;text-align:center;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              <h1 style="margin:0 0 14px;font-size:28px;font-weight:800;letter-spacing:-0.5px;color:#0a0a0a;line-height:1.2;">
                ${c.hero(firstName)}
              </h1>
              <p style="margin:0;font-size:16px;line-height:1.6;color:#374151;">
                ${c.heroSub}
              </p>
            </td>
          </tr>

          <!-- ── DIVIDER ────────────────────────────────────────── -->
          <tr>
            <td style="background:#ffffff;padding:0 40px;text-align:center;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              <p style="margin:0;font-size:16px;letter-spacing:6px;color:#fad02c;">&#9733;&#9733;&#9733;</p>
            </td>
          </tr>

          <!-- ── TOOLS ──────────────────────────────────────────── -->
          <tr>
            <td style="background:#ffffff;padding:8px 40px 32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              <p style="margin:0 0 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;">
                ${c.toolsHeading}
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${toolCards}
              </table>
            </td>
          </tr>

          <!-- ── CTA ────────────────────────────────────────────── -->
          <tr>
            <td style="background:#ffffff;padding:0 40px 32px;text-align:center;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:8px;background:#4F46E5;">
                    <a href="${DASHBOARD}"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.01em;">
                      ${c.cta}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── CREDITS NOTE ───────────────────────────────────── -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border:1px solid #e5e7eb;">
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">
                ${c.creditsNote}
              </p>
            </td>
          </tr>

          <!-- ── FOOTER ─────────────────────────────────────────── -->
          <tr>
            <td style="background:#f3f4f6;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">${c.footerLine1}</p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                <a href="${DASHBOARD}" style="color:#9ca3af;text-decoration:underline;">${c.unsubscribe}</a>
                &nbsp;&middot;&nbsp;${c.legal}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}
