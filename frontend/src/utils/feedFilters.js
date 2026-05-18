import { SPORT_FILTERS, findItem, findPlayer } from '../data/mocks';

export const FEED_POST_TYPES = [
  { id: 'all', label: 'All posts' },
  { id: 'added', label: 'Added' },
  { id: 'listed', label: 'For sale' },
  { id: 'sold', label: 'Sold' },
  { id: 'updated', label: 'Updated' },
  { id: 'mover', label: 'Index movers' },
  { id: 'auction', label: 'Notable sales' },
  { id: 'comp', label: 'New comps' },
];

export const FEED_SPORTS = SPORT_FILTERS;

export const FEED_ITEM_TYPES = [
  'All', 'Bat', 'Jersey', 'Helmet', 'Cleats', 'Sneakers', 'Baseball', 'Football', 'Puck', 'Batting Gloves', 'Card',
];

export function normalizeFeedKind(kind) {
  if (kind === 'player.mover') return 'mover';
  return kind || '';
}

export function resolveFeedPlayer(event) {
  if (event.player) return event.player;
  const playerId = event.payload?.player
    || (event.subjectType === 'player' ? event.subjectId : null);
  return playerId ? findPlayer(playerId) : null;
}

export function getEventFilterMeta(event) {
  const kind = normalizeFeedKind(event.kind);
  const item = event.item || (event.subjectType === 'item' && event.subjectId ? findItem(event.subjectId) : null);
  const player = item ? findPlayer(item.player) : resolveFeedPlayer(event);
  const actor = event.actorUser;
  const owner = item?.ownerUser;

  const searchParts = [
    event.payload?.title,
    event.payload?.detail,
    item?.title,
    item?.type,
    item?.sport,
    item?.team,
    player?.name,
    player?.sport,
    actor?.displayName,
    owner?.displayName,
    actor?.handle,
    owner?.handle,
  ];

  return {
    kind,
    playerId: player?.id || item?.player || event.payload?.player || null,
    sport: (player?.sport || item?.sport || '').toUpperCase(),
    itemType: item?.type || '',
    searchText: searchParts.filter(Boolean).join(' ').toLowerCase(),
  };
}

export function filterFeedEvents(events, { query = '', postType = 'all', sport = 'All', itemType = 'All', playerId = 'All' } = {}) {
  const q = query.trim().toLowerCase();
  return (events || []).filter((event) => {
    const meta = getEventFilterMeta(event);
    if (postType !== 'all' && meta.kind !== postType) return false;
    if (sport !== 'All' && meta.sport !== sport) return false;
    if (playerId !== 'All' && meta.playerId !== playerId) return false;
    if (itemType !== 'All') {
      if (!meta.itemType || meta.itemType !== itemType) return false;
    }
    if (q && !meta.searchText.includes(q)) return false;
    return true;
  });
}

export function feedHasActiveFilters(filters) {
  return Boolean(
    filters.query?.trim()
    || (filters.postType && filters.postType !== 'all')
    || (filters.sport && filters.sport !== 'All')
    || (filters.itemType && filters.itemType !== 'All')
    || (filters.playerId && filters.playerId !== 'All'),
  );
}
