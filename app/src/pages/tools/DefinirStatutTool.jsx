import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { Glyph } from '../../components/Glyph';
import { ToolIcon } from '../../components/ToolIcon';
import { useToast } from '../../components/Toast';

const STEPS = ['Revenus', 'Risque', 'Équipe', 'TVA'];

const RISK_OPTIONS = [
  { id: 'low', label: 'Minimum', desc: 'Je préfère la simplicité et moins de charges' },
  { id: 'mid', label: 'Modéré', desc: 'Je suis prêt à gérer un peu plus de complexité' },
  { id: 'high', label: 'Élevé', desc: 'Je vise une optimisation fiscale maximale' },
];

function getRecommendation({ revenue, risk, employees, vat }) {
  if (employees) {
    return {
      statut: 'SASU',
      label: 'Société par Actions Simplifiée Unipersonnelle',
      color: '#6366F1',
      bg: '#EEF2FF',
      pros: [
        'Peut embaucher dès le premier jour',
        'Protection du patrimoine personnel',
        'Optimisation rémunération/dividendes',
        'Crédible pour lever des fonds',
      ],
      cons: [
        'Comptabilité obligatoire (expert-comptable recommandé)',
        'Charges sociales sur salaire du dirigeant (~75%)',
        'Coût de création et fermeture plus élevé',
      ],
      switch: 'Vous êtes déjà dans la structure la plus adaptée à votre cas.',
    };
  }
  if (revenue > 77700 || risk === 'high') {
    return {
      statut: 'EURL',
      label: 'Entreprise Unipersonnelle à Responsabilité Limitée',
      color: '#8B5CF6',
      bg: '#F5F3FF',
      pros: [
        'Protection du patrimoine personnel',
        'Régime réel : déduction des charges réelles',
        'Taux IS plus avantageux au-delà de 60 k€',
        'Possibilité de verser des dividendes',
      ],
      cons: [
        'Comptabilité complexe (liasse fiscale)',
        'Coût de création et clôture (~800–1 500€)',
        'Charges sociales TNS (~45% du bénéfice)',
      ],
      switch: 'Envisagez la SASU si vous souhaitez embaucher ou lever des fonds.',
    };
  }
  if (revenue < 30000 || risk === 'low') {
    return {
      statut: 'Auto-entrepreneur',
      label: 'Micro-entreprise (BNC)',
      color: '#10B981',
      bg: '#ECFDF5',
      pros: [
        'Démarches simplifiées, lancement en 24h',
        'Charges sociales proportionnelles au CA (~22%)',
        'Comptabilité allégée (livre de recettes)',
        'Pas de TVA sous le seuil de franchise',
      ],
      cons: [
        `Plafond de CA à 77 700€/an`,
        'Pas de déduction des charges réelles',
        'Patrimoine personnel non protégé',
      ],
      switch: 'Passez en EURL/SASU dès que vous dépassez 55–60 k€ de CA.',
    };
  }
  return {
    statut: 'EI (régime réel)',
    label: 'Entreprise Individuelle au régime réel',
    color: '#F59E0B',
    bg: '#FFFBEB',
    pros: [
      'Déduction des charges réelles',
      'Pas de capital social requis',
      'Création simple et rapide',
    ],
    cons: [
      'Patrimoine personnel non protégé (hors résidence principale)',
      'Comptabilité plus lourde que la micro',
      'Cotisations sociales TNS (~45%)',
    ],
    switch: 'Envisagez l\'EURL si vous souhaitez protéger votre patrimoine.',
  };
}

export function DefinirStatutTool({ tool }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [revenue, setRevenue] = useState(40000);
  const [risk, setRisk] = useState('mid');
  const [employees, setEmployees] = useState(false);
  const [vat, setVat] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, ToastEl] = useToast();

  const finish = () => setResult(getRecommendation({ revenue, risk, employees, vat }));
  const restart = () => { setStep(0); setResult(null); };

  const formatRevenue = (v) => v >= 1000 ? `${(v / 1000).toFixed(0)} k€` : `${v}€`;

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

        {!result ? (
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            {/* Progress bar */}
            <div style={{ marginBottom: 32 }}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                {STEPS.map((s, i) => (
                  <div key={s} className="row" style={{ gap: 6, fontSize: 13, color: i === step ? 'var(--fg)' : i < step ? 'var(--accent)' : 'var(--fg-4)' }}>
                    <span style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      background: i < step ? 'var(--accent)' : i === step ? 'var(--fg)' : 'var(--bg-2)',
                      color: i <= step ? '#fff' : 'var(--fg-4)',
                    }}>
                      {i < step ? <Glyph name="check" size={11} /> : i + 1}
                    </span>
                    <span style={{ display: 'none' }} className="sm-show">{s}</span>
                  </div>
                ))}
              </div>
              <div style={{ height: 4, background: 'var(--bg-2)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${((step) / (STEPS.length - 1)) * 100}%`,
                  background: 'var(--accent)',
                  borderRadius: 4,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div className="row" style={{ justifyContent: 'space-between', marginTop: 6 }}>
                {STEPS.map((s, i) => (
                  <span key={s} style={{ fontSize: 11, color: i === step ? 'var(--fg)' : 'var(--fg-4)', fontWeight: i === step ? 600 : 400 }}>{s}</span>
                ))}
              </div>
            </div>

            <div className="card card-pad">
              {/* Step 1: Revenue */}
              {step === 0 && (
                <div>
                  <h2 className="h2" style={{ marginBottom: 6 }}>Quel est ton objectif de CA annuel ?</h2>
                  <p className="muted" style={{ marginBottom: 28, fontSize: 14 }}>Estime le chiffre d'affaires que tu vises dans les 12 prochains mois.</p>

                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>{formatRevenue(revenue)}</span>
                    <span className="muted" style={{ marginLeft: 8, fontSize: 14 }}>/ an</span>
                  </div>

                  <input
                    type="range"
                    min={10000}
                    max={200000}
                    step={5000}
                    value={revenue}
                    onChange={e => setRevenue(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)', marginBottom: 8 }}
                  />
                  <div className="row" style={{ justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-4)' }}>
                    <span>10 k€</span>
                    <span>200 k€+</span>
                  </div>

                  {revenue >= 77700 && (
                    <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A', fontSize: 13, color: '#92400E' }}>
                      ⚠️ Au-delà de 77 700€ de CA, le statut auto-entrepreneur n'est plus possible.
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Risk */}
              {step === 1 && (
                <div>
                  <h2 className="h2" style={{ marginBottom: 6 }}>Quelle est ta tolérance au risque et à la complexité ?</h2>
                  <p className="muted" style={{ marginBottom: 24, fontSize: 14 }}>Certains statuts optimisent davantage mais demandent plus de gestion.</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {RISK_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setRisk(opt.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '14px 16px',
                          borderRadius: 10,
                          border: `2px solid ${risk === opt.id ? 'var(--accent)' : 'var(--border)'}`,
                          background: risk === opt.id ? 'var(--accent-bg, #f0f7ff)' : 'var(--bg)',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          border: `2px solid ${risk === opt.id ? 'var(--accent)' : 'var(--border)'}`,
                          background: risk === opt.id ? 'var(--accent)' : 'transparent',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {risk === opt.id && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{opt.label}</div>
                          <div style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 2 }}>{opt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Employees */}
              {step === 2 && (
                <div>
                  <h2 className="h2" style={{ marginBottom: 6 }}>Prévois-tu d'embaucher ?</h2>
                  <p className="muted" style={{ marginBottom: 24, fontSize: 14 }}>L'embauche influe directement sur le statut recommandé.</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[{ v: false, label: 'Non', desc: 'Je travaille seul(e)' }, { v: true, label: 'Oui', desc: 'Je veux embaucher' }].map(opt => (
                      <button
                        key={String(opt.v)}
                        onClick={() => setEmployees(opt.v)}
                        style={{
                          padding: '20px 16px',
                          borderRadius: 12,
                          border: `2px solid ${employees === opt.v ? 'var(--accent)' : 'var(--border)'}`,
                          background: employees === opt.v ? 'var(--accent-bg, #f0f7ff)' : 'var(--bg)',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: 28, marginBottom: 6 }}>{opt.v ? '👥' : '🧑‍💻'}</div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 4 }}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: VAT */}
              {step === 3 && (
                <div>
                  <h2 className="h2" style={{ marginBottom: 6 }}>Es-tu assujetti(e) à la TVA ?</h2>
                  <p className="muted" style={{ marginBottom: 24, fontSize: 14 }}>Sous le seuil de franchise (36 800€ ou 77 700€ selon activité), vous n'êtes pas obligé de facturer la TVA.</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[{ v: false, label: 'Non', desc: 'Franchise en base' }, { v: true, label: 'Oui', desc: 'Je facture la TVA' }].map(opt => (
                      <button
                        key={String(opt.v)}
                        onClick={() => setVat(opt.v)}
                        style={{
                          padding: '20px 16px',
                          borderRadius: 12,
                          border: `2px solid ${vat === opt.v ? 'var(--accent)' : 'var(--border)'}`,
                          background: vat === opt.v ? 'var(--accent-bg, #f0f7ff)' : 'var(--bg)',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: 28, marginBottom: 6 }}>{opt.v ? '🧾' : '🙅'}</div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 4 }}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="row" style={{ justifyContent: 'space-between', marginTop: 28 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setStep(s => s - 1)}
                  disabled={step === 0}
                >
                  <Glyph name="arrow-left" size={14} /> Retour
                </button>
                {step < STEPS.length - 1 ? (
                  <button className="btn btn-accent" onClick={() => setStep(s => s + 1)}>
                    Continuer <Glyph name="arrow-right" size={14} />
                  </button>
                ) : (
                  <button className="btn btn-accent" onClick={finish}>
                    <Glyph name="sparkle" size={14} /> Voir ma recommandation
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Result card */
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div className="card card-pad" style={{ borderColor: result.color, borderWidth: 2, background: result.bg }}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: result.color }}>Statut recommandé</span>
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: result.color, margin: '0 0 4px' }}>{result.statut}</h2>
              <p style={{ fontSize: 14, color: 'var(--fg-4)', marginBottom: 24 }}>{result.label}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#10B981', marginBottom: 8 }}>Avantages</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {result.pros.map((p, i) => (
                      <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                        <Glyph name="check" size={13} style={{ color: '#10B981', flexShrink: 0, marginTop: 1 }} />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#EF4444', marginBottom: 8 }}>À surveiller</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {result.cons.map((c, i) => (
                      <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                        <span style={{ color: '#EF4444', flexShrink: 0 }}>→</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.04)', fontSize: 13, color: 'var(--fg-2)' }}>
                <strong>Évolution :</strong> {result.switch}
              </div>
            </div>

            <div className="row" style={{ justifyContent: 'center', marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={restart}>
                <Glyph name="refresh" size={14} /> Recommencer
              </button>
            </div>
          </div>
        )}
        {ToastEl}
      </div>
    </>
  );
}
