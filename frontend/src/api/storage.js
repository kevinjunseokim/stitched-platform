// Thin localStorage wrappers. Every read and write is fault-tolerant — private
// browsing, quota errors, and disabled storage all degrade gracefully without
// breaking the surrounding flow.
export const AUTH_STORAGE_KEY = 'stitched.auth';
export const TICKER_VISIBLE_KEY = 'stitched.tickerVisible';

function safeGet(key) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

function safeSet(key, value) {
  try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
}

function safeRemove(key) {
  try { window.localStorage.removeItem(key); } catch { /* ignore */ }
}

export function readTickerVisible() {
  return safeGet(TICKER_VISIBLE_KEY) !== 'false';
}

export function storeTickerVisible(visible) {
  safeSet(TICKER_VISIBLE_KEY, visible ? 'true' : 'false');
}

export function readStoredAuth() {
  try {
    return JSON.parse(safeGet(AUTH_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function storeAuth(auth) {
  safeSet(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth() {
  safeRemove(AUTH_STORAGE_KEY);
}
