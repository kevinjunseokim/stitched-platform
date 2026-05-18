import { useEffect, useRef, useState } from 'react';

import { Eyebrow } from '../atoms';
import { COLORS } from '../../theme/tokens';
import { useApp } from '../../context/AppDataContext';
import { formatRelative } from '../../utils/format';

import { HeaderIconButton } from './HeaderIconButton';

export function NotificationsBell() {
  const { notifications, notificationsUnread, refreshNotifications, api, user } = useApp();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handleOpen = async () => {
    if (!user) return;
    setOpen((v) => !v);
    if (!open) {
      await refreshNotifications();
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    try {
      await api.markNotificationsRead();
      refreshNotifications();
    } catch {
      // Swallow — notifications stay unread until next refresh succeeds.
    }
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <HeaderIconButton label="Notifications" onClick={handleOpen}>
        <i className="iconoir-bell" style={{ fontSize: 20 }}/>
        {notificationsUnread > 0 && (
          <span style={{ position: 'absolute', top: 9, right: 9, width: 6, height: 6, background: COLORS.clay, borderRadius: 999 }}/>
        )}
      </HeaderIconButton>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 56, width: 360, maxHeight: 480, overflow: 'auto',
          background: COLORS.paper, border: `1px solid ${COLORS.ink}`, zIndex: 50,
        }}>
          <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `1px solid ${COLORS.border}` }}>
            <Eyebrow>Notifications</Eyebrow>
            <button onClick={markAllRead} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: COLORS.pin, fontSize: 11, fontFamily: "'Geist', sans-serif", letterSpacing: '0.14em', textTransform: 'uppercase' }}>Mark all read</button>
          </div>
          {(notifications || []).length === 0 && (
            <div style={{ padding: 22, fontSize: 13, color: COLORS.inkFaint }}>You're all caught up.</div>
          )}
          {(notifications || []).map((n) => (
            <div key={n.id} style={{
              padding: '14px 18px', borderBottom: `1px solid ${COLORS.borderFaint}`,
              background: n.read ? 'transparent' : 'rgba(155,54,24,0.05)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.ink }}>{n.title}</div>
              {n.body && <div style={{ fontSize: 12, color: COLORS.inkMuted, marginTop: 4 }}>{n.body}</div>}
              <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 6 }}>{formatRelative(n.createdAt).toUpperCase()} AGO</Eyebrow>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
