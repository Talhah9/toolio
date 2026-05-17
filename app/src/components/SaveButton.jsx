import { useState, useEffect, useRef, useCallback } from 'react';
import { Glyph } from './Glyph';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';

function SaveNameModal({ defaultName, onConfirm, onCancel, t }) {
  const [name, setName] = useState(defaultName);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <>
      <div
        onClick={onCancel}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200 }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 201, background: 'var(--bg)',
        border: '1px solid var(--border)', borderRadius: 12,
        padding: 24, width: 340,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px', color: 'var(--fg)' }}>
          {t('save.modal.title')}
        </p>
        <input
          ref={inputRef}
          className="input"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onConfirm(name); }}
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>
            {t('save.modal.cancel')}
          </button>
          <button className="btn btn-accent btn-sm" onClick={() => onConfirm(name)}>
            {t('save.modal.confirm')}
          </button>
        </div>
      </div>
    </>
  );
}

export function SaveButton({ generationId, initialSaved = false, toolName = '', onToggle }) {
  const { session } = useApp();
  const { t, lang } = useLang();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errored, setErrored] = useState(false);

  // Sync internal state when initialSaved prop changes (e.g. History optimistic update)
  useEffect(() => { setSaved(initialSaved); }, [initialSaved]);

  if (!generationId) return null;

  const getDefaultName = () => {
    const date = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
    return toolName ? `${toolName} — ${date}` : date;
  };

  const handleClick = () => {
    if (saved) {
      doToggle(null);
    } else {
      setShowModal(true);
    }
  };

  const doToggle = async (name) => {
    if (busy || !session?.user?.id) return;
    setBusy(true);
    setErrored(false);
    try {
      const res = await fetch('/api/toggle-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token ?? ''}`,
        },
        body: JSON.stringify({
          generationId,
          userId: session.user.id,
          name: name || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      console.log('[SaveButton] toggle-save ok | saved:', json.saved, '| name:', json.name);
      setSaved(json.saved);
      if (onToggle) onToggle(json.saved);
    } catch (err) {
      console.error('[SaveButton] toggle-save failed:', err.message);
      setErrored(true);
      setTimeout(() => setErrored(false), 2000);
    } finally {
      setBusy(false);
      setShowModal(false);
    }
  };

  return (
    <>
      <button
        className="btn btn-ghost btn-sm"
        onClick={handleClick}
        disabled={busy}
        title={saved ? 'Unsave' : 'Save'}
        style={{ color: errored ? '#DC2626' : saved ? '#F59E0B' : 'var(--fg-3)', cursor: 'pointer' }}
      >
        <Glyph name={saved ? 'star-fill' : 'star'} size={14} />
      </button>
      {showModal && (
        <SaveNameModal
          defaultName={getDefaultName()}
          onConfirm={doToggle}
          onCancel={() => setShowModal(false)}
          t={t}
        />
      )}
    </>
  );
}
