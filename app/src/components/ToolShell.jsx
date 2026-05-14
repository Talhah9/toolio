import { useNavigate } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { Glyph } from './Glyph';
import { ToolIcon } from './ToolIcon';
import { useLang } from '../context/LanguageContext';
import { getToolText } from '../data/catalog';

export function ToolShell({ tool, children }) {
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const { name, desc } = getToolText(tool, lang);

  return (
    <>
      <AppHeader />
      <div className="page-pad">
        <div className="breadcrumb">
          <a onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</a>
          <Glyph name="chevron-right" size={12} />
          <span>{t('tool.breadcrumb.tools')}</span>
          <Glyph name="chevron-right" size={12} />
          <span className="current">{getToolText(tool, lang).short}</span>
        </div>

        <div className="row" style={{ marginBottom: 28, gap: 16 }}>
          <ToolIcon tool={tool} size="lg" />
          <div>
            <div className="row" style={{ gap: 10, marginBottom: 4, alignItems: 'center' }}>
              <h1 className="h1" style={{ margin: 0 }}>{name}</h1>
              {tool.franceOnly && (
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                  border: '1px solid #dbeafe', background: '#eff6ff', color: '#1d4ed8',
                }}>
                  🇫🇷 France only
                </span>
              )}
            </div>
            <p className="muted" style={{ fontSize: 14 }}>{desc}</p>
          </div>
        </div>

        {children}
      </div>
    </>
  );
}
