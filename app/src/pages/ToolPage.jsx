import { useNavigate, useParams } from 'react-router-dom';
import { TOOLS, getToolText } from '../data/catalog';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { AppHeader } from '../components/AppHeader';
import { Glyph } from '../components/Glyph';

import { AuditTool } from './tools/AuditTool';
import { ConcurrentsTool } from './tools/ConcurrentsTool';
import { LegalTool } from './tools/LegalTool';
import { ContratTool } from './tools/ContratTool';
import { LinkedinTool } from './tools/LinkedinTool';
import { ImageTool } from './tools/ImageTool';
import { DevisTool } from './tools/DevisTool';
import { RelanceTool } from './tools/RelanceTool';
import { DefinirStatutTool } from './tools/DefinirStatutTool';
import { URSSAFTool } from './tools/URSSAFTool';

const TOOL_COMPONENTS = {
  audit: AuditTool,
  compete: ConcurrentsTool,
  legal: LegalTool,
  contract: ContratTool,
  'linkedin-content': LinkedinTool,
  image: ImageTool,
  devis: DevisTool,
  relance: RelanceTool,
  statut: DefinirStatutTool,
  urssaf: URSSAFTool,
};

export function ToolPage() {
  const { toolId } = useParams();
  const navigate = useNavigate();
  const { session, plan, loading } = useApp();
  const { t, lang } = useLang();

  const tool = TOOLS.find(t => t.id === toolId);
  if (!tool) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  if (loading) return null;

  if (!session) {
    navigate('/auth', { replace: true });
    return null;
  }

  // Pro gate: render inline wall instead of redirecting to avoid blank pages.
  if (tool.plan === 'pro' && plan !== 'pro') {
    const { name } = getToolText(tool, lang);
    return (
      <>
        <AppHeader />
        <div className="page-pad" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <div className="card card-pad" style={{ maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <div style={{ marginBottom: 16, color: 'var(--fg-3)' }}>
              <Glyph name="lock" size={28} />
            </div>
            <h2 className="h2" style={{ marginBottom: 8 }}>{name}</h2>
            <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>{t('tool.pro.wall.body')}</p>
            <button className="btn btn-primary btn-lg btn-block" onClick={() => navigate('/pricing')}>
              {t('tool.pro.wall.cta')}
            </button>
          </div>
        </div>
      </>
    );
  }

  const Component = TOOL_COMPONENTS[toolId];
  if (!Component) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  return <Component tool={tool} />;
}
