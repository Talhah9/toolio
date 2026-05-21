import jsPDF from 'jspdf';

// Strip characters and patterns jsPDF can't handle
function sanitize(str) {
  return str
    // Remove ALL emoji and special unicode (comprehensive range)
    .replace(/[\u{1F000}-\u{1FFFF}|\u{2600}-\u{27BF}|\u{FE00}-\u{FE0F}|\u{1F900}-\u{1F9FF}|\u{2300}-\u{23FF}|\u{2B00}-\u{2BFF}|\u{1FA00}-\u{1FA9F}]/gu, '')
    // Lines that are only % characters (Claude separator artifacts)
    .replace(/^%+$/gm, '')
    // Arrow and special punctuation → ASCII equivalents
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[–—]/g, '-')
    // Remove markdown bold/italic
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    // Clean up multiple spaces
    .replace(/  +/g, ' ')
    // Strip any remaining non-ASCII as last resort
    .replace(/[^\x00-\x7F]/g, '')
    .trim();
}

export function exportPdf({ toolName, userEmail, output, filename }) {
  const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW  = 210;
  const pageH  = 297;
  const margin = 20;
  const maxW   = pageW - margin * 2;
  const lineH  = 7;
  const date   = new Date().toLocaleDateString('en-GB');

  let y = margin;

  const addPage = () => { doc.addPage(); y = margin; };
  const checkY  = (needed) => { if (y + needed > pageH - margin) addPage(); };

  // ── Header ──────────────────────────────────────────────────
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Savvly', margin, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(140, 140, 140);
  doc.text(date, pageW - margin, y, { align: 'right' });

  y += 6;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(sanitize(toolName), margin, y);

  if (userEmail) {
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 140);
    doc.text(userEmail, margin, y);
  }

  // ── Divider ─────────────────────────────────────────────────
  y += 7;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── Body ─────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);

  for (const rawLine of output.split('\n')) {
    const trimmed = rawLine.trim();

    // Horizontal rules: ---, ===, ***
    if (/^[-=*]{3,}$/.test(trimmed)) {
      checkY(8);
      y += 2;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
      continue;
    }

    // Table separator rows  | --- | :---: |
    if (/^\|[\s\-:|]+\|/.test(trimmed)) continue;

    // Headings
    const isH1 = rawLine.startsWith('# ');
    const isH2 = rawLine.startsWith('## ');
    const isH3 = rawLine.startsWith('### ');

    if (isH1 || isH2 || isH3) {
      const text     = sanitize(rawLine.replace(/^#{1,3}\s+/, ''));
      const fontSize = isH1 ? 13 : isH2 ? 11 : 10;
      checkY(lineH + (isH1 ? 4 : 2));
      y += isH1 ? 4 : 2;
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'bold');
      doc.text(text, margin, y);
      y += lineH;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      continue;
    }

    // Table rows  | col | col |
    if (trimmed.startsWith('|')) {
      const cells = trimmed.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const text  = sanitize(cells.join('   '));
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      for (const wl of doc.splitTextToSize(text, maxW)) {
        checkY(lineH);
        doc.text(wl, margin, y);
        y += lineH;
      }
      continue;
    }

    // Empty line
    if (trimmed === '') {
      y += 3;
      continue;
    }

    // Regular text
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    for (const wl of doc.splitTextToSize(sanitize(rawLine), maxW)) {
      checkY(lineH);
      doc.text(wl, margin, y);
      y += lineH;
    }
  }

  doc.save(filename || `savvly-${Date.now()}.pdf`);
}
