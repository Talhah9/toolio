import { Glyph } from './Glyph';

export function ToolIcon({ tool, size = 'md' }) {
  return (
    <span className={`glyph ${size === 'lg' ? 'glyph-lg' : ''}`}>
      <Glyph name={tool.glyph} size={size === 'lg' ? 20 : 16} />
    </span>
  );
}
