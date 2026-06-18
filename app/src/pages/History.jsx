import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarkdownResult } from '../components/MarkdownResult';
import { Glyph } from '../components/Glyph';
import { SaveButton } from '../components/SaveButton';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { TOOLS, getToolText } from '../data/catalog';
import { exportPdf } from '../lib/exportPdf';

export function History() {
  const navigate = useNavigate();
  const { session, user } = useApp();
  const { t, lang } = useLang();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    setLoading(true);
    console.log('[History] fetching generations for user:', session.user.id);
    supabase
      .from('generations')
      .select('id, tool_id, input, output, credits_used, saved, name, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) {
          console.error('[History] fetch error:', error.message, error);
        } else if (data) {
          console.log('[History] fetched rows:', data.length);
          const savedCount = data.filter(r => r.saved === true).length;
          console.log('[History] saved rows:', savedCount, '| sample saved fields:', data.slice(0, 3).map(r => ({ id: r.id, saved: r.saved })));
          setRows(data);
        }
        setLoading(false);
      });
  }, [session?.user?.id]);

  const toggleSaveOptimistic = (id, newVal) => {
    setRows(rs => rs.map(r => r.id === id ? { ...r, saved: newVal } : r));
  };

  const toolOptions = [...new Set(rows.map(r => r.tool_id))];

  const filtered = rows.filter(r => {
    if (filter === 'saved') return r.saved === true;
    if (filter === 'all') return true;
    return r.tool_id === filter;
  });

  const getToolName = (toolId) => {
    const tool = TOOLS.find(t => t.id === toolId);
    if (!tool) return toolId;
    return lang === 'fr' ? tool.short_fr : tool.short_en;
  };

  const getToolFullName = (toolId) => {
    const tool = TOOLS.find(t => t.id === toolId);
    if (!tool) return toolId;
    return lang === 'fr' ? tool.name_fr : tool.name_en;
  };

  const fmtDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const fmtTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      hour: '2-digit', minute: '2-digit',
    });
  };

  const copyOutput = (text) => { navigator.clipboard?.writeText(text); };

  const downloadPdf = (row) => {
    const tool = TOOLS.find(t => t.id === row.tool_id);
    const name = tool ? (lang === 'fr' ? tool.name_fr : tool.name_en) : row.tool_id;
    exportPdf({
      toolName: name,
      userEmail: user?.email,
      output: row.output,
      filename: `savvly-${row.tool_id}-${row.created_at?.slice(0, 10)}.pdf`,
    });
  };

  const isExpandable = (row) => row.output && row.output !== '[image]';

  return (
    <div className="page-pad">
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 className="h1" style={{ marginBottom: 6 }}>{t('history.title')}</h1>
          <p className="muted" style={{ fontSize: 14 }}>{t('history.subtitle')}</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {['all', 'saved'].map(f => (
            <button
              key={f}
              className="btn btn-sm"
              onClick={() => setFilter(f)}
              style={{
                border: `1px solid ${filter === f ? 'var(--fg)' : 'var(--border)'}`,
                background: filter === f ? 'var(--fg)' : 'var(--bg)',
                color: filter === f ? '#fff' : 'var(--fg-2)',
              }}
            >
              {f === 'all' ? t('history.filter.all') : t('history.filter.saved')}
            </button>
          ))}
          {toolOptions.length > 1 && (
            <select
              className="select"
              value={toolOptions.includes(filter) ? filter : ''}
              onChange={e => setFilter(e.target.value || 'all')}
              style={{ width: 'auto', height: 32, fontSize: 13, padding: '0 10px' }}
            >
              <option value="">{t('history.filter.tool')}</option>
              {toolOptions.map(id => (
                <option key={id} value={id}>{getToolName(id)}</option>
              ))}
            </select>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite', display: 'block' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p className="muted">{filter === 'saved' ? t('history.empty.saved') : t('history.empty')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(row => {
              const isExp = expanded === row.id;
              const canExpand = isExpandable(row);
              const displayName = row.name || getToolName(row.tool_id);

              return (
                <div key={row.id} className="card" style={{ overflow: 'hidden' }}>
                  {/* Row header */}
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
                      cursor: canExpand ? 'pointer' : 'default',
                    }}
                    onClick={() => canExpand && setExpanded(isExp ? null : row.id)}
                  >
                    {/* Tool badge */}
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                      background: 'var(--accent-soft)', color: 'var(--accent)',
                      flexShrink: 0,
                    }}>
                      {getToolName(row.tool_id)}
                    </span>

                    {/* Display name / date */}
                    <span style={{ fontSize: 13, color: 'var(--fg)', fontWeight: row.name ? 500 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {displayName}
                    </span>

                    {/* Date + time */}
                    <span className="muted" style={{ fontSize: 12, flexShrink: 0 }}>
                      {fmtDate(row.created_at)} · {fmtTime(row.created_at)}
                    </span>

                    {/* Credits */}
                    {row.credits_used > 0 && (
                      <span style={{ fontSize: 12, color: 'var(--fg-4)', flexShrink: 0 }}>
                        {row.credits_used} {t('history.credits')}
                      </span>
                    )}

                    {/* Save button */}
                    <div onClick={e => e.stopPropagation()}>
                      <SaveButton
                        generationId={row.id}
                        initialSaved={row.saved ?? false}
                        toolName={row.name || getToolFullName(row.tool_id)}
                        onToggle={(newVal) => toggleSaveOptimistic(row.id, newVal)}
                      />
                    </div>

                    {/* Expand chevron */}
                    {canExpand && (
                      <span style={{
                        color: 'var(--fg-4)', transition: 'transform 0.2s',
                        transform: isExp ? 'rotate(180deg)' : 'none',
                        display: 'flex', flexShrink: 0,
                      }}>
                        <Glyph name="chevron-down" size={14} />
                      </span>
                    )}
                  </div>

                  {/* Expanded output */}
                  {isExp && canExpand && (
                    <div style={{ borderTop: '1px solid var(--border)' }}>
                      {/* Action bar */}
                      <div style={{ display: 'flex', gap: 8, padding: '10px 18px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => copyOutput(row.output)}>
                          <Glyph name="copy" size={12} /> {t('history.expand.copy')}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => downloadPdf(row)}>
                          <Glyph name="arrow-down" size={12} /> {t('history.expand.pdf')}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            const initialData = typeof row.input === 'string'
                              ? (() => { try { return JSON.parse(row.input); } catch { return {}; } })()
                              : (row.input ?? {});
                            navigate(`/tools/${row.tool_id}`, { state: { initialData } });
                          }}
                        >
                          <Glyph name="refresh" size={12} /> Relancer
                        </button>
                      </div>
                      {/* Output */}
                      <MarkdownResult style={{ maxHeight: 480, overflowY: 'auto' }}>{row.output}</MarkdownResult>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
