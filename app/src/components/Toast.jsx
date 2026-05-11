import { useState } from 'react';
import { Glyph } from './Glyph';

export function useToast() {
  const [msg, setMsg] = useState(null);

  const show = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 2200);
  };

  const ToastEl = msg ? (
    <div className="toast">
      <Glyph name="check" size={14} />
      {msg}
    </div>
  ) : null;

  return [show, ToastEl];
}
