import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import { GUIDE_RESOURCES } from './newsletter-guide.js';

export const config = { maxDuration: 30 };

const RESEND_API = 'https://api.resend.com/emails';

function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

function generatePDF() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = 210;
  const pageH = 297;
  const marginL = 18;
  const marginR = 18;
  const contentW = pageW - marginL - marginR;

  const INDIGO = [79, 70, 229];
  const DARK = [15, 15, 26];
  const GRAY = [100, 116, 139];
  const LIGHT = [248, 250, 252];
  const WHITE = [255, 255, 255];

  // ── Cover page ─────────────────────────────────────────────
  doc.setFillColor(...INDIGO);
  doc.rect(0, 0, pageW, pageH, 'F');

  // Decorative circle
  doc.setFillColor(255, 255, 255, 0.05);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.circle(pageW - 30, 40, 60);
  doc.circle(30, pageH - 40, 40);

  // Logo / brand
  doc.setTextColor(...WHITE);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('SAVVLY', marginL, 22);

  // Badge
  doc.setFillColor(255, 255, 255, 0.15);
  doc.roundedRect(marginL, 55, 52, 8, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('GUIDE GRATUIT', marginL + 4, 60.5);

  // Title
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  const titleLines = doc.splitTextToSize('10 Ressources Gratuites', contentW);
  doc.text(titleLines, marginL, 80);

  doc.setFontSize(22);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 255);
  doc.text('pour Freelances', marginL, 100);

  // Subtitle
  doc.setFontSize(12);
  doc.setTextColor(180, 190, 255);
  const subLines = doc.splitTextToSize(
    'Contrats, devis, scripts LinkedIn, calculateur TJM et bien plus — tout ce qu\'il vous faut pour lancer et développer votre activité.',
    contentW
  );
  doc.text(subLines, marginL, 118, { lineHeightFactor: 1.6 });

  // Divider
  doc.setDrawColor(255, 255, 255, 0.3);
  doc.setLineWidth(0.5);
  doc.line(marginL, 145, pageW - marginR, 145);

  // Resource list on cover
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(210, 215, 255);
  const cols = [
    GUIDE_RESOURCES.slice(0, 5),
    GUIDE_RESOURCES.slice(5),
  ];
  cols.forEach((col, ci) => {
    const x = ci === 0 ? marginL : pageW / 2 + 4;
    col.forEach((r, ri) => {
      doc.text(`${String(r.id).padStart(2, '0')}  ${r.title}`, x, 155 + ri * 10);
    });
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(160, 170, 230);
  doc.text('savvly.co  ·  Généré avec Savvly AI', marginL, pageH - 12);

  // ── Resource pages ──────────────────────────────────────────
  GUIDE_RESOURCES.forEach((resource) => {
    doc.addPage();

    // Header band
    doc.setFillColor(...INDIGO);
    doc.rect(0, 0, pageW, 28, 'F');

    // Brand
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text('SAVVLY', marginL, 10);

    // Resource number
    doc.setFontSize(8);
    doc.setTextColor(180, 190, 255);
    doc.text(`RESSOURCE ${resource.id} / 10`, pageW - marginR, 10, { align: 'right' });

    // Resource title
    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text(resource.title, marginL, 20);

    // Subtitle
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(210, 215, 255);
    doc.text(resource.subtitle, marginL, 35);

    // Content area
    let y = 44;
    const lines = resource.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for new page (leave 16mm margin at bottom)
      if (y > pageH - 22) {
        doc.addPage();
        // Minimal header on continuation pages
        doc.setFillColor(...LIGHT);
        doc.rect(0, 0, pageW, 12, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...GRAY);
        doc.text(resource.title, marginL, 8);
        doc.text('savvly.co', pageW - marginR, 8, { align: 'right' });
        y = 20;
      }

      // Section header (all-caps lines)
      if (line === line.toUpperCase() && line.trim().length > 3 && !line.startsWith('•') && !line.startsWith('□') && !line.startsWith('✗') && !line.startsWith('→') && !line.startsWith('[')) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...INDIGO);
        const wrapped = doc.splitTextToSize(line, contentW);
        doc.text(wrapped, marginL, y);
        y += wrapped.length * 5 + 2;
      }
      // Separator line
      else if (line.startsWith('─')) {
        doc.setDrawColor(...INDIGO);
        doc.setLineWidth(0.2);
        doc.line(marginL, y - 1, pageW - marginR, y - 1);
        y += 3;
      }
      // Checkbox / bullet items
      else if (line.startsWith('□') || line.startsWith('•') || line.startsWith('✗') || line.startsWith('→')) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK);
        const wrapped = doc.splitTextToSize(line, contentW);
        doc.text(wrapped, marginL, y);
        y += wrapped.length * 5 + 1;
      }
      // Empty line
      else if (line.trim() === '') {
        y += 3;
      }
      // Normal text
      else {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK);
        const wrapped = doc.splitTextToSize(line, contentW);
        doc.text(wrapped, marginL, y);
        y += wrapped.length * 5 + 1;
      }
    }

    // Page footer
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text('savvly.co', pageW / 2, pageH - 8, { align: 'center' });
    doc.text(`${resource.id + 1}`, pageW - marginR, pageH - 8, { align: 'right' });
  });

  // ── Back cover ─────────────────────────────────────────────
  doc.addPage();
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageW, pageH, 'F');

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  const ctaLines = doc.splitTextToSize('Prêt à passer à la vitesse supérieure ?', contentW);
  doc.text(ctaLines, pageW / 2, 100, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 170, 200);
  doc.text('Tous vos outils freelance en un seul endroit.', pageW / 2, 120, { align: 'center' });

  doc.setFillColor(...INDIGO);
  doc.roundedRect(pageW / 2 - 45, 135, 90, 14, 4, 4, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('Essayer Savvly gratuitement', pageW / 2, 144, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(120, 130, 160);
  doc.text('savvly.co', pageW / 2, 160, { align: 'center' });

  return doc.output('base64');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
      console.error('[subscribe-newsletter] DB insert error:', error.message);
      return res.status(500).json({ error: 'Failed to save subscriber' });
    }
    // 23505 = unique violation (already subscribed) — still send the PDF
  } catch (err) {
    console.error('[subscribe-newsletter] DB error:', err.message);
    return res.status(500).json({ error: 'Database error' });
  }

  // ── 2. Generate PDF ─────────────────────────────────────────
  let pdfBase64;
  try {
    pdfBase64 = generatePDF();
  } catch (err) {
    console.error('[subscribe-newsletter] PDF generation error:', err.message);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }

  // ── 3. Send email via Resend ────────────────────────────────
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
        subject: '🎁 Vos 10 ressources freelance gratuites',
        html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#4F46E5,#6D28D9);padding:40px 40px 32px;text-align:center;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:rgba(255,255,255,0.7);margin-bottom:12px;">SAVVLY</div>
      <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;line-height:1.3;">Vos 10 ressources freelance sont prêtes !</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">Bonjour,</p>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
        Merci d'avoir rejoint la communauté Savvly ! Votre guide PDF gratuit est en pièce jointe.
      </p>
      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#0f0f1a;">Ce que vous trouverez dans ce guide :</p>
      <ul style="margin:0 0 28px;padding-left:20px;font-size:14px;color:#374151;line-height:2;">
        <li>Modèle de contrat freelance complet</li>
        <li>Modèle de devis professionnel</li>
        <li>3 scripts LinkedIn haute performance</li>
        <li>Calculateur de TJM détaillé</li>
        <li>Checklist lancement en 30 étapes</li>
        <li>10 réponses aux objections clients</li>
        <li>Templates de relance impayés</li>
        <li>Guide URSSAF & fiscalité</li>
        <li>5 hooks LinkedIn à fort engagement</li>
        <li>Routine hebdomadaire du freelance performant</li>
      </ul>
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
      <p style="margin:0;font-size:12px;color:#9CA3AF;">© 2025 Savvly · <a href="https://savvly.co" style="color:#9CA3AF;">savvly.co</a></p>
    </div>
  </div>
</body>
</html>`,
        attachments: [
          {
            filename: '10-ressources-freelance-savvly.pdf',
            content: pdfBase64,
          },
        ],
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
    console.error('[subscribe-newsletter] fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
