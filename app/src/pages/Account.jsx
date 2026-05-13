import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Glyph } from '../components/Glyph';
import { useToast } from '../components/Toast';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';

export function Account() {
  const navigate = useNavigate();
  const { user, credits, plan, cancelPro, signOut } = useApp();
  const { t } = useLang();
  const [confirm, setConfirm] = useState(false);
  const [toast, ToastEl] = useToast();

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
            <div className="card card-pad stack-4">
              <div className="field" style={{ margin: 0 }}>
                <label className="label">{t('account.name')}</label>
                <input className="input" defaultValue={[user.firstName, user.lastName].filter(Boolean).join(' ')} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">{t('account.email')}</label>
                <input className="input" defaultValue={user.email} />
              </div>
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-primary btn-sm" onClick={() => toast(t('account.toast.saved'))}>{t('account.save')}</button>
              </div>
            </div>
          </div>

          <div>
            <h2 className="h3" style={{ marginBottom: 12 }}>{t('account.subscription.title')}</h2>
            <div className="kv-list">
              <div className="kv-row">
                <span className="k">{t('account.plan')}</span>
                <span className="v">{plan === 'pro' ? 'Pro' : 'Free'}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/pricing')}>{t('account.manage')}</button>
              </div>
              <div className="kv-row">
                <span className="k">{t('account.credits')}</span>
                <span className="v tabular">{credits}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/pricing')}>{t('account.topup')}</button>
              </div>
              <div className="kv-row">
                <span className="k">{t('account.renewal')}</span>
                <span className="v">{plan === 'pro' ? '1 Jun 2026' : '—'}</span>
                <span className="muted" style={{ fontSize: 13 }}>{plan === 'pro' ? t('account.renewal.monthly') : ''}</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="h3" style={{ marginBottom: 12 }}>{t('account.payments.title')}</h2>
            <div className="kv-list">
              {[
                { date: '01/05/2026', label: 'Toolio Pro — May 2026', amount: '€49.00', status: 'Paid' },
                { date: '17/04/2026', label: 'Pack Medium — 250 credits', amount: '€19.00', status: 'Paid' },
                { date: '01/04/2026', label: 'Toolio Pro — April 2026', amount: '€49.00', status: 'Paid' },
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
            <h2 className="h3" style={{ marginBottom: 12 }}>{t('account.danger.title')}</h2>
            <div className="card card-pad" style={{ borderColor: 'var(--border)' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{t('account.cancel.title')}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{t('account.cancel.desc')}</div>
                </div>
                <button className="btn btn-secondary" onClick={() => setConfirm(true)} disabled={plan !== 'pro'}>
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
            </div>
          </div>
        </div>

        {confirm && (
          <div className="modal-overlay" onClick={() => setConfirm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <div>
                  <h3 className="h3" style={{ fontSize: 16 }}>{t('account.modal.title')}</h3>
                  <p className="muted" style={{ fontSize: 13, margin: '4px 0 0' }}>{t('account.modal.until')}</p>
                </div>
              </div>
              <div className="modal-body">
                <p className="muted" style={{ fontSize: 14 }}>{t('account.modal.body')}</p>
              </div>
              <div className="modal-foot">
                <button className="btn btn-secondary" onClick={() => setConfirm(false)}>{t('account.modal.cancel')}</button>
                <button className="btn btn-primary" onClick={() => { cancelPro(); setConfirm(false); toast(t('account.toast.cancelled')); }}>
                  {t('account.modal.confirm')}
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
