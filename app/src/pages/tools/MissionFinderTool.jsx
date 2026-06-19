import { useState, useEffect, useRef } from 'react';
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
import GeneratingIndicator from '../../components/GeneratingIndicator';
import StreamingBanner from '../../components/StreamingBanner';

const EXPERIENCE_LEVELS = [
  { id: 'Junior',    key: 'tool.mission-finder.experience.junior' },
  { id: 'Confirmed', key: 'tool.mission-finder.experience.confirmed' },
  { id: 'Senior',    key: 'tool.mission-finder.experience.senior' },
  { id: 'Expert',    key: 'tool.mission-finder.experience.expert' },
];

const WORK_PREFS = [
  { id: 'Remote',  key: 'tool.mission-finder.work.remote' },
  { id: 'Hybrid',  key: 'tool.mission-finder.work.hybrid' },
  { id: 'On-site', key: 'tool.mission-finder.work.onsite' },
];

const GOALS = [
  { id: 'Find missions quickly',    key: 'tool.mission-finder.goal.quick' },
  { id: 'Build long-term pipeline', key: 'tool.mission-finder.goal.pipeline' },
  { id: 'Both',                     key: 'tool.mission-finder.goal.both' },
];

const TABS = [
  { id: 'PLATFORMS',        key: 'tool.mission-finder.tab.platforms' },
  { id: 'BOOLEAN_SEARCH',   key: 'tool.mission-finder.tab.search' },
  { id: 'PROFILE_TIPS',     key: 'tool.mission-finder.tab.profile' },
  { id: 'TARGET_COMPANIES', key: 'tool.mission-finder.tab.companies' },
  { id: 'MESSAGES',         key: 'tool.mission-finder.tab.messages' },
];

const SECTION_KEYS = TABS.map(t => t.id);

function parseSections(output, keys) {
  const sections = {};
  for (let i = 0; i < keys.length; i++) {
    const marker = `[SECTION:${keys[i]}]`;
    const start = output.indexOf(marker);
    if (start === -1) continue;
    const contentStart = start + marker.length;
    const nextMarker = i < keys.length - 1 ? output.indexOf(`[SECTION:${keys[i + 1]}]`) : -1;
    sections[keys[i]] = output.slice(contentStart, nextMarker !== -1 ? nextMarker : output.length).trim();
  }
  return sections;
}

export function MissionFinderTool({ tool, initialData }) {
  const { credits, logGeneration, session, user } = useApp();
  const { t, lang } = useLang();

  const [expertise, setExpertise] = useState(initialData?.expertise ?? '');
  const [tjm, setTjm] = useState(initialData?.tjm ?? '');
  const [experience, setExperience] = useState(initialData?.experience ?? 'Confirmed');
  const [workPreference, setWorkPreference] = useState(initialData?.workPreference ?? 'Remote');
  const [location, setLocation] = useState(initialData?.location ?? '');
  const [sector, setSector] = useState(initialData?.sector ?? '');
  const [goal, setGoal] = useState(initialData?.goal ?? 'Both');
  const [sections, setSections] = useState({});
  const [rawOutput, setRawOutput] = useState('');
  const [activeTab, setActiveTab] = useState('PLATFORMS');
  const [loading, setLoading] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [genId, setGenId] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [toast, ToastEl] = useToast();
  const resultRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const handleScroll = () => {
    const el = resultRef.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 50);
  };
  useEffect(() => {
    if (autoScroll && resultRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight;
    }
  }, [rawOutput, autoScroll]);

  const hasOutput = Object.keys(sections).length > 0;

  const generate = async () => {
    if (!expertise.trim()) { toast(t('tool.mission-finder.error.expertise')); return; }
    if (credits === null) return;
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }
    setLoading(true);
    setSections({});
    setRawOutput('');
    setAutoScroll(true);
    try {
      const input = { expertise, tjm, experience, workPreference, location, sector: sector || undefined, goal };
      const fullText = await streamGenerate(
        { toolId: tool.id, input, session, lang },
        (text) => setRawOutput(text),
      );
      const parsed = parseSections(fullText, SECTION_KEYS);
      setSections(parsed);
      setRawOutput(fullText);
      setActiveTab('PLATFORMS');
      const id = await logGeneration(tool.id, { expertise, tjm, experience, workPreference, location, goal }, fullText, tool.credits);
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
      const input = { expertise, tjm, experience, workPreference, location, sector: sector || undefined, goal, _sectionKey: activeTab };
      const fullText = await streamGenerate(
        { toolId: tool.id, input, session, lang },
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
              {t('tool.mission-finder.expertise.label')} <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <input
              className="input"
              value={expertise}
              onChange={e => setExpertise(e.target.value)}
              placeholder={t('tool.mission-finder.expertise.placeholder')}
            />
          </div>

          <div className="field">
            <label className="label">{t('tool.mission-finder.tjm.label')}</label>
            <div style={{ position: 'relative', maxWidth: 180 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-4)', fontSize: 13, pointerEvents: 'none' }}>€</span>
              <input
                className="input"
                type="number"
                min="0"
                value={tjm}
                onChange={e => setTjm(e.target.value)}
                placeholder={t('tool.mission-finder.tjm.placeholder')}
                style={{ paddingLeft: 22 }}
              />
            </div>
          </div>

          <div className="field">
            <label className="label">{t('tool.mission-finder.experience.label')}</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {EXPERIENCE_LEVELS.map(lvl => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setExperience(lvl.id)}
                  className="btn btn-sm"
                  style={{
                    border: `1px solid ${experience === lvl.id ? 'var(--fg)' : 'var(--border)'}`,
                    background: experience === lvl.id ? 'var(--fg)' : 'var(--bg)',
                    color: experience === lvl.id ? '#fff' : 'var(--fg-2)',
                  }}
                >
                  {t(lvl.key)}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="label">{t('tool.mission-finder.work.label')}</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {WORK_PREFS.map(wp => (
                <button
                  key={wp.id}
                  type="button"
                  onClick={() => setWorkPreference(wp.id)}
                  className="btn btn-sm"
                  style={{
                    border: `1px solid ${workPreference === wp.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: workPreference === wp.id ? 'var(--accent-bg, #f0f7ff)' : 'var(--bg)',
                    color: 'var(--fg)',
                  }}
                >
                  {t(wp.key)}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="label">{t('tool.mission-finder.location.label')}</label>
            <input
              className="input"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder={t('tool.mission-finder.location.placeholder')}
            />
          </div>

          <div className="field">
            <label className="label">{t('tool.mission-finder.sector.label')}</label>
            <input
              className="input"
              value={sector}
              onChange={e => setSector(e.target.value)}
              placeholder={t('tool.mission-finder.sector.placeholder')}
            />
          </div>

          <div className="field">
            <label className="label">{t('tool.mission-finder.goal.label')}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {GOALS.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  className="btn btn-sm"
                  style={{
                    justifyContent: 'flex-start',
                    border: `1px solid ${goal === g.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: goal === g.id ? 'var(--accent-bg, #f0f7ff)' : 'var(--bg)',
                    color: 'var(--fg)',
                    fontWeight: goal === g.id ? 600 : 400,
                  }}
                >
                  {t(g.key)}
                </button>
              ))}
            </div>
          </div>

          <div className="hr" style={{ margin: '20px 0' }} />
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
            <span className="muted">{t('tool.cost')}</span>
            <span className="tabular"><b>{tool.credits}</b> {t('tool.credits')}</span>
          </div>
          <CreditGate cost={tool.credits}>
            <button className="btn btn-accent btn-lg btn-block" onClick={generate} disabled={loading}>
              {loading ? t('tool.generating') : <><Glyph name="sparkle" size={14} /> {t('tool.mission-finder.btn')}</>}
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
                <button className="btn btn-ghost btn-sm" onClick={generate} disabled={!hasOutput || loading}>
                  <Glyph name="refresh" size={12} /> {t('tool.regenerate')}
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
                        background: 'none',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
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

            <div ref={resultRef} className="result-body" onScroll={handleScroll}>
              <StreamingBanner loading={loading} hasOutput={!!rawOutput} />
              {loading && !rawOutput ? (
                <GeneratingIndicator toolId="mission-finder" />
              ) : rawOutput && loading ? (
                <pre className="stream-text">{rawOutput}<span className="stream-cursor" /></pre>
              ) : hasOutput ? (
                <MarkdownResult>{sections[activeTab] || ''}</MarkdownResult>
              ) : (
                <div className="result-empty">{t('tool.result.placeholder')}</div>
              )}
            </div>
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
