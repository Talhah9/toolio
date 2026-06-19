import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Glyph } from '../components/Glyph';
import { useToast } from '../components/Toast';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { loadProfile, saveProfile } from '../hooks/useFreelanceProfile';


export function Account() {
  const navigate = useNavigate();
  const { user, session, credits, plan, isPro, cancelAt: ctxCancelAt, refreshCredits, signOut } = useApp();
  const { lang, t } = useLang();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');

  // Re-sync from context when profile names load or refresh
  useEffect(() => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
  }, [user?.firstName, user?.lastName]);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [toast, ToastEl] = useToast();
  const [payments, setPayments] = useState(null); // null = loading

  // Freelance profile (localStorage)
  const [fpNom,       setFpNom]       = useState(() => loadProfile().nom        || '');
  const [fpEntreprise,setFpEntreprise]= useState(() => loadProfile().entreprise  || '');
  const [fpEmail,     setFpEmail]     = useState(() => loadProfile().email       || '');
  const [fpTel,       setFpTel]       = useState(() => loadProfile().tel         || '');
  const [fpSiret,     setFpSiret]     = useState(() => loadProfile().siret       || '');
  const [fpAdresse,   setFpAdresse]   = useState(() => loadProfile().adresse     || '');
  const [fpSaved,     setFpSaved]     = useState(false);
  const [renewalDate, setRenewalDate] = useState(null);
  const [stripeCancelAt, setStripeCancelAt] = useState(null);

  // Format raw DB cancel_at (ISO string) into locale display string
  const fmtDate = (iso) => iso
    ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  // Stripe API result wins; fall back to DB cancel_at already in context
  const ctxCancelAtFmt = ctxCancelAt && new Date(ctxCancelAt) > new Date() ? fmtDate(ctxCancelAt) : null;
  const effectiveCancelAt = stripeCancelAt || ctxCancelAtFmt;

  // Load subscription status from Stripe (renewal date + cancel info)
  useEffect(() => {
    if (!user?.email || !isPro) return;
    fetch('/api/subscription-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ userId: session?.user?.id, userEmail: user.email }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.renewalDate) setRenewalDate(json.renewalDate);
        if (json.cancelAt) {
          setStripeCancelAt(json.cancelAt);
          setRenewalDate(null); // cancelling — hide renewal date
        }
      })
      .catch(() => {});
  }, [user, isPro]);

  useEffect(() => {
    if (!session?.user?.id || !user?.email) return;
    fetch('/api/payment-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ userId: session.user.id, userEmail: user.email }),
    })
      .then(r => r.json())
      .then(json => setPayments(json.payments ?? []))
      .catch(() => setPayments([]));
  }, [session, user]);

  return (
    <>
      <AppHeader />
      <div className="page-pad">
        <div style={{ marginBottom: 32 }}>
          <h1 className="h1" style={{ marginBottom: 6 }}>{t('account.title')}</h1>
          <p className="muted">{t('account.subtitle')}</p>
        </div>

        <div className="stack-8" style={{ maxWidth: 720 }}>
          <div>
            <h2 className="h3" style={{ marginBottom: 12 }}>{t('account.personal.title')}</h2>
            <div className="stack-8">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">{t('account.firstname')}</label>
                  <input className="input" value={firstName} onChange={e => setFirstName(e.target.value)} disabled={saving} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">{t('account.lastname')}</label>
                  <input className="input" value={lastName} onChange={e => setLastName(e.target.value)} disabled={saving} />
                </div>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">{t('account.email')}</label>
                <input className="input" value={user.email} readOnly style={{ opacity: 0.6, cursor: 'default' }} />
              </div>
              <div>
                <button
                  className="btn btn-primary btn-sm"
                  style={saveOk ? { background: '#10B981', borderColor: '#10B981' } : undefined}
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    setSaveErr('');
                    try {
                      const { error } = await supabase
                        .from('profiles')
                        .update({ first_name: firstName, last_name: lastName })
                        .eq('id', session.user.id);
                      if (error) throw error;
                      setSaveOk(true);
                      setTimeout(() => setSaveOk(false), 2000);
                      await refreshCredits();
                    } catch (err) {
                      setSaveErr(err.message || 'Erreur lors de la sauvegarde');
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {saving ? '…' : saveOk ? 'Enregistré ✓' : t('account.save')}
                </button>
                {saveErr && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>{saveErr}</p>}
              </div>
            </div>
          </div>

          <div>
            <h2 className="h3" style={{ marginBottom: 4 }}>Profil freelance</h2>
            <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
              Ces informations sont pré-remplies automatiquement dans tous vos outils (contrat, devis, facture, CGV).
            </p>
            <div className="stack-8">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Nom complet</label>
                  <input className="input" value={fpNom} onChange={e => setFpNom(e.target.value)} placeholder="Jean Dupont" />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Entreprise</label>
                  <input className="input" value={fpEntreprise} onChange={e => setFpEntreprise(e.target.value)} placeholder="JD Conseil" />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">SIRET</label>
                  <input className="input" value={fpSiret} onChange={e => setFpSiret(e.target.value)} placeholder="000 000 000 00000" />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Email pro</label>
                  <input className="input" type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)} placeholder="jean@dupont.fr" />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Téléphone</label>
                  <input className="input" value={fpTel} onChange={e => setFpTel(e.target.value)} placeholder="+33 6 00 00 00 00" />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Adresse</label>
                  <input className="input" value={fpAdresse} onChange={e => setFpAdresse(e.target.value)} placeholder="12 rue de la Paix, 75001 Paris" />
                </div>
              </div>
              <div>
                <button
                  className="btn btn-primary btn-sm"
                  style={fpSaved ? { background: '#10B981', borderColor: '#10B981' } : undefined}
                  onClick={() => {
                    saveProfile({ nom: fpNom, entreprise: fpEntreprise, email: fpEmail, tel: fpTel, siret: fpSiret, adresse: fpAdresse });
                    setFpSaved(true);
                    setTimeout(() => setFpSaved(false), 2000);
                  }}
                >
                  {fpSaved ? 'Enregistré ✓' : 'Sauvegarder le profil'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <h2 className="h3" style={{ marginBottom: 12 }}>{t('account.subscription.title')}</h2>
            <div className="kv-list">
              <div className="kv-row">
                <span className="k">{t('account.plan')}</span>
                <span className="v" style={isPro && effectiveCancelAt ? { color: '#EF4444', fontWeight: 500 } : {}}>
                  {isPro && effectiveCancelAt
                    ? `Actif jusqu'au ${effectiveCancelAt}`
                    : isPro
                    ? 'Pro'
                    : 'Free'}
                </span>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/pricing')}>{t('account.manage')}</button>
              </div>
              <div className="kv-row">
                <span className="k">{t('account.credits')}</span>
                <span className="v tabular">{credits}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/pricing')}>{t('account.topup')}</button>
              </div>
              <div className="kv-row">
                <span className="k">{t('account.renewal')}</span>
                <span className="v tabular">
                  {!isPro
                    ? '—'
                    : effectiveCancelAt
                    ? `${t('account.renewal.until')} ${effectiveCancelAt}`
                    : renewalDate
                    ? renewalDate
                    : '—'}
                </span>
                {isPro && effectiveCancelAt ? (
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={reactivating}
                    onClick={async () => {
                      setReactivating(true);
                      try {
                        const res = await fetch('/api/reactivate-subscription', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                          body: JSON.stringify({ userId: session.user.id, userEmail: user.email }),
                        });
                        const json = await res.json();
                        if (json.redirectToPricing) { navigate('/pricing'); return; }
                        if (!json.success) throw new Error(json.error || 'Reactivation failed');
                        await refreshCredits();
                        toast(t('account.toast.reactivated'));
                      } catch (err) {
                        toast(err.message);
                      } finally {
                        setReactivating(false);
                      }
                    }}
                  >
                    {reactivating ? t('account.reactivate.processing') : t('account.reactivate.btn')}
                  </button>
                ) : (
                  <span className="muted" style={{ fontSize: 13 }}>
                    {isPro && !effectiveCancelAt ? t('account.renewal.monthly') : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 className="h3" style={{ marginBottom: 12 }}>{t('account.payments.title')}</h2>
            <div className="kv-list">
              {payments === null ? (
                <div className="kv-row"><span className="muted" style={{ fontSize: 13 }}>{t('account.payments.loading')}</span></div>
              ) : payments.length === 0 ? (
                <div className="kv-row"><span className="muted" style={{ fontSize: 13 }}>{t('account.payments.empty')}</span></div>
              ) : payments.map((row, i) => (
                <div className="kv-row" key={i}>
                  <span className="k tabular">{row.date}</span>
                  <span className="v">{row.description}</span>
                  <span className="row" style={{ gap: 12 }}>
                    <span className="tabular">{row.amount}</span>
                    <span className="badge badge-outline" style={{ color: '#10B981', borderColor: '#A7F3D0', background: '#ECFDF5' }}>{row.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="h3" style={{ marginBottom: 12 }}>{t('account.danger.title')}</h2>
            <div className="card card-pad" style={{ borderColor: 'var(--border)' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{t('account.cancel.title')}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {effectiveCancelAt
                      ? `Ton abonnement sera résilié le ${effectiveCancelAt}. Tu gardes l'accès Pro jusqu'à cette date.`
                      : t('account.cancel.desc')}
                  </div>
                </div>
                <button className="btn btn-secondary" onClick={() => setConfirm(true)}
                  disabled={!isPro || !!effectiveCancelAt}>
                  {t('account.cancel.btn')}
                </button>
              </div>
              <div className="hr" style={{ margin: '20px 0' }} />
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{t('account.logout.title')}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{t('account.logout.desc')}</div>
                </div>
                <button className="btn btn-secondary" onClick={async () => { await signOut(); navigate('/'); }}>{t('account.logout.btn')}</button>
              </div>
              <div className="hr" style={{ margin: '20px 0' }} />
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 500, color: 'var(--warn-fg)' }}>{t('account.delete.title')}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{t('account.delete.desc')}</div>
                </div>
                <button className="btn btn-secondary" style={{ borderColor: 'var(--warn-fg)', color: 'var(--warn-fg)' }}
                  onClick={() => { setConfirmDelete(true); setDeleteInput(''); }}>
                  {t('account.delete.btn')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 8, paddingTop: 4 }}>
          <p className="muted" style={{ fontSize: 12, textAlign: 'center' }}>
            <Link to="/legal?tab=cgv" style={{ color: 'var(--fg-4)', textDecoration: 'underline' }}>
              Conditions Générales de Vente
            </Link>
            {' · '}
            <Link to="/legal?tab=privacy" style={{ color: 'var(--fg-4)', textDecoration: 'underline' }}>
              Politique de Confidentialité
            </Link>
          </p>
        </div>

        {confirm && (
          <div className="modal-overlay" onClick={() => setConfirm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <div>
                  <h3 className="h3" style={{ fontSize: 16 }}>{t('account.modal.title')}</h3>
                </div>
              </div>
              <div className="modal-body">
                <p className="muted" style={{ fontSize: 14 }}>
                  {lang === 'fr'
                    ? `Vous garderez l'accès Pro jusqu'au ${effectiveCancelAt || renewalDate || '…'}. Vos crédits sont conservés.`
                    : `You'll keep Pro access until ${effectiveCancelAt || renewalDate || '…'}. Your credits are preserved.`}
                </p>
              </div>
              <div className="modal-foot">
                <button className="btn btn-secondary" onClick={() => setConfirm(false)} disabled={cancelling}>
                  {t('account.modal.cancel')}
                </button>
                <button className="btn btn-primary" disabled={cancelling} onClick={async () => {
                  setCancelling(true);
                  try {
                    const res = await fetch('/api/cancel-subscription', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                      body: JSON.stringify({ userId: session.user.id, userEmail: user.email }),
                    });
                    const json = await res.json();
                    if (!json.success) throw new Error(json.error || 'Cancellation failed');
                    setConfirm(false);
                    // Immediately reflect cancellation in local state without waiting for
                    // refreshCredits → subscription-status re-fetch chain to complete
                    if (json.cancelAt) {
                      setStripeCancelAt(json.cancelAt);
                      setRenewalDate(null);
                    }
                    await refreshCredits();
                    toast(t('account.toast.cancelled'));
                  } catch (err) {
                    toast(err.message);
                    setConfirm(false);
                  } finally {
                    setCancelling(false);
                  }
                }}>
                  {cancelling ? t('account.cancel.processing') : t('account.modal.confirm')}
                </button>
              </div>
            </div>
          </div>
        )}
        {confirmDelete && (
          <div className="modal-overlay" onClick={() => !deleting && setConfirmDelete(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <div>
                  <h3 className="h3" style={{ fontSize: 16, color: 'var(--warn-fg)' }}>{t('account.delete.modal.title')}</h3>
                  <p className="muted" style={{ fontSize: 13, margin: '4px 0 0' }}>{t('account.delete.modal.irreversible')}</p>
                </div>
              </div>
              <div className="modal-body">
                <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>{t('account.delete.modal.body')}</p>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">{t('account.delete.modal.confirm-label')}</label>
                  <input
                    className="input"
                    placeholder={t('account.delete.modal.confirm-placeholder')}
                    value={deleteInput}
                    onChange={e => setDeleteInput(e.target.value)}
                    disabled={deleting}
                  />
                </div>
              </div>
              <div className="modal-foot">
                <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                  {t('account.modal.cancel')}
                </button>
                <button
                  className="btn btn-primary"
                  style={{ background: 'var(--warn-fg)', borderColor: 'var(--warn-fg)' }}
                  disabled={deleteInput !== 'DELETE' || deleting}
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      const res = await fetch('/api/delete-account', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                        body: JSON.stringify({ userId: session.user.id, userEmail: user.email }),
                      });
                      const json = await res.json();
                      if (!json.success) throw new Error(json.error || 'Deletion failed');
                      await signOut();
                      navigate('/');
                    } catch (err) {
                      toast(err.message);
                      setConfirmDelete(false);
                    } finally {
                      setDeleting(false);
                    }
                  }}
                >
                  {deleting ? t('account.delete.modal.processing') : t('account.delete.modal.btn')}
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
