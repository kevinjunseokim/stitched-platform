// Stitched — Player indexes overview (market landing + full index list).

import { useMemo, useRef, useState } from 'react';

import { Avatar, Delta, Eyebrow, Num } from '../../components/atoms';
import { Pill } from '../../components/primitives';
import { useApp } from '../../context/AppDataContext';
import { SPORT_FILTERS } from '../../data/mocks';
import { COLORS } from '../../theme/tokens';

import {
  MarketSnapshot,
  MoversSection,
  NotableSalesSection,
  PlayerIndexesHero,
  SportLeaderboards,
  usePlayerMarketData,
} from './PlayerMarketSections';

const SPORTS = SPORT_FILTERS;
const SORTS = [
  { id: 'index', label: 'Index' },
  { id: 'd30', label: '30d movers' },
];

function PlayerIndexSearch({ value, onChange, resultCount }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.ink}`, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <i className="iconoir-search" style={{ fontSize: 20, color: COLORS.inkSubtle, flexShrink: 0 }}/>
          <input
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search players by name, team, or league…"
            aria-label="Search player indexes"
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontFamily: "'Geist', sans-serif", fontSize: 18, fontWeight: 500,
              color: COLORS.ink, letterSpacing: '-0.015em',
            }}
          />
          {value.trim() && (
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Clear search"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 16, color: COLORS.inkSubtle, padding: 4, lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>
      {value.trim() && (
        <Eyebrow color={COLORS.inkFaint} style={{ display: 'block', marginTop: 10 }}>
          {resultCount} {resultCount === 1 ? 'match' : 'matches'}
        </Eyebrow>
      )}
    </div>
  );
}

function PlayerBrowseList({ list, onPlayer, hasQuery }) {
  if (!list.length) {
    return (
      <div style={{ padding: 32, fontSize: 14, color: COLORS.inkFaint, background: COLORS.paper, border: `1px solid ${COLORS.border}` }}>
        {hasQuery ? 'No players match your search.' : 'No players match this filter.'}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {list.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onPlayer && onPlayer(p.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 18, padding: 18,
            background: COLORS.paper, border: `1px solid ${COLORS.border}`,
            cursor: 'pointer', textAlign: 'left', width: '100%',
          }}
        >
          <Avatar initials={p.initials} size={48} color={p.color}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{p.name}</div>
            <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 4 }}>{p.sport} · {p.team}</Eyebrow>
          </div>
          <div style={{ textAlign: 'right', minWidth: 88 }}>
            <Eyebrow>Index</Eyebrow>
            <Num size={18} weight={500} style={{ display: 'block', marginTop: 4 }}>
              {Number(p.index || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Num>
          </div>
          <div style={{ textAlign: 'right', minWidth: 64 }}>
            <Eyebrow>30d</Eyebrow>
            <div style={{ marginTop: 4 }}><Delta pct={p.d30}/></div>
          </div>
          <i className="iconoir-nav-arrow-right" style={{ fontSize: 16, color: COLORS.inkFaint, flexShrink: 0 }}/>
        </button>
      ))}
    </div>
  );
}

export function PlayersIndexScreen({ onPlayer }) {
  const { players, ticker, notableSales } = useApp();
  const browseRef = useRef(null);
  const [sport, setSport] = useState('All');
  const [sort, setSort] = useState('index');
  const [query, setQuery] = useState('');

  const { allPlayers, sportGroups, gainers, decliners, avgD30 } = usePlayerMarketData(players);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = sport === 'All'
      ? allPlayers
      : allPlayers.filter((p) => (p.sport || '').toUpperCase() === sport);
    if (q) {
      filtered = filtered.filter((p) => {
        const haystack = [p.name, p.team, p.sport, p.id].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      });
    }
    return [...filtered].sort((a, b) => {
      if (sort === 'd30') return (b.d30 || 0) - (a.d30 || 0);
      return (b.index || 0) - (a.index || 0);
    });
  }, [allPlayers, sport, sort, query]);

  const focusSport = (nextSport) => {
    setSport(nextSport);
    browseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ padding: '48px 56px 96px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <PlayerIndexesHero playerCount={allPlayers.length} avgD30={avgD30} loading={false}/>

        <MarketSnapshot ticker={ticker}/>

        <SportLeaderboards groups={sportGroups} onPlayer={onPlayer} onSportFocus={focusSport}/>

        <MoversSection gainers={gainers} decliners={decliners} onPlayer={onPlayer}/>

        <NotableSalesSection sales={notableSales} onPlayer={onPlayer}/>

        <section ref={browseRef} style={{ scrollMarginTop: 80 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <Eyebrow>Browse indexes</Eyebrow>
              <h2 style={{
                fontFamily: "'Geist', sans-serif", fontSize: 26, fontWeight: 500,
                letterSpacing: '-0.02em', margin: '8px 0 0', lineHeight: 1.1,
              }}>
                All player indexes
              </h2>
            </div>
            <Eyebrow color={COLORS.inkFaint}>{list.length} players</Eyebrow>
          </div>
          <p style={{ fontSize: 14, color: COLORS.inkMuted, margin: '0 0 20px', maxWidth: 560 }}>
            Filter the full index catalog. Click a sport leader above to jump here with that league selected.
          </p>

          <PlayerIndexSearch value={query} onChange={setQuery} resultCount={list.length}/>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            {SPORTS.map((s) => (
              <Pill key={s} active={sport === s} onClick={() => setSport(s)}>{s}</Pill>
            ))}
            <span style={{ width: 1, height: 20, background: COLORS.border, margin: '0 6px' }}/>
            {SORTS.map((s) => (
              <Pill key={s.id} active={sort === s.id} onClick={() => setSort(s.id)}>{s.label}</Pill>
            ))}
          </div>

          <PlayerBrowseList list={list} onPlayer={onPlayer} hasQuery={!!query.trim()}/>
        </section>
      </div>
    </div>
  );
}
