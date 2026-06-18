import { useState } from 'react';
import { MarkdownResult } from '../../components/MarkdownResult';
import { ResultViewer } from '../../components/ResultViewer';
import { ToolShell } from '../../components/ToolShell';
import { Glyph } from '../../components/Glyph';
import { CreditGate } from '../../components/CreditGate';
import { SaveButton } from '../../components/SaveButton';
import { ShareButton } from '../../components/ShareButton';
import { useToast } from '../../components/Toast';
import GeneratingIndicator from '../../components/GeneratingIndicator';
import StreamingBanner from '../../components/StreamingBanner';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';
import { exportPdf } from '../../lib/exportPdf';
import { streamGenerate } from '../../lib/streamGenerate';
import { CompletionCelebration } from '../../components/CompletionCelebration';
import { loadProfile, saveProfile } from '../../hooks/useFreelanceProfile';

const VAT_RATES     = ['0%', '5%', '10%', '20%'];
const PAYMENT_TERMS = [
  { id: 'immediate', label: 'À réception' },
  { id: 'net14',     label: '14 jours'    },
  { id: 'net30',     label: '30 jours'    },
  { id: 'net45',     label: '45 jours'    },
  { id: 'net60',     label: '60 jours'    },
];

function newLine() {
  return { id: Date.now() + Math.random(), desc: '', qty: 1, price: '' };
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function defaultNumero() {
  return `FACT-${new Date().getFullYear()}-001`;
}

export function FactureTool({ tool, initialData }) {
  const { credits, logGeneration, session, user } = useApp();
  const { t, lang } = useLang();

  const prof = loadProfile();

  // Prestataire (from shared profile)
  const [nom,       setNom]       = useState(prof.nom        || '');
  const [entreprise,setEntreprise]= useState(prof.entreprise  || '');
  const [email,     setEmail]     = useState(prof.email       || '');
  const [tel,       setTel]       = useState(prof.tel         || '');
  const [siret,     setSiret]     = useState(prof.siret       || '');
  const [adresse,   setAdresse]   = useState(prof.adresse     || '');

  // Invoice metadata
  const [numeroFacture, setNumeroFacture] = useState(initialData?.numeroFacture || defaultNumero());
  const [dateEmission,  setDateEmission]  = useState(initialData?.dateEmission  || todayStr());
  const [paymentTerms,  setPaymentTerms]  = useState(initialData?.paymentTerms  || 'net30');

  // Client
  const [clientName,    setClientName]    = useState(initialData?.clientName    || '');
  const [clientCompany, setClientCompany] = useState(initialData?.clientCompany || '');
  const [clientEmail,   setClientEmail]   = useState(initialData?.clientEmail   || '');

  // Services
  const [lines,   setLines]   = useState(() => initialData?.lines ?? [newLine()]);
  const [vatRate, setVatRate] = useState(initialData?.vatRate ?? '0%');
  const [notes,   setNotes]   = useState(initialData?.notes   || '');

  const [output,          setOutput]          = useState('');
  const [loading,         setLoading]         = useState(false);
  const [genId,           setGenId]           = useState(null);
  const [viewerOpen,      setViewerOpen]      = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [toast, ToastEl] = useToast();

  const updateLine  = (id, field, value) => setLines(ls => ls.map(l => l.id === id ? { ...l, [field]: value } : l));
  const removeLine  = (id) => setLines(ls => ls.length > 1 ? ls.filter(l => l.id !== id) : ls);

  const subtotal  = lines.reduce((s, l) => s + (parseFloat(l.price) || 0) * (parseFloat(l.qty) || 0), 0);
  const vatPct    = parseFloat(vatRate) / 100;
  const vatAmount = subtotal * vatPct;
  const total     = subtotal + vatAmount;
  const fmt       = (n) => n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const echeanceDays = { immediate: 0, net14: 14, net30: 30, net45: 45, net60: 60 }[paymentTerms] ?? 30;
  const dateEcheance = addDays(dateEmission, echeanceDays);

  const generate = async () => {
    if (!clientName.trim()) { toast('Nom du client requis'); return; }
    if (credits === null) return;
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }

    saveProfile({ nom, entreprise, email, tel, siret, adresse });

    setLoading(true);
    setOutput('');
    try {
      const input = {
        nom, entreprise, email, tel, siret, adresse,
        numeroFacture, dateEmission, dateEcheance,
        clientName, clientCompany, clientEmail,
        lines, vatRate, paymentTerms, notes,
      };
      const fullText = await streamGenerate(
        { toolId: tool.id, input, session, lang },
        (chunk) => setOutput(chunk),
      );
      const id = await logGeneration(tool.id, input, fullText, tool.credits);
      setGenId(id);
      setShowCelebration(true);
    } catch (err) {
      toast(err.message || t('tool.error.generic'));
    } finally {
      setLoading(false);
    }
  };

  const copy = () => { if (!output) return; navigator.clipboard?.writeText(output); toast(t('tool.copied')); };
  const downloadPdf = () => exportPdf({
    toolName: lang === 'fr' ? tool.name_fr : tool.name_en,
    userEmail: user?.email,
    output,
    filename: `facture-${numeroFacture}-${dateEmission}.pdf`,
  });

  const sectionLabel = { marginBottom: 14, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-4)' };

  return (
    <ToolShell tool={tool}>
      <div className="tool-page">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Numéro + Date */}
          <div className="card card-pad">
            <h3 className="h3" style={sectionLabel}>Facture</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">Numéro de facture</label>
                <input className="input" value={numeroFacture} onChange={e => setNumeroFacture(e.target.value)} placeholder="FACT-2026-001" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">Date d'émission</label>
                <input className="input" type="date" value={dateEmission} onChange={e => setDateEmission(e.target.value)} />
              </div>
            </div>
            <div className="field" style={{ margin: '10px 0 0' }}>
              <label className="label">Délai de paiement</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {PAYMENT_TERMS.map(pt => (
                  <button key={pt.id} type="button" onClick={() => setPaymentTerms(pt.id)} className="btn btn-sm"
                    style={{ fontSize: 12, border: '1px solid ' + (paymentTerms === pt.id ? 'var(--fg)' : 'var(--border)'), background: paymentTerms === pt.id ? 'var(--fg)' : 'var(--bg)', color: paymentTerms === pt.id ? '#fff' : 'var(--fg-2)' }}>
                    {pt.label}
                  </button>
                ))}
              </div>
              {echeanceDays > 0 && (
                <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                  Date d'échéance : <strong>{new Date(dateEcheance).toLocaleDateString('fr-FR')}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Prestataire */}
          <div className="card card-pad">
            <h3 className="h3" style={sectionLabel}>
              Vos coordonnées
              <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 8, color: 'var(--fg-4)', textTransform: 'none', letterSpacing: 0 }}>
                sauvegardées automatiquement
              </span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">Nom complet</label>
                <input className="input" value={nom} onChange={e => setNom(e.target.value)} placeholder="Jean Dupont" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">Entreprise (optionnel)</label>
                <input className="input" value={entreprise} onChange={e => setEntreprise(e.target.value)} placeholder="JD Conseil" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">SIRET</label>
                <input className="input" value={siret} onChange={e => setSiret(e.target.value)} placeholder="000 000 000 00000" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">Email</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean@dupont.fr" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">Téléphone</label>
                <input className="input" value={tel} onChange={e => setTel(e.target.value)} placeholder="+33 6 00 00 00 00" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">Adresse</label>
                <input className="input" value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="12 rue de la Paix, 75001 Paris" />
              </div>
            </div>
          </div>

          {/* Client */}
          <div className="card card-pad">
            <h3 className="h3" style={sectionLabel}>Client</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">Nom <span style={{ color: 'var(--accent)' }}>*</span></label>
                <input className="input" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Sophie Lefèvre" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">Entreprise</label>
                <input className="input" value={clientCompany} onChange={e => setClientCompany(e.target.value)} placeholder="Atelier Marquetin" />
              </div>
              <div className="field" style={{ margin: 0, gridColumn: '1 / -1' }}>
                <label className="label">Email client</label>
                <input className="input" type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="sophie@atelier.com" />
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="card card-pad">
            <h3 className="h3" style={sectionLabel}>Prestations</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px 24px', gap: 6, marginBottom: 6 }}>
              <span className="label" style={{ margin: 0, fontSize: 11 }}>Description</span>
              <span className="label" style={{ margin: 0, fontSize: 11 }}>Qté</span>
              <span className="label" style={{ margin: 0, fontSize: 11 }}>PU HT (€)</span>
              <span />
            </div>

            {lines.map(line => (
              <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px 24px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                <input className="input" value={line.desc} onChange={e => updateLine(line.id, 'desc', e.target.value)} placeholder="Développement front-end" style={{ fontSize: 13 }} />
                <input className="input" value={line.qty}  onChange={e => updateLine(line.id, 'qty',  e.target.value)} type="number" min="0" style={{ fontSize: 13 }} />
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
              <Glyph name="plus" size={12} /> Ajouter une ligne
            </button>

            <div className="hr" style={{ margin: '16px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted">Sous-total HT</span>
                <span className="tabular">€{fmt(subtotal)}</span>
              </div>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="row" style={{ gap: 8 }}>
                  <span className="muted">TVA</span>
                  <select className="select" value={vatRate} onChange={e => setVatRate(e.target.value)} style={{ width: 'auto', padding: '2px 8px', fontSize: 12, height: 'auto' }}>
                    {VAT_RATES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <span className="tabular">€{fmt(vatAmount)}</span>
              </div>
              <div className="row" style={{ justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                <span>Total TTC</span>
                <span className="tabular">€{fmt(total)}</span>
              </div>
            </div>

            <div className="field" style={{ margin: '16px 0 0' }}>
              <label className="label">Notes (optionnel)</label>
              <textarea className="input" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Modalités de paiement, coordonnées bancaires, etc." style={{ resize: 'vertical' }} />
            </div>
          </div>

          <div className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}>
            <span className="muted">{t('tool.cost')}</span>
            <span className="tabular"><b>{tool.credits}</b> {t('tool.credits')}</span>
          </div>
          <CreditGate cost={tool.credits}>
            <button className="btn btn-accent btn-lg btn-block" onClick={generate} disabled={loading}>
              {loading ? t('tool.generating') : <><Glyph name="sparkle" size={14} /> Générer la facture</>}
            </button>
          </CreditGate>
        </div>

        <div>
          <div className="result-zone">
            <div className="result-head">
              <span className="muted" style={{ fontSize: 13 }}>{t('tool.result')}</span>
              <div className="row" style={{ gap: 6 }}>
                <SaveButton generationId={genId} toolName={lang === 'fr' ? tool.name_fr : tool.name_en} />
                <ShareButton generationId={genId} />
                <button className="btn btn-ghost btn-sm" onClick={copy} disabled={!output}><Glyph name="copy" size={12} /> {t('tool.copy')}</button>
                {output && <button className="btn btn-ghost btn-sm" onClick={downloadPdf}><Glyph name="arrow-down" size={12} /> {t('tool.pdf')}</button>}
                <button className="btn btn-ghost btn-sm" onClick={generate} disabled={!output || loading}><Glyph name="refresh" size={12} /> {t('tool.regenerate')}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setViewerOpen(true)} disabled={!output}><Glyph name="expand" size={12} /> Fullscreen</button>
              </div>
            </div>
            {viewerOpen && <ResultViewer output={output} toolName={lang === 'fr' ? tool.name_fr : tool.name_en} userEmail={user?.email} onClose={() => setViewerOpen(false)} />}
            <StreamingBanner loading={loading} hasOutput={!!output} />
            {loading && !output ? (
              <GeneratingIndicator toolId="facture" />
            ) : output ? (
              loading ? (
                <pre className="stream-text">{output}<span className="stream-cursor" /></pre>
              ) : (
                <MarkdownResult>{output}</MarkdownResult>
              )
            ) : (
              <div className="result-empty">{t('tool.result.placeholder')}</div>
            )}
          </div>
        </div>
      </div>
      {ToastEl}
      {showCelebration && (
        <CompletionCelebration
          onPdf={downloadPdf}
          onFullscreen={() => setViewerOpen(true)}
          onClose={() => setShowCelebration(false)}
          t={t}
        />
      )}
    </ToolShell>
  );
}
