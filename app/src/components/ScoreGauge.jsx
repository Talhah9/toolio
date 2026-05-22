export function parseScore(text) {
  const match = (text || '').match(/\[SCORE:(\d+)\]/);
  return match ? Math.min(100, Math.max(0, parseInt(match[1], 10))) : null;
}

export function stripScore(text) {
  return (text || '').replace(/\[SCORE:\d+\]\s*/g, '');
}

function scoreColor(score) {
  if (score < 40) return '#EF4444';
  if (score < 70) return '#F59E0B';
  return '#10B981';
}

function scoreLabel(score, lang) {
  const fr = score < 40 ? 'Problèmes critiques' : score < 70 ? 'Amélioration possible' : 'Bonne performance';
  const en = score < 40 ? 'Critical issues to fix' : score < 70 ? 'Room for improvement' : 'Good performance';
  return lang === 'fr' ? fr : en;
}

export function ScoreGauge({ score, lang }) {
  const R = 34;
  const STROKE = 6;
  const cx = 44;
  const cy = 44;
  const circumference = 2 * Math.PI * R;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 18,
      padding: '14px 20px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-soft)',
    }}>
      <svg width={88} height={88} style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--border)" strokeWidth={STROKE} />
        <circle
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)' }}
        />
        <text
          x={cx} y={cy + 1}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontSize: 20, fontWeight: 700, fill: color, fontFamily: 'inherit' }}
        >
          {score}
        </text>
      </svg>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1, marginBottom: 4 }}>
          {score}/100
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.4 }}>
          {scoreLabel(score, lang)}
        </div>
      </div>
    </div>
  );
}
