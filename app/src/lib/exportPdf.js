import jsPDF from 'jspdf';

export function exportPdf({ toolName, userEmail, output, filename }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW  = 210;
  const margin = 20;
  const maxW   = pageW - margin * 2;
  const date   = new Date().toLocaleDateString('en-GB');

  let y = margin;

  // ── Header ──────────────────────────────────────────────────
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Toolio', margin, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(140, 140, 140);
  doc.text(date, pageW - margin, y, { align: 'right' });

  y += 6;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(toolName, margin, y);

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

  const addPage = () => { doc.addPage(); y = margin; };
  const checkY  = (needed = 6) => { if (y + needed > 277) addPage(); };

  for (const rawLine of output.split('\n')) {
    const isH1 = rawLine.startsWith('# ');
    const isH2 = rawLine.startsWith('## ');
    const isH3 = rawLine.startsWith('### ');

    if (isH1 || isH2 || isH3) {
      const text     = rawLine.replace(/^#{1,3}\s+/, '');
      const fontSize = isH1 ? 13 : isH2 ? 11 : 10;
      if (isH1) { checkY(10); y += 3; }
      else { checkY(8); y += 2; }
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'bold');
      doc.text(text, margin, y);
      y += fontSize === 13 ? 7 : 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    } else if (rawLine.trim() === '') {
      y += 2.5;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const wrapped = doc.splitTextToSize(rawLine, maxW);
      for (const wl of wrapped) {
        checkY(5);
        doc.text(wl, margin, y);
        y += 5;
      }
    }
  }

  doc.save(filename || `toolio-${Date.now()}.pdf`);
}
