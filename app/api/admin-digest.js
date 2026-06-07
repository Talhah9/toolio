import { verifyAdmin, fetchAdminStats, ADMIN_EMAIL } from './_admin-queries.js';

export const config = { maxDuration: 30 };

const RESEND_API = 'https://api.resend.com/emails';

function buildDigestHtml(stats, dateStr) {
  const topTool = stats.toolUsage[0];
  const rows = stats.toolUsage.slice(0, 8).map(t => `
    <tr>
      <td style="padding:8px 12px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;">${t.tool_id}</td>
      <td style="padding:8px 12px;font-size:13px;color:#111827;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">${t.count}</td>
    </tr>`).join('');

  const recentRows = stats.recentUsers.slice(0, 5).map(u => `
    <tr>
      <td style="padding:8px 12px;font-size:12px;color:#374151;border-bottom:1px solid #f3f4f6;">${u.email}</td>
      <td style="padding:8px 12px;font-size:12px;text-align:center;border-bottom:1px solid #f3f4f6;">
        <span style="padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;background:${u.plan === 'pro' ? '#ede9fe' : '#f3f4f6'};color:${u.plan === 'pro' ? '#7c3aed' : '#6b7280'};">${u.plan}</span>
      </td>
      <td style="padding:8px 12px;font-size:12px;color:#6b7280;text-align:right;border-bottom:1px solid #f3f4f6;">${u.credits} cr</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px 48px;">
  <tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

    <!-- Header -->
    <tr><td style="background:#0a0a0a;border-radius:12px 12px 0 0;padding:24px 32px;">
      <p style="margin:0;font-size:20px;font-weight:800;color:#fff;">Savvly<span style="color:#4F46E5;">.</span></p>
      <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.4);">Weekly digest — ${dateStr}</p>
    </td></tr>

    <!-- KPIs -->
    <tr><td style="background:#fff;padding:28px 32px 20px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
      <p style="margin:0 0 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Key metrics</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:25%;text-align:center;padding:12px 8px;background:#fafafa;border-radius:8px;">
            <p style="margin:0;font-size:24px;font-weight:800;color:#111827;">${stats.totalUsers}</p>
            <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">Total users</p>
          </td>
          <td style="width:4%;"></td>
          <td style="width:25%;text-align:center;padding:12px 8px;background:#fafafa;border-radius:8px;">
            <p style="margin:0;font-size:24px;font-weight:800;color:#4F46E5;">${stats.proUsers}</p>
            <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">Pro users</p>
          </td>
          <td style="width:4%;"></td>
          <td style="width:25%;text-align:center;padding:12px 8px;background:#fafafa;border-radius:8px;">
            <p style="margin:0;font-size:24px;font-weight:800;color:#111827;">€${stats.mrr}</p>
            <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">Est. MRR</p>
          </td>
          <td style="width:4%;"></td>
          <td style="width:25%;text-align:center;padding:12px 8px;background:#fafafa;border-radius:8px;">
            <p style="margin:0;font-size:24px;font-weight:800;color:#111827;">${stats.monthlyGens}</p>
            <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">Gens (MTD)</p>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">
        <strong style="color:#111827;">${stats.newThisWeek}</strong> new signup${stats.newThisWeek !== 1 ? 's' : ''} this week ·
        <strong style="color:#dc2626;">${stats.lowCreditUsers.length}</strong> user${stats.lowCreditUsers.length !== 1 ? 's' : ''} with &lt;20 credits
        ${topTool ? ` · Top tool: <strong style="color:#111827;">${topTool.tool_id}</strong> (${topTool.count} uses)` : ''}
      </p>
    </td></tr>

    <!-- Tool usage -->
    <tr><td style="background:#fff;padding:0 32px 24px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Tool usage this month</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:8px;overflow:hidden;">
        ${rows || '<tr><td style="padding:16px;font-size:13px;color:#9ca3af;text-align:center;">No generations yet</td></tr>'}
      </table>
    </td></tr>

    <!-- Recent signups -->
    <tr><td style="background:#fff;padding:0 32px 24px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Recent signups</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:8px;overflow:hidden;">
        ${recentRows || '<tr><td style="padding:16px;font-size:13px;color:#9ca3af;text-align:center;">No recent signups</td></tr>'}
      </table>
    </td></tr>

    <!-- CTA -->
    <tr><td style="background:#fff;padding:0 32px 32px;text-align:center;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px;">
        <tr><td style="background:#4F46E5;border-radius:8px;">
          <a href="https://savvly.co/admin" style="display:inline-block;padding:11px 24px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;">
            Open Admin Dashboard →
          </a>
        </td></tr>
      </table>
      <a href="https://dashboard.stripe.com" style="font-size:12px;color:#9ca3af;">Stripe Dashboard</a>
    </td></tr>

    <!-- Footer -->
    <tr><td style="background:#f3f4f6;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Savvly internal digest · sent every Monday at 8am UTC</p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth: JWT for manual trigger, CRON_SECRET header for scheduled call
  const cronSecret = process.env.CRON_SECRET;
  const authHeader  = req.headers['authorization'] ?? '';
  const isCron      = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCron) {
    const email = await verifyAdmin(req, res);
    if (!email) return;
  }

  try {
    const stats  = await fetchAdminStats();
    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const response = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Savvly <hello@savvly.co>',
        reply_to: 'hello@savvly.co',
        to: [ADMIN_EMAIL],
        subject: `Savvly Weekly Digest — ${dateStr}`,
        html: buildDigestHtml(stats, dateStr),
      }),
    });

    const json = await response.json();
    if (!response.ok) {
      console.error('[admin-digest] Resend error:', json);
      return res.status(500).json({ error: json.message });
    }

    console.log('[admin-digest] sent | id:', json.id);
    res.json({ ok: true, id: json.id });
  } catch (err) {
    console.error('[admin-digest] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
