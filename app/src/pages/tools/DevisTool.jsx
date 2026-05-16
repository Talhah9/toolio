import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ToolShell } from '../../components/ToolShell';
import { Glyph } from '../../components/Glyph';
import { CreditGate } from '../../components/CreditGate';
import { SaveButton } from '../../components/SaveButton';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';
import { exportPdf } from '../../lib/exportPdf';

const VAT_RATES = ['0%', '5%', '10%', '20%'];
const PAYMENT_TERMS = [
  { id: 'delivery', key: 'tool.devis.payment.delivery' },
  { id: 'net14',    key: 'tool.devis.payment.net14' },
  { id: 'net30',    key: 'tool.devis.payment.net30' },
  { id: 'net45',    key: 'tool.devis.payment.net45' },
  { id: 'net60',    key: 'tool.devis.payment.net60' },
];

function newLine() {
  return { id: Date.now() + Math.random(), desc: '', qty: 1, price: '' };
}

export function DevisTool({ tool, initialData }) {
  const { credits, logGeneration, session, user } = useApp();
  const { t, lang } = useLang();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [lines, setLines] = useState(() => initialData?.lines ?? [newLine()]);
  const [vatRate, setVatRate] = useState(initialData?.vatRate ?? '0%');
  const [paymentTerms, setPaymentTerms] = useState(initialData?.paymentTerms ?? 'net30');
  const [notes, setNotes] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [genId, setGenId] = useState(null);
  const [toast, ToastEl] = useToast();

  const updateLine = (id, field, value) =>
    setLines(ls => ls.map(l => l.id === id ? { ...l, [field]: value } : l));

  const removeLine = (id) =>
    setLines(ls => ls.length > 1 ? ls.filter(l => l.id !== id) : ls);

  const subtotal = lines.reduce((sum, l) => sum + (parseFloat(l.price) || 0) * (parseFloat(l.qty) || 0), 0);
  const vatPct = parseFloat(vatRate) / 100;
  const vatAmount = subtotal * vatPct;
  const total = subtotal + vatAmount;
  const fmt = (n) => n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const generate = async () => {
    if (!clientName.trim()) { toast(t('tool.devis.error.client')); return; }
    if (credits === null) return;
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }
    setLoading(true);
    setOutput('');
    try {
      const input = { clientName, clientCompany, clientEmail, lines, vatRate, paymentTerms, notes };
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: tool.id, input, userId: session?.user?.id, lang }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setOutput(json.output);
      const id = await logGeneration(tool.id, input, json.output, tool.credits);
      setGenId(id);
    } catch (err) {
      toast(err.message || t('tool.error.generic'));
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!output) return;
    navigator.clipboard?.writeText(output);
    toast(t('tool.copied'));
  };

  const downloadPdf = () => exportPdf({
    toolName: lang === 'fr' ? tool.name_fr : tool.name_en,
    userEmail: user?.email,
    output,
    filename: `toolio-${tool.id}-${new Date().toISOString().slice(0, 10)}.pdf`,
  });

  return (
    <ToolShell tool={tool}>
      <div className="tool-page">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card card-pad">
            <h3 className="h3" style={{ marginBottom: 14, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-4)' }}>{t('tool.devis.client.section')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">{t('tool.devis.client.name')} <span style={{ color: 'var(--accent)' }}>*</span></label>
                <input className="input" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Sophie Lefèvre" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">{t('tool.devis.client.company')}</label>
                <input className="input" value={clientCompany} onChange={e => setClientCompany(e.target.value)} placeholder="Atelier Marquetin" />
              </div>
            </div>
            <div className="field" style={{ margin: '10px 0 0' }}>
              <label className="label">{t('tool.devis.client.email')}</label>
              <input className="input" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="sophie@atelier.com" type="email" />
            </div>
          </div>

          <div className="card card-pad">
            <h3 className="h3" style={{ marginBottom: 14, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-4)' }}>{t('tool.devis.services.section')}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px 24px', gap: 6, marginBottom: 6 }}>
              <span className="label" style={{ margin: 0, fontSize: 11 }}>{t('tool.devis.line.desc')}</span>
              <span className="label" style={{ margin: 0, fontSize: 11 }}>{t('tool.devis.line.qty')}</span>
              <span className="label" style={{ margin: 0, fontSize: 11 }}>{t('tool.devis.line.price')}</span>
              <span />
            </div>

            {lines.map(line => (
              <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px 24px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                <input className="input" value={line.desc} onChange={e => updateLine(line.id, 'desc', e.target.value)} placeholder="UX design — 10 screens" style={{ fontSize: 13 }} />
                <input className="input" value={line.qty} onChange={e => updateLine(line.id, 'qty', e.target.value)} type="number" min="0" style={{ fontSize: 13 }} />
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-4)', fontSize: 12 }}>€</span>
                  <input className="input" value={line.price} onChange={e => updateLine(line.id, 'price', e.target.value)} type="number" min="0" placeholder="0" style={{ fontSize: 13, paddingLeft: 20 }} />
                </div>
                <button onClick={() => removeLine(line.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-4)', padding: 0, display: 'flex', alignItems: 'center' }}>
                  <Glyph name="x" size={14} />
                </button>
              </div>
            ))}

            <button className="btn btn-ghost btn-sm" onClick={() => setLines(ls => [...ls, newLine()])} style={{ marginTop: 4 }}>
              <Glyph name="plus" size={12} /> {t('tool.devis.add-line')}
            </button>

            <div className="hr" style={{ margin: '16px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted">{t('tool.devis.subtotal')}</span>
                <span className="tabular">€{fmt(subtotal)}</span>
              </div>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="row" style={{ gap: 8 }}>
                  <span className="muted">{t('tool.devis.vat')}</span>
                  <select className="select" value={vatRate} onChange={e => setVatRate(e.target.value)} style={{ width: 'auto', padding: '2px 8px', fontSize: 12, height: 'auto' }}>
                    {VAT_RATES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <span className="tabular">€{fmt(vatAmount)}</span>
              </div>
              <div className="row" style={{ justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                <span>{t('tool.devis.total')}</span>
                <span className="tabular">€{fmt(total)}</span>
              </div>
            </div>

            <div className="hr" style={{ margin: '16px 0' }} />

            <div className="field" style={{ margin: 0 }}>
              <label className="label">{t('tool.devis.payment.label')}</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PAYMENT_TERMS.map(pt => (
                  <button key={pt.id} type="button" onClick={() => setPaymentTerms(pt.id)} className="btn btn-sm"
                    style={{ fontSize: 12, border: '1px solid ' + (paymentTerms === pt.id ? 'var(--fg)' : 'var(--border)'), background: paymentTerms === pt.id ? 'var(--fg)' : 'var(--bg)', color: paymentTerms === pt.id ? '#fff' : 'var(--fg-2)' }}>
                    {t(pt.key)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}>
            <span className="muted">{t('tool.cost')}</span>
            <span className="tabular"><b>{tool.credits}</b> {t('tool.credits')}</span>
          </div>
          <CreditGate cost={tool.credits}>
            <button className="btn btn-accent btn-lg btn-block" onClick={generate} disabled={loading}>
              {loading ? t('tool.generating') : <><Glyph name="sparkle" size={14} /> {t('tool.devis.btn')}</>}
            </button>
          </CreditGate>
        </div>

        <div>
          <div className="result-zone">
            <div className="result-head">
              <span className="muted" style={{ fontSize: 13 }}>{t('tool.result')}</span>
              <div className="row" style={{ gap: 6 }}>
                <SaveButton generationId={genId} toolName={lang === 'fr' ? tool.name_fr : tool.name_en} />
                <button className="btn btn-ghost btn-sm" onClick={copy} disabled={!output}><Glyph name="copy" size={12} /> {t('tool.copy')}</button>
                {output && <button className="btn btn-ghost btn-sm" onClick={downloadPdf}><Glyph name="arrow-down" size={12} /> {t('tool.pdf')}</button>}
                <button className="btn btn-ghost btn-sm" onClick={generate} disabled={!output || loading}><Glyph name="refresh" size={12} /> {t('tool.regenerate')}</button>
              </div>
            </div>
            {loading ? (
              <div className="result-empty"><span className="row" style={{ gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite' }} />{t('tool.result.working')}</span></div>
            ) : output ? (
              <div className="result-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown></div>
            ) : (
              <div className="result-empty">{t('tool.result.placeholder')}</div>
            )}
          </div>
        </div>
      </div>
      {ToastEl}
    </ToolShell>
  );
}
