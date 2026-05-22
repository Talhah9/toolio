import { useState } from 'react';
import { MarkdownResult } from '../../components/MarkdownResult';
import { ResultViewer } from '../../components/ResultViewer';
import { ToolShell } from '../../components/ToolShell';
import { Glyph } from '../../components/Glyph';
import { CreditGate } from '../../components/CreditGate';
import { SaveButton } from '../../components/SaveButton';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';
import { exportPdf } from '../../lib/exportPdf';
import { streamGenerate } from '../../lib/streamGenerate';

const CHECK_KEYS = [
  'tool.audit.check.titles',
  'tool.audit.check.headings',
  'tool.audit.check.speed',
  'tool.audit.check.cta',
  'tool.audit.check.mobile',
  'tool.audit.check.links',
  'tool.audit.check.alt',
  'tool.audit.check.schema',
];

const TABS = [
  { id: 'TECHNICAL',   key: 'tool.audit.tab.technical' },
  { id: 'CONTENT',     key: 'tool.audit.tab.content' },
  { id: 'PERFORMANCE', key: 'tool.audit.tab.performance' },
  { id: 'CONVERSION',  key: 'tool.audit.tab.conversion' },
  { id: 'ACTIONS',     key: 'tool.audit.tab.actions' },
];

function parseSections(output, keys) {
  const normalized = output.replace(/\r\n/g, '\n').trim();
  const sections = {};
  for (let i = 0; i < keys.length; i++) {
    const marker = `[SECTION:${keys[i]}]`;
    const upperNorm = normalized.toUpperCase();
    const upperMarker = marker.toUpperCase();
    const start = upperNorm.indexOf(upperMarker);
    if (start === -1) continue;
    const contentStart = start + marker.length;
    const nextKey = i < keys.length - 1 ? `[SECTION:${keys[i + 1]}]`.toUpperCase() : null;
    const nextMarkerPos = nextKey ? upperNorm.indexOf(nextKey, contentStart) : -1;
    sections[keys[i]] = normalized.slice(contentStart, nextMarkerPos !== -1 ? nextMarkerPos : normalized.length).trim();
  }
  return sections;
}

export function AuditTool({ tool }) {
  const { credits, logGeneration, session, user } = useApp();
  const { t, lang } = useLang();
  const [url, setUrl] = useState('');
  const [checks, setChecks] = useState(CHECK_KEYS.map(() => true));
  const [sections, setSections] = useState({});
  const [rawOutput, setRawOutput] = useState('');
  const [activeTab, setActiveTab] = useState('TECHNICAL');
  const [loading, setLoading] = useState(false);
  const [genId, setGenId] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [toast, ToastEl] = useToast();

  const hasOutput = Object.keys(sections).length > 0;

  const generate = async () => {
    if (!url.trim()) { toast(t('tool.audit.error.url')); return; }
    if (credits === null) return;
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }
    setLoading(true);
    setSections({});
    setRawOutput('');
    try {
      const fullText = await streamGenerate(
        { toolId: tool.id, input: { url, checks: CHECK_KEYS.filter((_, i) => checks[i]) }, session, lang },
        () => {},
      );
      const parsed = parseSections(fullText, TABS.map(t => t.id));
      setSections(parsed);
      setRawOutput(fullText);
      setActiveTab('TECHNICAL');
      const id = await logGeneration(tool.id, { url }, fullText, tool.credits);
      setGenId(id);
    } catch (err) {
      toast(err.message || t('tool.error.generic'));
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    const text = sections[activeTab];
    if (!text) return;
    navigator.clipboard?.writeText(text);
    toast(t('tool.copied'));
  };

  const downloadPdf = () => {
    const allSections = TABS
      .map(tab => sections[tab.id] ? `## ${t(tab.key)}\n\n${sections[tab.id]}` : '')
      .filter(Boolean)
      .join('\n\n---\n\n');
    exportPdf({
      toolName: lang === 'fr' ? tool.name_fr : tool.name_en,
      userEmail: user?.email,
      output: allSections,
      filename: `savvly-${tool.id}-${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  };

  return (
    <ToolShell tool={tool}>
      <div className="card card-pad" style={{ marginBottom: 24, textAlign: 'center' }}>
        <p className="muted" style={{ marginBottom: 16, fontSize: 14 }}>{t('tool.audit.url.label')}</p>
        <div className="row" style={{ gap: 10, maxWidth: 600, margin: '0 auto' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-4)' }}>
              <Glyph name="audit" size={15} />
            </span>
            <input
              className="input"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder={t('tool.audit.url.placeholder')}
              style={{ paddingLeft: 36 }}
              onKeyDown={e => e.key === 'Enter' && generate()}
            />
          </div>
          <button className="btn btn-accent" onClick={generate} disabled={loading || credits === null || credits < tool.credits} style={{ whiteSpace: 'nowrap' }}>
            {loading ? t('tool.generating') : t('tool.audit.btn')}
          </button>
        </div>
      </div>

      <div className="tool-page">
        <div className="card card-pad">
          <h3 className="h3" style={{ marginBottom: 16, fontSize: 15 }}>{t('tool.audit.checks.title')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CHECK_KEYS.map((key, i) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={checks[i]}
                  onChange={() => setChecks(c => c.map((v, j) => j === i ? !v : v))}
                  style={{ accentColor: 'var(--accent)', width: 15, height: 15 }}
                />
                <span style={{ color: checks[i] ? 'var(--fg)' : 'var(--fg-4)' }}>{t(key)}</span>
              </label>
            ))}
          </div>
          <div className="hr" style={{ margin: '20px 0' }} />
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
            <span className="muted">{t('tool.cost')}</span>
            <span className="tabular"><b>{tool.credits}</b> {t('tool.credits')}</span>
          </div>
          <CreditGate cost={tool.credits}><></></CreditGate>
        </div>

        <div>
          <div className="result-zone">
            <div className="result-head">
              <span className="muted" style={{ fontSize: 13 }}>{t('tool.result')}</span>
              <div className="row" style={{ gap: 6 }}>
                <SaveButton generationId={genId} toolName={lang === 'fr' ? tool.name_fr : tool.name_en} />
                <button className="btn btn-ghost btn-sm" onClick={copy} disabled={!hasOutput}><Glyph name="copy" size={12} /> {t('tool.copy')}</button>
                {hasOutput && <button className="btn btn-ghost btn-sm" onClick={downloadPdf}><Glyph name="arrow-down" size={12} /> {t('tool.pdf')}</button>}
                <button className="btn btn-ghost btn-sm" onClick={generate} disabled={!hasOutput || loading}><Glyph name="refresh" size={12} /> {t('tool.regenerate')}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setViewerOpen(true)} disabled={!hasOutput}><Glyph name="expand" size={12} /> Fullscreen</button>
              </div>
            </div>

            {viewerOpen && <ResultViewer output={rawOutput} toolName={lang === 'fr' ? tool.name_fr : tool.name_en} userEmail={user?.email} onClose={() => setViewerOpen(false)} />}
            {hasOutput && (
              <div style={{ borderBottom: '1px solid var(--border)', display: 'flex', gap: 0, overflowX: 'auto' }}>
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '10px 14px',
                      fontSize: 12,
                      fontWeight: activeTab === tab.id ? 600 : 400,
                      color: activeTab === tab.id ? 'var(--accent)' : 'var(--fg-3)',
                      borderTop: 'none',
                      borderLeft: 'none',
                      borderRight: 'none',
                      borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                      background: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'color 0.15s',
                    }}
                  >
                    {t(tab.key)}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="result-empty"><span className="row" style={{ gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite' }} />{t('tool.result.working')}</span></div>
            ) : hasOutput ? (
              sections[activeTab] ? (
                <MarkdownResult>{sections[activeTab]}</MarkdownResult>
              ) : (
                <div className="result-empty" style={{ flexDirection: 'column', gap: 8 }}>
                  <span>{t('tool.audit.section.empty') || 'This section was not generated.'}</span>
                  <button className="btn btn-ghost btn-sm" onClick={generate}>
                    <Glyph name="refresh" size={12} /> {t('tool.regenerate')}
                  </button>
                </div>
              )
            ) : (
              <div className="result-empty">{t('tool.result.placeholder')}</div>
            )}
          </div>
        </div>
      </div>
      {ToastEl}
    </ToolShell>
  );
}
