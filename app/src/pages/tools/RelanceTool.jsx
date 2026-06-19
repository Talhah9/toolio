import { useState, useEffect, useRef } from 'react';
import { MarkdownResult } from '../../components/MarkdownResult';
import { ResultViewer } from '../../components/ResultViewer';
import { ToolShell } from '../../components/ToolShell';
import { Glyph } from '../../components/Glyph';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';
import { streamGenerate } from '../../lib/streamGenerate';
import { CompletionCelebration } from '../../components/CompletionCelebration';
import GeneratingIndicator from '../../components/GeneratingIndicator';
import StreamingBanner from '../../components/StreamingBanner';

const TONES = [
  { id: 'cordial', labelKey: 'tool.relance.tone.cordial.label', descKey: 'tool.relance.tone.cordial.desc', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  { id: 'firm',    labelKey: 'tool.relance.tone.firm.label',    descKey: 'tool.relance.tone.firm.desc',    color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { id: 'urgent',  labelKey: 'tool.relance.tone.urgent.label',  descKey: 'tool.relance.tone.urgent.desc',  color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
];

function calcDaysLate(dueDateStr) {
  if (!dueDateStr) return '';
  const due = new Date(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - due) / (1000 * 60 * 60 * 24));
  return diff > 0 ? String(diff) : '0';
}

export function RelanceTool({ tool }) {
  const { credits, logGeneration, session, user } = useApp();
  const { t, lang } = useLang();

  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [daysLate, setDaysLate] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectNature, setProjectNature] = useState('');
  const [previousReminders, setPreviousReminders] = useState('0');
  const [additionalContext, setAdditionalContext] = useState('');
  const [tone, setTone] = useState('cordial');

  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [toast, ToastEl] = useToast();
  const resultRef = useRef(null);
  useEffect(() => {
    if (resultRef.current) resultRef.current.scrollTop = resultRef.current.scrollHeight;
  }, [output]);

  useEffect(() => {
    if (dueDate) setDaysLate(calcDaysLate(dueDate));
  }, [dueDate]);

  const buildContext = () => {
    const parts = [];
    if (clientName) parts.push(`Client : ${clientName}`);
    if (invoiceNumber) parts.push(`Facture n° ${invoiceNumber}`);
    if (invoiceAmount) parts.push(`Montant : ${invoiceAmount} €`);
    if (dueDate) parts.push(`Date d'échéance : ${new Date(dueDate).toLocaleDateString('fr-FR')}`);
    if (daysLate && Number(daysLate) > 0) parts.push(`Retard : ${daysLate} jour(s)`);
    if (projectNature) parts.push(`Nature du projet : ${projectNature}`);
    if (Number(previousReminders) > 0) parts.push(`Relances précédentes : ${previousReminders}`);
    if (additionalContext.trim()) parts.push(`Contexte : ${additionalContext.trim()}`);
    return parts.join('\n');
  };

  const generate = async () => {
    if (!clientName.trim()) { toast('Veuillez renseigner le nom du client'); return; }
    if (!invoiceAmount) { toast('Veuillez renseigner le montant de la facture'); return; }
    if (!projectNature.trim()) { toast('Veuillez renseigner la nature du projet'); return; }
    if (credits === null) return;
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }
    setLoading(true);
    setOutput('');
    try {
      const context = buildContext();
      const fullText = await streamGenerate(
        { toolId: tool.id, input: { context, tone }, session, lang },
        (chunk) => setOutput(chunk),
      );
      await logGeneration(tool.id, { context, tone }, fullText, tool.credits);
      setShowCelebration(true);
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

  const activeTone = TONES.find(to => to.id === tone);
  const F = { marginBottom: 16 };
  const LBL = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--fg-3)', marginBottom: 6 };
  const REQ = { color: 'var(--accent)', marginLeft: 2 };

  return (
    <ToolShell tool={tool}>
      <div className="tool-page">
        <div className="card card-pad">

          {/* Row 1: Montant + Numéro */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, ...F }}>
            <div>
              <label style={LBL}>Montant de la facture<span style={REQ}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type="number"
                  value={invoiceAmount}
                  onChange={e => setInvoiceAmount(e.target.value)}
                  placeholder="2 500"
                  style={{ paddingRight: 36 }}
                />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-4)', fontWeight: 600 }}>€</span>
              </div>
            </div>
            <div>
              <label style={LBL}>Numéro de facture</label>
              <input className="input" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="FA-2024-042" />
            </div>
          </div>

          {/* Row 2: Échéance + Jours de retard */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, ...F }}>
            <div>
              <label style={LBL}>Date d'échéance</label>
              <input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <label style={LBL}>Jours de retard</label>
              <input
                className="input"
                type="number"
                value={daysLate}
                onChange={e => setDaysLate(e.target.value)}
                placeholder="15"
              />
            </div>
          </div>

          {/* Row 3: Client + Projet */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, ...F }}>
            <div>
              <label style={LBL}>Nom du client / entreprise<span style={REQ}>*</span></label>
              <input className="input" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Acme Corp" />
            </div>
            <div>
              <label style={LBL}>Nature du projet<span style={REQ}>*</span></label>
              <input className="input" value={projectNature} onChange={e => setProjectNature(e.target.value)} placeholder="Développement web, design..." />
            </div>
          </div>

          {/* Row 4: Relances précédentes */}
          <div style={F}>
            <label style={LBL}>Relances précédentes</label>
            <input className="input" type="number" min="0" value={previousReminders} onChange={e => setPreviousReminders(e.target.value)} placeholder="0" style={{ maxWidth: 120 }} />
          </div>

          {/* Row 5: Contexte additionnel */}
          <div style={F}>
            <label style={LBL}>Contexte additionnel <span style={{ color: 'var(--fg-4)', fontWeight: 400 }}>(optionnel)</span></label>
            <textarea
              className="textarea"
              value={additionalContext}
              onChange={e => setAdditionalContext(e.target.value)}
              placeholder="Informations supplémentaires utiles pour la relance..."
              rows={3}
            />
          </div>

          {/* Tone selector */}
          <div style={F}>
            <label style={LBL}>{t('tool.relance.tone.label')}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TONES.map(t_item => (
                <button
                  key={t_item.id}
                  type="button"
                  onClick={() => setTone(t_item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                    borderRadius: 10,
                    border: `2px solid ${tone === t_item.id ? t_item.color : 'var(--border)'}`,
                    background: tone === t_item.id ? t_item.bg : 'var(--bg)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: t_item.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: tone === t_item.id ? t_item.color : 'var(--fg)' }}>{t(t_item.labelKey)}</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 1 }}>{t(t_item.descKey)}</div>
                  </div>
                  {tone === t_item.id && (
                    <span style={{ marginLeft: 'auto', color: t_item.color }}>
                      <Glyph name="check-circle" size={16} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="hr" style={{ margin: '20px 0' }} />
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
            <span className="muted">{t('tool.cost')}</span>
            <span style={{ color: '#10B981', fontWeight: 600 }}>{t('tool.free')}</span>
          </div>
          <button
            className="btn btn-lg btn-block"
            onClick={generate}
            disabled={loading}
            style={{ background: activeTone?.color || 'var(--accent)', color: '#fff', border: 'none' }}
          >
            {loading ? t('tool.generating') : <><Glyph name="sparkle" size={14} /> {t('tool.relance.btn')}</>}
          </button>
        </div>

        <div>
          <div className="result-zone">
            <div className="result-head">
              <span className="muted" style={{ fontSize: 13 }}>{t('tool.result')}</span>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={copy} disabled={!output}>
                  <Glyph name="copy" size={12} /> {t('tool.copy')}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={generate} disabled={!output || loading}>
                  <Glyph name="refresh" size={12} /> {t('tool.regenerate')}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setViewerOpen(true)} disabled={!output}>
                  <Glyph name="expand" size={12} /> Fullscreen
                </button>
              </div>
            </div>
            {viewerOpen && <ResultViewer output={output} toolName={lang === 'fr' ? tool.name_fr : tool.name_en} userEmail={user?.email} onClose={() => setViewerOpen(false)} />}
            <div ref={resultRef} style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 260px)', scrollBehavior: 'smooth' }}>
              <StreamingBanner loading={loading} hasOutput={!!output} />
              {loading && !output ? (
                <GeneratingIndicator toolId="relance" />
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
      </div>
      {ToastEl}
      {showCelebration && (
        <CompletionCelebration
          onFullscreen={() => setViewerOpen(true)}
          onClose={() => setShowCelebration(false)}
          t={t}
        />
      )}
    </ToolShell>
  );
}
