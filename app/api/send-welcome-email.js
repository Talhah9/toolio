import { welcomeEmailHtml, welcomeEmailSubject } from './email-templates/welcome.js';

export const config = { maxDuration: 10 };

const RESEND_API = 'https://api.resend.com/emails';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, name, lang } = req.body ?? {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const firstName = name?.trim().split(' ')[0] || '';

  try {
    const response = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Savvly <onboarding@resend.dev>',
        to: [email],
        subject: welcomeEmailSubject(lang),
        html: welcomeEmailHtml({ firstName, lang }),
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
