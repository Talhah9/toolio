import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Splits a text string on [OK] / [WARN] / [ERR] tokens and returns
// an array of strings and badge <span> elements.
function processBadges(children) {
  return React.Children.map(children, child => {
    if (typeof child !== 'string') return child;
    const parts = child.split(/(\[OK\]|\[WARN\]|\[ERR\])/g);
    if (parts.length === 1) return child;
    return parts.map((part, i) => {
      if (part === '[OK]')   return <span key={i} className="md-badge md-badge-ok">OK</span>;
      if (part === '[WARN]') return <span key={i} className="md-badge md-badge-warn">WARN</span>;
      if (part === '[ERR]')  return <span key={i} className="md-badge md-badge-err">ERR</span>;
      return part || null;
    });
  });
}

const components = {
  p:      ({ children }) => <p>{processBadges(children)}</p>,
  li:     ({ children }) => <li>{processBadges(children)}</li>,
  td:     ({ children }) => <td>{processBadges(children)}</td>,
  strong: ({ children }) => <strong>{processBadges(children)}</strong>,
};

export function MarkdownResult({ children, style }) {
  return (
    <div className="result-body" style={style}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children || ''}
      </ReactMarkdown>
    </div>
  );
}
