// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  AUTH_STORAGE_KEY,
  TICKER_VISIBLE_KEY,
  clearStoredAuth,
  readStoredAuth,
  readTickerVisible,
  storeAuth,
  storeTickerVisible,
} from './storage';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe('readStoredAuth', () => {
  it('returns null when nothing is stored', () => {
    expect(readStoredAuth()).toBeNull();
  });

  it('returns the parsed JSON for a stored payload', () => {
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ access_token: 'abc', user: { id: 'u1' } })
    );
    expect(readStoredAuth()).toEqual({
      access_token: 'abc',
      user: { id: 'u1' },
    });
  });

  it('returns null when the stored value is malformed', () => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, '{not json}');
    expect(readStoredAuth()).toBeNull();
  });
});

describe('storeAuth', () => {
  it('serialises and stores the payload', () => {
    storeAuth({ access_token: 'xyz', user: { id: 'u2' } });
    const stored = JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY));
    expect(stored).toEqual({ access_token: 'xyz', user: { id: 'u2' } });
  });
});

describe('clearStoredAuth', () => {
  it('removes the storage key', () => {
    storeAuth({ access_token: 'abc' });
    clearStoredAuth();
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });
});

describe('ticker visibility preference', () => {
  it('defaults to visible when unset', () => {
    expect(readTickerVisible()).toBe(true);
  });

  it('persists hide and show', () => {
    storeTickerVisible(false);
    expect(readTickerVisible()).toBe(false);
    expect(window.localStorage.getItem(TICKER_VISIBLE_KEY)).toBe('false');
    storeTickerVisible(true);
    expect(readTickerVisible()).toBe(true);
  });
});
