import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { Glyph } from '../../components/Glyph';
import { ToolIcon } from '../../components/ToolIcon';
import { useToast } from '../../components/Toast';

const REGIMES = [
  {
    id: 'micro-bnc',
    label: 'Micro-BNC',
    desc: 'Professions libérales non réglementées',
    taux: 0.232,
    tauxLabel: '23,2%',
    abattement: 0.34,
  },
  {
    id: 'micro-bic',
    label: 'Micro-BIC',
    desc: 'Prestations de services commerciales',
    taux: 0.222,
    tauxLabel: '22,2%',
    abattement: 0.5,
  },
  {
    id: 'reel',
    label: 'Régime réel simplifié',
    desc: 'EI ou société au régime réel',
    taux: 0.45,
    tauxLabel: '~45%',
    abattement: null,
  },
];

const QUARTERS = [
  { id: 'Q1', label: '1er trimestre', months: 'Jan–Mar', deadline: '30 avril' },
  { id: 'Q2', label: '2e trimestre', months: 'Avr–Jun', deadline: '31 juillet' },
  { id: 'Q3', label: '3e trimestre', months: 'Jul–Sep', deadline: '31 octobre' },
  { id: 'Q4', label: '4e trimestre', months: 'Oct–Déc', deadline: '31 janvier' },
];

function fmtEur(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function fmtEurDec(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export function URSSAFTool({ tool }) {
  const navigate = useNavigate();
  const [ca, setCa] = useState(48000);
  const [regimeId, setRegimeId] = useState('micro-bnc');
  const [toast, ToastEl] = useToast();

  const regime = REGIMES.find(r => r.id === regimeId);

  const calc = useMemo(() => {
    const caParTrimestre = ca / 4;
    const totalCotisations = ca * regime.taux;
    const cotisationsParTrimestre = totalCotisations / 4;

    return {
      caParTrimestre,
      totalCotisations,
      cotisationsParTrimestre,
      netEstime: ca - totalCotisations,
      quarters: QUARTERS.map(q => ({
        ...q,
        ca: caParTrimestre,
        cotisations: cotisationsParTrimestre,
      })),
    };
  }, [ca, regime]);

  const copyTable = () => {
    const lines = [
      `CA annuel : ${fmtEur(ca)}`,
      `Régime : ${regime.label}`,
      `Taux de cotisations : ${regime.tauxLabel}`,
      '',
      'Trimestre | CA déclaré | Cotisations | Date limite',
      ...calc.quarters.map(q => `${q.label} | ${fmtEur(q.ca)} | ${fmtEur(q.cotisations)} | ${q.deadline}`),
      '',
      `Total cotisations : ${fmtEurDec(calc.totalCotisations)}`,
      `Net estimé : ${fmtEurDec(calc.netEstime)}`,
    ].join('\n');
    navigator.clipboard?.writeText(lines);
    toast('Tableau copié dans le presse-papier');
  };

  return (
    <>
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
                🇫🇷 France uniquement
              </span>
            </div>
            <p className="muted" style={{ fontSize: 14 }}>{tool.desc}</p>
          </div>
        </div>

        <div style={{ maxWidth: 720 }}>
          {/* Inputs */}
          <div className="card card-pad" style={{ marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* CA slider */}
              <div>
                <label className="label">Chiffre d'affaires annuel prévisionnel</label>
                <div style={{ textAlign: 'center', margin: '12px 0 8px' }}>
                  <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>{fmtEur(ca)}</span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={200000}
                  step={1000}
                  value={ca}
                  onChange={e => setCa(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
                <div className="row" style={{ justifyContent: 'space-between', fontSize: 11, color: 'var(--fg-4)', marginTop: 4 }}>
                  <span>5 k€</span>
                  <span>200 k€</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <label className="label" style={{ marginBottom: 4 }}>Ou saisir manuellement</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input"
                      type="number"
                      value={ca}
                      onChange={e => setCa(Math.max(0, Number(e.target.value)))}
                      style={{ paddingRight: 28 }}
                    />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-4)', fontSize: 13 }}>€</span>
                  </div>
                </div>
              </div>

              {/* Régime */}
              <div>
                <label className="label">Régime fiscal</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {REGIMES.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setRegimeId(r.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: `2px solid ${regimeId === r.id ? 'var(--accent)' : 'var(--border)'}`,
                        background: regimeId === r.id ? 'var(--accent-bg, #f0f7ff)' : 'var(--bg)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: `2px solid ${regimeId === r.id ? 'var(--accent)' : 'var(--border)'}`,
                        background: regimeId === r.id ? 'var(--accent)' : 'transparent',
                        flexShrink: 0,
                      }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{r.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 1 }}>{r.desc}</div>
                      </div>
                      <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 13, color: regimeId === r.id ? 'var(--accent)' : 'var(--fg-4)' }}>
                        {r.tauxLabel}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Summary row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'CA annuel', value: fmtEur(ca), color: 'var(--fg)' },
              { label: 'Cotisations totales', value: fmtEurDec(calc.totalCotisations), color: '#EF4444' },
              { label: 'Net estimé', value: fmtEurDec(calc.netEstime), color: '#10B981' },
            ].map(item => (
              <div key={item.label} className="card card-pad" style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{ fontSize: 11, color: 'var(--fg-4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: item.color, letterSpacing: '-0.01em' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Quarterly table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="row" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', justifyContent: 'space-between' }}>
              <h3 className="h3" style={{ fontSize: 15, margin: 0 }}>Échéancier trimestriel</h3>
              <button className="btn btn-ghost btn-sm" onClick={copyTable}>
                <Glyph name="copy" size={12} /> Copier
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-2)' }}>
                    {['Trimestre', 'Période', 'CA déclaré', `Taux (${regime.tauxLabel})`, 'À payer', 'Date limite'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: 'var(--fg-4)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {calc.quarters.map((q, i) => (
                    <tr key={q.id} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-2, #fafafa)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>{q.id}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--fg-4)', fontSize: 13 }}>{q.months}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{fmtEurDec(q.ca)}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--fg-4)' }}>{regime.tauxLabel}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#EF4444', fontFamily: 'monospace' }}>{fmtEurDec(q.cotisations)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 20, background: '#FEF3C7', color: '#92400E', fontSize: 12, fontWeight: 600 }}>
                          {q.deadline}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                    <td colSpan={4} style={{ padding: '12px 16px' }}>Total annuel</td>
                    <td style={{ padding: '12px 16px', color: '#EF4444', fontFamily: 'monospace' }}>{fmtEurDec(calc.totalCotisations)}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--fg-4)', fontSize: 13 }}>—</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--fg-4)' }}>
              ℹ️ Les cotisations sociales sont calculées sur le CA brut encaissé. En micro-entreprise, aucune déduction de charges n'est possible.
              N'oubliez pas la <strong>CFE</strong> (Cotisation Foncière des Entreprises), due en décembre, variable selon la commune.
              {regime.id === 'reel' && (
                <span> Au régime réel, le taux de 45% est une estimation — consultez un expert-comptable pour votre situation précise.</span>
              )}
            </div>
          </div>
        </div>
        {ToastEl}
      </div>
    </>
  );
}
