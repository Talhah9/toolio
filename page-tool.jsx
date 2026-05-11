// Toolio — Tool page (LinkedIn content generator) with pre-baked example outputs

const SAMPLE_OUTPUTS = {
  'linkedin-content': [
    `Il y a 18 mois, je facturais 350€ la journée.\n\nAujourd'hui, c'est 1 200€. Et j'ai moins de clients.\n\nVoici ce qui a changé :\n\n→ J'ai arrêté de vendre des heures. Je vends un résultat.\n→ J'ai dit non aux missions floues. Cahier des charges ou rien.\n→ J'ai posé un acompte de 30%. Sans ça, on ne démarre pas.\n→ J'ai documenté chaque livrable. Photo avant/après, métriques, ROI.\n\nLe vrai déclic ? Comprendre que mes clients n'achètent pas mon temps.\nIls achètent la tranquillité d'esprit.\n\nEt ça, ça vaut bien plus que 350€ la journée.\n\nVous en êtes où sur vos tarifs ?`,

    `Trois choses que personne ne vous dit quand vous lancez votre activité freelance :\n\n1. Les premiers clients sont les plus durs. Ensuite ça roule.\n2. Votre réseau pèse plus que votre portfolio.\n3. Le "non" est votre meilleur allié commercial.\n\nJ'ai mis trois ans à comprendre la troisième.\n\nDire non à un projet mal cadré, c'est protéger les bons clients déjà signés.\n\nEt vous, quel "non" vous a fait avancer cette année ?`,

    `Un client m'a écrit ce matin : "Combien pour refaire mon site ?"\n\nMa réponse : "Combien vaut un client supplémentaire pour vous ?"\n\nSilence radio pendant deux heures.\n\nPuis : "Environ 8 000€ par an."\n\n"Ok. Si on en gagne 3 de plus, ça fait 24 000€. Mon devis est à 7 500€."\n\nIl a signé.\n\nLeçon : ne jamais parler prix avant valeur.`,
  ],
  'invoice': [
    `FACTURE N° 2026-042\n\nÉmise le 03/05/2026\nÉchéance : 02/06/2026\n\n— De —\nLéa Marchand — EI\nSIRET : 893 421 002 00012\n\n— À —\nAtelier Marquetin\n12 rue du Faubourg, 75011 Paris\n\nDésignation                   Qté     PU       Total\nRéfonte UI app mobile         1      4 500€   4 500€\nIntégration Stripe             1        800€     800€\n\nTotal HT                                       5 300€\nTVA non applicable, art. 293 B du CGI\nTotal à régler                                 5 300€\n\nMode de paiement : virement IBAN FR76 ...`,
  ],
  'status': [
    `Recommandation : Micro-entreprise (BNC)\n\nPourquoi ce statut\n→ Démarches simplifiées, démarrage en 24h\n→ Charges sociales proportionnelles au CA (~22%)\n→ Comptabilité allégée (livre de recettes)\n\nÀ surveiller\n→ Plafond CA 77 700€/an pour prestations de services\n→ Pas de récupération de TVA\n→ Protection sociale limitée\n\nQuand passer en SASU\n→ Au-delà de 60 000€ de CA\n→ Si vous embauchez ou levez des fonds\n→ Si vous voulez optimiser rémunération/dividendes`,
  ],
};

const ToolPage = ({ navigate, toolId, user, credits, plan, onConsume }) => {
  const tool = TOOLS.find(t => t.id === toolId) || TOOLS[7];
  const [niche, setNiche] = React.useState('Freelance design produit');
  const [tone, setTone] = React.useState('direct');
  const [topic, setTopic] = React.useState('Comment fixer ses tarifs en freelance');
  const [format, setFormat] = React.useState('storytelling');
  const [output, setOutput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [history, setHistory] = React.useState([
    { id: 1, topic: 'Trouver ses 3 premiers clients', time: 'il y a 2 h', credits: 10 },
    { id: 2, topic: 'Refonte de mon offre en 2026', time: 'hier', credits: 10 },
    { id: 3, topic: 'Pourquoi j\'ai quitté mon CDI', time: 'il y a 3 j', credits: 10 },
  ]);
  const [toast, ToastEl] = useToast();
  const [outIndex, setOutIndex] = React.useState(0);

  const generate = () => {
    if (credits < tool.credits) {
      toast('Crédits insuffisants. Rechargez votre compte.');
      return;
    }
    setLoading(true);
    setOutput('');
    setTimeout(() => {
      const samples = SAMPLE_OUTPUTS[tool.id] || SAMPLE_OUTPUTS['linkedin-content'];
      const next = samples[outIndex % samples.length];
      setOutput(next);
      setOutIndex(i => i + 1);
      setLoading(false);
      onConsume(tool.credits);
      setHistory(h => [{ id: Date.now(), topic, time: 'à l\'instant', credits: tool.credits }, ...h].slice(0, 5));
    }, 1200);
  };

  const copy = () => {
    if (!output) return;
    navigator.clipboard?.writeText(output);
    toast('Copié dans le presse-papier');
  };

  return (
    <>
      <AppHeader user={user} credits={credits} plan={plan} navigate={navigate} />
      <div className="page-pad">
        <div className="breadcrumb">
          <a onClick={() => navigate('dashboard')} style={{ cursor: 'pointer' }}>Dashboard</a>
          <Glyph name="chevron-right" size={12} />
          <span>Outils</span>
          <Glyph name="chevron-right" size={12} />
          <span className="current">{tool.short}</span>
        </div>

        <div className="row" style={{ marginBottom: 28, gap: 16 }}>
          <ToolIcon tool={tool} size="lg" />
          <div>
            <h1 className="h1" style={{ marginBottom: 4 }}>{tool.name}</h1>
            <p className="muted" style={{ fontSize: 14 }}>{tool.desc}</p>
          </div>
        </div>

        <div className="tool-page">
          {/* Form */}
          <div className="card card-pad">
            <h3 className="h3" style={{ marginBottom: 16, fontSize: 15 }}>Paramètres</h3>

            <div className="field">
              <label className="label">Niche / activité</label>
              <input className="input" value={niche} onChange={e => setNiche(e.target.value)} placeholder="Ex. designer UX freelance" />
            </div>

            <div className="field">
              <label className="label">Sujet du post</label>
              <textarea className="textarea" value={topic} onChange={e => setTopic(e.target.value)} placeholder="De quoi voulez-vous parler ?" />
            </div>

            <div className="field">
              <label className="label">Ton</label>
              <select className="select" value={tone} onChange={e => setTone(e.target.value)}>
                <option value="direct">Direct, sans détour</option>
                <option value="storyteller">Narratif, personnel</option>
                <option value="expert">Expert, analytique</option>
                <option value="provocateur">Provocateur</option>
              </select>
            </div>

            <div className="field">
              <label className="label">Format</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { v: 'storytelling', label: 'Storytelling' },
                  { v: 'liste', label: 'Liste à puces' },
                  { v: 'opinion', label: 'Opinion forte' },
                  { v: 'question', label: 'Question ouverte' },
                ].map(opt => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setFormat(opt.v)}
                    className="btn btn-sm"
                    style={{
                      border: '1px solid ' + (format === opt.v ? 'var(--fg)' : 'var(--border)'),
                      background: format === opt.v ? 'var(--fg)' : 'var(--bg)',
                      color: format === opt.v ? '#fff' : 'var(--fg-2)',
                      justifyContent: 'flex-start',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="hr" style={{ margin: '20px 0' }} />

            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
              <span className="muted">Coût</span>
              <span className="tabular"><b>{tool.credits}</b> crédits</span>
            </div>

            <button className="btn btn-accent btn-lg btn-block" onClick={generate} disabled={loading}>
              {loading ? 'Génération…' : <><Glyph name="sparkle" size={14} /> Générer</>}
            </button>
          </div>

          {/* Result */}
          <div>
            <div className="result-zone">
              <div className="result-head">
                <span className="muted" style={{ fontSize: 13 }}>Résultat</span>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={copy} disabled={!output}>
                    <Glyph name="copy" size={12} /> Copier
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={generate} disabled={!output || loading}>
                    <Glyph name="refresh" size={12} /> Régénérer
                  </button>
                </div>
              </div>
              {loading ? (
                <div className="result-empty">
                  <span className="row" style={{ gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite' }} />
                    Toolio rédige votre post…
                  </span>
                </div>
              ) : output ? (
                <div className="result-body">{output}</div>
              ) : (
                <div className="result-empty">
                  Le résultat apparaîtra ici.
                </div>
              )}
            </div>

            <div style={{ marginTop: 24 }}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 className="h3" style={{ fontSize: 14 }}>Historique récent</h3>
                <a className="muted" style={{ fontSize: 13, cursor: 'pointer' }}>Tout voir</a>
              </div>
              <div className="card" style={{ overflow: 'hidden' }}>
                {history.slice(0, 3).map(h => (
                  <div className="history-row" key={h.id}>
                    <div>
                      <div>{h.topic}</div>
                      <div className="meta">{h.time} · {h.credits} crédits</div>
                    </div>
                    <Glyph name="chevron-right" size={14} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {ToastEl}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </>
  );
};

window.ToolPage = ToolPage;
