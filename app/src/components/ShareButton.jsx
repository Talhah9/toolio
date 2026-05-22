import { useState } from 'react';
import { Glyph } from './Glyph';

export function ShareButton({ generationId }) {
  const [copied, setCopied] = useState(false);

  if (!generationId) return null;

  const share = () => {
    const url = `${window.location.origin}/share/${generationId}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      className="btn btn-ghost btn-sm"
      onClick={share}
      title="Share result"
      style={{ color: copied ? '#10B981' : 'var(--fg-3)' }}
    >
      <Glyph name="share" size={12} /> {copied ? 'Copied!' : 'Share'}
    </button>
  );
}
