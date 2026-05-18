// Low-level fetch wrapper. Most callers should use `makeApiClient()` below;
// it's exported for the one-off auth endpoints (register/login) where we need
// to inspect the response shape before pushing a token into storage.
export async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }
  return data;
}

export async function apiUpload(path, { token, formData } = {}) {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Upload failed.');
  }
  return data;
}

// Typed-ish client over apiRequest. Every screen goes through `useApp().api` so
// the bearer token threads automatically.
export function makeApiClient(token) {
  const call = (path, opts = {}) => apiRequest(path, { ...opts, token });
  return {
    call,
    me: () => call('/api/current-user'),
    updateMe: (body) => call('/api/me', { method: 'PATCH', body }),
    stats: () => call('/api/stats'),
    listItems: () => call('/api/items'),
    uploadImages: (files) => {
      const formData = new FormData();
      for (const file of files) formData.append('files', file);
      return apiUpload('/api/uploads', { token, formData });
    },
    createItem: (body) => call('/api/items', { method: 'POST', body }),
    getItem: (id) => call(`/api/items/${encodeURIComponent(id)}`),
    estimateItem: (body) => call('/api/items/estimate', { method: 'POST', body }),
    updateItem: (id, body) => call(`/api/items/${id}`, { method: 'PATCH', body }),
    deleteItem: (id) => call(`/api/items/${id}`, { method: 'DELETE' }),
    revalueItem: (id) => call(`/api/items/${id}/revalue`, { method: 'POST' }),
    listForSale: (id, body) => call(`/api/items/${id}/list`, { method: 'POST', body }),
    unlist: (id) => call(`/api/items/${id}/unlist`, { method: 'POST' }),
    sellItem: (id, body) => call(`/api/items/${id}/sell`, { method: 'POST', body }),
    listPlayers: (sport) => call(`/api/players${sport ? `?sport=${encodeURIComponent(sport)}` : ''}`),
    getPlayer: (id) => call(`/api/players/${id}`),
    playerIndex: (id, range = '365d') => call(`/api/players/${id}/index?range=${range}`),
    playerNotableSales: (id) => call(`/api/players/${id}/notable-sales`),
    relatedPlayers: (id) => call(`/api/players/${id}/related`),
    listComps: ({ player, type, sport, source, usedOnly, q, limit = 50 } = {}) => {
      const params = new URLSearchParams();
      if (player && player !== 'All') params.set('player', player);
      if (type && type !== 'All') params.set('type', type);
      if (sport && sport !== 'All') params.set('sport', sport);
      if (source && source !== 'All') params.set('source', source);
      if (usedOnly) params.set('usedOnly', 'true');
      if (q) params.set('q', q);
      params.set('limit', String(limit));
      return call(`/api/comps?${params.toString()}`);
    },
    marketTicker: () => call('/api/market/ticker'),
    notableSales: () => call('/api/market/notable-sales'),
    follow: (targetType, targetId) => call('/api/follows', { method: 'POST', body: { targetType, targetId } }),
    unfollow: (targetType, targetId) => call(`/api/follows/${targetType}/${encodeURIComponent(targetId)}`, { method: 'DELETE' }),
    myFollows: (type) => call(`/api/me/follows${type ? `?type=${type}` : ''}`),
    userFollowers: (handle) => call(`/api/users/${handle}/followers`),
    userFollowing: (handle) => call(`/api/users/${handle}/following`),
    like: (targetType, targetId) => call('/api/likes', { method: 'POST', body: { targetType, targetId } }),
    unlike: (targetType, targetId) => call(`/api/likes/${targetType}/${encodeURIComponent(targetId)}`, { method: 'DELETE' }),
    listComments: (targetType, targetId) => call(`/api/${targetType}/${targetId}/comments`),
    postComment: (targetType, targetId, body) => call(`/api/${targetType}/${targetId}/comments`, { method: 'POST', body: { body } }),
    feed: () => call('/api/feed'),
    watchlist: () => call('/api/watchlist'),
    addWatchlist: (body) => call('/api/watchlist', { method: 'POST', body }),
    updateWatchlist: (id, body) => call(`/api/watchlist/${id}`, { method: 'PATCH', body }),
    removeWatchlist: (id) => call(`/api/watchlist/${id}`, { method: 'DELETE' }),
    savedSearches: () => call('/api/saved-searches'),
    saveSearch: (body) => call('/api/saved-searches', { method: 'POST', body }),
    deleteSavedSearch: (id) => call(`/api/saved-searches/${id}`, { method: 'DELETE' }),
    search: (q) => call(`/api/search?q=${encodeURIComponent(q)}`),
    notifications: () => call('/api/notifications'),
    markNotificationsRead: (ids) => call('/api/notifications/mark-read', { method: 'POST', body: { ids } }),
    profile: (handle) => call(`/api/profiles/${handle}`),
    collectionSummary: () => call('/api/me/collection/summary'),
  };
}
