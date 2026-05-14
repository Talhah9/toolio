import { useState, useRef } from 'react';
import { Glyph } from './Glyph';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';

const PRO_PRICE_ID = 'price_1TWwVeAFTm9a9DATGNn4FO2g';
const PACK_PRICES = {
  small:  'price_1TWwWxAFTm9a9DATtpAaaemv',
  medium: 'price_1TWwZRAFTm9a9DATOmAb6KjN',
  large:  'price_1TWwa2AFTm9a9DATrycG9Lqj',
};

export function Checkout({ data, onClose }) {
  const { user, session } = useApp();
  const { t } = useLang();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false); // synchronous guard against double-submit

  const total = data.type === 'pro' ? 49 : data.pack.price;
  const label = data.type === 'pro'
    ? t('checkout.label.pro')
    : `Pack ${data.pack.label} — ${data.pack.credits} ${t('checkout.label.pack')}`;
  const sub = data.type === 'pro' ? t('checkout.sub.monthly') : t('checkout.sub.once');

  const pay = async () => {
    if (inFlight.current) return; // block any second call before React re-renders
    inFlight.current = true;
    setProcessing(true);
    setError('');
    try {
      const priceId = data.type === 'pro' ? PRO_PRICE_ID : PACK_PRICES[data.pack.id];
      const mode    = data.type === 'pro' ? 'subscription' : 'payment';
      const credits = data.type === 'pack' ? data.pack.credits : 0;

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          mode,
          userId:    session?.user?.id,
          userEmail: user?.email,
          credits,
        }),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);
      window.location.href = json.url;
    } catch (err) {
      console.error('[Checkout] error:', err.message);
      setError(t('checkout.error') || 'Something went wrong. Please try again.');
      setProcessing(false);
      inFlight.current = false;
    }
  };

  return (
    <div className="modal-overlay" onClick={processing ? undefined : onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3 className="h3" style={{ fontSize: 16 }}>{t('checkout.title')}</h3>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>{t('checkout.subtitle')}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ width: 30, padding: 0 }} disabled={processing}>
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

          {user?.email && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">{t('checkout.email')}</label>
              <input className="input" value={user.email} readOnly style={{ color: 'var(--fg-3)', cursor: 'default' }} />
            </div>
          )}

          {error && (
            <p style={{ color: 'var(--error, #EF4444)', fontSize: 13, marginTop: 12, marginBottom: 0 }}>{error}</p>
          )}
        </div>

        <div className="modal-foot">
          <span className="row muted" style={{ gap: 6, fontSize: 12 }}>
            <Glyph name="lock" size={12} /> {t('checkout.secure')}
          </span>
          <button className="btn btn-accent" onClick={pay} disabled={processing}>
            {processing
              ? t('checkout.processing')
              : <><Glyph name="lock" size={13} /> {t('checkout.pay')} {total},00€</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
