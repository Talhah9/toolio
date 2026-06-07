import jsPDF from 'jspdf';

const ACCENT   = [79, 70, 229];
const ACCENT_L = [238, 242, 255];
const DARK     = [15, 15, 26];
const MID      = [80, 80, 100];
const SOFT     = [150, 150, 165];
const BORDER   = [220, 220, 230];
const WHITE    = [255, 255, 255];

function sanitize(str) {
  if (!str) return '';
  return str
    .replace(/[\u{1F000}-\u{1FFFF}|\u{2600}-\u{27BF}|\u{FE00}-\u{FE0F}|\u{1F900}-\u{1F9FF}|\u{2300}-\u{23FF}|\u{2B00}-\u{2BFF}|\u{1FA00}-\u{1FA9F}]/gu, '')
    .replace(/^%+$/gm, '')
    .replace(/→/g, '->').replace(/←/g, '<-')
    .replace(/['']/g, "'").replace(/[""]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`(.*?)`/g, '$1')
    .replace(/  +/g, ' ')
    .replace(/[^\x00-\xFF]/g, '')
    .trim();
}

// ── Contract PDF ──────────────────────────────────────────────────────────────
function exportContractPdf({ doc, output, toolName, userEmail }) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 25;
  const maxW = pageW - margin * 2;
  const LH = 6.5;
  const FOOTER_H = 16;

  let page = 1;
  let y = 0;

  // ── Cover page ────────────────────────────────────────────────
  // Purple header band
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, pageW, 48, 'F');

  // Brand top-left
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('SAVVLY', margin, 14);

  // Date top-right
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 255);
  doc.text(new Date().toLocaleDateString('fr-FR'), pageW - margin, 14, { align: 'right' });

  // Main title
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  const title = sanitize(toolName || 'CONTRAT DE PRESTATION').toUpperCase();
  doc.text(title, pageW / 2, 34, { align: 'center' });

  // Purple accent line under header
  doc.setFillColor(...ACCENT);
  doc.rect(margin, 52, maxW, 2, 'F');

  y = 68;

  const addFooter = (p) => {
    doc.setPage(p);
    const fy = pageH - 8;
    doc.setDrawColor(...BORDER);
    doc.line(margin, fy - 5, pageW - margin, fy - 5);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SOFT);
    doc.text('Document confidentiel · savvly.co', margin, fy);
    doc.text(`${p}`, pageW - margin, fy, { align: 'right' });
  };

  const addPage = () => {
    addFooter(page);
    doc.addPage();
    page++;
    y = margin;

    // Mini header on continuation pages
    doc.setFillColor(248, 248, 252);
    doc.rect(0, 0, pageW, 12, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MID);
    doc.text('SAVVLY', margin, 8);
    doc.text(sanitize(toolName || 'Contrat'), pageW - margin, 8, { align: 'right' });
    y = 20;
  };

  const checkY = (needed) => {
    if (y + needed > pageH - FOOTER_H - margin) addPage();
  };

  // ── Body ─────────────────────────────────────────────────────
  doc.setTextColor(...DARK);
  const lines = (output || '').split('\n');

  let tableStarted = false, tableIsHeader = false, tableDataRow = 0, colCount = 0;
  let articleCount = 0;

  for (let li = 0; li < lines.length; li++) {
    const raw = lines[li];
    const trim = raw.trim();

    // HR
    if (/^[-=*]{3,}$/.test(trim)) {
      checkY(8);
      y += 2;
      doc.setDrawColor(...BORDER);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
      tableStarted = false;
      continue;
    }

    // Table separator
    if (/^\|[\s\-:|]+\|$/.test(trim)) {
      tableIsHeader = false; tableDataRow = 0;
      continue;
    }

    // Table row
    if (trim.startsWith('|')) {
      const cells = trim.replace(/^\||\|$/g, '').split('|').map(c => sanitize(c.trim()));
      if (!cells.length) continue;
      if (!tableStarted) { tableStarted = true; tableIsHeader = true; tableDataRow = 0; colCount = cells.length; y += 2; }
      const colW = maxW / colCount;
      checkY(8);
      cells.forEach((cell, ci) => {
        const cx = margin + ci * colW;
        const cy = y - 7 + 2;
        if (tableIsHeader) { doc.setFillColor(...ACCENT); doc.rect(cx, cy, colW, 7, 'F'); }
        else if (tableDataRow % 2 === 0) { doc.setFillColor(245, 245, 252); doc.rect(cx, cy, colW, 7, 'F'); }
        doc.setDrawColor(...BORDER); doc.rect(cx, cy, colW, 7, 'S');
        doc.setFontSize(8.5); doc.setFont('helvetica', tableIsHeader ? 'bold' : 'normal');
        doc.setTextColor(...(tableIsHeader ? WHITE : DARK));
        const t = cell.length > 38 ? cell.slice(0, 36) + '..' : cell;
        doc.text(t, cx + 2.5, y - 0.5);
      });
      y += 7;
      if (!tableIsHeader) tableDataRow++;
      tableIsHeader = false;
      continue;
    }

    tableStarted = false; tableIsHeader = false; tableDataRow = 0;

    if (trim === '') { y += 3; continue; }

    const isH1 = raw.startsWith('# ')  && !raw.startsWith('## ');
    const isH2 = raw.startsWith('## ') && !raw.startsWith('### ');
    const isH3 = raw.startsWith('### ');

    if (isH1) {
      const text = sanitize(raw.replace(/^#\s+/, ''));
      if (!text) continue;
      checkY(20);
      y += 8;
      // Article number badge
      articleCount++;
      doc.setFillColor(...ACCENT);
      doc.roundedRect(margin, y - 8, 28, 10, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...WHITE);
      doc.text(`Art. ${articleCount}`, margin + 14, y - 1, { align: 'center' });
      // Article title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...DARK);
      doc.text(text, margin + 34, y - 1);
      y += 7;
      doc.setDrawColor(...BORDER);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
    } else if (isH2) {
      const text = sanitize(raw.replace(/^##\s+/, ''));
      if (!text) continue;
      checkY(14);
      y += 5;
      doc.setFillColor(...ACCENT);
      doc.rect(margin, y - 5, 3, 8, 'F');
      doc.setFillColor(...ACCENT_L);
      doc.rect(margin + 3, y - 5, maxW - 3, 8, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...ACCENT);
      doc.text(text, margin + 7, y);
      doc.setTextColor(...DARK);
      y += 7;
    } else if (isH3) {
      const text = sanitize(raw.replace(/^###\s+/, ''));
      if (!text) continue;
      checkY(10);
      y += 4;
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...MID);
      doc.text(text.toUpperCase(), margin, y);
      doc.setTextColor(...DARK);
      y += LH;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK);
      const wrapped = doc.splitTextToSize(sanitize(raw), maxW - (raw.startsWith('  ') ? 10 : 0));
      const indent = raw.startsWith('  ') ? margin + 10 : margin;
      for (const wl of wrapped) {
        checkY(LH);
        doc.text(wl, indent, y);
        y += LH;
      }
    }
  }

  // ── Signature block ──────────────────────────────────────────
  checkY(60);
  y += 12;
  doc.setDrawColor(...BORDER);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('Signatures', margin, y);
  y += 10;

  const colMid = pageW / 2 - 5;
  const sigW = colMid - margin - 5;
  const sigH = 28;

  // Left: Prestataire
  doc.setDrawColor(...BORDER);
  doc.rect(margin, y, sigW, sigH, 'S');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT);
  doc.text('LE PRESTATAIRE', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MID);
  doc.text('Signature précédée de « Bon pour accord »', margin + 4, y + sigH - 4);

  // Right: Client
  doc.rect(pageW / 2 + 5, y, sigW, sigH, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT);
  doc.text('LE CLIENT', pageW / 2 + 9, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MID);
  doc.text('Signature précédée de « Bon pour accord »', pageW / 2 + 9, y + sigH - 4);

  y += sigH + 16;

  // Date line
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MID);
  doc.text(`Fait le ${new Date().toLocaleDateString('fr-FR')}`, margin, y);
  if (userEmail) doc.text(sanitize(userEmail), pageW - margin, y, { align: 'right' });

  // Footers
  const total = doc.getNumberOfPages ? doc.getNumberOfPages() : doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) addFooter(p);
}

// ── Legal PDF (CGV / Privacy / Mentions) ─────────────────────────────────────
function exportLegalPdf({ doc, output, toolName, userEmail }) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 25;
  const maxW = pageW - margin * 2;
  const LH = 6.5;
  const FOOTER_H = 16;

  let page = 1;
  let y = 0;

  // Header band
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, pageW, 16, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('SAVVLY', margin, 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 255);
  doc.text(sanitize(toolName || 'Document juridique'), pageW - margin, 10, { align: 'right' });

  y = 28;

  const addFooter = (p) => {
    doc.setPage(p);
    const fy = pageH - 8;
    doc.setDrawColor(...BORDER);
    doc.line(margin, fy - 5, pageW - margin, fy - 5);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SOFT);
    doc.text('savvly.co', margin, fy);
    doc.text(`${p}`, pageW - margin, fy, { align: 'right' });
  };

  const addPage = () => {
    addFooter(page);
    doc.addPage();
    page++;
    // Mini header
    doc.setFillColor(248, 248, 252);
    doc.rect(0, 0, pageW, 12, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MID);
    doc.text('SAVVLY', margin, 8);
    doc.text(sanitize(toolName || ''), pageW - margin, 8, { align: 'right' });
    y = 20;
  };

  const checkY = (needed) => {
    if (y + needed > pageH - FOOTER_H - margin) addPage();
  };

  doc.setTextColor(...DARK);
  const lines = (output || '').split('\n');

  let tableStarted = false, tableIsHeader = false, tableDataRow = 0, colCount = 0;

  for (let li = 0; li < lines.length; li++) {
    const raw = lines[li];
    const trim = raw.trim();

    if (/^[-=*]{3,}$/.test(trim)) {
      checkY(8);
      y += 2;
      doc.setDrawColor(...BORDER);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
      tableStarted = false;
      continue;
    }

    if (/^\|[\s\-:|]+\|$/.test(trim)) { tableIsHeader = false; tableDataRow = 0; continue; }

    if (trim.startsWith('|')) {
      const cells = trim.replace(/^\||\|$/g, '').split('|').map(c => sanitize(c.trim()));
      if (!cells.length) continue;
      if (!tableStarted) { tableStarted = true; tableIsHeader = true; tableDataRow = 0; colCount = cells.length; y += 2; }
      const colW = maxW / colCount;
      checkY(8);
      cells.forEach((cell, ci) => {
        const cx = margin + ci * colW;
        const cy = y - 7 + 2;
        if (tableIsHeader) { doc.setFillColor(...ACCENT); doc.rect(cx, cy, colW, 7, 'F'); }
        else if (tableDataRow % 2 === 0) { doc.setFillColor(245, 245, 252); doc.rect(cx, cy, colW, 7, 'F'); }
        doc.setDrawColor(...BORDER); doc.rect(cx, cy, colW, 7, 'S');
        doc.setFontSize(8.5); doc.setFont('helvetica', tableIsHeader ? 'bold' : 'normal');
        doc.setTextColor(...(tableIsHeader ? WHITE : DARK));
        const t = cell.length > 38 ? cell.slice(0, 36) + '..' : cell;
        doc.text(t, cx + 2.5, y - 0.5);
      });
      y += 7;
      if (!tableIsHeader) tableDataRow++;
      tableIsHeader = false;
      continue;
    }

    tableStarted = false; tableIsHeader = false; tableDataRow = 0;

    if (trim === '') { y += 3; continue; }

    const isH1 = raw.startsWith('# ')  && !raw.startsWith('## ');
    const isH2 = raw.startsWith('## ') && !raw.startsWith('### ');
    const isH3 = raw.startsWith('### ');

    if (isH1) {
      const text = sanitize(raw.replace(/^#\s+/, ''));
      if (!text) continue;
      checkY(22);
      y += 10;
      doc.setFillColor(...ACCENT);
      doc.rect(0, y - 9, pageW, 18, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...WHITE);
      doc.text(text, margin, y + 2);
      doc.setTextColor(...DARK);
      y += 16;
    } else if (isH2) {
      const text = sanitize(raw.replace(/^##\s+/, ''));
      if (!text) continue;
      checkY(16);
      y += 6;
      doc.setFillColor(...ACCENT);
      doc.rect(margin, y - 5, 4, 9, 'F');
      doc.setFillColor(...ACCENT_L);
      doc.rect(margin + 4, y - 5, maxW - 4, 9, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...ACCENT);
      doc.text(text, margin + 9, y + 1);
      doc.setTextColor(...DARK);
      y += 9;
    } else if (isH3) {
      const text = sanitize(raw.replace(/^###\s+/, ''));
      if (!text) continue;
      checkY(10);
      y += 5;
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...MID);
      doc.text(text.toUpperCase(), margin, y);
      doc.setTextColor(...DARK);
      y += LH;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK);
      const wrapped = doc.splitTextToSize(sanitize(raw), maxW);
      for (const wl of wrapped) {
        checkY(LH);
        doc.text(wl, margin, y);
        y += LH;
      }
    }
  }

  const total = doc.getNumberOfPages ? doc.getNumberOfPages() : doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) addFooter(p);
}

// ── Generic PDF fallback ──────────────────────────────────────────────────────
function exportGenericPdf({ doc, output, toolName, userEmail }) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 25;
  const maxW = pageW - margin * 2;
  const LH = 6.5;
  const FOOTER_H = 16;

  let page = 1;
  let y = margin;

  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, pageW, 14, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('SAVVLY', margin, 9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 255);
  doc.text(sanitize(toolName || ''), pageW - margin, 9, { align: 'right' });

  y = 24;

  const addFooter = (p) => {
    doc.setPage(p);
    const fy = pageH - 8;
    doc.setDrawColor(...BORDER);
    doc.line(margin, fy - 5, pageW - margin, fy - 5);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SOFT);
    doc.text(new Date().toLocaleDateString('fr-FR'), margin, fy);
    if (userEmail) doc.text(sanitize(userEmail), pageW / 2, fy, { align: 'center' });
    doc.text(`${p}`, pageW - margin, fy, { align: 'right' });
  };

  const addPage = () => {
    addFooter(page);
    doc.addPage();
    page++;
    y = margin;
    doc.setTextColor(...DARK);
  };

  const checkY = (needed) => {
    if (y + needed > pageH - FOOTER_H - margin) addPage();
  };

  doc.setTextColor(...DARK);
  const lines = (output || '').split('\n');

  let tableStarted = false, tableIsHeader = false, tableDataRow = 0, colCount = 0;

  for (let li = 0; li < lines.length; li++) {
    const raw = lines[li];
    const trim = raw.trim();

    if (/^[-=*]{3,}$/.test(trim)) {
      checkY(8); y += 2;
      doc.setDrawColor(...BORDER);
      doc.line(margin, y, pageW - margin, y);
      y += 6; tableStarted = false; continue;
    }

    if (/^\|[\s\-:|]+\|$/.test(trim)) { tableIsHeader = false; tableDataRow = 0; continue; }

    if (trim.startsWith('|')) {
      const cells = trim.replace(/^\||\|$/g, '').split('|').map(c => sanitize(c.trim()));
      if (!cells.length) continue;
      if (!tableStarted) { tableStarted = true; tableIsHeader = true; tableDataRow = 0; colCount = cells.length; y += 2; }
      const colW = maxW / colCount;
      checkY(7);
      cells.forEach((cell, ci) => {
        const cx = margin + ci * colW; const cy = y - 7 + 2;
        if (tableIsHeader) { doc.setFillColor(...ACCENT); doc.rect(cx, cy, colW, 7, 'F'); }
        else if (tableDataRow % 2 === 0) { doc.setFillColor(245, 245, 252); doc.rect(cx, cy, colW, 7, 'F'); }
        doc.setDrawColor(...BORDER); doc.rect(cx, cy, colW, 7, 'S');
        doc.setFontSize(8.5); doc.setFont('helvetica', tableIsHeader ? 'bold' : 'normal');
        doc.setTextColor(...(tableIsHeader ? WHITE : DARK));
        const t = cell.length > 38 ? cell.slice(0, 36) + '..' : cell;
        doc.text(t, cx + 2.5, y - 0.5);
      });
      y += 7;
      if (!tableIsHeader) tableDataRow++;
      tableIsHeader = false; continue;
    }

    tableStarted = false; tableIsHeader = false; tableDataRow = 0;
    if (trim === '') { y += 2.5; continue; }

    const isH1 = raw.startsWith('# ')  && !raw.startsWith('## ');
    const isH2 = raw.startsWith('## ') && !raw.startsWith('### ');
    const isH3 = raw.startsWith('### ');

    if (isH1) {
      const text = sanitize(raw.replace(/^#\s+/, ''));
      if (!text) continue;
      checkY(16); y += 6;
      doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
      doc.text(text, margin, y); y += 5;
      doc.setDrawColor(...BORDER); doc.line(margin, y, pageW - margin, y); y += 5;
    } else if (isH2) {
      const text = sanitize(raw.replace(/^##\s+/, ''));
      if (!text) continue;
      checkY(14); y += 5;
      doc.setFillColor(...ACCENT); doc.rect(margin, y - 5, 3, 8, 'F');
      doc.setFillColor(...ACCENT_L); doc.rect(margin + 3, y - 5, maxW - 3, 8, 'F');
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ACCENT);
      doc.text(text, margin + 6, y); doc.setTextColor(...DARK); y += 7;
    } else if (isH3) {
      const text = sanitize(raw.replace(/^###\s+/, ''));
      if (!text) continue;
      checkY(10); y += 4;
      doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...MID);
      doc.text(text.toUpperCase(), margin, y); doc.setTextColor(...DARK); y += LH;
    } else {
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK);
      const wrapped = doc.splitTextToSize(sanitize(raw), maxW);
      for (const wl of wrapped) { checkY(LH); doc.text(wl, margin, y); y += LH; }
    }
  }

  const total = doc.getNumberOfPages ? doc.getNumberOfPages() : doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) addFooter(p);
}

// ── Public API ────────────────────────────────────────────────────────────────
export function exportPdf({ toolName, userEmail, output, filename, toolId }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const id = toolId || '';
  if (id === 'contract') {
    exportContractPdf({ doc, output, toolName, userEmail });
  } else if (id === 'legal' || id === 'cgv' || id === 'privacy' || id === 'notice') {
    exportLegalPdf({ doc, output, toolName, userEmail });
  } else {
    exportGenericPdf({ doc, output, toolName, userEmail });
  }

  doc.save(filename || `savvly-${Date.now()}.pdf`);
}
