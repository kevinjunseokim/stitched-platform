import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ITEM_ID,
  DEFAULT_PLAYER_ID,
  buildPath,
  parsePath,
} from './routing';

describe('parsePath', () => {
  it.each([
    ['/', { route: 'landing' }],
    ['/landing', { route: 'landing' }],
    ['/home', { route: 'feed' }],
    ['/feed', { route: 'feed' }],
    ['/collection', { route: 'collection' }],
    ['/comps', { route: 'comps' }],
    ['/profile', { route: 'profile', profileHandle: undefined }],
    ['/search', { route: 'search' }],
    ['/watchlist', { route: 'watchlist' }],
    ['/mobile', { route: 'mobile' }],
  ])('parses simple route %s', (path, expected) => {
    expect(parsePath(path)).toEqual(expected);
  });

  it('parses the players index overview route', () => {
    expect(parsePath('/players')).toEqual({ route: 'players' });
  });

  it('parses an item detail route and decodes the id', () => {
    expect(parsePath('/item/wemby-jersey')).toEqual({
      route: 'item',
      itemId: 'wemby-jersey',
    });
    expect(parsePath('/item/has%20space')).toEqual({
      route: 'item',
      itemId: 'has space',
    });
  });

  it('parses a player route and decodes the id', () => {
    expect(parsePath('/player/corbin-carroll')).toEqual({
      route: 'player',
      playerId: 'corbin-carroll',
    });
  });

  it('parses a profile route with handle', () => {
    expect(parsePath('/profile/camille')).toEqual({
      route: 'profile',
      profileHandle: 'camille',
    });
  });

  it('strips a trailing slash', () => {
    expect(parsePath('/collection/')).toEqual({ route: 'collection' });
  });

  it('falls back to feed for unknown paths', () => {
    expect(parsePath('/this/route/does/not/exist')).toEqual({ route: 'feed' });
  });

  it('treats falsy input as the root path', () => {
    expect(parsePath(undefined)).toEqual({ route: 'landing' });
    expect(parsePath('')).toEqual({ route: 'landing' });
  });
});

describe('buildPath', () => {
  it.each([
    ['landing', '/'],
    ['feed', '/home'],
    ['collection', '/collection'],
    ['comps', '/comps'],
    ['profile', '/profile'],
    ['search', '/search'],
    ['watchlist', '/watchlist'],
    ['mobile', '/mobile'],
    ['players', '/players'],
  ])('builds %s', (route, expected) => {
    expect(buildPath(route)).toBe(expected);
  });

  it('builds the item route with the supplied id (encoded)', () => {
    expect(buildPath('item', { itemId: 'custom item' })).toBe(
      '/item/custom%20item'
    );
  });

  it('builds the item route with the default id when omitted', () => {
    expect(buildPath('item')).toBe(`/item/${DEFAULT_ITEM_ID}`);
  });

  it('builds the player route with default id when omitted', () => {
    expect(buildPath('player')).toBe(`/player/${DEFAULT_PLAYER_ID}`);
  });

  it('falls back to /home for unknown route names', () => {
    expect(buildPath('not-a-real-route')).toBe('/home');
  });
});

describe('parsePath / buildPath round-trip', () => {
  it.each([
    'landing',
    'feed',
    'collection',
    'comps',
    'profile',
    'search',
    'watchlist',
    'mobile',
    'players',
  ])('round-trips %s', (route) => {
    const path = buildPath(route);
    const parsed = parsePath(path);
    expect(parsed.route).toBe(route);
  });

  it('round-trips item with custom id', () => {
    const path = buildPath('item', { itemId: 'wemby-jersey' });
    const parsed = parsePath(path);
    expect(parsed).toEqual({ route: 'item', itemId: 'wemby-jersey' });
  });

  it('round-trips player with custom id', () => {
    const path = buildPath('player', { playerId: 'shohei-ohtani' });
    const parsed = parsePath(path);
    expect(parsed).toEqual({ route: 'player', playerId: 'shohei-ohtani' });
  });
});
