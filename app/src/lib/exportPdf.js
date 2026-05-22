import jsPDF from 'jspdf';

const ACCENT   = [79, 70, 229];   // #4F46E5
const ACCENT_L = [238, 242, 255]; // #EEF2FF
const GREY_1   = [245, 245, 250]; // alternating row
const GREY_2   = [220, 220, 228]; // border/rule
const TEXT_DARK = [15, 15, 15];
const TEXT_MID  = [80, 80, 90];
const TEXT_SOFT = [150, 150, 160];

function sanitize(str) {
  if (!str) return '';
  return str
    .replace(/[\u{1F000}-\u{1FFFF}|\u{2600}-\u{27BF}|\u{FE00}-\u{FE0F}|\u{1F900}-\u{1F9FF}|\u{2300}-\u{23FF}|\u{2B00}-\u{2BFF}|\u{1FA00}-\u{1FA9F}]/gu, '')
    .replace(/^%+$/gm, '')
    .replace(/→/g, '->').replace(/←/g, '<-')
    .replace(/['']/g, "'").replace(/[""]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`(.*?)`/g, '$1')
    .replace(/\[OK\]/g, '[OK]').replace(/\[WARN\]/g, '[WARN]').replace(/\[ERR\]/g, '[ERR]')
    .replace(/  +/g, ' ')
    .replace(/[^\x00-\xFF]/g, '')
    .trim();
}

export function exportPdf({ toolName, userEmail, output, filename }) {
  const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210, pageH = 297;
  const margin = 18, maxW = pageW - margin * 2;
  const LH = 6;       // line height
  const CELL_H = 7;   // table row height
  const FOOTER_H = 14; // reserved at bottom for footer

  let y = margin;
  let page = 1;

  // ── Footer helper ───────────────────────────────────────────────
  function addFooter(p) {
    doc.setPage(p);
    const fy = pageH - 7;
    doc.setDrawColor(...GREY_2);
    doc.line(margin, fy - 4, pageW - margin, fy - 4);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_SOFT);
    doc.text(new Date().toLocaleDateString('fr-FR'), margin, fy);
    if (userEmail) {
      doc.text(sanitize(userEmail), pageW / 2, fy, { align: 'center' });
    }
    doc.text(`Page ${p}`, pageW - margin, fy, { align: 'right' });
  }

  function addPage() {
    addFooter(page);
    doc.addPage();
    page++;
    y = margin;
    doc.setTextColor(...TEXT_DARK);
  }

  function checkY(needed) {
    if (y + needed > pageH - FOOTER_H - margin) addPage();
  }

  // ── Divider at top ──────────────────────────────────────────────
  doc.setDrawColor(...GREY_2);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── Body ─────────────────────────────────────────────────────────
  doc.setTextColor(...TEXT_DARK);

  const lines = (output || '').split('\n');

  // Track table state
  let tableStarted = false;
  let tableIsHeader = false;
  let tableDataRow = 0;
  let colCount = 0;

  for (let li = 0; li < lines.length; li++) {
    const raw = lines[li];
    const trim = raw.trim();

    // ── Skip HR ──────────────────────────────────────────────────
    if (/^[-=*]{3,}$/.test(trim)) {
      checkY(8);
      y += 2;
      doc.setDrawColor(...GREY_2);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
      tableStarted = false;
      continue;
    }

    // ── Table separator ──────────────────────────────────────────
    if (/^\|[\s\-:|]+\|$/.test(trim)) {
      tableIsHeader = false;
      tableDataRow = 0;
      continue;
    }

    // ── Table row ────────────────────────────────────────────────
    if (trim.startsWith('|')) {
      const cells = trim.replace(/^\||\|$/g, '').split('|').map(c => sanitize(c.trim()));
      if (!cells.length) continue;

      if (!tableStarted) {
        // First row = header
        tableStarted = true;
        tableIsHeader = true;
        tableDataRow = 0;
        colCount = cells.length;
        y += 2;
      }

      const colW = maxW / colCount;
      checkY(CELL_H + 2);

      cells.forEach((cell, ci) => {
        const cx = margin + ci * colW;
        const cy = y - CELL_H + 2;

        if (tableIsHeader) {
          doc.setFillColor(...ACCENT);
          doc.rect(cx, cy, colW, CELL_H, 'F');
        } else if (tableDataRow % 2 === 0) {
          doc.setFillColor(...GREY_1);
          doc.rect(cx, cy, colW, CELL_H, 'F');
        }

        // Cell border
        doc.setDrawColor(...GREY_2);
        doc.rect(cx, cy, colW, CELL_H, 'S');

        // Text
        doc.setFontSize(9);
        doc.setFont('helvetica', tableIsHeader ? 'bold' : 'normal');
        doc.setTextColor(...(tableIsHeader ? [255, 255, 255] : TEXT_DARK));
        const cellText = cell.length > 35 ? cell.slice(0, 33) + '..' : cell;
        doc.text(cellText, cx + 2.5, y - 0.5);
      });

      y += CELL_H;
      if (!tableIsHeader) tableDataRow++;
      tableIsHeader = false;
      continue;
    }

    // Not a table row
    tableStarted = false;
    tableIsHeader = false;
    tableDataRow = 0;

    // ── Blank line ───────────────────────────────────────────────
    if (trim === '') {
      y += 2.5;
      continue;
    }

    // ── Headings ─────────────────────────────────────────────────
    const isH1 = raw.startsWith('# ')  && !raw.startsWith('## ');
    const isH2 = raw.startsWith('## ') && !raw.startsWith('### ');
    const isH3 = raw.startsWith('### ');

    if (isH1 || isH2 || isH3) {
      const text = sanitize(raw.replace(/^#{1,3}\s+/, ''));
      if (!text) continue;

      if (isH1) {
        checkY(16);
        y += 6;
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...TEXT_DARK);
        doc.text(text, margin, y);
        y += 5;
        doc.setDrawColor(...GREY_2);
        doc.line(margin, y, pageW - margin, y);
        y += 5;
      } else if (isH2) {
        checkY(14);
        y += 5;
        // Accent bar
        doc.setFillColor(...ACCENT);
        doc.rect(margin, y - 5, 3, 8, 'F');
        // Soft background
        doc.setFillColor(...ACCENT_L);
        doc.rect(margin + 3, y - 5, maxW - 3, 8, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...ACCENT);
        doc.text(text, margin + 6, y);
        doc.setTextColor(...TEXT_DARK);
        y += 7;
      } else {
        checkY(10);
        y += 4;
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...TEXT_MID);
        doc.text(text.toUpperCase(), margin, y);
        doc.setTextColor(...TEXT_DARK);
        y += LH;
      }
      continue;
    }

    // ── Regular lines ────────────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_DARK);

    const wrapped = doc.splitTextToSize(sanitize(raw), maxW);
    for (const wl of wrapped) {
      checkY(LH);
      doc.text(wl, margin, y);
      y += LH;
    }
  }

  // ── Footers on all pages ────────────────────────────────────────
  const total = doc.getNumberOfPages ? doc.getNumberOfPages() : doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) addFooter(p);

  doc.save(filename || `savvly-${Date.now()}.pdf`);
}
