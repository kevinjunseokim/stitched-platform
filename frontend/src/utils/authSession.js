/** Routes that require a verified logged-in session (not the landing/marketing shell). */
export const PROTECTED_ROUTES = new Set([
  'feed',
  'collection',
  'item',
  'players',
  'player',
  'search',
  'comps',
  'profile',
  'watchlist',
]);

export function requiresAuth(route) {
  return PROTECTED_ROUTES.has(route);
}

/** True when we have a bearer token and a hydrated user record from the API. */
export function isAuthenticated(auth) {
  return Boolean(auth?.access_token && auth?.user?.id);
}
