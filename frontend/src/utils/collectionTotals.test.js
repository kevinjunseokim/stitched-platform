import { describe, expect, it } from 'vitest';

import {
  chartValuesForRange,
  deriveCollectionHistory,
  deriveCollectionTotals,
  itemEstimateMid,
  mergeCollectionSummary,
} from './collectionTotals';

describe('itemEstimateMid', () => {
  it('uses estimate.mid when present', () => {
    expect(itemEstimateMid({ estimate: { mid: 4200 }, acquired: 1100 })).toBe(4200);
  });

  it('falls back to acquired when mid is missing', () => {
    expect(itemEstimateMid({ estimate: { mid: null }, acquired: 1850 })).toBe(1850);
  });
});

describe('mergeCollectionSummary', () => {
  it('derives totals when API summary reports zero but items have value', () => {
    const items = [
      { sport: 'MLB', type: 'Bat', estimate: { mid: 3000 }, acquired: 1800 },
      { sport: 'NBA', type: 'Jersey', estimate: { mid: 5000 }, acquired: 4000 },
    ];
    const merged = mergeCollectionSummary({ totals: { pieces: 2, estimate: 0, acquired: 5800 } }, items);
    expect(merged.totals.estimate).toBe(8000);
    expect(merged.bySport.length).toBeGreaterThan(0);
  });
});

describe('deriveCollectionHistory', () => {
  it('returns weekly points when items exist', () => {
    const history = deriveCollectionHistory([
      { estimate: { mid: 3000 }, acquired: 2000, acquiredDate: '2024-01-01' },
      { estimate: { mid: 5000 }, acquired: 4000, acquiredDate: '2024-06-01' },
    ]);
    expect(history.length).toBeGreaterThan(2);
    expect(history[history.length - 1].value).toBeGreaterThan(0);
  });
});

describe('chartValuesForRange', () => {
  it('returns at least two values for a 30D window', () => {
    const history = Array.from({ length: 25 }, (_, i) => ({
      date: new Date(Date.now() - (24 - i) * 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      value: 1000 + i * 100,
    }));
    const values = chartValuesForRange(history, '30D');
    expect(values.length).toBeGreaterThanOrEqual(2);
  });
});

describe('mergeCollectionSummary', () => {
  it('includes derived history when API summary is missing', () => {
    const items = [
      { sport: 'MLB', type: 'Bat', estimate: { mid: 3000 }, acquired: 1800, acquiredDate: '2024-02-04' },
    ];
    const merged = mergeCollectionSummary(null, items);
    expect(merged.history.length).toBeGreaterThan(2);
    expect(merged.totals.estimate).toBe(3000);
  });
});

describe('deriveCollectionTotals', () => {
  it('sums item mids', () => {
    const totals = deriveCollectionTotals([
      { estimate: { mid: 1000 }, acquired: 800, auth: 'PSA' },
      { estimate: { mid: 2000 }, acquired: 1500 },
    ]);
    expect(totals.estimate).toBe(3000);
    expect(totals.acquired).toBe(2300);
    expect(totals.gain).toBe(700);
  });
});
