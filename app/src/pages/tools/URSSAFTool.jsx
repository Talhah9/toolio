import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { Glyph } from '../../components/Glyph';
import { ToolIcon } from '../../components/ToolIcon';
import { useToast } from '../../components/Toast';

const REGIMES = [
  { id: 'micro-bnc',  label: 'Micro-BNC',          desc: 'Professions libérales',       forcesActivite: 'liberal' },
  { id: 'micro-bic',  label: 'Micro-BIC',           desc: 'Services & commerce',          forcesActivite: null },
  { id: 'auto',       label: 'Auto-entrepreneur',   desc: 'Micro-entreprise (AE)',         forcesActivite: null },
  { id: 'eurl',       label: 'EURL',                desc: 'Société — estimation IS+TNS',  forcesActivite: null },
  { id: 'sasu',       label: 'SASU',                desc: 'Société — estimation IS+charges', forcesActivite: null },
];

const ACTIVITES = [
  { id: 'liberal',  label: 'Libéral' },
  { id: 'services', label: 'Services' },
  { id: 'ventes',   label: 'Ventes' },
];

const QUARTERS = [
  { id: 'T1', label: '1er trimestre', months: 'Jan–Mar', deadline: '30 avril' },
  { id: 'T2', label: '2e trimestre',  months: 'Avr–Jun', deadline: '31 juillet' },
  { id: 'T3', label: '3e trimestre',  months: 'Jul–Sep', deadline: '31 octobre' },
  { id: 'T4', label: '4e trimestre',  months: 'Oct–Déc', deadline: '31 janvier' },
];

const TVA_SEUILS = { services: 37500, liberal: 37500, ventes: 85000 };
const MICRO_SEUILS = { liberal: 77700, services: 77700, ventes: 188700 };
const EURL_SASU_CA_OPTIMAL = 70000;

function getTaux(regimeId, activite, domtom) {
  if (regimeId === 'micro-bnc')  return domtom ? 0.155 : 0.232;
  if (regimeId === 'micro-bic' || regimeId === 'auto') {
    if (activite === 'ventes') return domtom ? 0.089 : 0.128;
    return domtom ? 0.141 : 0.222;
  }
  if (regimeId === 'eurl')  return 0.43;
  if (regimeId === 'sasu')  return 0.47;
  return 0.45;
}

function getAbattement(regimeId, activite) {
  if (regimeId === 'micro-bnc')  return 0.34;
  if (regimeId === 'micro-bic' || regimeId === 'auto') {
    if (activite === 'ventes') return 0.71;
    return 0.50;
  }
  return null;
}

function isMicro(regimeId) {
  return regimeId === 'micro-bnc' || regimeId === 'micro-bic' || regimeId === 'auto';
}

function fmtEur(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
function fmtEurDec(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
function fmtPct(r) {
  return (r * 100).toFixed(1).replace('.0', '') + '%';
}

function Toggle({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
      {['Non', 'Oui'].map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt === 'Oui')}
          style={{
            padding: '6px 16px',
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            background: (opt === 'Oui') === value ? 'var(--accent)' : 'var(--bg)',
            color: (opt === 'Oui') === value ? '#fff' : 'var(--fg-3)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >{opt}</button>
      ))}
    </div>
  );
}

export function URSSAFTool({ tool }) {
  const navigate = useNavigate();
  const [ca, setCa] = useState(48000);
  const [regimeId, setRegimeId] = useState('micro-bnc');
  const [activite, setActivite] = useState('liberal');
  const [acre, setAcre] = useState(false);
  const [domtom, setDomtom] = useState(false);
  const [trimestre, setTrimestre] = useState('T1');
  const [toast, ToastEl] = useToast();

  const regime = REGIMES.find(r => r.id === regimeId);
  const effectiveActivite = regime.forcesActivite || activite;
  const taux = getTaux(regimeId, effectiveActivite, domtom);
  const abattement = getAbattement(regimeId, effectiveActivite);
  const micro = isMicro(regimeId);

  const calc = useMemo(() => {
    const caQ = ca / 4;
    const cot = ca * taux;
    const cotQ = cot / 4;
    const net = ca - cot;

    // ACRE: Y1 50%, Y2 75%, Y3 100%
    const acreRows = micro ? [
      { label: 'Année 1 (ACRE)', taux: taux * 0.5,  cot: ca * taux * 0.5,  net: ca - ca * taux * 0.5,  economy: ca * taux * 0.5 },
      { label: 'Année 2',        taux: taux * 0.75, cot: ca * taux * 0.75, net: ca - ca * taux * 0.75, economy: ca * taux * 0.25 },
      { label: 'Année 3+',       taux: taux,        cot: ca * taux,        net: ca - ca * taux,        economy: 0 },
    ] : null;

    // Simulation +20%
    const caPlus20 = ca * 1.2;
    const cotPlus20 = caPlus20 * taux;

    const tvaSeuil = TVA_SEUILS[effectiveActivite] ?? 37500;
    const microSeuil = MICRO_SEUILS[effectiveActivite] ?? 77700;

    return {
      caQ, cot, cotQ, net,
      acreRows,
      caPlus20, cotPlus20, netPlus20: caPlus20 - cotPlus20,
      cotDelta: cotPlus20 - cot,
      tvaSeuil, microSeuil,
      quarters: QUARTERS.map(q => ({ ...q, caQ, cotQ })),
    };
  }, [ca, taux, effectiveActivite, micro]);

  const copyTable = () => {
    const lines = [
      `CA annuel : ${fmtEur(ca)}`,
      `Régime : ${regime.label}`,
      `Taux : ${fmtPct(taux)}`,
      '',
      'Trimestre | CA déclaré | Cotisations | Date limite',
      ...calc.quarters.map(q => `${q.id} | ${fmtEur(q.caQ)} | ${fmtEur(q.cotQ)} | ${q.deadline}`),
      '',
      `Total cotisations : ${fmtEurDec(calc.cot)}`,
      `Net estimé : ${fmtEurDec(calc.net)}`,
    ].join('\n');
    navigator.clipboard?.writeText(lines);
    toast('Tableau copié dans le presse-papier');
  };

  const sectionHead = (title, action) => (
    <div className="row" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', justifyContent: 'space-between' }}>
      <h3 className="h3" style={{ fontSize: 15, margin: 0 }}>{title}</h3>
      {action}
    </div>
  );

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .urssaf-grid-2 { grid-template-columns: 1fr !important; }
          .urssaf-grid-3 { grid-template-columns: 1fr !important; }
          .urssaf-sim-grid { grid-template-columns: 1fr !important; }
          .urssaf-sim-cell + .urssaf-sim-cell { border-left: none !important; border-top: 1px solid var(--border) !important; }
        }
      `}</style>
      <AppHeader />
      <div className="page-pad">
        <div className="breadcrumb">
          <a onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</a>
          <Glyph name="chevron-right" size={12} />
          <span>Outils</span>
          <Glyph name="chevron-right" size={12} />
          <span className="current">{tool.short}</span>
        </div>

        <div className="row" style={{ marginBottom: 28, gap: 16 }}>
          <ToolIcon tool={tool} size="lg" />
          <div>
            <div className="row" style={{ gap: 10, marginBottom: 4, alignItems: 'center' }}>
              <h1 className="h1" style={{ margin: 0 }}>{tool.name}</h1>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, border: '1px solid #dbeafe', background: '#eff6ff', color: '#1d4ed8' }}>
                France uniquement
              </span>
            </div>
            <p className="muted" style={{ fontSize: 14 }}>{tool.desc}</p>
          </div>
        </div>

        <div style={{ maxWidth: 780 }}>
          {/* ── Inputs ──────────────────────────────────────────── */}
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <div className="urssaf-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
              {/* CA slider */}
              <div>
                <label className="label">CA annuel prévisionnel</label>
                <div style={{ textAlign: 'center', margin: '12px 0 8px' }}>
                  <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em' }}>{fmtEur(ca)}</span>
                </div>
                <input type="range" min={5000} max={200000} step={1000} value={ca}
                  onChange={e => setCa(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }} />
                <div className="row" style={{ justifyContent: 'space-between', fontSize: 11, color: 'var(--fg-4)', marginTop: 4 }}>
                  <span>5 k€</span><span>200 k€</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <label className="label" style={{ marginBottom: 4 }}>Ou saisir manuellement</label>
                  <div style={{ position: 'relative' }}>
                    <input className="input" type="number" value={ca}
                      onChange={e => setCa(Math.max(0, Number(e.target.value)))}
                      style={{ paddingRight: 28 }} />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-4)', fontSize: 13 }}>€</span>
                  </div>
                </div>
              </div>

              {/* Régime */}
              <div>
                <label className="label">Régime</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {REGIMES.map(r => (
                    <button key={r.id} onClick={() => {
                      setRegimeId(r.id);
                      if (r.forcesActivite) setActivite(r.forcesActivite);
                    }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                        borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                        border: `2px solid ${regimeId === r.id ? 'var(--accent)' : 'var(--border)'}`,
                        background: regimeId === r.id ? 'var(--accent-bg, #f0f7ff)' : 'var(--bg)',
                      }}>
                      <span style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${regimeId === r.id ? 'var(--accent)' : 'var(--border)'}`,
                        background: regimeId === r.id ? 'var(--accent)' : 'transparent' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{r.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-4)' }}>{r.desc}</div>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 12, color: regimeId === r.id ? 'var(--accent)' : 'var(--fg-4)' }}>
                        {micro && regimeId === r.id ? fmtPct(taux) : ''}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Type d'activité (disabled for micro-bnc) */}
            {!regime.forcesActivite && (
              <div style={{ marginBottom: 16 }}>
                <label className="label" style={{ marginBottom: 8 }}>Type d'activité</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {ACTIVITES.map(a => (
                    <button key={a.id} type="button" onClick={() => setActivite(a.id)}
                      className="btn btn-sm"
                      style={{
                        border: `1px solid ${activite === a.id ? 'var(--accent)' : 'var(--border)'}`,
                        background: activite === a.id ? 'var(--accent-bg, #f0f7ff)' : 'var(--bg)',
                        color: activite === a.id ? 'var(--accent)' : 'var(--fg-2)',
                        fontWeight: activite === a.id ? 600 : 400,
                      }}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Options row */}
            <div className="urssaf-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label className="label" style={{ marginBottom: 8 }}>ACRE</label>
                <Toggle value={acre} onChange={setAcre} />
                {acre && <div style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 4 }}>Exonération 1re année</div>}
              </div>
              <div>
                <label className="label" style={{ marginBottom: 8 }}>DOM-TOM</label>
                <Toggle value={domtom} onChange={setDomtom} />
                {domtom && <div style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 4 }}>Taux réduits applicables</div>}
              </div>
              <div>
                <label className="label" style={{ marginBottom: 8 }}>Trimestre actuel</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {QUARTERS.map(q => (
                    <button key={q.id} type="button" onClick={() => setTrimestre(q.id)}
                      style={{
                        padding: '5px 10px', fontSize: 12, fontWeight: trimestre === q.id ? 700 : 400,
                        border: `1px solid ${trimestre === q.id ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 6,
                        background: trimestre === q.id ? 'var(--accent)' : 'var(--bg)',
                        color: trimestre === q.id ? '#fff' : 'var(--fg-3)',
                        cursor: 'pointer',
                      }}>
                      {q.id}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Summary cards ───────────────────────────────────── */}
          <div className="urssaf-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'CA annuel', value: fmtEur(ca), color: 'var(--fg)' },
              { label: `Cotisations (${fmtPct(acre ? taux * 0.5 : taux)})`, value: fmtEurDec(acre ? ca * taux * 0.5 : calc.cot), color: '#EF4444' },
              { label: 'Net estimé', value: fmtEurDec(acre ? ca - ca * taux * 0.5 : calc.net), color: '#10B981' },
            ].map(item => (
              <div key={item.label} className="card card-pad" style={{ textAlign: 'center', padding: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--fg-4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* ── Quarterly table ─────────────────────────────────── */}
          <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
            {sectionHead('Échéancier trimestriel',
              <button className="btn btn-ghost btn-sm" onClick={copyTable}><Glyph name="copy" size={12} /> Copier</button>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-2)' }}>
                    {['Trimestre', 'Période', 'CA déclaré', `Taux (${fmtPct(taux)})`, 'À payer', 'Date limite'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: 'var(--fg-4)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {calc.quarters.map((q, i) => {
                    const isCurrent = q.id === trimestre;
                    const displayCot = acre ? q.cotQ * 0.5 : q.cotQ;
                    return (
                      <tr key={q.id} style={{
                        borderTop: '1px solid var(--border)',
                        background: isCurrent ? 'var(--accent-bg, #f0f7ff)' : i % 2 === 0 ? 'transparent' : 'var(--bg-2, #fafafa)',
                      }}>
                        <td style={{ padding: '12px 16px', fontWeight: isCurrent ? 700 : 400 }}>
                          {q.id} {isCurrent && <span style={{ fontSize: 10, color: 'var(--accent)', marginLeft: 4 }}>← actuel</span>}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--fg-4)', fontSize: 13 }}>{q.months}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{fmtEurDec(q.caQ)}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--fg-4)' }}>{fmtPct(acre ? taux * 0.5 : taux)}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#EF4444', fontFamily: 'monospace' }}>{fmtEurDec(displayCot)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: 20, background: isCurrent ? '#FEF3C7' : 'var(--bg-2)', color: isCurrent ? '#92400E' : 'var(--fg-4)', fontSize: 12, fontWeight: 600 }}>
                            {q.deadline}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                    <td colSpan={4} style={{ padding: '12px 16px' }}>Total annuel</td>
                    <td style={{ padding: '12px 16px', color: '#EF4444', fontFamily: 'monospace' }}>
                      {fmtEurDec(acre ? calc.cot * 0.5 : calc.cot)}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--fg-4)', fontSize: 13 }}>—</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--fg-4)' }}>
              Les cotisations sont calculées sur le CA brut encaissé. N'oubliez pas la <strong>CFE</strong> (Cotisation Foncière des Entreprises), due en décembre.
              {!micro && <span> Taux EURL/SASU = estimation globale IS + charges sociales — consultez un expert-comptable.</span>}
            </div>
          </div>

          {/* ── ACRE impact ─────────────────────────────────────── */}
          {acre && calc.acreRows && (
            <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
              {sectionHead('Impact ACRE — Taux progressifs sur 3 ans', null)}
              <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-2)' }}>
                    {['Période', 'Taux ACRE', 'Cotisations', 'Net estimé', 'Économie vs normal'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: 'var(--fg-4)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {calc.acreRows.map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border)', background: i === 0 ? 'var(--accent-bg, #f0f7ff)' : 'transparent' }}>
                      <td style={{ padding: '12px 16px', fontWeight: i === 0 ? 700 : 400 }}>{row.label}</td>
                      <td style={{ padding: '12px 16px', color: i === 0 ? 'var(--accent)' : 'var(--fg)' }}>{fmtPct(row.taux)}</td>
                      <td style={{ padding: '12px 16px', color: '#EF4444', fontFamily: 'monospace' }}>{fmtEurDec(row.cot)}</td>
                      <td style={{ padding: '12px 16px', color: '#10B981', fontFamily: 'monospace' }}>{fmtEurDec(row.net)}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: row.economy > 0 ? '#10B981' : 'var(--fg-4)' }}>
                        {row.economy > 0 ? `+ ${fmtEurDec(row.economy)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {/* ── DOM-TOM note ─────────────────────────────────────── */}
          {domtom && (
            <div className="card card-pad" style={{ marginBottom: 20, border: '1px solid #BFDBFE', background: '#EFF6FF' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#1D4ED8' }}>Avantages DOM-TOM</div>
              <div style={{ fontSize: 13, color: '#1E40AF', lineHeight: 1.6 }}>
                Le taux appliqué ({fmtPct(taux)}) intègre déjà la réduction DOM-TOM.
                En Martinique, Guadeloupe et Réunion, les cotisations sociales sont réduites sur les 24 premiers mois d'activité (taux encore plus faibles la 1re année).
                Renseignez-vous auprès de votre URSSAF locale pour les abattements supplémentaires éventuels.
              </div>
            </div>
          )}

          {/* ── Simulation +20% ─────────────────────────────────── */}
          <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
            {sectionHead('Simulation — si votre CA augmente de 20%', null)}
            <div className="urssaf-sim-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
              {[
                { label: 'CA +20%', value: fmtEur(calc.caPlus20), sub: `vs ${fmtEur(ca)} actuel`, color: 'var(--fg)' },
                { label: 'Cotisations', value: fmtEurDec(calc.cotPlus20), sub: `+${fmtEurDec(calc.cotDelta)} supplémentaires`, color: '#EF4444' },
                { label: 'Net estimé', value: fmtEurDec(calc.netPlus20), sub: `vs ${fmtEurDec(calc.net)} actuel`, color: '#10B981' },
              ].map((item, i) => (
                <div key={item.label} className="urssaf-sim-cell" style={{ padding: '16px 20px', borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: item.color, marginBottom: 2 }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-4)' }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Optimisation fiscale ─────────────────────────────── */}
          <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
            {sectionHead('Optimisation & seuils à surveiller', null)}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Abattement fiscal */}
              {abattement && (
                <div style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-2)' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Abattement fiscal {fmtPct(abattement)}</div>
                  <div style={{ fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.5 }}>
                    Votre base imposable à l'IR est de {fmtEur(ca * (1 - abattement))} (après abattement forfaitaire de {fmtPct(abattement)} sur {fmtEur(ca)}).
                    Les cotisations sociales sont calculées sur le CA brut ({fmtEur(ca)}), pas sur la base après abattement.
                  </div>
                </div>
              )}

              {/* Versement libératoire */}
              {micro && ca > 15000 && (
                <div style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #D1FAE5', background: '#ECFDF5' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#065F46' }}>Versement libératoire de l'IR</div>
                  <div style={{ fontSize: 13, color: '#047857', lineHeight: 1.5 }}>
                    Avec un CA de {fmtEur(ca)}, vous pouvez opter pour le versement libératoire si votre revenu fiscal de référence N-2 est inférieur à 27 478€.
                    Taux : {effectiveActivite === 'ventes' ? '1%' : effectiveActivite === 'liberal' ? '2.2%' : '1.7%'} du CA — souvent avantageux en dessous de la tranche à 30%.
                  </div>
                </div>
              )}

              {/* TVA franchise */}
              {micro && (
                <div style={{
                  padding: '12px 14px', borderRadius: 8,
                  border: `1px solid ${ca > calc.tvaSeuil * 0.9 ? '#FDE68A' : 'var(--border)'}`,
                  background: ca > calc.tvaSeuil * 0.9 ? '#FFFBEB' : 'var(--bg-2)',
                }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: ca > calc.tvaSeuil * 0.9 ? '#92400E' : 'var(--fg)' }}>
                    {ca > calc.tvaSeuil ? 'Seuil TVA dépassé' : ca > calc.tvaSeuil * 0.9 ? 'Seuil TVA proche' : 'Franchise en base de TVA'}
                  </div>
                  <div style={{ fontSize: 13, color: ca > calc.tvaSeuil * 0.9 ? '#92400E' : 'var(--fg-3)', lineHeight: 1.5 }}>
                    Seuil franchise TVA : {fmtEur(calc.tvaSeuil)} (CA actuel : {fmtEur(ca)}).
                    {ca > calc.tvaSeuil
                      ? ' Votre CA dépasse le seuil — vous devez facturer la TVA et la reverser.'
                      : ca > calc.tvaSeuil * 0.9
                        ? ` Vous approchez du seuil — anticipez le passage à la TVA (il reste ${fmtEur(calc.tvaSeuil - ca)}).`
                        : ' Vous êtes en franchise de TVA — vous ne facturez pas de TVA à vos clients.'}
                  </div>
                </div>
              )}

              {/* Seuil micro */}
              {micro && (
                <div style={{
                  padding: '12px 14px', borderRadius: 8,
                  border: `1px solid ${ca > calc.microSeuil * 0.85 ? '#FECACA' : 'var(--border)'}`,
                  background: ca > calc.microSeuil * 0.85 ? '#FEF2F2' : 'var(--bg-2)',
                }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: ca > calc.microSeuil * 0.85 ? '#991B1B' : 'var(--fg)' }}>
                    Seuil du régime micro : {fmtEur(calc.microSeuil)}
                  </div>
                  <div style={{ fontSize: 13, color: ca > calc.microSeuil * 0.85 ? '#991B1B' : 'var(--fg-3)', lineHeight: 1.5 }}>
                    {ca > calc.microSeuil
                      ? 'Seuil dépassé — vous sortez automatiquement du régime micro.'
                      : ca > calc.microSeuil * 0.85
                        ? `Vous approchez du plafond micro (${fmtEur(calc.microSeuil - ca)} restants). Pensez à anticiper le changement de régime.`
                        : `Au régime micro, pas de comptabilité complète, pas de déduction de charges réelles.`}
                  </div>
                </div>
              )}

              {/* EURL/SASU switch */}
              {ca >= EURL_SASU_CA_OPTIMAL && micro && (
                <div style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #DDD6FE', background: '#F5F3FF' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#5B21B6' }}>Quand passer en EURL ou SASU ?</div>
                  <div style={{ fontSize: 13, color: '#6D28D9', lineHeight: 1.5 }}>
                    Avec {fmtEur(ca)} de CA, envisagez le passage en structure IS (EURL ou SASU).
                    <br />
                    <strong>EURL :</strong> Gérant TNS, cotisations ~45% sur la rémunération mais déductibles. Idéal si vous réinvestissez les bénéfices.
                    <br />
                    <strong>SASU :</strong> Président assimilé-salarié, protection sociale plus complète, charges ~47% mais IS à 15% sur les premiers 42 500€.
                    <br />
                    Seuil typique de rentabilité du changement : 70 000–80 000€ de CA selon votre profil fiscal. Consultez un expert-comptable.
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
        {ToastEl}
      </div>
    </>
  );
}
