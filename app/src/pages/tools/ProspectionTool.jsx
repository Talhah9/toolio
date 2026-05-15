import { useState } from 'react';
import { ToolShell } from '../../components/ToolShell';
import { Glyph } from '../../components/Glyph';
import { CreditGate } from '../../components/CreditGate';
import { useToast } from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { useLang } from '../../context/LanguageContext';

const CHANNELS = [
  { id: 'LinkedIn DM', key: 'tool.prospection.channel.linkedin' },
  { id: 'Email',       key: 'tool.prospection.channel.email' },
  { id: 'WhatsApp',    key: 'tool.prospection.channel.whatsapp' },
];

const TONES = [
  { id: 'Professional', key: 'tool.prospection.tone.professional' },
  { id: 'Casual',       key: 'tool.prospection.tone.casual' },
  { id: 'Direct',       key: 'tool.prospection.tone.direct' },
];

const MSG_TABS = [
  { id: 'VERSION_A', key: 'tool.prospection.tab.a' },
  { id: 'VERSION_B', key: 'tool.prospection.tab.b' },
  { id: 'VERSION_C', key: 'tool.prospection.tab.c' },
  { id: 'FOLLOWUP',  key: 'tool.prospection.tab.followup' },
];

const SECTION_KEYS = ['VERSION_A', 'VERSION_B', 'VERSION_C', 'FOLLOWUP_D3', 'FOLLOWUP_D7'];

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

export function ProspectionTool({ tool }) {
  const { credits, logGeneration, session } = useApp();
  const { t } = useLang();

  const [niche, setNiche] = useState('');
  const [target, setTarget] = useState('');
  const [channel, setChannel] = useState('LinkedIn DM');
  const [tone, setTone] = useState('Professional');
  const [pain, setPain] = useState('');
  const [sections, setSections] = useState({});
  const [activeTab, setActiveTab] = useState('VERSION_A');
  const [loading, setLoading] = useState(false);
  const [toast, ToastEl] = useToast();

  const hasOutput = Object.keys(sections).length > 0;

  const generate = async () => {
    if (!niche.trim()) { toast(t('tool.prospection.error.niche')); return; }
    if (!target.trim()) { toast(t('tool.prospection.error.target')); return; }
    if (credits === null) return;
    if (credits < tool.credits) { toast(t('tool.error.credits')); return; }
    setLoading(true);
    setSections({});
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: tool.id,
          input: { niche, target, channel, tone, pain: pain || undefined },
          userId: session?.user?.id,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const parsed = parseSections(json.output, SECTION_KEYS);
      setSections(parsed);
      setActiveTab('VERSION_A');
      await logGeneration(tool.id, { niche, target, channel, tone }, json.output, tool.credits);
    } catch (err) {
      toast(err.message || t('tool.error.generic'));
    } finally {
      setLoading(false);
    }
  };

  const getTabContent = (tabId) => {
    if (tabId !== 'FOLLOWUP') return sections[tabId] || '';
    const d3 = sections['FOLLOWUP_D3'] || '';
    const d7 = sections['FOLLOWUP_D7'] || '';
    if (!d3 && !d7) return '';
    return [
      d3 ? `${t('tool.prospection.followup.d3')}\n\n${d3}` : '',
      d7 ? `${t('tool.prospection.followup.d7')}\n\n${d7}` : '',
    ].filter(Boolean).join('\n\n---\n\n');
  };

  const copy = () => {
    const text = getTabContent(activeTab);
    if (!text) return;
    navigator.clipboard?.writeText(text);
    toast(t('tool.copied'));
  };

  return (
    <ToolShell tool={tool}>
      <div className="tool-page">
        <div className="card card-pad">
          <h3 className="h3" style={{ marginBottom: 16, fontSize: 15 }}>{t('tool.params')}</h3>

          <div className="field">
            <label className="label">
              {t('tool.prospection.niche.label')} <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <input
              className="input"
              type="text"
              value={niche}
              onChange={e => setNiche(e.target.value)}
              placeholder={t('tool.prospection.niche.placeholder')}
            />
          </div>

          <div className="field">
            <label className="label">
              {t('tool.prospection.target.label')} <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <textarea
              className="textarea"
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder={t('tool.prospection.target.placeholder')}
              rows={4}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="field">
            <label className="label">{t('tool.prospection.channel.label')}</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CHANNELS.map(ch => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setChannel(ch.id)}
                  className="btn btn-sm"
                  style={{
                    border: '1px solid ' + (channel === ch.id ? 'var(--fg)' : 'var(--border)'),
                    background: channel === ch.id ? 'var(--fg)' : 'var(--bg)',
                    color: channel === ch.id ? '#fff' : 'var(--fg-2)',
                  }}
                >
                  {t(ch.key)}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="label">{t('tool.prospection.tone.label')}</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TONES.map(tn => (
                <button
                  key={tn.id}
                  type="button"
                  onClick={() => setTone(tn.id)}
                  className="btn btn-sm"
                  style={{
                    border: '1px solid ' + (tone === tn.id ? 'var(--accent)' : 'var(--border)'),
                    background: tone === tn.id ? 'var(--accent-bg, #f0f7ff)' : 'var(--bg)',
                    color: 'var(--fg)',
                  }}
                >
                  {t(tn.key)}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="label">{t('tool.prospection.pain.label')}</label>
            <textarea
              className="textarea"
              value={pain}
              onChange={e => setPain(e.target.value)}
              placeholder={t('tool.prospection.pain.placeholder')}
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="hr" style={{ margin: '20px 0' }} />
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
            <span className="muted">{t('tool.cost')}</span>
            <span className="tabular"><b>{tool.credits}</b> {t('tool.credits')}</span>
          </div>
          <CreditGate cost={tool.credits}>
            <button className="btn btn-accent btn-lg btn-block" onClick={generate} disabled={loading}>
              {loading ? t('tool.generating') : <><Glyph name="sparkle" size={14} /> {t('tool.prospection.btn')}</>}
            </button>
          </CreditGate>
        </div>

        <div>
          <div className="result-zone">
            <div className="result-head">
              <span className="muted" style={{ fontSize: 13 }}>{t('tool.result')}</span>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={copy} disabled={!hasOutput}>
                  <Glyph name="copy" size={12} /> {t('tool.copy')}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={generate} disabled={!hasOutput || loading}>
                  <Glyph name="refresh" size={12} /> {t('tool.regenerate')}
                </button>
              </div>
            </div>

            {hasOutput && (
              <div style={{ borderBottom: '1px solid var(--border)', display: 'flex', gap: 0 }}>
                {MSG_TABS.map(tab => (
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
                      border: 'none',
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
            )}

            {loading ? (
              <div className="result-empty">
                <span className="row" style={{ gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite' }} />
                  {t('tool.result.working')}
                </span>
              </div>
            ) : hasOutput ? (
              <div className="result-body" style={{ whiteSpace: 'pre-wrap' }}>
                {getTabContent(activeTab)}
              </div>
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
