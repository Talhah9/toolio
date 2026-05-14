import { useNavigate } from 'react-router-dom';
import { Glyph } from './Glyph';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';

export function CreditGate({ cost, children }) {
  const { credits } = useApp();
  const navigate = useNavigate();
  const { t } = useLang();

  if (cost === 0 || credits >= cost) return children;

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', borderRadius: 10, marginBottom: 8,
        background: 'var(--warn-bg, #fefce8)',
        border: '1px solid var(--warn-border, #fde047)',
      }}>
        <Glyph name="lightning" size={14} style={{ color: 'var(--warn-fg, #854d0e)', flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: 'var(--warn-fg, #854d0e)' }}>
          {t('tool.nocredits.message')}
        </span>
      </div>
      <button
        className="btn btn-lg btn-block"
        onClick={() => navigate('/pricing')}
        style={{ background: 'var(--warn-fg, #854d0e)', color: '#fff', border: 'none' }}
      >
        <Glyph name="lightning" size={14} /> {t('tool.nocredits.cta')}
      </button>
    </div>
  );
}
