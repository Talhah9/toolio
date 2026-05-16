import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ToolShell } from '../../components/ToolShell';
import { Glyph } from '../../components/Glyph';
import { SaveButton } from '../../components/SaveButton';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';
import { exportPdf } from '../../lib/exportPdf';

const RATE_TYPE_KEYS = ['total', 'daily', 'hourly'];
const DURATION_UNIT_KEYS = ['days', 'weeks', 'months'];
const PAYMENT_TERM_KEYS = ['30 days', '45 days', '60 days', 'On delivery'];

export function ContratTool({ tool, initialData }) {
  const { credits, logGeneration, session, user } = useApp();
  const { t, lang } = useLang();
  const [client, setClient] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [mission, setMission] = useState(initialData?.mission ?? '');
  const [rate, setRate] = useState('');
  const [rateType, setRateType] = useState(initialData?.rateType ?? 'total');
  const [duration, setDuration] = useState('');
  const [durationUnit, setDurationUnit] = useState(initialData?.durationUnit ?? 'weeks');
  const [deliverables, setDeliverables] = useState(initialData?.deliverables ?? '');
  const [paymentTerms, setPaymentTerms] = useState('30 days');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [genId, setGenId] = useState(null);
  const [toast, ToastEl] = useToast();

  const generate = async () => {
    if (!client.trim() || !mission.trim()) { toast(t('tool.contract.error')); return; }
    if (credits === null) return;
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }
    setLoading(true);
    setOutput('');
    try {
      const input = { client, clientCompany, mission, rate, rateType, duration, durationUnit, deliverables, paymentTerms };
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

  const copy = () => { if (!output) return; navigator.clipboard?.writeText(output); toast(t('tool.copied')); };

  const downloadPdf = () => exportPdf({
    toolName: lang === 'fr' ? tool.name_fr : tool.name_en,
    userEmail: user?.email,
    output,
    filename: `toolio-${tool.id}-${new Date().toISOString().slice(0, 10)}.pdf`,
  });

  return (
    <ToolShell tool={tool}>
      <div className="tool-page">
        <div className="card card-pad">
          <h3 className="h3" style={{ marginBottom: 16, fontSize: 15 }}>{t('tool.contract.section.title')}</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label className="label">{t('tool.contract.client.label')} <span style={{ color: 'var(--accent)' }}>*</span></label>
              <input className="input" value={client} onChange={e => setClient(e.target.value)} placeholder={t('tool.contract.client.placeholder')} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label className="label">{t('tool.contract.company.label')}</label>
              <input className="input" value={clientCompany} onChange={e => setClientCompany(e.target.value)} placeholder={t('tool.contract.company.placeholder')} />
            </div>
          </div>

          <div className="field">
            <label className="label">{t('tool.contract.mission.label')} <span style={{ color: 'var(--accent)' }}>*</span></label>
            <textarea className="textarea" value={mission} onChange={e => setMission(e.target.value)} placeholder={t('tool.contract.mission.placeholder')} rows={3} />
          </div>

          <div className="field">
            <label className="label">{t('tool.contract.rate.label')}</label>
            <div className="row" style={{ gap: 8 }}>
              <input className="input" value={rate} onChange={e => setRate(e.target.value)} placeholder="9,500" type="number" style={{ flex: 1 }} />
              <select className="select" value={rateType} onChange={e => setRateType(e.target.value)} style={{ width: 'auto' }}>
                {RATE_TYPE_KEYS.map(k => <option key={k} value={k}>{t(`tool.contract.rate.${k}`)}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label className="label">{t('tool.contract.duration.label')}</label>
            <div className="row" style={{ gap: 8 }}>
              <input className="input" value={duration} onChange={e => setDuration(e.target.value)} placeholder="6" type="number" style={{ flex: 1 }} />
              <select className="select" value={durationUnit} onChange={e => setDurationUnit(e.target.value)} style={{ width: 'auto' }}>
                {DURATION_UNIT_KEYS.map(k => <option key={k} value={k}>{t(`tool.contract.duration.${k}`)}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label className="label">{t('tool.contract.deliverables.label')}</label>
            <textarea className="textarea" value={deliverables} onChange={e => setDeliverables(e.target.value)} placeholder={t('tool.contract.deliverables.placeholder')} rows={2} />
          </div>

          <div className="field">
            <label className="label">{t('tool.contract.payment.label')}</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PAYMENT_TERM_KEYS.map(pt => (
                <button key={pt} type="button" onClick={() => setPaymentTerms(pt)} className="btn btn-sm"
                  style={{ border: '1px solid ' + (paymentTerms === pt ? 'var(--fg)' : 'var(--border)'), background: paymentTerms === pt ? 'var(--fg)' : 'var(--bg)', color: paymentTerms === pt ? '#fff' : 'var(--fg-2)' }}>
                  {pt}
                </button>
              ))}
            </div>
          </div>

          <div className="hr" style={{ margin: '20px 0' }} />
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
            <span className="muted">{t('tool.cost')}</span>
            <span style={{ color: '#10B981', fontWeight: 600 }}>{t('tool.free')}</span>
          </div>
          <button className="btn btn-accent btn-lg btn-block" onClick={generate} disabled={loading}>
            {loading ? t('tool.generating') : <><Glyph name="sparkle" size={14} /> {t('tool.contract.btn')}</>}
          </button>
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
            ) : output ? <div className="result-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown></div> : <div className="result-empty">{t('tool.result.placeholder')}</div>}
          </div>
        </div>
      </div>
      {ToastEl}
    </ToolShell>
  );
}
