import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { TOOLS, getToolText } from '../data/catalog';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { AppHeader } from '../components/AppHeader';

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
import { LinkedinIntelTool } from './tools/LinkedinIntelTool';
import { ProspectionTool } from './tools/ProspectionTool';
import { MissionFinderTool } from './tools/MissionFinderTool';
import { ConverterTool } from './tools/ConverterTool';
import { TJMTool } from './tools/TJMTool';
import { FactureTool } from './tools/FactureTool';

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
  'linkedin-intel': LinkedinIntelTool,
  prospection: ProspectionTool,
  'mission-finder': MissionFinderTool,
  converter: ConverterTool,
  tjm:       TJMTool,
  facture:   FactureTool,
};

export function ToolPage() {
  const { toolId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading } = useApp();
  const { lang } = useLang();

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

  // Disabled gate: coming soon
  if (tool.disabled) {
    const { name } = getToolText(tool, lang);
    return (
      <>
        <AppHeader />
        <div className="page-pad" style={{ display: 'flex', justifyContent: 'center', paddingTop: 64 }}>
          <div className="card card-pad" style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
            <h2 className="h2" style={{ marginBottom: 8 }}>{name}</h2>
            <p className="muted" style={{ fontSize: 15, marginBottom: 24 }}>
              Cet outil est en cours de développement et sera disponible très prochainement.
            </p>
            <button className="btn btn-accent btn-lg btn-block" onClick={() => navigate('/dashboard')}>
              ← Retour au dashboard
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

  const initialData = location.state?.initialData ?? undefined;
  return <Component tool={tool} initialData={initialData} />;
}
