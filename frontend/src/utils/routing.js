export const DEFAULT_ITEM_ID = 'carroll-bat-2023';
export const DEFAULT_PLAYER_ID = 'corbin-carroll';

export function parsePath(pathname) {
  const path = (pathname || '/').replace(/\/$/, '') || '/';
  if (path === '/' || path === '/landing') return { route: 'landing' };
  if (path === '/home' || path === '/feed') return { route: 'feed' };
  if (path === '/collection') return { route: 'collection' };
  if (path === '/comps') return { route: 'comps' };
  const profileMatch = path.match(/^\/profile(?:\/([^/]+))?$/);
  if (profileMatch) {
    const profileHandle = profileMatch[1] ? decodeURIComponent(profileMatch[1]) : undefined;
    return { route: 'profile', profileHandle };
  }
  if (path === '/search') return { route: 'search' };
  if (path === '/watchlist') return { route: 'watchlist' };
  if (path === '/mobile') return { route: 'mobile' };
  if (path === '/players') return { route: 'players' };
  const itemMatch = path.match(/^\/item\/([^/]+)$/);
  if (itemMatch) return { route: 'item', itemId: decodeURIComponent(itemMatch[1]) };
  const playerMatch = path.match(/^\/player\/([^/]+)$/);
  if (playerMatch) return { route: 'player', playerId: decodeURIComponent(playerMatch[1]) };
  return { route: 'feed' };
}

export function buildPath(route, { itemId = DEFAULT_ITEM_ID, playerId = DEFAULT_PLAYER_ID, profileHandle } = {}) {
  switch (route) {
    case 'landing': return '/';
    case 'feed': return '/home';
    case 'collection': return '/collection';
    case 'comps': return '/comps';
    case 'profile':
      return profileHandle ? `/profile/${encodeURIComponent(profileHandle)}` : '/profile';
    case 'search': return '/search';
    case 'watchlist': return '/watchlist';
    case 'mobile': return '/mobile';
    case 'players': return '/players';
    case 'item': return `/item/${encodeURIComponent(itemId)}`;
    case 'player': return `/player/${encodeURIComponent(playerId)}`;
    default: return '/home';
  }
}
