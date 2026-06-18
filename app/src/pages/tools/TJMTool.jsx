import { useMemo, useState } from 'react';
import { ToolShell } from '../../components/ToolShell';

const STATUTS = [
  { id: 'micro',     label: 'Micro-entreprise',  charges: 0.222 },
  { id: 'eurl-sasu', label: 'EURL / SASU',       charges: 0.45  },
  { id: 'portage',   label: 'Portage salarial',   charges: 0.42  },
];

// 365 - 104 weekends - 8 jours fériés moyens
const JOURS_OUVRES_BASE = 253;

function fmtEur(n) {
  return Math.round(n).toLocaleString('fr-FR') + ' €';
}

const F   = { marginBottom: 20 };
const LBL = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--fg-3)', marginBottom: 6 };
const INP = { height: 44, borderRadius: 10 };
const SEL = { height: 44, borderRadius: 10 };

export function TJMTool({ tool }) {
  const [salaireNet, setSalaireNet] = useState('');
  const [conges,     setConges]     = useState('25');
  const [tauxFactu,  setTauxFactu]  = useState('80');
  const [statut,     setStatut]     = useState('micro');

  const result = useMemo(() => {
    const net = parseFloat(salaireNet);
    if (!net || net <= 0) return null;

    const tFact     = Math.min(Math.max(parseInt(tauxFactu) || 80, 10), 100);
    const cong      = Math.min(Math.max(parseInt(conges)    || 0,   0), 100);
    const charges   = STATUTS.find(s => s.id === statut)?.charges ?? 0.222;

    const joursOuvres = Math.max(JOURS_OUVRES_BASE - cong, 1);
    const joursFact   = Math.max(Math.round(joursOuvres * tFact / 100), 1);
    const caAnnuel    = (net * 12) / (1 - charges);
    const tjm         = caAnnuel / joursFact;

    const joursHigh = Math.max(Math.round(joursOuvres * Math.min(tFact + 10, 100) / 100), 1);
    const joursLow  = Math.max(Math.round(joursOuvres * Math.max(tFact - 10, 10)  / 100), 1);

    return {
      tjm:        Math.ceil(tjm),
      tjm_opt:    Math.ceil(caAnnuel / joursHigh),
      tjm_pru:    Math.ceil(caAnnuel / joursLow),
      caAnnuel:   Math.ceil(caAnnuel),
      joursFact,
      joursOuvres,
      charges:    Math.round(charges * 100),
    };
  }, [salaireNet, conges, tauxFactu, statut]);

  return (
    <ToolShell tool={tool}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 24, alignItems: 'start' }}>

        {/* ── Form ── */}
        <div className="card card-pad">
          <div style={F}>
            <label style={LBL}>
              Salaire net mensuel souhaité (€)
              <span style={{ color: 'var(--accent)', marginLeft: 2 }}>*</span>
            </label>
            <input
              className="input"
              style={INP}
              type="number"
              min="0"
              placeholder="ex : 4 000"
              value={salaireNet}
              onChange={e => setSalaireNet(e.target.value)}
            />
          </div>

          <div style={F}>
            <label style={LBL}>Statut juridique</label>
            <select className="select" style={SEL} value={statut} onChange={e => setStatut(e.target.value)}>
              {STATUTS.map(s => (
                <option key={s.id} value={s.id}>
                  {s.label} (~{Math.round(s.charges * 100)} % charges)
                </option>
              ))}
            </select>
          </div>

          <div style={F}>
            <label style={LBL}>Jours de congés par an</label>
            <input
              className="input"
              style={INP}
              type="number"
              min="0"
              max="60"
              value={conges}
              onChange={e => setConges(e.target.value)}
            />
          </div>

          <div>
            <label style={LBL}>Taux de facturation (% des jours ouvrés)</label>
            <input
              className="input"
              style={INP}
              type="number"
              min="10"
              max="100"
              value={tauxFactu}
              onChange={e => setTauxFactu(e.target.value)}
            />
            <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              En pratique : 70–85 %. Prospection, admin, congés imprévus s'ajoutent aux jours fériés.
            </p>
          </div>
        </div>

        {/* ── Result ── */}
        {result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Main TJM */}
            <div className="card card-pad" style={{ textAlign: 'center', background: 'var(--accent)', color: '#fff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', opacity: 0.8, marginBottom: 10 }}>
                TJM RECOMMANDÉ
              </div>
              <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1 }}>
                {result.tjm.toLocaleString('fr-FR')}&nbsp;€
              </div>
              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 8 }}>/ jour facturé</div>
            </div>

            {/* Breakdown */}
            <div className="card card-pad">
              {[
                ['CA annuel nécessaire',  fmtEur(result.caAnnuel)],
                ['Jours facturables / an', `${result.joursFact} j`],
                ['Jours ouvrés / an',      `${result.joursOuvres} j`],
                ['Taux de charges',        `~${result.charges} %`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="muted">{label}</span>
                  <span style={{ fontWeight: 700 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Sensitivity */}
            <div className="card card-pad">
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--fg-3)', marginBottom: 14 }}>
                FOURCHETTE (±10 % taux de facturation)
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: 'Optimiste',   tjm: result.tjm_opt, accent: false },
                  { label: 'Recommandé',  tjm: result.tjm,     accent: true  },
                  { label: 'Prudent',     tjm: result.tjm_pru, accent: false },
                ].map(({ label, tjm, accent }) => (
                  <div key={label} style={{
                    flex: 1, textAlign: 'center', padding: '12px 8px', borderRadius: 10,
                    background: accent ? 'var(--accent-soft)' : 'var(--bg-2)',
                  }}>
                    <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontWeight: 700, color: accent ? 'var(--accent)' : 'var(--fg)' }}>
                      {tjm.toLocaleString('fr-FR')}&nbsp;€
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
            <p className="muted" style={{ textAlign: 'center', fontSize: 14 }}>
              Renseigne ton salaire net mensuel pour calculer ton TJM.
            </p>
          </div>
        )}

      </div>
    </ToolShell>
  );
}
