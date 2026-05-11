import { useState } from 'react';
import { Glyph } from './Glyph';

export function Checkout({ data, onClose, onSuccess }) {
  const [card, setCard] = useState('4242 4242 4242 4242');
  const [exp, setExp] = useState('12 / 28');
  const [cvc, setCvc] = useState('123');
  const [name, setName] = useState('Léa Marchand');
  const [processing, setProcessing] = useState(false);

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
}
