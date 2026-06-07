import { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import { ToolShell } from '../../components/ToolShell';
import { Glyph } from '../../components/Glyph';
import { useToast } from '../../components/Toast';

const ACCENT = [79, 70, 229];
const SUPPORTED = ['image/png', 'image/jpeg', 'image/jpg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'];
const SUPPORTED_EXT = ['.png', '.jpg', '.jpeg', '.docx', '.pdf'];

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function imageFileToPdf(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const doc = new jsPDF({ orientation: img.width > img.height ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 10;
        const maxW = pageW - margin * 2;
        const maxH = pageH - margin * 2;
        const ratio = Math.min(maxW / img.width, maxH / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        const x = (pageW - w) / 2;
        const y = (pageH - h) / 2;
        doc.addImage(e.target.result, file.type === 'image/png' ? 'PNG' : 'JPEG', x, y, w, h);
        resolve(doc);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function docxFileToPdf(file) {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const { value: text } = await mammoth.extractRawText({ arrayBuffer });

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxW = pageW - margin * 2;
  const LH = 6;
  const FOOTER_H = 14;

  // Header
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, pageW, 12, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('SAVVLY', margin, 8);
  doc.setFont('helvetica', 'normal');
  doc.text(file.name.replace('.docx', ''), pageW - margin, 8, { align: 'right' });

  let y = 22;
  let page = 1;

  const addPage = () => {
    addFooter(page);
    doc.addPage();
    page++;
    y = 20;
  };

  const addFooter = (p) => {
    doc.setPage(p);
    const fy = pageH - 7;
    doc.setDrawColor(220, 220, 228);
    doc.line(margin, fy - 4, pageW - margin, fy - 4);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 160);
    doc.text('Document confidentiel · savvly.co', margin, fy);
    doc.text(`${p}`, pageW - margin, fy, { align: 'right' });
  };

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 15, 15);

  const lines = text.split('\n');
  for (const raw of lines) {
    const wrapped = doc.splitTextToSize(raw.trim() || ' ', maxW);
    for (const wl of wrapped) {
      if (y + LH > pageH - FOOTER_H - margin) addPage();
      doc.text(wl, margin, y);
      y += LH;
    }
    if (!raw.trim()) y += 1;
  }

  const total = doc.getNumberOfPages ? doc.getNumberOfPages() : doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) addFooter(p);

  return doc;
}

export function ConverterTool({ tool }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [toast, ToastEl] = useToast();

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'));
    if (!SUPPORTED_EXT.includes(ext)) {
      toast('Format non supporté. Utilisez PNG, JPG, DOCX ou PDF.');
      return;
    }
    setFile(f);
    setDone(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setDone(false);
    try {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      const outName = file.name.replace(/\.[^.]+$/, '') + '.pdf';

      if (ext === '.pdf') {
        // Just download as-is
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = outName;
        a.click();
        URL.revokeObjectURL(url);
        setDone(true);
        return;
      }

      let doc;
      if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
        doc = await imageFileToPdf(file);
      } else if (ext === '.docx') {
        doc = await docxFileToPdf(file);
      } else {
        toast('Format non supporté.');
        return;
      }
      doc.save(outName);
      setDone(true);
    } catch (err) {
      console.error('[converter]', err);
      toast('Erreur lors de la conversion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const isImage = file && (file.type.startsWith('image/'));
  const isPdf = file && file.type === 'application/pdf';

  return (
    <ToolShell tool={tool}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px' }}>
        <div className="card card-pad">

          {/* Drop zone */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${file ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 14,
              padding: '40px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: file ? 'var(--accent-soft)' : 'var(--bg-2)',
              transition: 'all 0.2s',
              marginBottom: 24,
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".png,.jpg,.jpeg,.docx,.pdf"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />
            {file ? (
              <>
                <div style={{ fontSize: 36, marginBottom: 8 }}>
                  {isImage ? '🖼️' : isPdf ? '📄' : '📝'}
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{file.name}</div>
                <div style={{ fontSize: 13, color: 'var(--fg-4)' }}>{humanSize(file.size)}</div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 12, color: 'var(--fg-4)' }}>
                  <Glyph name="arrow-down" size={28} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
                  Déposez votre fichier ici ou cliquez pour choisir
                </div>
                <div style={{ fontSize: 13, color: 'var(--fg-4)' }}>
                  PNG, JPG, DOCX, PDF · Max 20 MB
                </div>
              </>
            )}
          </div>

          {/* Format info */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {['PNG → PDF', 'JPG → PDF', 'DOCX → PDF', 'PDF → Téléchargement'].map(label => (
              <span key={label} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg-3)', fontWeight: 500 }}>
                {label}
              </span>
            ))}
          </div>

          {/* Action */}
          {file && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-accent btn-lg"
                style={{ flex: 1 }}
                onClick={convert}
                disabled={loading}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
                    Conversion en cours…
                  </span>
                ) : isPdf ? (
                  <><Glyph name="arrow-down" size={14} /> Télécharger le PDF</>
                ) : (
                  <><Glyph name="sparkle" size={14} /> Convertir en PDF</>
                )}
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => { setFile(null); setDone(false); }}>
                <Glyph name="close" size={14} />
              </button>
            </div>
          )}

          {done && (
            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Glyph name="check" size={16} />
              Fichier téléchargé avec succès !
            </div>
          )}

          <div className="hr" style={{ margin: '24px 0 16px' }} />
          <div style={{ fontSize: 12, color: 'var(--fg-4)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Glyph name="lock" size={12} />
            Conversion 100% locale — aucun fichier n'est envoyé sur nos serveurs.
          </div>
        </div>
      </div>
      {ToastEl}
    </ToolShell>
  );
}
