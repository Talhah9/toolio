import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { Glyph } from './Glyph';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const TYPE_META = {
  success: { glyph: 'check-circle', color: '#16a34a' },
  warning: { glyph: 'warning',      color: '#d97706' },
  credits: { glyph: 'coin',         color: '#4F46E5' },
  info:    { glyph: 'info',         color: '#0ea5e9' },
};

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllRead } = useApp();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  return (
    <div className="notif-wrap" ref={ref}>
      <button
        className="notif-bell"
        onClick={() => setOpen(o => !o)}
        aria-label={t('notif.label') || 'Notifications'}
      >
        <Glyph name="bell" size={18} />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-title">{t('notif.title') || 'Notifications'}</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAllRead}>
                {t('notif.markAll') || 'Mark all read'}
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <Glyph name="bell" size={24} />
                <span>{t('notif.empty') || 'No notifications'}</span>
              </div>
            ) : (
              notifications.map(n => {
                const meta = TYPE_META[n.type] || TYPE_META.info;
                return (
                  <div
                    key={n.id}
                    className={`notif-item${n.read ? '' : ' notif-item--unread'}`}
                    onClick={() => !n.read && markAsRead(n.id)}
                  >
                    <span className="notif-icon" style={{ color: meta.color }}>
                      <Glyph name={meta.glyph} size={16} />
                    </span>
                    <div className="notif-body">
                      <span className="notif-item-title">{n.title}</span>
                      {n.body && <span className="notif-item-body">{n.body}</span>}
                      <span className="notif-time">{timeAgo(n.created_at)}</span>
                    </div>
                    {!n.read && <span className="notif-dot" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
