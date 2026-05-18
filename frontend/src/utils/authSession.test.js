import { describe, expect, it } from 'vitest';

import { isAuthenticated, requiresAuth } from './authSession';

describe('requiresAuth', () => {
  it('treats app routes as protected', () => {
    expect(requiresAuth('feed')).toBe(true);
    expect(requiresAuth('collection')).toBe(true);
  });

  it('allows landing and mobile without a session', () => {
    expect(requiresAuth('landing')).toBe(false);
    expect(requiresAuth('mobile')).toBe(false);
  });
});

describe('isAuthenticated', () => {
  it('requires both a token and a hydrated user', () => {
    expect(isAuthenticated(null)).toBe(false);
    expect(isAuthenticated({ access_token: 'tok' })).toBe(false);
    expect(isAuthenticated({ user: { id: 'u1' } })).toBe(false);
    expect(isAuthenticated({ access_token: 'tok', user: { id: 'u1' } })).toBe(true);
  });
});
