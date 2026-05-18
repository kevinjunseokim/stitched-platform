import { describe, expect, it } from 'vitest';

import { filterFeedEvents, getEventFilterMeta, normalizeFeedKind } from './feedFilters';

describe('feedFilters', () => {
  it('normalizes player.mover to mover', () => {
    expect(normalizeFeedKind('player.mover')).toBe('mover');
  });

  it('filters by post type', () => {
    const events = [
      { id: '1', kind: 'added', subjectType: 'item', subjectId: 'carroll-bat-2023' },
      { id: '2', kind: 'mover', subjectType: 'player', subjectId: 'victor-wembanyama', payload: { player: 'victor-wembanyama' } },
    ];
    expect(filterFeedEvents(events, { postType: 'added' })).toHaveLength(1);
    expect(filterFeedEvents(events, { postType: 'mover' })).toHaveLength(1);
  });

  it('filters item events by sport from hydrated item', () => {
    const events = [{
      id: '1',
      kind: 'added',
      subjectType: 'item',
      subjectId: 'x',
      item: { sport: 'NBA', type: 'Jersey', player: 'anthony-edwards', title: 'Edwards jersey' },
    }];
    expect(filterFeedEvents(events, { sport: 'NBA' })).toHaveLength(1);
    expect(filterFeedEvents(events, { sport: 'MLB' })).toHaveLength(0);
  });

  it('builds searchable text from actor and item', () => {
    const meta = getEventFilterMeta({
      kind: 'added',
      actorUser: { displayName: 'Kevin Kim', handle: 'kevin' },
      item: { title: 'Carroll bat', sport: 'MLB', type: 'Bat', player: 'corbin-carroll' },
    });
    expect(meta.searchText).toContain('kevin kim');
    expect(meta.searchText).toContain('carroll bat');
  });
});
