// Toolio — Pricing (logged-in upgrade), Checkout modal, Account

const Pricing = ({ navigate, user, credits, plan, onUpgrade, onPack }) => {
  const [showCheckout, setShowCheckout] = React.useState(null); // { type: 'pro' | 'pack', pack? }
  const [toast, ToastEl] = useToast();

  return (
    <>
      <AppHeader user={user} credits={credits} plan={plan} navigate={navigate} />
      <div className="page-pad">
        <div style={{ marginBottom: 32 }}>
          <h1 className="h1" style={{ marginBottom: 6 }}>Plan & crédits</h1>
          <p className="muted">Gérez votre abonnement et rechargez vos crédits.</p>
        </div>

        {/* Current plan summary */}
        <div className="kv-list" style={{ marginBottom: 40 }}>
          <div className="kv-row">
            <span className="k">Plan actuel</span>
            <span className="v">{plan === 'pro' ? 'Pro' : 'Free'}</span>
            <PlanBadge plan={plan} />
          </div>
          <div className="kv-row">
            <span className="k">Crédits restants</span>
            <span className="v tabular">{credits} crédits</span>
            <span className="muted" style={{ fontSize: 13 }}>{plan === 'pro' ? 'Renouvelés le 1er du mois' : '50 offerts à l\'inscription'}</span>
          </div>
          <div className="kv-row">
            <span className="k">Prochaine échéance</span>
            <span className="v">{plan === 'pro' ? '1er juin 2026' : '—'}</span>
            <span className="muted" style={{ fontSize: 13 }}>{plan === 'pro' ? '49,00€' : 'Aucune'}</span>
          </div>
        </div>

        {/* Plans */}
        <div style={{ marginBottom: 16 }}>
          <h2 className="h2" style={{ marginBottom: 4 }}>Abonnements</h2>
          <p className="muted" style={{ marginBottom: 24 }}>Tout-illimité dans la limite des crédits mensuels.</p>
        </div>
        <div className="pricing-grid" style={{ marginBottom: 64 }}>
          <div className="plan">
            <div>
              <h3 className="plan-name">Free</h3>
              <p className="muted" style={{ fontSize: 13, margin: '0 0 24px' }}>Pour découvrir.</p>
              <p className="plan-price">0€<small>/ mois</small></p>
            </div>
            <ul className="plan-features">
              <li><Glyph name="check" size={14} /><span>50 crédits offerts</span></li>
              <li><Glyph name="check" size={14} /><span>3 outils gratuits</span></li>
              <li><Glyph name="check" size={14} /><span>Recharges à la demande</span></li>
            </ul>
            {plan === 'free'
              ? <button className="btn btn-secondary btn-lg btn-block" disabled>Plan actuel</button>
              : <button className="btn btn-secondary btn-lg btn-block">Rétrograder</button>
            }
          </div>

          <div className="plan featured">
            <div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3 className="plan-name">Pro</h3>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>Recommandé</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: '0 0 24px' }}>Pour aller vite.</p>
              <p className="plan-price">49€<small style={{ color: 'rgba(255,255,255,0.6)' }}>/ mois</small></p>
            </div>
            <ul className="plan-features" style={{ color: 'rgba(255,255,255,0.85)' }}>
              <li><Glyph name="check" size={14} /><span>500 crédits / mois</span></li>
              <li><Glyph name="check" size={14} /><span>Accès aux 9 outils</span></li>
              <li><Glyph name="check" size={14} /><span>Historique complet & exports</span></li>
              <li><Glyph name="check" size={14} /><span>Support prioritaire</span></li>
            </ul>
            {plan === 'pro'
              ? <button className="btn btn-block btn-lg" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }} disabled>Plan actuel</button>
              : <button className="btn btn-block btn-lg" style={{ background: '#fff', color: 'var(--fg)' }} onClick={() => setShowCheckout({ type: 'pro' })}>Passer au Pro</button>
            }
          </div>
        </div>

        {/* Packs */}
        <div style={{ marginBottom: 16 }}>
          <h2 className="h2" style={{ marginBottom: 4 }}>Recharges de crédits</h2>
          <p className="muted" style={{ marginBottom: 24 }}>Sans expiration. Ajoutés instantanément à votre compte.</p>
        </div>
        <div className="packs-grid">
          {PACKS.map(p => (
            <div key={p.id} className={`pack ${p.featured ? 'featured' : ''}`}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted" style={{ fontSize: 13 }}>{p.label}</span>
                {p.featured && <span className="badge badge-outline">Populaire</span>}
              </div>
              <p className="pack-credits tabular">{p.credits}<span className="muted" style={{ fontSize: 14, fontWeight: 400, marginLeft: 6 }}>crédits</span></p>
              <p className="pack-price">{p.price}€</p>
              <p className="pack-meta">Sans expiration · {(p.price / p.credits).toFixed(2)}€ par crédit</p>
              <button className="btn btn-secondary btn-block" style={{ marginTop: 8 }} onClick={() => setShowCheckout({ type: 'pack', pack: p })}>
                Acheter
              </button>
            </div>
          ))}
        </div>

        {showCheckout && (
          <Checkout
            data={showCheckout}
            onClose={() => setShowCheckout(null)}
            onSuccess={() => {
              if (showCheckout.type === 'pro') { onUpgrade(); toast('Bienvenue dans Pro !'); }
              else { onPack(showCheckout.pack.credits); toast(`+${showCheckout.pack.credits} crédits ajoutés`); }
              setShowCheckout(null);
            }}
          />
        )}
        {ToastEl}
      </div>
    </>
  );
};

const Checkout = ({ data, onClose, onSuccess }) => {
  const [card, setCard] = React.useState('4242 4242 4242 4242');
  const [exp, setExp] = React.useState('12 / 28');
  const [cvc, setCvc] = React.useState('123');
  const [name, setName] = React.useState('Léa Marchand');
  const [processing, setProcessing] = React.useState(false);

  const total = data.type === 'pro' ? 49 : data.pack.price;
  const label = data.type === 'pro' ? 'Toolio Pro' : `Pack ${data.pack.label} — ${data.pack.credits} crédits`;
  const sub = data.type === 'pro' ? 'Abonnement mensuel' : 'Achat unique';

  const pay = () => {
    setProcessing(true);
    setTimeout(() => onSuccess(), 1300);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3 className="h3" style={{ fontSize: 16 }}>Confirmer le paiement</h3>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>Paiement sécurisé via Stripe</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ width: 30, padding: 0 }}>
            <Glyph name="x" size={14} />
          </button>
        </div>
        <div className="modal-body">
          <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 20 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 500 }}>{label}</span>
              <span className="tabular">{total},00€</span>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>{sub}</div>
          </div>

          <div className="field">
            <label className="label">Email</label>
            <input className="input" defaultValue="lea@marchand.fr" />
          </div>

          <div className="field">
            <label className="label">Informations de carte</label>
            <div className="card-field">
              <input value={card} onChange={e => setCard(e.target.value)} placeholder="1234 1234 1234 1234" />
              <div className="card-field-row">
                <input value={exp} onChange={e => setExp(e.target.value)} placeholder="MM / AA" />
                <input value={cvc} onChange={e => setCvc(e.target.value)} placeholder="CVC" />
              </div>
            </div>
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Titulaire</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} />
          </div>
        </div>
        <div className="modal-foot">
          <span className="row muted" style={{ gap: 6, fontSize: 12 }}>
            <Glyph name="lock" size={12} /> Sécurisé par Stripe
          </span>
          <button className="btn btn-accent" onClick={pay} disabled={processing}>
            {processing ? 'Traitement…' : `Payer ${total},00€`}
          </button>
        </div>
      </div>
    </div>
  );
};

const Account = ({ navigate, user, credits, plan, onLogout, onCancelPro }) => {
  const [confirm, setConfirm] = React.useState(false);
  const [toast, ToastEl] = useToast();

  return (
    <>
      <AppHeader user={user} credits={credits} plan={plan} navigate={navigate} />
      <div className="page-pad">
        <div style={{ marginBottom: 32 }}>
          <h1 className="h1" style={{ marginBottom: 6 }}>Profil</h1>
          <p className="muted">Vos informations et préférences de facturation.</p>
        </div>

        <div className="stack-8" style={{ maxWidth: 720 }}>
          <div>
            <h2 className="h3" style={{ marginBottom: 12 }}>Informations personnelles</h2>
            <div className="card card-pad stack-4">
              <div className="field" style={{ margin: 0 }}>
                <label className="label">Nom</label>
                <input className="input" defaultValue={`${user.firstName} ${user.lastName}`} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">Email</label>
                <input className="input" defaultValue={user.email} />
              </div>
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-primary btn-sm" onClick={() => toast('Modifications enregistrées')}>Enregistrer</button>
              </div>
            </div>
          </div>

          <div>
            <h2 className="h3" style={{ marginBottom: 12 }}>Abonnement</h2>
            <div className="kv-list">
              <div className="kv-row">
                <span className="k">Plan</span>
                <span className="v">{plan === 'pro' ? 'Pro' : 'Free'}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('pricing')}>Gérer</button>
              </div>
              <div className="kv-row">
                <span className="k">Crédits restants</span>
                <span className="v tabular">{credits}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('pricing')}>Recharger</button>
              </div>
              <div className="kv-row">
                <span className="k">Renouvellement</span>
                <span className="v">{plan === 'pro' ? '1er juin 2026' : '—'}</span>
                <span className="muted" style={{ fontSize: 13 }}>{plan === 'pro' ? 'Mensuel' : ''}</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="h3" style={{ marginBottom: 12 }}>Historique des paiements</h2>
            <div className="kv-list">
              {[
                { date: '01/05/2026', label: 'Toolio Pro — Mai 2026', amount: '49,00€', status: 'Payé' },
                { date: '17/04/2026', label: 'Pack Medium — 250 crédits', amount: '19,00€', status: 'Payé' },
                { date: '01/04/2026', label: 'Toolio Pro — Avril 2026', amount: '49,00€', status: 'Payé' },
              ].map((row, i) => (
                <div className="kv-row" key={i}>
                  <span className="k tabular">{row.date}</span>
                  <span className="v">{row.label}</span>
                  <span className="row" style={{ gap: 12 }}>
                    <span className="tabular">{row.amount}</span>
                    <span className="badge badge-outline" style={{ color: '#10B981', borderColor: '#A7F3D0', background: '#ECFDF5' }}>{row.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="h3" style={{ marginBottom: 12 }}>Zone sensible</h2>
            <div className="card card-pad" style={{ borderColor: 'var(--border)' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>Résilier l'abonnement Pro</div>
                  <div className="muted" style={{ fontSize: 13 }}>Vous garderez l'accès jusqu'à la fin de la période en cours.</div>
                </div>
                <button className="btn btn-secondary" onClick={() => setConfirm(true)} disabled={plan !== 'pro'}>
                  Résilier
                </button>
              </div>
              <div className="hr" style={{ margin: '20px 0' }} />
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>Déconnexion</div>
                  <div className="muted" style={{ fontSize: 13 }}>Vous reviendrez à la page d'accueil.</div>
                </div>
                <button className="btn btn-secondary" onClick={onLogout}>Se déconnecter</button>
              </div>
            </div>
          </div>
        </div>

        {confirm && (
          <div className="modal-overlay" onClick={() => setConfirm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <div>
                  <h3 className="h3" style={{ fontSize: 16 }}>Confirmer la résiliation</h3>
                  <p className="muted" style={{ fontSize: 13, margin: '4px 0 0' }}>Vous garderez l'accès jusqu'au 1er juin 2026.</p>
                </div>
              </div>
              <div className="modal-body">
                <p className="muted" style={{ fontSize: 14 }}>Vous perdrez l'accès aux 6 outils Pro et au renouvellement automatique des crédits. Vous pourrez réactiver à tout moment.</p>
              </div>
              <div className="modal-foot">
                <button className="btn btn-secondary" onClick={() => setConfirm(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={() => { onCancelPro(); setConfirm(false); toast('Abonnement résilié'); }}>
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
        {ToastEl}
      </div>
    </>
  );
};

Object.assign(window, { Pricing, Checkout, Account });
