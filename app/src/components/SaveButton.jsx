import { useState } from 'react';
import { Glyph } from './Glyph';
import { useApp } from '../context/AppContext';

export function SaveButton({ generationId, initialSaved = false }) {
  const { session } = useApp();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  if (!generationId) return null;

  const toggle = async () => {
    if (busy || !session?.user?.id) return;
    setBusy(true);
    try {
      const res = await fetch('/api/toggle-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId, userId: session.user.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSaved(json.saved);
    } catch {
      // silent fail
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      className="btn btn-ghost btn-sm"
      onClick={toggle}
      disabled={busy}
      title={saved ? 'Unsave' : 'Save'}
      style={{ color: saved ? '#F59E0B' : 'var(--fg-3)', cursor: 'pointer' }}
    >
      <Glyph name={saved ? 'star-fill' : 'star'} size={14} />
    </button>
  );
}
