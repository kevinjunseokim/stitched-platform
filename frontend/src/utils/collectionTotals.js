/** Resolve a displayable mid estimate for an item (dollars). */
export function itemEstimateMid(item) {
  const mid = item?.estimate?.mid;
  if (mid != null && mid > 0) return mid;
  if (item?.acquired != null && item.acquired > 0) return item.acquired;
  return 0;
}

export function deriveCollectionTotals(items) {
  const list = items || [];
  const estimate = list.reduce((sum, it) => sum + itemEstimateMid(it), 0);
  const acquired = list.reduce((sum, it) => sum + (it.acquired || 0), 0);
  const forSale = list.filter((it) => it.forSale).length;
  const sold = list.filter((it) => it.soldAt).length;
  const authenticated = list.filter((it) => (it.auth || '').trim()).length;

  return {
    pieces: list.length,
    estimate,
    acquired,
    gain: estimate - acquired,
    forSale,
    sold,
    authenticatedPct: list.length ? Math.round((authenticated / list.length) * 100) : 0,
    delta30d: 0,
    delta90d: 0,
    delta365d: 0,
  };
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const it of items) {
    const key = keyFn(it) || 'Other';
    const row = map.get(key) || { count: 0, value: 0 };
    row.count += 1;
    row.value += itemEstimateMid(it);
    map.set(key, row);
  }
  return map;
}

function parseItemDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Approximate weekly collection value history from item acquisition dates and estimates. */
export function deriveCollectionHistory(items, weeks = 24) {
  const list = items || [];
  if (!list.length) return [];

  const now = new Date();
  const stepDays = Math.max(1, Math.floor(365 / weeks));
  const points = [];

  for (let i = weeks; i >= 0; i -= 1) {
    const anchor = new Date(now);
    anchor.setDate(anchor.getDate() - i * stepDays);
    const anchorDay = startOfDay(anchor);
    const nowDay = startOfDay(now);
    let total = 0;

    for (const item of list) {
      const mid = itemEstimateMid(item);
      const acquired = item.acquired ?? mid;
      const acquiredDate = parseItemDate(item.acquiredDate || item.createdAt);
      if (!acquiredDate) {
        total += mid;
        continue;
      }

      const acqDay = startOfDay(acquiredDate);
      if (anchorDay < acqDay) continue;

      const daysHeld = Math.max(1, Math.round((nowDay - acqDay) / (1000 * 60 * 60 * 24)));
      const elapsed = Math.max(0, Math.round((anchorDay - acqDay) / (1000 * 60 * 60 * 24)));
      const ratio = Math.min(1, elapsed / daysHeld);
      total += acquired + Math.round((mid - acquired) * ratio);
    }

    points.push({
      date: anchorDay.toISOString().slice(0, 10),
      value: Math.round(total),
    });
  }

  return points;
}

export function chartValuesForRange(history, range) {
  if (!history?.length) return [];

  const daysMap = { '30D': 30, '90D': 90, '1Y': 365, '2Y': 730, All: null };
  const days = daysMap[range] ?? null;
  let points = history;

  if (days != null) {
    const cutoff = startOfDay(new Date());
    cutoff.setDate(cutoff.getDate() - days);
    const filtered = history.filter((p) => startOfDay(new Date(p.date)) >= cutoff);
    if (filtered.length >= 2) points = filtered;
  }

  return points.map((p) => p.value);
}

export function deriveCollectionBreakdown(items) {
  const bySportMap = groupBy(items, (it) => it.sport);
  const byTypeMap = groupBy(items, (it) => it.type);
  return {
    bySport: [...bySportMap.entries()]
      .map(([sport, v]) => ({ sport, count: v.count, value: v.value }))
      .sort((a, b) => b.value - a.value),
    byType: [...byTypeMap.entries()]
      .map(([type, v]) => ({ type, count: v.count, value: v.value }))
      .sort((a, b) => b.value - a.value),
  };
}

/** Prefer API summary; fall back to item-derived totals when estimates are missing. */
export function mergeCollectionSummary(summary, items) {
  const derived = deriveCollectionTotals(items);
  const breakdown = deriveCollectionBreakdown(items);

  const historyFromItems = deriveCollectionHistory(items);
  const pickHistory = (apiHistory) => (
    apiHistory?.length >= 2 ? apiHistory : historyFromItems
  );

  if (!summary) {
    return {
      totals: derived,
      bySport: breakdown.bySport,
      byType: breakdown.byType,
      history: historyFromItems,
    };
  }

  const apiEstimate = summary.totals?.estimate || 0;
  const useDerived = items.length > 0 && apiEstimate <= 0 && derived.estimate > 0;

  return {
    ...summary,
    totals: useDerived ? { ...summary.totals, ...derived, pieces: summary.totals?.pieces ?? derived.pieces } : summary.totals,
    bySport: (summary.bySport?.length && !useDerived) ? summary.bySport : breakdown.bySport,
    byType: (summary.byType?.length && !useDerived) ? summary.byType : breakdown.byType,
    history: pickHistory(summary.history),
  };
}
