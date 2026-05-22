import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Glyph } from './Glyph';
import { processBadges } from './MarkdownResult';
import { exportPdf } from '../lib/exportPdf';

function prepareContent(raw) {
  return (raw || '')
    .replace(/\[SCORE:\d+\]\s*/g, '')
    .replace(/\[SECTION:([A-Z_]+)\]/g, (_, k) =>
      `\n\n## ${k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}\n`
    )
    .trim();
}

function getFirstText(node) {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) {
    for (const child of node) { const t = getFirstText(child); if (t) return t; }
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

const mkComponents = {
  h1: ({ children }) => <h1 className="rv-h1">{children}</h1>,
  h2: ({ children }) => <h2 className="rv-h2">{children}</h2>,
  h3: ({ children }) => <h3 className="rv-h3">{children}</h3>,
  p:  ({ children }) => <p  className="rv-p">{processBadges(children)}</p>,
  li: ({ children }) => <li className="rv-li">{processBadges(children)}</li>,
  th: ({ children }) => <th className="rv-th">{children}</th>,
  td: ({ children }) => <td className="rv-td">{processBadges(children)}</td>,
  tr: ({ children }) => <tr className="rv-tr">{children}</tr>,
  table:      ({ children }) => <div className="rv-table-wrap"><table className="rv-table">{children}</table></div>,
  code:       ({ inline, children }) => inline
    ? <code className="rv-code-inline">{children}</code>
    : <pre className="rv-pre"><code>{children}</code></pre>,
  blockquote: ({ children }) => {
    const type = getCalloutType(children);
    if (type) return <div className={`callout callout-${type}`}>{children}</div>;
    return <blockquote className="rv-blockquote">{children}</blockquote>;
  },
  strong:     ({ children }) => <strong>{processBadges(children)}</strong>,
};

export function ResultViewer({ output, toolName, userEmail, onClose }) {
  const [visible, setVisible] = useState(true);
  const content = prepareContent(output);
  const date = new Date().toLocaleDateString('en-GB');

  const close = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const copy = () => navigator.clipboard?.writeText(content);

  const downloadPdf = () => exportPdf({
    toolName,
    userEmail,
    output: content,
    filename: `savvly-${(toolName || 'result').toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`,
  });

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          className="rv-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={close}
        >
          <motion.div
            className="rv-panel"
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <div className="rv-header">
              <div>
                <div className="rv-title">{toolName}</div>
                <div className="rv-date">{date}</div>
              </div>
              <button className="rv-close" onClick={close}>
                <Glyph name="x" size={15} />
              </button>
            </div>

            <div className="rv-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mkComponents}>
                {content}
              </ReactMarkdown>
            </div>

            <div className="rv-footer">
              <button className="btn btn-ghost btn-sm" onClick={downloadPdf}>
                <Glyph name="arrow-down" size={12} /> Export PDF
              </button>
              <button className="btn btn-ghost btn-sm" onClick={copy}>
                <Glyph name="copy" size={12} /> Copy
              </button>
              <button className="btn btn-accent btn-sm" onClick={close}>
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
