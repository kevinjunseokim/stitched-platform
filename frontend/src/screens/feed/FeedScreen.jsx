// Stitched — Home feed (Strava-style) with right sidebar.

import { useEffect, useMemo, useState } from 'react';

import { Avatar, Badge, Button, Delta, Eyebrow, Num } from '../../components/atoms';
import { Card, FilterDropdown, ItemImage, Pill } from '../../components/primitives';
import { useApp } from '../../context/AppDataContext';
import { MARKET_TICKER_ITEMS, PLAYERS, findItem, findPlayer } from '../../data/mocks';
import { COLORS } from '../../theme/tokens';
import { formatRelative } from '../../utils/format';
import { itemEstimateMid } from '../../utils/collectionTotals';
import {
  FEED_ITEM_TYPES,
  FEED_POST_TYPES,
  FEED_SPORTS,
  feedHasActiveFilters,
  filterFeedEvents,
} from '../../utils/feedFilters';

function FeedCardChrome({ event, user, initials, color, ago, action, kind, children }) {
  const { api, user: currentUser, openAuth, refreshFeed } = useApp();
  const [liked, setLiked] = useState(!!event?.liked);
  const [likeCount, setLikeCount] = useState(event?.likes ?? 0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentCount, setCommentCount] = useState(event?.comments ?? 0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLiked(!!event?.liked);
    setLikeCount(event?.likes ?? 0);
    setCommentCount(event?.comments ?? 0);
  }, [event?.id, event?.liked, event?.likes, event?.comments]);

  const toggleLike = async () => {
    if (!currentUser) { openAuth('signin'); return; }
    if (!event?.id) return;
    setBusy(true);
    try {
      if (liked) {
        await api.unlike('event', event.id);
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        await api.like('event', event.id);
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    } catch {
      // Optimistic toggle reverted on next refresh.
    } finally { setBusy(false); }
  };

  const openComments = async () => {
    setCommentsOpen((open) => !open);
    if (!commentsOpen && event?.id) {
      try {
        const { comments: list } = await api.listComments('event', event.id);
        setComments(list);
      } catch {
        // Empty comments fall back to the "no comments yet" copy.
      }
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!currentUser) { openAuth('signin'); return; }
    const body = commentDraft.trim();
    if (!body || !event?.id) return;
    try {
      const { comment } = await api.postComment('event', event.id, body);
      setComments((prev) => [...prev, comment]);
      setCommentCount((c) => c + 1);
      setCommentDraft('');
      refreshFeed();
    } catch {
      // Surface this through a toast in a future iteration.
    }
  };

  return (
    <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, marginBottom: 28 }}>
      <div style={{ padding: '24px 32px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar initials={initials} size={40} color={color}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, color: COLORS.ink, lineHeight: 1.45, letterSpacing: '-0.005em' }}>{action}</div>
          <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 6 }}>{user} · {ago} ago</Eyebrow>
        </div>
        {kind && <Badge kind={kind.kind}>{kind.label}</Badge>}
      </div>
      {children}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 32px 22px' }}>
        <button type="button" onClick={toggleLike} disabled={busy} style={{
          background: 'transparent', border: 'none', cursor: busy ? 'wait' : 'pointer', padding: '6px 0',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          color: liked ? COLORS.clay : COLORS.inkMuted, fontSize: 13, fontFamily: "'Geist', sans-serif", marginRight: 24,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          {likeCount}
        </button>
        <button type="button" onClick={openComments} style={{
          background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 0',
          display: 'inline-flex', alignItems: 'center', gap: 8, color: COLORS.inkMuted,
          fontSize: 13, fontFamily: "'Geist', sans-serif", marginRight: 24,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          {commentCount}
        </button>
      </div>
      {commentsOpen && (
        <div style={{ borderTop: `1px solid ${COLORS.borderFaint}`, padding: '18px 32px 22px', background: COLORS.paperSunken }}>
          {comments.length === 0 && (
            <Eyebrow color={COLORS.inkFaint}>No comments yet · be the first</Eyebrow>
          )}
          {comments.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
              <Avatar initials={c.author?.initials || 'U'} size={28}/>
              <div style={{ flex: 1 }}>
                <Eyebrow>{c.author?.displayName || 'Collector'}</Eyebrow>
                <div style={{ fontSize: 13, color: COLORS.ink, marginTop: 4 }}>{c.body}</div>
              </div>
            </div>
          ))}
          <form onSubmit={submitComment} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Add a comment…"
              style={{
                flex: 1, fontFamily: "'Geist', sans-serif", fontSize: 13,
                padding: '8px 10px', background: COLORS.paper, border: `1px solid ${COLORS.border}`, color: COLORS.ink,
              }}/>
            <Button variant="primary" size="sm">Post</Button>
          </form>
        </div>
      )}
    </div>
  );
}

function eventPlayer(event) {
  if (event.player) return event.player;
  const playerId = event.payload?.player || event.subjectId;
  return playerId ? findPlayer(playerId) : null;
}

function actorMeta(event) {
  const actor = event.actorUser;
  const displayName = actor?.displayName || (event.actorUserId ? 'Collector' : 'Stitched');
  const initials = actor?.initials || displayName.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
  const color = actor?.color || COLORS.field;
  return { displayName, initials, color };
}

function FeedMoverEventCard({ event, onPlayer }) {
  const player = eventPlayer(event);
  const pct = event.payload?.pct ?? 0;
  const { displayName, initials, color } = actorMeta(event);
  return (
    <FeedCardChrome
      event={event}
      user={displayName}
      initials={initials}
      color={color}
      ago={formatRelative(event.createdAt)}
      kind={{ kind: 'field', label: 'INDEX MOVER' }}
      action={<><b>{player?.name || 'Player index'}</b> moved <Delta pct={pct} size={15}/> this week.</>}>
      <div style={{ padding: '8px 32px 24px' }}>
        {player && (
          <button onClick={() => onPlayer && onPlayer(player.id)} style={{
            background: COLORS.paperSunken, border: `1px solid ${COLORS.border}`, padding: '18px 22px',
            width: '100%', cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Eyebrow>{player.sport}</Eyebrow>
                <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 20, fontWeight: 500, marginTop: 8 }}>{player.name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Num size={22} weight={500}>{Number(player.index || 0).toLocaleString()}</Num>
                <div style={{ marginTop: 6 }}><Delta pct={player.d30 ?? pct} size={13}/></div>
              </div>
            </div>
          </button>
        )}
      </div>
    </FeedCardChrome>
  );
}

function FeedAuctionEventCard({ event, onPlayer }) {
  const player = eventPlayer(event);
  const payload = event.payload || {};
  const { displayName, initials, color } = actorMeta(event);
  return (
    <FeedCardChrome
      event={event}
      user={displayName}
      initials={initials}
      color={color}
      ago={formatRelative(event.createdAt)}
      kind={{ kind: 'hot', label: 'NOTABLE SALE' }}
      action={<><b>{player?.name || 'Market'}</b> piece hammered at <b>{payload.price || '—'}</b> on {payload.auctionHouse || 'auction'}.</>}>
      <div style={{ padding: '8px 32px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, color: COLORS.inkMuted }}>{payload.auctionHouse || 'Auction house'}</div>
        {payload.delta != null && <Delta pct={payload.delta} size={14}/>}
        {player && (
          <button onClick={() => onPlayer && onPlayer(player.id)} style={{
            marginLeft: 16, background: 'transparent', border: `1px solid ${COLORS.border}`,
            padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontFamily: "'Geist', sans-serif",
          }}>View index →</button>
        )}
      </div>
    </FeedCardChrome>
  );
}

function FeedCompEventCard({ event }) {
  const payload = event.payload || {};
  const { displayName, initials, color } = actorMeta(event);
  return (
    <FeedCardChrome
      event={event}
      user={displayName}
      initials={initials}
      color={color}
      ago={formatRelative(event.createdAt)}
      kind={{ kind: 'default', label: 'NEW COMPS' }}
      action={<>{payload.count || 'New'} auction comp{(payload.count || 0) === 1 ? '' : 's'} matched players you follow.</>}>
      <div style={{ padding: '8px 32px 24px', fontSize: 15, color: COLORS.ink }}>
        {payload.detail || 'Fresh comps are available in player indexes.'}
      </div>
    </FeedCardChrome>
  );
}

function FeedEventCard({ event, onItem, onPlayer, onProfile }) {
  const kind = event.kind;
  if (kind === 'mover' || kind === 'player.mover') {
    return <FeedMoverEventCard event={event} onPlayer={onPlayer}/>;
  }
  if (kind === 'auction') {
    return <FeedAuctionEventCard event={event} onPlayer={onPlayer}/>;
  }
  if (kind === 'comp') {
    return <FeedCompEventCard event={event}/>;
  }
  return <FeedItemEventCard event={event} onItem={onItem} onPlayer={onPlayer} onProfile={onProfile}/>;
}

function FeedItemEventCard({ event, onItem, onPlayer, onProfile }) {
  const item = event.item || (event.subjectId ? findItem(event.subjectId) : null);
  const player = item ? findPlayer(item.player) : null;
  const ownerUser = item?.ownerUser || event.actorUser;
  const actor = event.actorUser || ownerUser;
  const displayName = actor?.displayName || ownerUser?.displayName || 'Collector';
  const initials = actor?.initials || ownerUser?.initials || displayName.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
  const verb = event.kind === 'updated' ? 'updated a piece' : event.kind === 'listed' ? 'listed a piece for sale' : event.kind === 'sold' ? 'sold a piece' : 'added a piece to the collection';
  const kindLabel = { added: '+ ADDED', listed: 'FOR SALE', sold: 'SOLD', updated: 'UPDATED' }[event.kind] || event.kind?.toUpperCase();
  const badgeKind = { added: 'field', listed: 'pending', sold: 'pending', updated: 'default' }[event.kind] || 'default';
  const estimate = item ? itemEstimateMid(item) : 0;
  return (
    <FeedCardChrome
      event={event}
      user={displayName}
      initials={initials} color={COLORS.leather} ago={formatRelative(event.createdAt)}
      kind={kindLabel ? { kind: badgeKind, label: kindLabel } : null}
      action={(
        <>
          <b
            role="link"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); ownerUser?.handle && onProfile?.(ownerUser.handle); }}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && ownerUser?.handle) {
                e.preventDefault();
                e.stopPropagation();
                onProfile?.(ownerUser.handle);
              }
            }}
            style={{ cursor: ownerUser?.handle ? 'pointer' : 'default' }}
          >{displayName}</b> {verb}.
        </>
      )}>
      {item && (
        <>
          <div onClick={() => onItem && onItem(item.id)} style={{ cursor: 'pointer' }}>
            <ItemImage tint={item.tint} height={260} glyph={item.glyph}
              badges={item.badges} eyebrow={`${item.usage || ''}${item.season ? ` · ${item.season}` : ''}`}
              mono={item.cert}/>
          </div>
          <div style={{ padding: '24px 32px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
              <div>
                <button onClick={() => onItem && onItem(item.id)} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 22, fontWeight: 500, color: COLORS.ink, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{item.title}</div>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
                  {player && (
                    <button onClick={() => onPlayer && onPlayer(item.player)} style={{
                      background: 'transparent', border: `1px solid ${COLORS.border}`, padding: '6px 12px',
                      fontFamily: "'Geist', sans-serif", fontSize: 12, fontWeight: 500,
                      color: COLORS.ink, cursor: 'pointer',
                    }}>{player.name}</button>
                  )}
                  {item.type && <Pill style={{ pointerEvents: 'none' }}>{item.type}</Pill>}
                  {item.sport && <Pill style={{ pointerEvents: 'none' }}>{item.sport}</Pill>}
                </div>
              </div>
              {estimate > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <Eyebrow>Est. value</Eyebrow>
                  <Num size={24} weight={500} style={{ display: 'block', marginTop: 8, letterSpacing: '-0.02em' }}>
                    ${estimate.toLocaleString()}
                  </Num>
                  {item.acquired ? (
                    <div style={{ marginTop: 6 }}><Delta pct={((estimate - item.acquired) / item.acquired) * 100}/></div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </FeedCardChrome>
  );
}

function FeedRightRail({ onPlayer }) {
  const { players, follows, ticker } = useApp();
  const followedIds = Array.from(follows.players || []);
  const list = (players && players.length ? players : PLAYERS);
  const followedPlayers = followedIds.length
    ? list.filter((p) => followedIds.includes(p.id))
    : list.slice(0, 5);
  const display = followedPlayers.length ? followedPlayers.slice(0, 5) : list.slice(0, 5);
  const tickerEntries = (ticker && ticker.length ? ticker : MARKET_TICKER_ITEMS).slice(0, 4);
  return (
    <aside style={{
      width: 340,
      borderLeft: `1px solid ${COLORS.border}`,
      background: COLORS.paper,
      flexShrink: 0,
      alignSelf: 'stretch',
    }}>
      <div style={{
        position: 'sticky',
        top: 64,
        padding: '40px 40px 64px',
        maxHeight: 'calc(100vh - 64px)',
        overflowY: 'auto',
      }}>
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <Eyebrow>Followed</Eyebrow>
          <Eyebrow color={COLORS.inkFaint}>{followedIds.length} players</Eyebrow>
        </div>
        {display.map((p) => (
          <button key={p.id} onClick={() => onPlayer && onPlayer(p.id)} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', width: '100%',
            background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
          }}>
            <Avatar initials={p.initials} size={36} color={p.color}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.ink, lineHeight: 1.2 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: COLORS.inkFaint, marginTop: 4 }}>{p.sport}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Num size={14} weight={500}>{Number(p.index || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Num>
              <div style={{ marginTop: 4 }}><Delta pct={p.d30} size={11}/></div>
            </div>
          </button>
        ))}
      </section>

      <section style={{ marginTop: 48 }}>
        <Eyebrow style={{ marginBottom: 20 }}>Market snapshot</Eyebrow>
        {tickerEntries.map((t, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 0',
          }}>
            <div style={{ fontSize: 14, color: COLORS.ink }}>{t.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Num size={13} weight={500}>{t.value}</Num>
              <Delta pct={t.pct} size={12}/>
            </div>
          </div>
        ))}
      </section>
      </div>
    </aside>
  );
}

function FeedFilters({
  query, setQuery, postType, setPostType, sport, setSport, itemType, setItemType,
  playerId, setPlayerId, players, resultCount, totalCount, onClear,
}) {
  const playerOptions = players?.length ? players : PLAYERS;
  const active = feedHasActiveFilters({ query, postType, sport, itemType, playerId });

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, padding: '16px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="iconoir-search" style={{ fontSize: 18, color: COLORS.inkSubtle, flexShrink: 0 }}/>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search feed by player, piece, collector…"
            aria-label="Search feed"
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontFamily: "'Geist', sans-serif", fontSize: 16, fontWeight: 500,
              color: COLORS.ink, letterSpacing: '-0.015em',
            }}
          />
          {query.trim() && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search" style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 14, color: COLORS.inkSubtle, padding: 4,
            }}>✕</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12, marginBottom: 12 }}>
        <FilterDropdown
          label="Post type"
          value={postType}
          onChange={setPostType}
          options={FEED_POST_TYPES.map((t) => ({ v: t.id, l: t.label }))}
        />

        <FilterDropdown
          label="Sport"
          value={sport}
          onChange={setSport}
          options={FEED_SPORTS.map((s) => ({ v: s, l: s === 'All' ? 'All sports' : s }))}
        />
        <FilterDropdown
          label="Item type"
          value={itemType}
          onChange={setItemType}
          options={FEED_ITEM_TYPES.map((t) => ({ v: t, l: t === 'All' ? 'All types' : t }))}
        />
        <FilterDropdown
          label="Player"
          value={playerId}
          onChange={setPlayerId}
          minWidth={180}
          options={[
            { v: 'All', l: 'All players' },
            ...playerOptions.map((p) => ({ v: p.id, l: p.name })),
          ]}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
        <Eyebrow color={COLORS.inkFaint}>
          {resultCount} of {totalCount} posts
        </Eyebrow>
        {active && (
          <button type="button" onClick={onClear} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: "'Geist', sans-serif", fontSize: 12, fontWeight: 500,
            color: COLORS.clay, letterSpacing: '0.04em', textDecoration: 'underline',
          }}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

function FeedFilteredEmpty() {
  return (
    <Card style={{ padding: '28px 32px', marginBottom: 28 }}>
      <Eyebrow>No matches</Eyebrow>
      <div style={{ fontSize: 15, color: COLORS.inkMuted, marginTop: 10, lineHeight: 1.5 }}>
        Nothing in your feed matches these filters. Try broadening post type, sport, or player.
      </div>
    </Card>
  );
}

function FeedEmptyState({ onAdd, hasFollows }) {
  return (
    <Card style={{ padding: '32px 36px' }}>
      <Eyebrow>Your feed is quiet</Eyebrow>
      <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 22, fontWeight: 500, letterSpacing: '-0.015em', margin: '12px 0 10px' }}>
        Activity from every collector on Stitched will show up here once pieces are added.
      </div>
      <div style={{ fontSize: 13, color: COLORS.inkMuted, lineHeight: 1.5, marginBottom: 18 }}>
        {hasFollows ? 'Add an item to join the feed, or run seed data to load demo collectors.' : 'Add an item or run `python seed.py` in the backend to load demo collectors and pieces.'}
      </div>
      <Button variant="primary" size="sm" onClick={onAdd}>Add an item →</Button>
    </Card>
  );
}

export function FeedScreen({ onItem, onPlayer, onProfile, onAdd }) {
  const { feed, refreshFeed, user, follows, players } = useApp();
  const [query, setQuery] = useState('');
  const [postType, setPostType] = useState('all');
  const [sport, setSport] = useState('All');
  const [itemType, setItemType] = useState('All');
  const [playerId, setPlayerId] = useState('All');

  useEffect(() => { refreshFeed(); }, [refreshFeed]);

  const filteredFeed = useMemo(
    () => filterFeedEvents(feed, { query, postType, sport, itemType, playerId }),
    [feed, query, postType, sport, itemType, playerId],
  );

  const clearFilters = () => {
    setQuery('');
    setPostType('all');
    setSport('All');
    setItemType('All');
    setPlayerId('All');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'stretch' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ padding: '40px 56px 80px', maxWidth: 840, margin: '0 auto' }}>
          {!user && (
            <Card style={{ padding: '24px 28px', marginBottom: 28 }}>
              <Eyebrow>Welcome</Eyebrow>
              <div style={{ fontSize: 15, color: COLORS.ink, marginTop: 8 }}>
                Sign in to see activity from collectors across Stitched — additions, sales, index movers, and notable auctions.
              </div>
            </Card>
          )}
          {feed.length > 0 && (
            <FeedFilters
              query={query}
              setQuery={setQuery}
              postType={postType}
              setPostType={setPostType}
              sport={sport}
              setSport={setSport}
              itemType={itemType}
              setItemType={setItemType}
              playerId={playerId}
              setPlayerId={setPlayerId}
              players={players}
              resultCount={filteredFeed.length}
              totalCount={feed.length}
              onClear={clearFilters}
            />
          )}
          {feed.length === 0 && user && (
            <FeedEmptyState onAdd={onAdd} hasFollows={follows.players.size > 0 || follows.users.size > 0}/>
          )}
          {feed.length > 0 && filteredFeed.length === 0 && <FeedFilteredEmpty/>}
          {filteredFeed.map((event) => (
            <FeedEventCard key={event.id} event={event} onItem={onItem} onPlayer={onPlayer} onProfile={onProfile}/>
          ))}
        </div>
      </div>
      <FeedRightRail onPlayer={onPlayer}/>
    </div>
  );
}
