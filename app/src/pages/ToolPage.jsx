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
  const { session, plan, loading } = useApp();

  const tool = TOOLS.find(t => t.id === toolId);
  if (!tool) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  // Wait until auth has resolved — plan starts as 'free' by default and
  // would incorrectly trigger the Pro gate before fetchUserData completes.
  if (loading) return null;

  // No session: belt-and-suspenders guard (ProtectedRoute handles this
  // globally, but a direct URL hit during a stale render could slip through).
  if (!session) {
    navigate('/auth', { replace: true });
    return null;
  }

  // Pro gate: only runs once we know the user's actual plan.
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
