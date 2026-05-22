import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MarkdownResult } from '../components/MarkdownResult';
import { stripScore } from '../components/ScoreGauge';

export function ShareResult() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/get-shared-result?id=${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setNotFound(true);
        else setData(d);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  const containerStyle = {
    maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px',
    fontFamily: 'inherit',
  };

  if (notFound) return (
    <div style={containerStyle}>
      <Link to="/" style={{ color: 'var(--accent)', fontSize: 14, display: 'inline-block', marginBottom: 32 }}>
        ← Toolio
      </Link>
      <p style={{ color: 'var(--fg-3)', fontSize: 15 }}>This result is no longer available.</p>
    </div>
  );

  if (!data) return (
    <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <span style={{ color: 'var(--fg-4)', fontSize: 14 }}>Loading…</span>
    </div>
  );

  const date = new Date(data.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div style={containerStyle}>
      <Link to="/" style={{ color: 'var(--accent)', fontSize: 14, display: 'inline-block', marginBottom: 32 }}>
        ← Toolio
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg)', margin: '0 0 4px' }}>
        {data.name || data.tool_id}
      </h1>
      <p style={{ color: 'var(--fg-4)', fontSize: 13, margin: '0 0 28px' }}>{date}</p>
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg)' }}>
        <MarkdownResult>{stripScore(data.output)}</MarkdownResult>
      </div>
      <p style={{ textAlign: 'center', marginTop: 32, fontSize: 13, color: 'var(--fg-4)' }}>
        Generated with <a href="/" style={{ color: 'var(--accent)' }}>Toolio</a>
      </p>
    </div>
  );
}
