import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { Glyph } from '../components/Glyph';
import { ToolIcon } from '../components/ToolIcon';
import { useToast } from '../components/Toast';
import { TOOLS, SAMPLE_OUTPUTS } from '../data/catalog';
import { useApp } from '../context/AppContext';

export function ToolPage() {
  const navigate = useNavigate();
  const { toolId } = useParams();
  const { credits, consumeCredits } = useApp();

  const tool = TOOLS.find(t => t.id === toolId) || TOOLS[7];

  const [niche, setNiche] = useState('Freelance design produit');
  const [tone, setTone] = useState('direct');
  const [topic, setTopic] = useState('Comment fixer ses tarifs en freelance');
  const [format, setFormat] = useState('storytelling');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [outIndex, setOutIndex] = useState(0);
  const [history, setHistory] = useState([
    { id: 1, topic: 'Trouver ses 3 premiers clients', time: 'il y a 2 h', credits: 10 },
    { id: 2, topic: 'Refonte de mon offre en 2026', time: 'hier', credits: 10 },
    { id: 3, topic: "Pourquoi j'ai quitté mon CDI", time: 'il y a 3 j', credits: 10 },
  ]);
  const [toast, ToastEl] = useToast();

  const generate = () => {
    if (credits < tool.credits) {
      toast('Crédits insuffisants. Rechargez votre compte.');
      return;
    }
    setLoading(true);
    setOutput('');
    setTimeout(() => {
      const samples = SAMPLE_OUTPUTS[tool.id] || SAMPLE_OUTPUTS['linkedin-content'];
      const next = samples[outIndex % samples.length];
      setOutput(next);
      setOutIndex(i => i + 1);
      setLoading(false);
      consumeCredits(tool.credits);
      setHistory(h => [{ id: Date.now(), topic, time: "à l'instant", credits: tool.credits }, ...h].slice(0, 5));
    }, 1200);
  };

  const copy = () => {
    if (!output) return;
    navigator.clipboard?.writeText(output);
    toast('Copié dans le presse-papier');
  };

  return (
    <>
      <AppHeader />
      <div className="page-pad">
        <div className="breadcrumb">
          <a onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</a>
          <Glyph name="chevron-right" size={12} />
          <span>Outils</span>
          <Glyph name="chevron-right" size={12} />
          <span className="current">{tool.short}</span>
        </div>

        <div className="row" style={{ marginBottom: 28, gap: 16 }}>
          <ToolIcon tool={tool} size="lg" />
          <div>
            <h1 className="h1" style={{ marginBottom: 4 }}>{tool.name}</h1>
            <p className="muted" style={{ fontSize: 14 }}>{tool.desc}</p>
          </div>
        </div>

        <div className="tool-page">
          {/* Form */}
          <div className="card card-pad">
            <h3 className="h3" style={{ marginBottom: 16, fontSize: 15 }}>Paramètres</h3>

            <div className="field">
              <label className="label">Niche / activité</label>
              <input className="input" value={niche} onChange={e => setNiche(e.target.value)} placeholder="Ex. designer UX freelance" />
            </div>

            <div className="field">
              <label className="label">Sujet du post</label>
              <textarea className="textarea" value={topic} onChange={e => setTopic(e.target.value)} placeholder="De quoi voulez-vous parler ?" />
            </div>

            <div className="field">
              <label className="label">Ton</label>
              <select className="select" value={tone} onChange={e => setTone(e.target.value)}>
                <option value="direct">Direct, sans détour</option>
                <option value="storyteller">Narratif, personnel</option>
                <option value="expert">Expert, analytique</option>
                <option value="provocateur">Provocateur</option>
              </select>
            </div>

            <div className="field">
              <label className="label">Format</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { v: 'storytelling', label: 'Storytelling' },
                  { v: 'liste', label: 'Liste à puces' },
                  { v: 'opinion', label: 'Opinion forte' },
                  { v: 'question', label: 'Question ouverte' },
                ].map(opt => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setFormat(opt.v)}
                    className="btn btn-sm"
                    style={{
                      border: '1px solid ' + (format === opt.v ? 'var(--fg)' : 'var(--border)'),
                      background: format === opt.v ? 'var(--fg)' : 'var(--bg)',
                      color: format === opt.v ? '#fff' : 'var(--fg-2)',
                      justifyContent: 'flex-start',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="hr" style={{ margin: '20px 0' }} />

            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
              <span className="muted">Coût</span>
              <span className="tabular"><b>{tool.credits}</b> crédits</span>
            </div>

            <button className="btn btn-accent btn-lg btn-block" onClick={generate} disabled={loading}>
              {loading ? 'Génération…' : <><Glyph name="sparkle" size={14} /> Générer</>}
            </button>
          </div>

          {/* Result */}
          <div>
            <div className="result-zone">
              <div className="result-head">
                <span className="muted" style={{ fontSize: 13 }}>Résultat</span>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={copy} disabled={!output}>
                    <Glyph name="copy" size={12} /> Copier
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={generate} disabled={!output || loading}>
                    <Glyph name="refresh" size={12} /> Régénérer
                  </button>
                </div>
              </div>
              {loading ? (
                <div className="result-empty">
                  <span className="row" style={{ gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite' }} />
                    Toolio rédige votre post…
                  </span>
                </div>
              ) : output ? (
                <div className="result-body">{output}</div>
              ) : (
                <div className="result-empty">Le résultat apparaîtra ici.</div>
              )}
            </div>

            <div style={{ marginTop: 24 }}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 className="h3" style={{ fontSize: 14 }}>Historique récent</h3>
                <a className="muted" style={{ fontSize: 13, cursor: 'pointer' }}>Tout voir</a>
              </div>
              <div className="card" style={{ overflow: 'hidden' }}>
                {history.slice(0, 3).map(h => (
                  <div className="history-row" key={h.id}>
                    <div>
                      <div>{h.topic}</div>
                      <div className="meta">{h.time} · {h.credits} crédits</div>
                    </div>
                    <Glyph name="chevron-right" size={14} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {ToastEl}
      </div>
    </>
  );
}
