import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiRequest, apiUpload, makeApiClient } from './client';

// Lightweight `fetch` mock used by every test. Returns a 200 JSON response by
// default; tests override `.mockResolvedValueOnce()` to simulate error cases.
function jsonResponse(body, { status = 200, ok = status >= 200 && status < 300 } = {}) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

let fetchMock;
const ORIGINAL_FETCH = global.fetch;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
  global.fetch = fetchMock;
});

afterEach(() => {
  global.fetch = ORIGINAL_FETCH;
});

function lastCall() {
  expect(fetchMock).toHaveBeenCalledTimes(1);
  return fetchMock.mock.calls[0];
}

describe('apiRequest', () => {
  it('issues a GET by default and does not set Content-Type without a body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    const result = await apiRequest('/api/example');
    expect(result).toEqual({ ok: true });
    const [url, init] = lastCall();
    expect(url).toBe('/api/example');
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
    expect(init.headers['Content-Type']).toBeUndefined();
  });

  it('serialises a JSON body and sets Content-Type', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'x' }));
    await apiRequest('/api/items', { method: 'POST', body: { title: 'Hi' } });
    const [, init] = lastCall();
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({ title: 'Hi' });
  });

  it('threads the bearer token when provided', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await apiRequest('/api/me', { token: 'tok-123' });
    const [, init] = lastCall();
    expect(init.headers.Authorization).toBe('Bearer tok-123');
  });

  it('throws with the server-provided error message on a non-2xx response', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: 'Boom!' }, { status: 400 })
    );
    await expect(apiRequest('/api/items', { method: 'POST', body: {} })).rejects.toThrow(
      'Boom!'
    );
  });

  it('falls back to a generic error when the body is not JSON', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json');
      },
    });
    await expect(apiRequest('/api/x')).rejects.toThrow('Request failed.');
  });
});

describe('makeApiClient', () => {
  it('auto-injects the bearer token into every call', async () => {
    const api = makeApiClient('session-token');
    fetchMock.mockResolvedValueOnce(jsonResponse({ user: { id: 'u1' } }));
    await api.me();
    const [url, init] = lastCall();
    expect(url).toBe('/api/current-user');
    expect(init.headers.Authorization).toBe('Bearer session-token');
  });

  it('uploadImages sends multipart form data with auth', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ urls: ['/api/uploads/abc.png'] }));
    const api = makeApiClient('upload-token');
    const file = new File(['pixels'], 'bat.png', { type: 'image/png' });
    const result = await api.uploadImages([file]);
    expect(result.urls).toEqual(['/api/uploads/abc.png']);
    const [url, init] = lastCall();
    expect(url).toBe('/api/uploads');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer upload-token');
    expect(init.headers['Content-Type']).toBeUndefined();
    expect(init.body).toBeInstanceOf(FormData);
  });

  it('omits the Authorization header when no token is supplied', async () => {
    const api = makeApiClient(null);
    await api.listPlayers();
    const [, init] = lastCall();
    expect(init.headers.Authorization).toBeUndefined();
  });

  it.each([
    ['createItem', ['/api/items', 'POST'], (api) => api.createItem({ title: 'T' })],
    ['updateItem', ['/api/items/abc', 'PATCH'], (api) => api.updateItem('abc', { title: 'T' })],
    ['deleteItem', ['/api/items/abc', 'DELETE'], (api) => api.deleteItem('abc')],
    ['revalueItem', ['/api/items/abc/revalue', 'POST'], (api) => api.revalueItem('abc')],
    ['listForSale', ['/api/items/abc/list', 'POST'], (api) => api.listForSale('abc', { asking: 100 })],
    ['unlist', ['/api/items/abc/unlist', 'POST'], (api) => api.unlist('abc')],
    ['sellItem', ['/api/items/abc/sell', 'POST'], (api) => api.sellItem('abc', { soldPrice: 500 })],
    ['follow', ['/api/follows', 'POST'], (api) => api.follow('player', 'corbin-carroll')],
    ['unfollow', ['/api/follows/player/corbin-carroll', 'DELETE'], (api) => api.unfollow('player', 'corbin-carroll')],
    ['like', ['/api/likes', 'POST'], (api) => api.like('item', 'i1')],
    ['unlike', ['/api/likes/item/i1', 'DELETE'], (api) => api.unlike('item', 'i1')],
    ['postComment', ['/api/item/i1/comments', 'POST'], (api) => api.postComment('item', 'i1', 'Nice')],
    ['addWatchlist', ['/api/watchlist', 'POST'], (api) => api.addWatchlist({ targetType: 'player', targetId: 'x' })],
    ['updateWatchlist', ['/api/watchlist/12', 'PATCH'], (api) => api.updateWatchlist(12, { alertFreq: 'daily' })],
    ['removeWatchlist', ['/api/watchlist/12', 'DELETE'], (api) => api.removeWatchlist(12)],
    ['saveSearch', ['/api/saved-searches', 'POST'], (api) => api.saveSearch({ name: 'x' })],
    ['deleteSavedSearch', ['/api/saved-searches/3', 'DELETE'], (api) => api.deleteSavedSearch(3)],
    ['markNotificationsRead', ['/api/notifications/mark-read', 'POST'], (api) => api.markNotificationsRead()],
    ['updateMe', ['/api/me', 'PATCH'], (api) => api.updateMe({ bio: 'hi' })],
  ])('%s issues the expected request', async (_label, [expectedUrl, expectedMethod], invoke) => {
    const api = makeApiClient('tok');
    await invoke(api);
    const [url, init] = lastCall();
    expect(url).toBe(expectedUrl);
    expect(init.method).toBe(expectedMethod);
  });

  it.each([
    ['marketTicker', '/api/market/ticker', (api) => api.marketTicker()],
    ['notableSales', '/api/market/notable-sales', (api) => api.notableSales()],
    ['feed', '/api/feed', (api) => api.feed()],
    ['notifications', '/api/notifications', (api) => api.notifications()],
    ['watchlist', '/api/watchlist', (api) => api.watchlist()],
    ['savedSearches', '/api/saved-searches', (api) => api.savedSearches()],
    ['collectionSummary', '/api/me/collection/summary', (api) => api.collectionSummary()],
    ['stats', '/api/stats', (api) => api.stats()],
  ])('%s issues a GET to %s', async (_label, expectedUrl, invoke) => {
    const api = makeApiClient('tok');
    await invoke(api);
    const [url, init] = lastCall();
    expect(url).toBe(expectedUrl);
    expect(init.method).toBe('GET');
  });

  it('encodes path parameters', async () => {
    const api = makeApiClient('tok');
    await api.unfollow('user', 'name with space');
    const [url] = lastCall();
    expect(url).toBe('/api/follows/user/name%20with%20space');
  });

  it('serialises body payloads for POST helpers', async () => {
    const api = makeApiClient('tok');
    await api.like('item', 'item-123');
    const [, init] = lastCall();
    expect(JSON.parse(init.body)).toEqual({ targetType: 'item', targetId: 'item-123' });
  });

  it('listPlayers builds a sport query param when provided', async () => {
    const api = makeApiClient(null);
    await api.listPlayers('NBA');
    const [url] = lastCall();
    expect(url).toBe('/api/players?sport=NBA');
  });

  it('listComps builds composite query params', async () => {
    const api = makeApiClient(null);
    await api.listComps({
      player: 'corbin-carroll',
      type: 'Bat',
      sport: 'MLB',
      source: 'Goldin',
      usedOnly: true,
      q: 'rookie',
      limit: 5,
    });
    const [url] = lastCall();
    expect(url).toContain('/api/comps?');
    expect(url).toContain('player=corbin-carroll');
    expect(url).toContain('type=Bat');
    expect(url).toContain('sport=MLB');
    expect(url).toContain('source=Goldin');
    expect(url).toContain('usedOnly=true');
    expect(url).toContain('q=rookie');
    expect(url).toContain('limit=5');
  });

  it('playerIndex defaults to a 365d range', async () => {
    const api = makeApiClient(null);
    await api.playerIndex('corbin-carroll');
    const [url] = lastCall();
    expect(url).toBe('/api/players/corbin-carroll/index?range=365d');
  });

  it('search encodes the query string', async () => {
    const api = makeApiClient(null);
    await api.search('a b & c');
    const [url] = lastCall();
    expect(url).toBe('/api/search?q=a%20b%20%26%20c');
  });
});
