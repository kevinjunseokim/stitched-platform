// Stitched — Watchlist & alerts.

import { useEffect, useState } from 'react';

import { Avatar, Badge, Delta, Eyebrow, Num } from '../../components/atoms';
import { SectionHeading } from '../../components/SectionHeading';
import { useApp } from '../../context/AppDataContext';
import { PLAYERS, findPlayer } from '../../data/mocks';
import { COLORS } from '../../theme/tokens';
import { formatRelative } from '../../utils/format';

function WatchlistEntryRow({ entry, divider, onPlayer, onRemove, onUpdate }) {
  const player = entry.player || (entry.targetType === 'player' ? findPlayer(entry.targetId) : null);
  const [freq, setFreq] = useState(entry.alertFreq || 'daily');
  const updateFreq = (next) => {
    setFreq(next);
    onUpdate(entry.id, { alertFreq: next });
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: divider ? `1px solid ${COLORS.borderFaint}` : 'none' }}>
      {player ? (
        <button onClick={() => onPlayer(player.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar initials={player.initials} size={36} color={player.color}/>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{player.name}</div>
            <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 3 }}>{player.sport}</Eyebrow>
          </div>
        </button>
      ) : (
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{entry.label || `${entry.targetType}: ${entry.targetId}`}</div>
          <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 4 }}>{entry.targetType}</Eyebrow>
        </div>
      )}
      <div style={{ flex: 1 }}/>
      <div style={{ display: 'flex', border: `1px solid ${COLORS.border}` }}>
        {['realtime', 'daily', 'weekly'].map((f, i) => (
          <button key={f} onClick={() => updateFreq(f)} style={{
            padding: '6px 10px', background: freq === f ? COLORS.ink : COLORS.paper, color: freq === f ? COLORS.chalk : COLORS.ink,
            border: 'none', borderRight: i < 2 ? `1px solid ${COLORS.border}` : 'none', cursor: 'pointer',
            fontFamily: "'Geist', sans-serif", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>{f}</button>
        ))}
      </div>
      <button onClick={() => onRemove(entry.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: COLORS.inkSubtle, fontSize: 12, fontFamily: "'Geist', sans-serif", letterSpacing: '0.14em', textTransform: 'uppercase' }}>Remove</button>
    </div>
  );
}

export function WatchlistScreen({ onPlayer }) {
  const { api, watchlist, refreshWatchlist, notifications, refreshNotifications, follows, players } = useApp();
  const [savedSearches, setSavedSearches] = useState([]);

  useEffect(() => { refreshWatchlist(); refreshNotifications(); }, [refreshWatchlist, refreshNotifications]);

  useEffect(() => {
    let cancelled = false;
    api.savedSearches().then(({ savedSearches: list }) => { if (!cancelled) setSavedSearches(list || []); }).catch(() => {});
    return () => { cancelled = true; };
  }, [api]);

  const handleRemove = async (id) => {
    try { await api.removeWatchlist(id); refreshWatchlist(); } catch { /* silent — refresh will reconcile */ }
  };
  const handleUpdate = async (id, patch) => {
    try { await api.updateWatchlist(id, patch); refreshWatchlist(); } catch { /* silent */ }
  };

  const followedPlayerIds = Array.from(follows.players || []);
  const followedPlayers = (players || PLAYERS).filter((p) => followedPlayerIds.includes(p.id));
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ padding: '48px 56px 96px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 0, border: `1px solid ${COLORS.border}`, marginBottom: 28 }}>
        {[
          { l: 'WATCHED PLAYERS', v: followedPlayers.length, sub: 'following' },
          { l: 'WATCHLIST ENTRIES', v: watchlist.length, sub: 'with alert thresholds' },
          { l: 'SAVED SEARCHES', v: savedSearches.length, sub: 'reusable queries' },
          { l: 'ALERTS · UNREAD', v: unreadCount, sub: `${notifications.length} total`, color: unreadCount > 0 ? COLORS.clay : COLORS.ink },
        ].map((s, i) => (
          <div key={i} style={{ padding: '20px 22px', background: COLORS.paper, borderRight: i < 3 ? `1px solid ${COLORS.border}` : 'none' }}>
            <Eyebrow>{s.l}</Eyebrow>
            <Num size={28} weight={500} color={s.color || COLORS.ink} style={{ display: 'block', marginTop: 10, letterSpacing: '-0.02em' }}>{s.v}</Num>
            <div style={{ fontSize: 12, color: COLORS.inkMuted, marginTop: 6 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        <div>
          <SectionHeading title="Recent alerts">
            <button onClick={async () => { try { await api.markNotificationsRead(); refreshNotifications(); } catch { /* silent */ } }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: COLORS.pin, fontSize: 11, fontFamily: "'Geist', sans-serif", letterSpacing: '0.14em', textTransform: 'uppercase' }}>Mark all read →</button>
          </SectionHeading>
          <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}` }}>
            {notifications.length === 0 && (
              <div style={{ padding: 22, fontSize: 13, color: COLORS.inkFaint }}>No alerts yet — add players to your watchlist to start receiving updates.</div>
            )}
            {notifications.map((a, i, arr) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '18px 22px', borderBottom: i < arr.length - 1 ? `1px solid ${COLORS.borderFaint}` : 'none', position: 'relative' }}>
                {!a.read && <span style={{ position: 'absolute', top: 24, left: 8, width: 6, height: 6, background: COLORS.clay }}/>}
                <Badge kind="field" style={{ minWidth: 130, justifyContent: 'center', flexShrink: 0 }}>{(a.kind || 'ALERT').toUpperCase()}</Badge>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.ink, letterSpacing: '-0.005em' }}>{a.title}</div>
                  {a.body && <div style={{ fontSize: 13, color: COLORS.inkMuted, marginTop: 4, lineHeight: 1.5 }}>{a.body}</div>}
                </div>
                <Eyebrow color={COLORS.inkFaint} style={{ minWidth: 60, textAlign: 'right' }}>{formatRelative(a.createdAt).toUpperCase()} AGO</Eyebrow>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <SectionHeading title="Watchlist" size="sm" meta={`${watchlist.length} entries`} style={{ marginBottom: 16 }}/>
            <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}` }}>
              {watchlist.length === 0 && (
                <div style={{ padding: 18, fontSize: 13, color: COLORS.inkFaint }}>Add players or saved searches from the player or search page.</div>
              )}
              {watchlist.map((entry, i, arr) => (
                <WatchlistEntryRow key={entry.id} entry={entry} divider={i < arr.length - 1} onPlayer={onPlayer} onRemove={handleRemove} onUpdate={handleUpdate}/>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading title="Followed players" size="sm" meta={followedPlayers.length} style={{ marginBottom: 16 }}/>
            <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}` }}>
              {followedPlayers.length === 0 && (
                <div style={{ padding: 18, fontSize: 13, color: COLORS.inkFaint }}>Follow players from their detail page.</div>
              )}
              {followedPlayers.map((p, i) => (
                <button key={p.id} onClick={() => onPlayer(p.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', width: '100%',
                  background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                  borderBottom: i < followedPlayers.length - 1 ? `1px solid ${COLORS.borderFaint}` : 'none',
                }}>
                  <Avatar initials={p.initials} size={32} color={p.color}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 3 }}>{p.sport}</Eyebrow>
                  </div>
                  <Delta pct={p.d30} size={11}/>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
