import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { Glyph } from './Glyph';
import { ToolIcon } from './ToolIcon';
import { ToolIntro } from './ToolIntro';
import { useLang } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { getToolText } from '../data/catalog';

function storageKey(toolId) { return `savvly-intro-seen-${toolId}`; }

function hasSeenIntro(toolId) {
  try { return !!localStorage.getItem(storageKey(toolId)); } catch { return false; }
}

function markIntroSeen(toolId) {
  try { localStorage.setItem(storageKey(toolId), '1'); } catch {}
}

export function ToolShell({ tool, children }) {
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const { credits } = useApp();
  const { name, desc } = getToolText(tool, lang);

  const [showIntro, setShowIntro] = useState(() => !hasSeenIntro(tool.id));

  const handleStart = () => {
    markIntroSeen(tool.id);
    setShowIntro(false);
  };

  const handleReopen = () => setShowIntro(true);

  if (showIntro) {
    return <ToolIntro tool={tool} credits={credits} lang={lang} onStart={handleStart} />;
  }

  return (
    <>
      <style>{`
        @keyframes shellIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tool-shell-body { animation: shellIn 0.25s ease-out both; }
      `}</style>
      <AppHeader />
      <div className="page-pad tool-shell-body" style={{ overflowX: 'hidden', maxWidth: '100%', width: '100%' }}>
        <div className="breadcrumb">
          <a onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</a>
          <Glyph name="chevron-right" size={12} />
          <span>{t('tool.breadcrumb.tools')}</span>
          <Glyph name="chevron-right" size={12} />
          <span className="current">{getToolText(tool, lang).short}</span>
        </div>

        <div className="row" style={{ marginBottom: 28, gap: 16, alignItems: 'flex-start' }}>
          <ToolIcon tool={tool} size="lg" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row" style={{ gap: 10, marginBottom: 4, alignItems: 'center', flexWrap: 'wrap' }}>
              <h1 className="h1" style={{ margin: 0 }}>{name}</h1>
              {tool.franceOnly && (
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                  border: '1px solid #dbeafe', background: '#eff6ff', color: '#1d4ed8',
                }}>
                  🇫🇷 France only
                </span>
              )}
              <button
                onClick={handleReopen}
                title={lang === 'fr' ? "Voir la présentation de l'outil" : 'View tool overview'}
                style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: '1.5px solid var(--border)',
                  background: 'var(--bg-2)', color: 'var(--fg-3)',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1, flexShrink: 0,
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--fg-3)'; }}
              >
                ?
              </button>
            </div>
            <p className="muted" style={{ fontSize: 14 }}>{desc}</p>
          </div>
        </div>

        {children}
      </div>
    </>
  );
}
