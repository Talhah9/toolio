import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarkdownResult } from '../../components/MarkdownResult';
import { ResultViewer } from '../../components/ResultViewer';
import { ToolShell } from '../../components/ToolShell';
import { Glyph } from '../../components/Glyph';
import { CreditGate } from '../../components/CreditGate';
import { SaveButton } from '../../components/SaveButton';
import { ShareButton } from '../../components/ShareButton';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';
import { streamGenerate } from '../../lib/streamGenerate';
import { CompletionCelebration } from '../../components/CompletionCelebration';

const GOALS = [
  { id: 'visibility', key: 'tool.linkedin-intel.goal.visibility' },
  { id: 'leads',      key: 'tool.linkedin-intel.goal.leads' },
  { id: 'authority',  key: 'tool.linkedin-intel.goal.authority' },
  { id: 'hiring',     key: 'tool.linkedin-intel.goal.hiring' },
];

const TABS = [
  { id: 'PROFILE_AUDIT',       key: 'tool.linkedin-intel.tab.audit' },
  { id: 'COMPETITOR_ANALYSIS', key: 'tool.linkedin-intel.tab.competitors' },
  { id: 'HOT_TOPICS',          key: 'tool.linkedin-intel.tab.topics' },
  { id: 'CONTENT_PLAN',        key: 'tool.linkedin-intel.tab.ideas' },
  { id: 'READY_POSTS',         key: 'tool.linkedin-intel.tab.posts' },
];

function parsePostIdeas(text) {
  if (!text) return null;
  const blocks = text.split(/(?=Idea\s+\d+:)/i).filter(b => b.trim());
  if (blocks.length === 0) return null;
  const ideas = [];
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const topicLine = lines.find(l => /^Idea\s+\d+:/i.test(l));
    const formatLine = lines.find(l => /^Format:/i.test(l));
    const angleLine = lines.find(l => /^Angle:/i.test(l));
    if (!topicLine) continue;
    ideas.push({
      topic: topicLine.replace(/^Idea\s+\d+:\s*/i, '').trim(),
      format: formatLine ? formatLine.replace(/^Format:\s*/i, '').trim() : '',
      angle: angleLine ? angleLine.replace(/^Angle:\s*/i, '').trim() : '',
    });
  }
  return ideas.length > 0 ? ideas : null;
}

function parseSections(output, keys) {
  // Normalize: collapse \r\n, trim surrounding whitespace
  const normalized = output.replace(/\r\n/g, '\n').trim();
  const sections = {};
  for (let i = 0; i < keys.length; i++) {
    const marker = `[SECTION:${keys[i]}]`;
    // Case-insensitive search
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

export function LinkedinIntelTool({ tool }) {
  const { credits, logGeneration, session, user } = useApp();
  const { t, lang } = useLang();
  const fileRef = useRef(null);

  const [profileUrl, setProfileUrl] = useState('');
  const [niche, setNiche] = useState('');
  const [goal, setGoal] = useState('visibility');
  const [competitors, setCompetitors] = useState(['']);
  const [imageBase64, setImageBase64] = useState('');
  const [imageMediaType, setImageMediaType] = useState('image/jpeg');
  const [imagePreview, setImagePreview] = useState('');
  const [sections, setSections] = useState({});
  const [rawOutput, setRawOutput] = useState('');
  const [activeTab, setActiveTab] = useState('PROFILE_AUDIT');
  const [loading, setLoading] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [genId, setGenId] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [toast, ToastEl] = useToast();
  const navigate = useNavigate();

  const hasOutput = Object.keys(sections).length > 0;

  const handleImage = (file) => {
    if (!file) return;
    setImageMediaType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setImagePreview(dataUrl);
      const base64 = dataUrl.split(',')[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const addCompetitor = () => {
    if (competitors.length < 3) setCompetitors([...competitors, '']);
  };

  const updateCompetitor = (i, val) => {
    const next = [...competitors];
    next[i] = val;
    setCompetitors(next);
  };

  const removeCompetitor = (i) => {
    setCompetitors(competitors.filter((_, idx) => idx !== i));
  };

  const generate = async () => {
    if (!profileUrl.trim()) { toast(t('tool.linkedin-intel.error.profile')); return; }
    if (!niche.trim()) { toast(t('tool.linkedin-intel.error.niche')); return; }
    if (credits === null) return;
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }
    setLoading(true);
    setSections({});
    setRawOutput('');
    try {
      const fullText = await streamGenerate(
        {
          toolId: tool.id,
          input: {
            profileUrl,
            niche,
            goal,
            competitors: competitors.filter(Boolean),
            imageBase64: imageBase64 || undefined,
            imageMediaType: imageBase64 ? imageMediaType : undefined,
          },
          session,
          lang,
        },
        () => {},
      );
      console.log('[linkedin-intel] raw output length:', fullText.length);
      const parsed = parseSections(fullText, TABS.map(t => t.id));
      console.log('[linkedin-intel] parsed sections:', Object.keys(parsed));
      setSections(parsed);
      setRawOutput(fullText);
      setActiveTab('PROFILE_AUDIT');
      const id = await logGeneration(tool.id, { profileUrl, niche, goal }, fullText, tool.credits);
      setGenId(id);
      setShowCelebration(true);
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

  const regenerateSection = async () => {
    setRegenLoading(true);
    try {
      const fullText = await streamGenerate(
        { toolId: tool.id, input: { profileUrl, niche, goal, competitors: competitors.filter(Boolean), _sectionKey: activeTab }, session, lang },
        () => {},
      );
      const marker = `[SECTION:${activeTab}]`;
      const markerPos = fullText.toUpperCase().indexOf(marker.toUpperCase());
      const content = markerPos !== -1 ? fullText.slice(markerPos + marker.length).trim() : fullText.trim();
      setSections(prev => ({ ...prev, [activeTab]: content }));
    } catch (err) {
      toast(err.message || t('tool.error.generic'));
    } finally {
      setRegenLoading(false);
    }
  };

  return (
    <ToolShell tool={tool}>
      <div className="tool-page">
        <div className="card card-pad">
          <h3 className="h3" style={{ marginBottom: 16, fontSize: 15 }}>{t('tool.params')}</h3>

          <div className="field">
            <label className="label">
              {t('tool.linkedin-intel.profile.label')} <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <input
              className="input"
              type="url"
              value={profileUrl}
              onChange={e => setProfileUrl(e.target.value)}
              placeholder={t('tool.linkedin-intel.profile.placeholder')}
            />
          </div>

          <div className="field">
            <label className="label">
              {t('tool.linkedin-intel.niche.label')} <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <textarea
              className="textarea"
              value={niche}
              onChange={e => setNiche(e.target.value)}
              placeholder={t('tool.linkedin-intel.niche.placeholder')}
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="field">
            <label className="label">{t('tool.linkedin-intel.screenshot.label')}</label>
            <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{t('tool.linkedin-intel.screenshot.hint')}</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => handleImage(e.target.files[0])}
            />
            {imagePreview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={imagePreview} alt="profile screenshot" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
                  {t('tool.linkedin-intel.screenshot.change')}
                </button>
              </div>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
                <Glyph name="image" size={14} /> {t('tool.linkedin-intel.screenshot.cta')}
              </button>
            )}
          </div>

          <div className="field">
            <label className="label">{t('tool.linkedin-intel.goal.label')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {GOALS.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  className="btn btn-sm"
                  style={{
                    border: '1px solid ' + (goal === g.id ? 'var(--accent)' : 'var(--border)'),
                    background: goal === g.id ? 'var(--accent-bg, #f0f7ff)' : 'var(--bg)',
                    color: 'var(--fg)',
                    justifyContent: 'flex-start',
                  }}
                >
                  {t(g.key)}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="label">{t('tool.linkedin-intel.competitors.label')}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {competitors.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input"
                    type="url"
                    value={c}
                    onChange={e => updateCompetitor(i, e.target.value)}
                    placeholder={t('tool.linkedin-intel.competitors.placeholder')}
                    style={{ flex: 1 }}
                  />
                  {competitors.length > 1 && (
                    <button className="btn btn-ghost btn-sm" onClick={() => removeCompetitor(i)} style={{ flexShrink: 0 }}>
                      <Glyph name="close" size={12} />
                    </button>
                  )}
                </div>
              ))}
              {competitors.length < 3 && (
                <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={addCompetitor}>
                  + {t('tool.linkedin-intel.competitors.add')}
                </button>
              )}
            </div>
          </div>

          <div className="hr" style={{ margin: '20px 0' }} />
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
            <span className="muted">{t('tool.cost')}</span>
            <span className="tabular"><b>{tool.credits}</b> {t('tool.credits')}</span>
          </div>
          <CreditGate cost={tool.credits}>
            <button className="btn btn-accent btn-lg btn-block" onClick={generate} disabled={loading}>
              {loading ? t('tool.generating') : <><Glyph name="sparkle" size={14} /> {t('tool.linkedin-intel.btn')}</>}
            </button>
          </CreditGate>
        </div>

        <div>
          <div className="result-zone">
            <div className="result-head">
              <span className="muted" style={{ fontSize: 13 }}>{t('tool.result')}</span>
              <div className="row" style={{ gap: 6 }}>
                <SaveButton generationId={genId} toolName={lang === 'fr' ? tool.name_fr : tool.name_en} />
                <ShareButton generationId={genId} />
                <button className="btn btn-ghost btn-sm" onClick={copy} disabled={!hasOutput}>
                  <Glyph name="copy" size={12} /> {t('tool.copy')}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setViewerOpen(true)} disabled={!hasOutput}>
                  <Glyph name="expand" size={12} /> Fullscreen
                </button>
              </div>
            </div>
            {viewerOpen && <ResultViewer output={rawOutput} toolName={lang === 'fr' ? tool.name_fr : tool.name_en} userEmail={user?.email} onClose={() => setViewerOpen(false)} />}

            {hasOutput && (
              <div style={{ borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', overflowX: 'auto' }}>
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
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ margin: '0 8px', flexShrink: 0, fontSize: 11 }}
                  onClick={regenerateSection}
                  disabled={regenLoading || loading}
                  title="Regenerate this section"
                >
                  <Glyph name="refresh" size={11} /> {regenLoading ? '…' : 'Regen'}
                </button>
              </div>
            )}

            {loading ? (
              <div className="result-empty">
                <span className="row" style={{ gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite' }} />
                  {t('tool.result.working')}
                </span>
              </div>
            ) : hasOutput ? (
              activeTab === 'CONTENT_PLAN' ? (() => {
                const ideas = parsePostIdeas(sections['CONTENT_PLAN']);
                if (!ideas) return <MarkdownResult>{sections['CONTENT_PLAN'] || ''}</MarkdownResult>;
                return (
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ideas.map((idea, i) => (
                      <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{idea.topic}</div>
                        {idea.format && (
                          <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {idea.format}
                          </div>
                        )}
                        {idea.angle && (
                          <div style={{ fontSize: 13, color: 'var(--fg-3)', marginBottom: 12, lineHeight: 1.5 }}>{idea.angle}</div>
                        )}
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 12 }}
                          onClick={() => navigate('/tools/linkedin-content', { state: { topic: idea.topic + (idea.angle ? ' — ' + idea.angle : '') } })}
                        >
                          {t('tool.linkedin-intel.develop')}
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })() : (
                <MarkdownResult>{sections[activeTab] || ''}</MarkdownResult>
              )
            ) : (
              <div className="result-empty">{t('tool.result.placeholder')}</div>
            )}
          </div>
        </div>
      </div>
      {ToastEl}
      {showCelebration && (
        <CompletionCelebration
          onFullscreen={() => setViewerOpen(true)}
          onClose={() => setShowCelebration(false)}
          t={t}
        />
      )}
    </ToolShell>
  );
}
