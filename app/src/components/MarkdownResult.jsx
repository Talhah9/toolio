import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function processBadges(children) {
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

function getFirstText(node) {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) {
    for (const child of node) {
      const t = getFirstText(child);
      if (t) return t;
    }
  }
  if (node?.props?.children) return getFirstText(node.props.children);
  return '';
}

function getCalloutType(children) {
  const text = getFirstText(children);
  if (text.startsWith('✅')) return 'ok';
  if (text.startsWith('⚠️')) return 'warn';
  if (text.startsWith('💡')) return 'tip';
  if (text.startsWith('🚨')) return 'critical';
  return null;
}

const components = {
  p:      ({ children }) => <p>{processBadges(children)}</p>,
  li:     ({ children }) => <li>{processBadges(children)}</li>,
  td:     ({ children }) => <td>{processBadges(children)}</td>,
  strong: ({ children }) => <strong>{processBadges(children)}</strong>,
  blockquote: ({ children }) => {
    const type = getCalloutType(children);
    if (type) return <div className={`callout callout-${type}`}>{children}</div>;
    return <blockquote>{children}</blockquote>;
  },
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
