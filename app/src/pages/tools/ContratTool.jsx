import { useState } from 'react';
import { ToolShell } from '../../components/ToolShell';
import { Glyph } from '../../components/Glyph';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';

const SAMPLE = `FREELANCE SERVICE AGREEMENT

Parties
This agreement is entered into between:
• Service Provider: Léa Marchand, sole trader (hereinafter "Provider")
• Client: Atelier Marquetin, registered company (hereinafter "Client")

Effective date: May 13, 2026

1. SCOPE OF WORK
The Provider agrees to deliver the following services:

"Full redesign of the Atelier Marquetin mobile application, covering UX research (user interviews, competitive analysis), wireframing, UI design (all screens), and handoff to development team via Figma."

Deliverables:
→ UX research report
→ Wireframes (all flows)
→ High-fidelity UI design (Figma)
→ Developer handoff with component library

2. TIMELINE
The project will commence on June 1, 2026 and is estimated to complete within 6 weeks.

3. COMPENSATION
Total project fee: €9,500 (excl. VAT)
Payment schedule:
• 30% deposit (€2,850) due before project start
• 40% milestone payment (€3,800) due on wireframe approval
• 30% final payment (€2,850) due on delivery

4. PAYMENT TERMS
Invoices are payable within 30 days of issue.

5. REVISIONS
Up to 2 rounds of revisions are included per deliverable. Additional revisions are billed at €350/day.

6. INTELLECTUAL PROPERTY
Full ownership of deliverables transfers to the Client upon receipt of final payment.

7. CONFIDENTIALITY
Both parties agree to keep all project details confidential for a period of 2 years.

8. GOVERNING LAW
This agreement is governed by the laws of England and Wales.

Signatures
Provider: _____________________ Date: _______
Client:  _____________________ Date: _______`;

const PAYMENT_TERMS = ['30 days', '45 days', '60 days', 'On delivery'];
const DURATION_UNITS = ['days', 'weeks', 'months'];

export function ContratTool({ tool }) {
  const { credits, consumeCredits } = useApp();
  const { t } = useLang();
  const [client, setClient] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [mission, setMission] = useState('');
  const [rate, setRate] = useState('');
  const [rateType, setRateType] = useState('project');
  const [duration, setDuration] = useState('');
  const [durationUnit, setDurationUnit] = useState('weeks');
  const [deliverables, setDeliverables] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('30 days');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, ToastEl] = useToast();

  const generate = () => {
    if (!client.trim() || !mission.trim()) { toast('Fill in client name and mission description.'); return; }
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }
    setLoading(true);
    setOutput('');
    setTimeout(() => {
      setOutput(SAMPLE);
      setLoading(false);
      consumeCredits(tool.credits);
    }, 1400);
  };

  const copy = () => {
    if (!output) return;
    navigator.clipboard?.writeText(output);
    toast(t('tool.copied'));
  };

  return (
    <ToolShell tool={tool}>
      <div className="tool-page">
        {/* Form */}
        <div className="card card-pad">
          <h3 className="h3" style={{ marginBottom: 16, fontSize: 15 }}>Contract details</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label className="label">Client name <span style={{ color: 'var(--accent)' }}>*</span></label>
              <input className="input" value={client} onChange={e => setClient(e.target.value)} placeholder="Sophie Lefèvre" />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label className="label">Client company</label>
              <input className="input" value={clientCompany} onChange={e => setClientCompany(e.target.value)} placeholder="Atelier Marquetin" />
            </div>
          </div>

          <div className="field">
            <label className="label">Mission description <span style={{ color: 'var(--accent)' }}>*</span></label>
            <textarea
              className="textarea"
              value={mission}
              onChange={e => setMission(e.target.value)}
              placeholder="Full redesign of the mobile application, covering UX research, wireframing, and UI design…"
              rows={3}
            />
          </div>

          <div className="field">
            <label className="label">Rate</label>
            <div className="row" style={{ gap: 8 }}>
              <div style={{ flex: 1 }}>
                <input className="input" value={rate} onChange={e => setRate(e.target.value)} placeholder="9,500" type="number" />
              </div>
              <select className="select" value={rateType} onChange={e => setRateType(e.target.value)} style={{ width: 'auto' }}>
                <option value="project">€ total</option>
                <option value="daily">€ / day</option>
                <option value="hourly">€ / hour</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label className="label">Duration</label>
            <div className="row" style={{ gap: 8 }}>
              <input className="input" value={duration} onChange={e => setDuration(e.target.value)} placeholder="6" type="number" style={{ flex: 1 }} />
              <select className="select" value={durationUnit} onChange={e => setDurationUnit(e.target.value)} style={{ width: 'auto' }}>
                {DURATION_UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label className="label">Deliverables</label>
            <textarea
              className="textarea"
              value={deliverables}
              onChange={e => setDeliverables(e.target.value)}
              placeholder="UX research report, wireframes, high-fidelity UI, Figma handoff…"
              rows={2}
            />
          </div>

          <div className="field">
            <label className="label">Payment terms</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PAYMENT_TERMS.map(pt => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => setPaymentTerms(pt)}
                  className="btn btn-sm"
                  style={{
                    border: '1px solid ' + (paymentTerms === pt ? 'var(--fg)' : 'var(--border)'),
                    background: paymentTerms === pt ? 'var(--fg)' : 'var(--bg)',
                    color: paymentTerms === pt ? '#fff' : 'var(--fg-2)',
                  }}
                >
                  {pt}
                </button>
              ))}
            </div>
          </div>

          <div className="hr" style={{ margin: '20px 0' }} />
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
            <span className="muted">{t('tool.cost')}</span>
            <span className="tabular"><b>{tool.credits}</b> {t('tool.credits')}</span>
          </div>
          <button className="btn btn-accent btn-lg btn-block" onClick={generate} disabled={loading}>
            {loading ? t('tool.generating') : <><Glyph name="sparkle" size={14} /> Generate contract</>}
          </button>
        </div>

        {/* Result */}
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
              </div>
            </div>
            {loading ? (
              <div className="result-empty">
                <span className="row" style={{ gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite' }} />
                  {t('tool.result.working')}
                </span>
              </div>
            ) : output ? (
              <div className="result-body">{output}</div>
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
