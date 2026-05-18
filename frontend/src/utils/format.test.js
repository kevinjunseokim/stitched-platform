import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { formatFollowers, formatRelative } from './format';

describe('formatFollowers', () => {
  it('returns the raw number when under 1,000', () => {
    expect(formatFollowers(0)).toBe('0');
    expect(formatFollowers(942)).toBe('942');
  });

  it('formats thousands with a single decimal', () => {
    expect(formatFollowers(1_234)).toBe('1.2k');
    expect(formatFollowers(12_846)).toBe('12.8k');
  });

  it('strips trailing .0', () => {
    expect(formatFollowers(2_000)).toBe('2k');
    expect(formatFollowers(40_000)).toBe('40k');
  });
});

describe('formatRelative', () => {
  // Pin "now" to a known instant so the boundary buckets are deterministic.
  const NOW = new Date('2026-05-17T22:00:00Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "now" for falsy input', () => {
    expect(formatRelative('')).toBe('now');
    expect(formatRelative(undefined)).toBe('now');
    expect(formatRelative(null)).toBe('now');
  });

  it('returns "now" for unparseable input', () => {
    expect(formatRelative('not-a-date')).toBe('now');
  });

  it('formats sub-minute deltas in seconds (minimum 1)', () => {
    const ts = new Date(NOW - 30 * 1000).toISOString();
    expect(formatRelative(ts)).toBe('30s');
    // Future/now collapses to the floor of 1s.
    expect(formatRelative(new Date(NOW).toISOString())).toBe('1s');
  });

  it('formats minute deltas', () => {
    const ts = new Date(NOW - 5 * 60 * 1000).toISOString();
    expect(formatRelative(ts)).toBe('5m');
  });

  it('formats hour deltas', () => {
    const ts = new Date(NOW - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelative(ts)).toBe('3h');
  });

  it('formats day deltas', () => {
    const ts = new Date(NOW - 4 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelative(ts)).toBe('4d');
  });

  it('formats month deltas', () => {
    const ts = new Date(NOW - 60 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelative(ts)).toBe('2mo');
  });

  it('formats year deltas', () => {
    const ts = new Date(NOW - 365 * 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelative(ts)).toBe('2y');
  });
});
