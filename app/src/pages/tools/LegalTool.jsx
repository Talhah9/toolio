import { useState } from 'react';
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
import { fillTemplate, CGV_TEMPLATE, PRIVACY_TEMPLATE, MENTIONS_TEMPLATE } from '../../lib/legalTemplates';

const LEGAL_TYPES = ['EI', 'Micro-entreprise', 'EURL', 'SASU', 'SARL', 'SAS', 'SA', 'Autre'];
const DEPOSIT_OPTIONS = ['30', '40', '50'];
const PAYMENT_OPTIONS = ['30', '45', '60'];

const F = { marginBottom: 20 };
const LBL = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--fg-3)', marginBottom: 6 };
const INP = { height: 44, borderRadius: 10 };
const SEL = { height: 44, borderRadius: 10 };
const REQ = { color: 'var(--accent)', marginLeft: 2 };

export function LegalTool({ tool, initialData }) {
  const { credits, logGeneration, session, user } = useApp();
  const { t, lang } = useLang();

  const [company, setCompany] = useState('');
  const [legalType, setLegalType] = useState('Micro-entreprise');
  const [siret, setSiret] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [activity, setActivity] = useState(initialData?.activity ?? '');
  const [vatSubject, setVatSubject] = useState(false);

  const [clientType, setClientType] = useState('B2B');
  const [depositPercent, setDepositPercent] = useState('40');
  const [paymentDelay, setPaymentDelay] = useState('30');

  const [hostingProvider, setHostingProvider] = useState('');
  const [hostingAddress, setHostingAddress] = useState('');

  const [docType, setDocType] = useState(initialData?.docType ?? 'tos');

  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [genId, setGenId] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [toast, ToastEl] = useToast();

  const buildBaseVars = () => {
    const today = new Date().toLocaleDateString('fr-FR');
    return {
      COMPANY_NAME: company.trim(),
      LEGAL_TYPE: legalType,
      SIRET_LINE: siret.trim() ? `, SIRET ${siret.trim()}` : '',
      SIRET_BLOCK: siret.trim() ? `SIRET : ${siret.trim()}\n` : '',
      ADDRESS: address.trim(),
      EMAIL: email.trim(),
      WEBSITE: website.trim() || 'votre site internet',
      WEBSITE_LINE: website.trim() ? `, site internet : ${website.trim()}` : '',
      WEBSITE_DESC: website.trim() ? ` ou sur ${website.trim()}` : '',
      WEBSITE_BLOCK: website.trim() ? `Site web : ${website.trim()}\n` : '',
      VAT_LINE: vatSubject
        ? 'Numéro de TVA intracommunautaire : à compléter.'
        : 'TVA non applicable — article 293 B du CGI.',
      VAT_MENTION: vatSubject
        ? 'Les prix sont indiqués hors taxes (HT). La TVA sera facturée au taux en vigueur à la date de facturation.'
        : `${company.trim()} bénéficie du régime de franchise en base de TVA (article 293 B du CGI). Aucune TVA ne sera facturée.`,
      DEPOSIT_PERCENT: depositPercent,
      PAYMENT_DELAY: paymentDelay,
      DATE: today,
      DIRECTOR_NAME: company.trim(),
      HOSTING_PROVIDER: hostingProvider.trim() || 'Hébergeur à préciser',
      HOSTING_ADDRESS: hostingAddress.trim() || 'Adresse à compléter',
      ACTIVITY_DESC: activity.trim(),
      RETRACTATION: clientType === 'B2C' ? 'true' : '',
      MEDIATION_CLAUSE: clientType === 'B2C'
        ? 'Le client consommateur peut recourir à un médiateur de la consommation conformément aux articles L.616-1 et R.616-1 du Code de la consommation. La liste des médiateurs agréés est disponible sur www.economie.gouv.fr.'
        : '',
      CUSTOM_CLAUSE_TITLE: 'Dispositions spécifiques',
      CUSTOM_CLAUSE_CONTENT: 'Les présentes conditions spécifiques complètent les dispositions générales ci-dessus. Pour toute question ou demande particulière, les parties conviennent de se contacter préalablement afin de trouver une solution adaptée dans le respect des intérêts mutuels.',
    };
  };

  const generate = async () => {
    if (!company.trim()) { toast(t('tool.legal.error.name')); return; }
    if (!email.trim()) { toast(t('tool.legal.error.email')); return; }
    if (!address.trim()) { toast(t('tool.legal.error.address')); return; }
    if (!activity.trim()) { toast(t('tool.legal.error.activity')); return; }
    if (credits === null) return;
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }

    setLoading(true);
    setOutput('');

    try {
      const baseVars = buildBaseVars();

      const aiResponse = await streamGenerate(
        { toolId: tool.id, input: { mode: 'template', activity: activity.trim(), legalType, docType }, session, lang },
        () => {},
      );

      const activityMatch = aiResponse.match(/\[ACTIVITY\]([\s\S]*?)\[\/ACTIVITY\]/);
      const titleMatch = aiResponse.match(/\[TITLE\]([\s\S]*?)\[\/TITLE\]/);
      const clauseMatch = aiResponse.match(/\[CLAUSE\]([\s\S]*?)\[\/CLAUSE\]/);

      const vars = {
        ...baseVars,
        ACTIVITY_DESC: activityMatch ? activityMatch[1].trim() : activity.trim(),
        CUSTOM_CLAUSE_TITLE: titleMatch ? titleMatch[1].trim() : 'Dispositions spécifiques',
        CUSTOM_CLAUSE_CONTENT: clauseMatch ? clauseMatch[1].trim() : baseVars.CUSTOM_CLAUSE_CONTENT,
      };

      let finalDoc;
      if (docType === 'tos') {
        finalDoc = fillTemplate(CGV_TEMPLATE, vars);
      } else if (docType === 'privacy') {
        finalDoc = fillTemplate(PRIVACY_TEMPLATE, vars);
      } else if (docType === 'notice') {
        finalDoc = fillTemplate(MENTIONS_TEMPLATE, vars);
      } else {
        const cgv = fillTemplate(CGV_TEMPLATE, vars);
        const privacy = fillTemplate(PRIVACY_TEMPLATE, vars);
        const notice = fillTemplate(MENTIONS_TEMPLATE, vars);
        finalDoc = cgv + '\n\n---\n\n' + privacy + '\n\n---\n\n' + notice;
      }

      setOutput(finalDoc);
      const id = await logGeneration(tool.id, { company: company.trim(), docType, activity: activity.trim() }, finalDoc, tool.credits);
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

  const showCgvOptions = docType === 'tos' || docType === 'all';
  const showHosting = docType === 'notice' || docType === 'all';

  return (
    <ToolShell tool={tool}>
      <div className="tool-page">
        <div className="card" style={{ padding: 28 }}>

          {/* Row 1: Nom + Forme juridique */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, ...F }}>
            <div>
              <label style={LBL}>{t('tool.legal.company.label')}<span style={REQ}>*</span></label>
              <input className="input" style={INP} value={company} onChange={e => setCompany(e.target.value)} placeholder={t('tool.legal.company.placeholder')} />
            </div>
            <div>
              <label style={LBL}>{t('tool.legal.type.label')}</label>
              <select className="select" style={SEL} value={legalType} onChange={e => setLegalType(e.target.value)}>
                {LEGAL_TYPES.map(lt => <option key={lt} value={lt}>{lt}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Adresse (full width) */}
          <div style={F}>
            <label style={LBL}>{t('tool.legal.address.label')}<span style={REQ}>*</span></label>
            <input className="input" style={INP} value={address} onChange={e => setAddress(e.target.value)} placeholder={t('tool.legal.address.placeholder')} />
          </div>

          {/* Row 3: SIRET + Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, ...F }}>
            <div>
              <label style={LBL}>{t('tool.legal.siret.label')}</label>
              <input className="input" style={INP} value={siret} onChange={e => setSiret(e.target.value)} placeholder="123 456 789 00012" />
            </div>
            <div>
              <label style={LBL}>{t('tool.legal.email.label')}<span style={REQ}>*</span></label>
              <input className="input" style={INP} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hello@monsite.fr" />
            </div>
          </div>

          {/* Row 4: Site internet (full width) */}
          <div style={F}>
            <label style={LBL}>{t('tool.legal.website.label')}</label>
            <input className="input" style={INP} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://monsite.fr" />
          </div>

          {/* Row 5: Description activité */}
          <div style={F}>
            <label style={LBL}>{t('tool.legal.activity.label')}<span style={REQ}>*</span></label>
            <textarea className="textarea" style={{ minHeight: 100, borderRadius: 10, resize: 'vertical' }} value={activity} onChange={e => setActivity(e.target.value)} placeholder={t('tool.legal.activity.placeholder')} />
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '8px 0 24px' }} />

          {/* Row 6: Document type pills */}
          <div style={F}>
            <label style={LBL}>{t('tool.legal.doctype.label')}</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[['tos', 'tool.legal.doctype.tos'], ['privacy', 'tool.legal.doctype.privacy'], ['notice', 'tool.legal.doctype.notice'], ['all', 'tool.legal.doctype.all']].map(([val, key]) => {
                const active = docType === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDocType(val)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: '1.5px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
                      background: active ? 'var(--accent)' : 'var(--bg)',
                      color: active ? '#fff' : 'var(--fg-2)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t(key)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CGV options */}
          {showCgvOptions && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, ...F }}>
                <div>
                  <label style={LBL}>{t('tool.legal.clienttype.label')}</label>
                  <select className="select" style={SEL} value={clientType} onChange={e => setClientType(e.target.value)}>
                    <option value="B2B">{t('tool.legal.clienttype.b2b')}</option>
                    <option value="B2C">{t('tool.legal.clienttype.b2c')}</option>
                  </select>
                </div>
                <div>
                  <label style={LBL}>{t('tool.legal.deposit.label')}</label>
                  <select className="select" style={SEL} value={depositPercent} onChange={e => setDepositPercent(e.target.value)}>
                    {DEPOSIT_OPTIONS.map(v => <option key={v} value={v}>{v}%</option>)}
                  </select>
                </div>
                <div>
                  <label style={LBL}>{t('tool.legal.payment.label')}</label>
                  <select className="select" style={SEL} value={paymentDelay} onChange={e => setPaymentDelay(e.target.value)}>
                    {PAYMENT_OPTIONS.map(v => <option key={v} value={v}>{v} {lang === 'fr' ? 'jours' : 'days'}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ ...F, marginTop: -4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--fg-2)' }}>
                  <input
                    type="checkbox"
                    checked={vatSubject}
                    onChange={e => setVatSubject(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                  {t('tool.legal.vat.label')}
                </label>
              </div>
            </>
          )}

          {/* Hébergeur (mentions légales) */}
          {showHosting && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, ...F }}>
              <div>
                <label style={LBL}>{t('tool.legal.hosting.label')}</label>
                <input className="input" style={INP} value={hostingProvider} onChange={e => setHostingProvider(e.target.value)} placeholder={t('tool.legal.hosting.placeholder')} />
              </div>
              <div>
                <label style={LBL}>{t('tool.legal.hosting.address.label')}</label>
                <input className="input" style={INP} value={hostingAddress} onChange={e => setHostingAddress(e.target.value)} placeholder={t('tool.legal.hosting.address.placeholder')} />
              </div>
            </div>
          )}

          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 20px' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>{t('tool.cost')}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>{t('tool.free')}</span>
          </div>

          <button className="btn btn-accent btn-lg btn-block" onClick={generate} disabled={loading}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', opacity: 0.8, animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
                  {t('tool.legal.generating')}
                </span>
              : <><Glyph name="sparkle" size={14} /> {t('tool.legal.btn')}</>
            }
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
                <div className="result-empty">
                  <span className="row" style={{ gap: 10 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                    <span style={{ color: 'var(--accent)', fontSize: 13 }}>{t('tool.legal.generating')}</span>
                  </span>
                </div>
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
