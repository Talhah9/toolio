import { useNavigate, useParams } from 'react-router-dom';
import { TOOLS, getToolText } from '../data/catalog';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { AppHeader } from '../components/AppHeader';
import { Glyph } from '../components/Glyph';
import { ToolIcon } from '../components/ToolIcon';

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
    const bullets = [
      t(`tool.wall.${tool.id}.b1`),
      t(`tool.wall.${tool.id}.b2`),
      t(`tool.wall.${tool.id}.b3`),
    ];
    return (
      <>
        <AppHeader />
        <div className="page-pad" style={{ display: 'flex', justifyContent: 'center', paddingTop: 64 }}>
          <div className="card card-pad" style={{ maxWidth: 420, width: '100%' }}>
            {/* Icon + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'var(--accent-soft)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Glyph name={tool.glyph} size={24} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 2 }}>Pro</div>
                <h2 className="h2" style={{ margin: 0 }}>{name}</h2>
              </div>
            </div>

            {/* Tagline */}
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg)', lineHeight: 1.45, marginBottom: 20 }}>
              {t(`tool.wall.${tool.id}.tagline`)}
            </p>

            {/* Bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {bullets.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14 }}>
                  <span style={{ color: '#10B981', flexShrink: 0, marginTop: 1 }}>
                    <Glyph name="check" size={14} />
                  </span>
                  <span style={{ color: 'var(--fg-2)' }}>{b}</span>
                </div>
              ))}
            </div>

            <div className="hr" style={{ marginBottom: 20 }} />

            {/* CTA */}
            <button
              className="btn btn-accent btn-lg btn-block"
              onClick={() => navigate('/pricing')}
              style={{ marginBottom: 10 }}
            >
              {t('tool.wall.cta')}
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--fg-4)', margin: 0 }}>
              {t('tool.wall.cancel')}
            </p>
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
