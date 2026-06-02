import { useState, useEffect } from 'react';
import { MarkdownResult } from '../../components/MarkdownResult';
import { ResultViewer } from '../../components/ResultViewer';
import { ToolShell } from '../../components/ToolShell';
import { Glyph } from '../../components/Glyph';
import { SaveButton } from '../../components/SaveButton';
import { ShareButton } from '../../components/ShareButton';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';
import { exportPdf } from '../../lib/exportPdf';
import { streamGenerate } from '../../lib/streamGenerate';
import { CompletionCelebration } from '../../components/CompletionCelebration';
import { fillTemplate, CONTRAT_TEMPLATE } from '../../lib/legalTemplates';
import GeneratingIndicator from '../../components/GeneratingIndicator';

const RATE_TYPE_KEYS = ['total', 'daily', 'hourly'];
const DURATION_UNIT_KEYS = ['days', 'weeks', 'months'];
const DEPOSIT_OPTIONS = ['30', '40', '50'];
const REVISION_OPTIONS = ['1', '2', '3', 'illimité'];
const LS_KEY = 'savvly_prestataire_info';

function loadPrest() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}

function savePrest(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

export function ContratTool({ tool, initialData }) {
  const { credits, logGeneration, session, user } = useApp();
  const { t, lang } = useLang();

  // Prestataire (auto-saved)
  const [prestName, setPrestName] = useState('');
  const [prestCompany, setPrestCompany] = useState('');
  const [prestEmail, setPrestEmail] = useState('');
  const [prestPhone, setPrestPhone] = useState('');
  const [prestSiret, setPrestSiret] = useState('');
  const [prestAddress, setPrestAddress] = useState('');

  // Client
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  // Mission
  const [mission, setMission] = useState(initialData?.mission ?? '');
  const [deliverables, setDeliverables] = useState(initialData?.deliverables ?? '');
  const [rate, setRate] = useState('');
  const [rateType, setRateType] = useState(initialData?.rateType ?? 'total');
  const [duration, setDuration] = useState('');
  const [durationUnit, setDurationUnit] = useState(initialData?.durationUnit ?? 'weeks');
  const [startDate, setStartDate] = useState('');
  const [depositPercent, setDepositPercent] = useState('40');
  const [revisions, setRevisions] = useState('2');
  const [vatSubject, setVatSubject] = useState(false);

  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [genId, setGenId] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [toast, ToastEl] = useToast();

  // Load prestataire info from localStorage on mount
  useEffect(() => {
    const p = loadPrest();
    if (p.name) setPrestName(p.name);
    if (p.company) setPrestCompany(p.company);
    if (p.email) setPrestEmail(p.email);
    if (p.phone) setPrestPhone(p.phone);
    if (p.siret) setPrestSiret(p.siret);
    if (p.address) setPrestAddress(p.address);
  }, []);

  // Auto-save prestataire info on change
  useEffect(() => {
    savePrest({ name: prestName, company: prestCompany, email: prestEmail, phone: prestPhone, siret: prestSiret, address: prestAddress });
  }, [prestName, prestCompany, prestEmail, prestPhone, prestSiret, prestAddress]);

  const generate = async () => {
    if (!clientName.trim()) { toast(t('tool.contract.error')); return; }
    if (!mission.trim()) { toast(t('tool.contract.error')); return; }
    if (credits === null) return;
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }

    setLoading(true);
    setOutput('');

    try {
      const today = new Date().toLocaleDateString('fr-FR');

      const aiResponse = await streamGenerate(
        { toolId: tool.id, input: { mode: 'template', mission: mission.trim() }, session, lang },
        () => {},
      );

      const missionMatch = aiResponse.match(/\[MISSION\]([\s\S]*?)\[\/MISSION\]/);
      const reformulatedMission = missionMatch ? missionMatch[1].trim() : mission.trim();

      const depPct = parseInt(depositPercent, 10);
      const balPct = 100 - depPct;

      const rateLabels = { total: lang === 'fr' ? 'forfait total' : 'total fee', daily: lang === 'fr' ? '/ jour' : '/ day', hourly: lang === 'fr' ? '/ heure' : '/ hour' };
      const durationLabels = { days: lang === 'fr' ? 'jours' : 'days', weeks: lang === 'fr' ? 'semaines' : 'weeks', months: lang === 'fr' ? 'mois' : 'months' };

      const rateDisplay = rate
        ? `${parseFloat(rate).toLocaleString('fr-FR')} €${vatSubject ? ' HT' : ''} ${rateLabels[rateType] || rateType}`
        : (lang === 'fr' ? 'À définir' : 'To be defined');

      const vatMention = vatSubject
        ? 'TVA applicable au taux en vigueur à la date de facturation.'
        : (lang === 'fr' ? 'Prestataire soumis à la franchise en base de TVA — aucune TVA facturée.' : 'Service provider exempt from VAT — no VAT will be charged.');

      const today2 = new Date();
      const defaultStart = startDate || today2.toLocaleDateString('fr-FR');

      const delivBlock = deliverables.trim()
        ? deliverables.trim().split(/[,\n]/).map(d => d.trim()).filter(Boolean).map(d => `- ${d}`).join('\n')
        : (lang === 'fr' ? '- À définir avec le client' : '- To be defined with the client');

      const vars = {
        PREST_NAME: prestName.trim() || (lang === 'fr' ? 'Prestataire' : 'Service Provider'),
        PREST_COMPANY_LINE: prestCompany.trim() ? `\n${prestCompany.trim()}` : '',
        PREST_ADDRESS: prestAddress.trim() || (lang === 'fr' ? 'Adresse à compléter' : 'Address to complete'),
        PREST_EMAIL: prestEmail.trim() || (lang === 'fr' ? 'email@exemple.fr' : 'email@example.com'),
        PREST_SIRET_LINE: prestSiret.trim() ? `SIRET : ${prestSiret.trim()}` : '',
        CLIENT_NAME: clientName.trim(),
        CLIENT_COMPANY_LINE: clientCompany.trim() ? `\n${clientCompany.trim()}` : '',
        CLIENT_ADDRESS_LINE: clientAddress.trim() || (lang === 'fr' ? 'Adresse à compléter' : 'Address to complete'),
        MISSION_DESC: reformulatedMission,
        START_DATE: defaultStart,
        DURATION: duration || (lang === 'fr' ? 'à définir' : 'TBD'),
        DURATION_UNIT: durationLabels[durationUnit] || durationUnit,
        DELIVERABLES_BLOCK: delivBlock,
        RATE_DISPLAY: rateDisplay,
        VAT_MENTION: vatMention,
        DEPOSIT_PERCENT: String(depPct),
        BALANCE_PERCENT: String(balPct),
        REVISIONS: revisions,
        DATE: today,
      };

      const finalDoc = fillTemplate(CONTRAT_TEMPLATE, vars);
      setOutput(finalDoc);

      const inputLog = { clientName: clientName.trim(), mission: mission.trim(), rate, rateType };
      const id = await logGeneration(tool.id, inputLog, finalDoc, tool.credits);
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
    filename: `savvly-${tool.id}-${new Date().toISOString().slice(0, 10)}.pdf`,
  });

  return (
    <ToolShell tool={tool}>
      <div className="tool-page">
        <div className="card card-pad">

          {/* Prestataire */}
          <h3 className="h3" style={{ marginBottom: 12, fontSize: 15 }}>{t('tool.contract.prestataire.title')}</h3>
          <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>{t('tool.devis.prestataire.hint')}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label className="label">{t('tool.contract.prestataire.name.label')} <span style={{ color: 'var(--accent)' }}>*</span></label>
              <input className="input" value={prestName} onChange={e => setPrestName(e.target.value)} placeholder={t('tool.contract.prestataire.name.placeholder')} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label className="label">{t('tool.contract.prestataire.company.label')}</label>
              <input className="input" value={prestCompany} onChange={e => setPrestCompany(e.target.value)} placeholder={t('tool.contract.prestataire.company.placeholder')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label className="label">{t('tool.contract.prestataire.email.label')}</label>
              <input className="input" type="email" value={prestEmail} onChange={e => setPrestEmail(e.target.value)} placeholder={t('tool.contract.prestataire.email.placeholder')} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label className="label">{t('tool.contract.prestataire.phone.label')}</label>
              <input className="input" value={prestPhone} onChange={e => setPrestPhone(e.target.value)} placeholder={t('tool.contract.prestataire.phone.placeholder')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label className="label">{t('tool.contract.prestataire.siret.label')}</label>
              <input className="input" value={prestSiret} onChange={e => setPrestSiret(e.target.value)} placeholder="123 456 789 00012" />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label className="label">{t('tool.contract.prestataire.address.label')}</label>
              <input className="input" value={prestAddress} onChange={e => setPrestAddress(e.target.value)} placeholder={t('tool.contract.prestataire.address.placeholder')} />
            </div>
          </div>

          <div className="hr" style={{ margin: '20px 0' }} />

          {/* Client */}
          <h3 className="h3" style={{ marginBottom: 12, fontSize: 15 }}>{t('tool.contract.section.title')}</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label className="label">{t('tool.contract.client.label')} <span style={{ color: 'var(--accent)' }}>*</span></label>
              <input className="input" value={clientName} onChange={e => setClientName(e.target.value)} placeholder={t('tool.contract.client.placeholder')} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label className="label">{t('tool.contract.company.label')}</label>
              <input className="input" value={clientCompany} onChange={e => setClientCompany(e.target.value)} placeholder={t('tool.contract.company.placeholder')} />
            </div>
          </div>

          <div className="field">
            <label className="label">{t('tool.contract.client.address.label')}</label>
            <input className="input" value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder={t('tool.contract.client.address.placeholder')} />
          </div>

          <div className="hr" style={{ margin: '20px 0' }} />

          {/* Mission */}
          <div className="field">
            <label className="label">{t('tool.contract.mission.label')} <span style={{ color: 'var(--accent)' }}>*</span></label>
            <textarea className="textarea" value={mission} onChange={e => setMission(e.target.value)} placeholder={t('tool.contract.mission.placeholder')} rows={3} />
          </div>

          <div className="field">
            <label className="label">{t('tool.contract.deliverables.label')}</label>
            <textarea className="textarea" value={deliverables} onChange={e => setDeliverables(e.target.value)} placeholder={t('tool.contract.deliverables.placeholder')} rows={2} />
          </div>

          <div className="field">
            <label className="label">{t('tool.contract.rate.label')}</label>
            <div className="row" style={{ gap: 8 }}>
              <input className="input" value={rate} onChange={e => setRate(e.target.value)} placeholder="5 000" type="number" style={{ flex: 1 }} />
              <select className="select" value={rateType} onChange={e => setRateType(e.target.value)} style={{ width: 'auto' }}>
                {RATE_TYPE_KEYS.map(k => <option key={k} value={k}>{t(`tool.contract.rate.${k}`)}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label className="label">{t('tool.contract.duration.label')}</label>
              <div className="row" style={{ gap: 8 }}>
                <input className="input" value={duration} onChange={e => setDuration(e.target.value)} placeholder="6" type="number" style={{ flex: 1 }} />
                <select className="select" value={durationUnit} onChange={e => setDurationUnit(e.target.value)} style={{ width: 'auto' }}>
                  {DURATION_UNIT_KEYS.map(k => <option key={k} value={k}>{t(`tool.contract.duration.${k}`)}</option>)}
                </select>
              </div>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label className="label">{t('tool.contract.startdate.label')}</label>
              <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value ? new Date(e.target.value).toLocaleDateString('fr-FR') : '')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label className="label">{t('tool.contract.deposit.label')}</label>
              <select className="select" value={depositPercent} onChange={e => setDepositPercent(e.target.value)}>
                {DEPOSIT_OPTIONS.map(v => <option key={v} value={v}>{v}%</option>)}
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label className="label">{t('tool.contract.revisions.label')}</label>
              <select className="select" value={revisions} onChange={e => setRevisions(e.target.value)}>
                {REVISION_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={vatSubject} onChange={e => setVatSubject(e.target.checked)} />
              {t('tool.contract.vat.label')}
            </label>
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
                <ShareButton generationId={genId} />
                <button className="btn btn-ghost btn-sm" onClick={copy} disabled={!output}><Glyph name="copy" size={12} /> {t('tool.copy')}</button>
                {output && <button className="btn btn-ghost btn-sm" onClick={downloadPdf}><Glyph name="arrow-down" size={12} /> {t('tool.pdf')}</button>}
                <button className="btn btn-ghost btn-sm" onClick={generate} disabled={!output || loading}><Glyph name="refresh" size={12} /> {t('tool.regenerate')}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setViewerOpen(true)} disabled={!output}><Glyph name="expand" size={12} /> Fullscreen</button>
              </div>
            </div>
            {viewerOpen && <ResultViewer output={output} toolName={lang === 'fr' ? tool.name_fr : tool.name_en} userEmail={user?.email} onClose={() => setViewerOpen(false)} />}
            <div className="result-body" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 260px)', scrollBehavior: 'smooth' }}>
              {loading ? (
                <GeneratingIndicator toolId="contract" />
              ) : output ? (
                <MarkdownResult>{output}</MarkdownResult>
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
          onPdf={downloadPdf}
          onFullscreen={() => setViewerOpen(true)}
          onClose={() => setShowCelebration(false)}
          t={t}
        />
      )}
    </ToolShell>
  );
}
