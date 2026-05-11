import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Glyph } from '../components/Glyph';
import { useToast } from '../components/Toast';
import { useApp } from '../context/AppContext';

export function Account() {
  const navigate = useNavigate();
  const { user, credits, plan, cancelPro, signOut } = useApp();
  const [confirm, setConfirm] = useState(false);
  const [toast, ToastEl] = useToast();

  return (
    <>
      <AppHeader />
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
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/pricing')}>Gérer</button>
              </div>
              <div className="kv-row">
                <span className="k">Crédits restants</span>
                <span className="v tabular">{credits}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/pricing')}>Recharger</button>
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
                <button className="btn btn-secondary" onClick={async () => { await signOut(); navigate('/'); }}>Se déconnecter</button>
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
                <button className="btn btn-primary" onClick={() => { cancelPro(); setConfirm(false); toast('Abonnement résilié'); }}>
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
}
