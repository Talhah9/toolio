import { useNavigate, useParams } from 'react-router-dom';
import { TOOLS } from '../data/catalog';
import { useApp } from '../context/AppContext';

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
  const { plan } = useApp();

  const tool = TOOLS.find(t => t.id === toolId);
  if (!tool) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  if (tool.plan === 'pro' && plan !== 'pro') {
    navigate('/pricing', { replace: true });
    return null;
  }

  const Component = TOOL_COMPONENTS[toolId];
  if (!Component) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  return <Component tool={tool} />;
}
