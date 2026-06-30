// Stitched — Player index page.

import { useEffect, useState } from 'react';

import { Avatar, Button, Delta, Eyebrow, Num } from '../../components/atoms';
import { CompsTable } from '../../components/CompsTable';
import { AreaChart } from '../../components/primitives';
import { SectionHeading } from '../../components/SectionHeading';
import { useApp } from '../../context/AppDataContext';
import { PLAYERS, SERIES, findPlayer } from '../../data/mocks';
import { COLORS } from '../../theme/tokens';

function PlayerHeader({ player, onFollow, onWatchlist, followed, watching, busy }) {
  return (
    <div style={{ background: COLORS.field, color: COLORS.chalk, borderBottom: `1px solid ${COLORS.ink}` }}>
      <div style={{ padding: '48px 56px 56px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <Avatar initials={player.initials} size={88} color={player.color} style={{ border: `2px solid ${COLORS.chalk}` }}/>
          <div style={{ flex: 1 }}>
            <Eyebrow color="rgba(250,250,245,0.65)">PLAYER INDEX · {player.sport}</Eyebrow>
            <h1 style={{ fontFamily: "'Geist', sans-serif", fontSize: 48, fontWeight: 500, letterSpacing: '-0.03em', margin: '8px 0 4px', lineHeight: 1, color: COLORS.chalk }}>
              {player.name}
            </h1>
            <div style={{ fontSize: 15, color: 'rgba(250,250,245,0.78)' }}>{player.team}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Eyebrow color="rgba(250,250,245,0.65)">Index value</Eyebrow>
            <Num size={56} weight={500} color={COLORS.chalk} style={{ display: 'block', marginTop: 6, letterSpacing: '-0.03em' }}>
              {Number(player.index || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Num>
            <div style={{ marginTop: 6 }}><Delta pct={player.d30} size={16}/></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 160 }}>
            <Button variant="invert" size="md" onClick={onFollow}>{followed ? '✓ Following' : 'Follow player'}</Button>
            <Button variant="ghost" size="md" onClick={onWatchlist} style={{ color: COLORS.chalk, border: '1px solid rgba(250,250,245,0.4)', textDecoration: 'none' }}>{busy ? '…' : (watching ? '✓ On watchlist' : '+ Add to watchlist')}</Button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, marginTop: 36, borderTop: '1px solid rgba(250,250,245,0.22)', paddingTop: 22 }}>
          {[
            { l: '30D', v: `${player.d30 >= 0 ? '+' : ''}${player.d30}%`, color: '#A8CFB6' },
            { l: '90D', v: `${player.d90 >= 0 ? '+' : ''}${player.d90}%`, color: '#A8CFB6' },
            { l: '365D', v: `${player.d365 >= 0 ? '+' : ''}${player.d365}%`, color: '#A8CFB6' },
          ].map((s, i) => (
            <div key={i} style={{ paddingRight: i < 2 ? 24 : 0 }}>
              <Eyebrow color="rgba(250,250,245,0.55)">{s.l}</Eyebrow>
              <Num size={20} weight={500} color={s.color || COLORS.chalk} style={{ display: 'block', marginTop: 6 }}>{s.v}</Num>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const PLAYER_RANGE_MAP = { '30D': '30d', '90D': '90d', '1Y': '365d', ALL: '365d' };
const PLAYER_RANGES = Object.keys(PLAYER_RANGE_MAP);

function PlayerChart({ player }) {
  const { api } = useApp();
  const [range, setRange] = useState('1Y');
  const [points, setPoints] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api.playerIndex(player.id, PLAYER_RANGE_MAP[range])
      .then(({ points: list }) => { if (!cancelled) setPoints(list || []); })
      .catch(() => { if (!cancelled) setPoints([]); });
    return () => { cancelled = true; };
  }, [api, player.id, range]);

  const values = points.length ? points.map((p) => p.value) : (SERIES[player.id] || SERIES['corbin-carroll']);
  const delta = values.length >= 2 && values[0] > 0 ? ((values[values.length - 1] - values[0]) / values[0]) * 100 : 0;

  return (
    <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 26px 18px', borderBottom: `1px solid ${COLORS.borderFaint}` }}>
        <div style={{ flex: 1 }}>
          <Eyebrow>Index movement · {range}</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 8 }}>
            <Num size={28} weight={500} style={{ letterSpacing: '-0.02em' }}>{Number(player.index || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Num>
            <Delta pct={delta}/>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0, border: `1px solid ${COLORS.border}` }}>
          {PLAYER_RANGES.map((r, i) => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: '8px 12px', fontFamily: "'Geist', sans-serif", fontSize: 10, letterSpacing: '0.14em',
              background: range === r ? COLORS.ink : COLORS.paper, color: range === r ? COLORS.chalk : COLORS.ink,
              border: 'none',
              borderRight: i < PLAYER_RANGES.length - 1 ? `1px solid ${COLORS.border}` : 'none',
              cursor: 'pointer', textTransform: 'uppercase',
            }}>{r}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: '14px 26px 22px' }}>
        <AreaChart data={values} w={1080} h={220}/>
      </div>
    </div>
  );
}

function NotableSales({ playerId }) {
  const { api, notableSales: globalSales } = useApp();
  const [sales, setSales] = useState([]);
  useEffect(() => {
    let cancelled = false;
    if (playerId) {
      api.playerNotableSales(playerId)
        .then(({ sales: list }) => { if (!cancelled) setSales(list || []); })
        .catch(() => { if (!cancelled) setSales([]); });
    } else {
      setSales(globalSales || []);
    }
    return () => { cancelled = true; };
  }, [api, playerId, globalSales]);
  const display = (sales.length ? sales : globalSales || []).slice(0, 4);
  if (!display.length) return null;
  return (
    <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, padding: '20px 24px' }}>
      <Eyebrow>Notable sales</Eyebrow>
      <div style={{ marginTop: 14 }}>
        {display.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: i < display.length - 1 ? `1px solid ${COLORS.borderFaint}` : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: COLORS.ink, fontWeight: 500 }}>{s.title}</div>
              <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 4 }}>{s.house} · {s.date}</Eyebrow>
            </div>
            <Num size={16} weight={500}>{s.price >= 1000000 ? `$${(s.price / 1000000).toFixed(2)}M` : `$${(s.price || 0).toLocaleString()}`}</Num>
          </div>
        ))}
      </div>
    </div>
  );
}

function YourPieces({ player, onItem, onAdd }) {
  const { items } = useApp();
  const owned = (items || []).filter((i) => i.player === player.id);
  if (!owned.length) {
    return (
      <div style={{ background: COLORS.paper, border: `1px dashed ${COLORS.inkSubtle}`, padding: '32px 24px', textAlign: 'center' }}>
        <Eyebrow>Your exposure</Eyebrow>
        <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 18, fontWeight: 500, marginTop: 10, color: COLORS.ink }}>No {player.name} pieces in your collection yet.</div>
        <div style={{ fontSize: 13, color: COLORS.inkMuted, marginTop: 8 }}>Add one and Stitched will track exposure for you.</div>
        <Button variant="secondary" size="sm" style={{ marginTop: 14 }} onClick={onAdd}>Add a piece →</Button>
      </div>
    );
  }
  return (
    <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}` }}>
      <div style={{ padding: '16px 22px', borderBottom: `1px solid ${COLORS.borderFaint}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Eyebrow>YOUR EXPOSURE · {owned.length} {owned.length === 1 ? 'PIECE' : 'PIECES'}</Eyebrow>
        <Eyebrow color={COLORS.inkFaint}>VALUE · ${owned.reduce((s, i) => s + (i.estimate?.mid || 0), 0).toLocaleString()}</Eyebrow>
      </div>
      {owned.map((it, i) => (
        <button key={it.id} onClick={() => onItem(it.id)} style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '16px 22px', width: '100%',
          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
          borderBottom: i < owned.length - 1 ? `1px solid ${COLORS.borderFaint}` : 'none',
        }}>
          <div style={{ width: 56, height: 56, background: `linear-gradient(155deg, ${it.tint}, ${COLORS.leatherDeep})`, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 4, border: '1px solid rgba(250,250,245,0.18)' }}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.ink, letterSpacing: '-0.005em' }}>{it.title}</div>
            <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 4 }}>{it.usage || it.type} · {it.season}</Eyebrow>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Num size={15} weight={500}>${(it.estimate?.mid || 0).toLocaleString()}</Num>
            {it.acquired ? (
              <div style={{ marginTop: 3 }}><Delta pct={(((it.estimate?.mid || 0) - it.acquired) / it.acquired) * 100} size={11}/></div>
            ) : null}
          </div>
        </button>
      ))}
    </div>
  );
}

function RelatedPlayers({ player, onPlayer }) {
  const { api } = useApp();
  const [related, setRelated] = useState([]);
  useEffect(() => {
    let cancelled = false;
    api.relatedPlayers(player.id)
      .then(({ players: list }) => { if (!cancelled) setRelated(list || []); })
      .catch(() => { if (!cancelled) setRelated([]); });
    return () => { cancelled = true; };
  }, [api, player.id]);
  const display = (related.length ? related : PLAYERS.filter((p) => p.sport === player.sport && p.id !== player.id)).slice(0, 4);
  if (!display.length) return null;
  return (
    <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, padding: '20px 24px' }}>
      <Eyebrow style={{ marginBottom: 14 }}>RELATED PLAYERS · {player.sport}</Eyebrow>
      {display.map((p, i) => (
        <button key={p.id} onClick={() => onPlayer(p.id)} style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', width: '100%',
          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
          borderBottom: i < display.length - 1 ? `1px solid ${COLORS.borderFaint}` : 'none',
        }}>
          <Avatar initials={p.initials} size={32} color={p.color}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.ink }}>{p.name}</div>
            <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 4 }}>{p.team}</Eyebrow>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Num size={13} weight={500}>{Number(p.index || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Num>
            <div style={{ marginTop: 3 }}><Delta pct={p.d30} size={11}/></div>
          </div>
        </button>
      ))}
    </div>
  );
}

export function PlayerScreen({ id, onItem, onPlayer, onBack }) {
  const { api, follows, watchlist, refreshFollows, refreshWatchlist, user, openAuth } = useApp();
  const [livePlayer, setLivePlayer] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.getPlayer(id)
      .then(({ player }) => { if (!cancelled) setLivePlayer(player); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [api, id]);

  const player = livePlayer || findPlayer(id);
  const followed = follows?.players?.has?.(player.id) || false;
  const watching = (watchlist || []).some((w) => w.targetType === 'player' && w.targetId === player.id);
  const watchEntry = (watchlist || []).find((w) => w.targetType === 'player' && w.targetId === player.id);

  const handleFollow = async () => {
    if (!user) { openAuth('signin'); return; }
    setBusy(true);
    try {
      if (followed) {
        await api.unfollow('player', player.id);
      } else {
        await api.follow('player', player.id);
      }
      refreshFollows();
    } catch {
      // Follow state self-corrects on next refresh.
    } finally { setBusy(false); }
  };

  const handleWatchlist = async () => {
    if (!user) { openAuth('signin'); return; }
    setBusy(true);
    try {
      if (watching && watchEntry) {
        await api.removeWatchlist(watchEntry.id);
      } else {
        await api.addWatchlist({ targetType: 'player', targetId: player.id, label: player.name, alertPct: 5, alertFreq: 'daily', channels: ['push'] });
      }
      refreshWatchlist();
    } catch {
      // Watchlist state self-corrects on next refresh.
    } finally { setBusy(false); }
  };

  return (
    <>
      {onBack && (
        <div style={{ padding: '36px 56px 0' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: COLORS.inkMuted, fontSize: 14, display: 'inline-flex',
              alignItems: 'center', gap: 8, padding: 0,
            }}
          >
            <i className="iconoir-arrow-left" style={{ fontSize: 14 }}/> All players
          </button>
        </div>
      )}
      <PlayerHeader
        player={player}
        followed={followed}
        watching={watching}
        busy={busy}
        onFollow={handleFollow}
        onWatchlist={handleWatchlist}
      />
      <div style={{ padding: '48px 56px 96px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <PlayerChart player={player}/>
          <div>
            <SectionHeading title="Recent auction comps" meta={player.name}/>
            <CompsTable playerId={player.id}/>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <YourPieces player={player} onItem={onItem}/>
          <NotableSales playerId={player.id}/>
          <RelatedPlayers player={player} onPlayer={onPlayer}/>
        </div>
      </div>
    </>
  );
}
