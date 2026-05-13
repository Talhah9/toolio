import { useState } from 'react';
import { ToolShell } from '../../components/ToolShell';
import { Glyph } from '../../components/Glyph';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';

const SAMPLE = `TERMS OF SERVICE
Last updated: May 13, 2026

1. ACCEPTANCE OF TERMS
By accessing or using the services provided by Acme Studio ("Company", "we", "us"), you agree to be bound by these Terms of Service.

2. SERVICES
Acme Studio provides UX design consulting and digital product design services to clients on a project and retainer basis.

3. PAYMENT TERMS
Invoices are due within 30 days of issue. A deposit of 30% is required before project commencement. Late payments incur a 1.5% monthly interest charge.

4. INTELLECTUAL PROPERTY
Upon full payment, the client receives full ownership of all deliverables. Acme Studio retains the right to display the work in its portfolio unless otherwise agreed in writing.

5. CONFIDENTIALITY
Both parties agree to keep confidential any proprietary information shared during the engagement.

6. LIMITATION OF LIABILITY
Acme Studio's total liability shall not exceed the total fees paid by the client in the three months preceding the claim.

7. GOVERNING LAW
These terms are governed by the laws of England and Wales.

---

PRIVACY POLICY
Acme Studio collects only the data necessary to deliver services (name, email, billing information). Data is never sold to third parties. You may request deletion of your data at any time by emailing privacy@acmestudio.co.`;

const BUSINESS_TYPES = ['Sole trader', 'Limited company (Ltd)', 'LLC', 'Partnership', 'Other'];
const DOCUMENTS = [
  { id: 'tos', label: 'Terms of Service' },
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'legal', label: 'Legal Notice' },
  { id: 'cookies', label: 'Cookie Policy' },
];

export function LegalTool({ tool }) {
  const { credits, consumeCredits } = useApp();
  const { t } = useLang();
  const [company, setCompany] = useState('');
  const [type, setType] = useState('Sole trader');
  const [country, setCountry] = useState('United Kingdom');
  const [address, setAddress] = useState('');
  const [activity, setActivity] = useState('');
  const [docs, setDocs] = useState(['tos', 'privacy']);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, ToastEl] = useToast();

  const toggleDoc = (id) =>
    setDocs(d => d.includes(id) ? d.filter(x => x !== id) : [...d, id]);

  const generate = () => {
    if (!company.trim()) { toast('Enter your company name.'); return; }
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
          <h3 className="h3" style={{ marginBottom: 16, fontSize: 15 }}>Company profile</h3>

          <div className="field">
            <label className="label">Company / trading name <span style={{ color: 'var(--accent)' }}>*</span></label>
            <input className="input" value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Studio" />
          </div>

          <div className="field">
            <label className="label">Business type</label>
            <select className="select" value={type} onChange={e => setType(e.target.value)}>
              {BUSINESS_TYPES.map(bt => <option key={bt}>{bt}</option>)}
            </select>
          </div>

          <div className="field">
            <label className="label">Country / jurisdiction</label>
            <input className="input" value={country} onChange={e => setCountry(e.target.value)} placeholder="United Kingdom" />
          </div>

          <div className="field">
            <label className="label">Business address</label>
            <input className="input" value={address} onChange={e => setAddress(e.target.value)} placeholder="12 High Street, London, EC1A 1BB" />
          </div>

          <div className="field">
            <label className="label">Activity description</label>
            <textarea
              className="textarea"
              value={activity}
              onChange={e => setActivity(e.target.value)}
              placeholder="Freelance UX design consulting for SaaS companies and digital agencies…"
              rows={3}
            />
          </div>

          <div className="field">
            <label className="label">Documents to generate</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DOCUMENTS.map(doc => (
                <label key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={docs.includes(doc.id)}
                    onChange={() => toggleDoc(doc.id)}
                    style={{ accentColor: 'var(--accent)', width: 15, height: 15 }}
                  />
                  <span>{doc.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="hr" style={{ margin: '20px 0' }} />
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
            <span className="muted">{t('tool.cost')}</span>
            <span className="tabular"><b>{tool.credits}</b> {t('tool.credits')}</span>
          </div>
          <button className="btn btn-accent btn-lg btn-block" onClick={generate} disabled={loading}>
            {loading ? t('tool.generating') : <><Glyph name="sparkle" size={14} /> Generate legal docs</>}
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
