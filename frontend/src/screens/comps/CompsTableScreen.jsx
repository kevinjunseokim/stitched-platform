// Stitched — Auction comps explorer (searchable list).

import { useEffect, useState } from 'react';

import { Badge, Eyebrow, Num } from '../../components/atoms';
import { FilterDropdown } from '../../components/primitives';
import { useApp } from '../../context/AppDataContext';
import { PLAYERS, findPlayer } from '../../data/mocks';
import { COLORS } from '../../theme/tokens';

const FILTER_SPORTS = ['All', 'MLB', 'NBA', 'NFL', 'NHL'];
const TYPES = ['All', 'Bat', 'Jersey', 'Card', 'Baseball', 'Football', 'Helmet', 'Cleats', 'Sneakers', 'Puck', 'Batting Gloves'];
const SOURCES = ['All', 'Goldin', 'MLB Auctions', 'Heritage Auctions', 'Hunt Auctions', 'Lelands', "Fanatics Auctions", "Sotheby's"];

function CompsFilters({
  query, setQuery, sport, setSport, itemType, setItemType, source, setSource,
  playerId, setPlayerId, usedOnly, setUsedOnly, players,
}) {
  const playerOptions = players?.length ? players : PLAYERS;
  return (
    <div style={{ marginBottom: 28 }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search lots, houses, auth, item types…"
        style={{
          width: '100%', padding: '14px 16px', marginBottom: 18,
          border: `1px solid ${COLORS.border}`, background: COLORS.paper,
          fontFamily: 'inherit', fontSize: 15, color: COLORS.ink,
        }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 }}>
        <FilterDropdown
          label="Sport"
          value={sport}
          onChange={setSport}
          options={FILTER_SPORTS.map((s) => ({ v: s, l: s === 'All' ? 'All sports' : s }))}
        />
        <FilterDropdown
          label="Type"
          value={itemType}
          onChange={setItemType}
          options={TYPES.map((t) => ({ v: t, l: t === 'All' ? 'All types' : t }))}
        />
        <FilterDropdown
          label="House"
          value={source}
          onChange={setSource}
          minWidth={168}
          options={SOURCES.map((s) => ({ v: s, l: s === 'All' ? 'All houses' : s }))}
        />
        <FilterDropdown
          label="Player"
          value={playerId}
          onChange={setPlayerId}
          minWidth={180}
          options={[
            { v: 'All', l: 'All players' },
            ...playerOptions.map((p) => ({ v: p.id, l: p.name })),
          ]}
        />
        <FilterDropdown
          label="Valuation"
          value={usedOnly ? 'used' : 'all'}
          onChange={(v) => setUsedOnly(v === 'used')}
          options={[
            { v: 'all', l: 'All comps' },
            { v: 'used', l: 'Used in valuation' },
          ]}
        />
      </div>
    </div>
  );
}

function CompsResultsTable({ comps, onPlayer }) {
  if (!comps.length) {
    return (
      <div style={{ padding: 32, fontSize: 14, color: COLORS.inkFaint, background: COLORS.paper, border: `1px solid ${COLORS.border}` }}>
        No comps match your filters. Try broadening your search.
      </div>
    );
  }

  const cols = '2fr 1fr 1.1fr 1fr 1fr 1fr 80px';
  return (
    <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}` }}>
      <div style={{
        display: 'grid', gridTemplateColumns: cols,
        padding: '14px 22px', borderBottom: `1px solid ${COLORS.ink}`,
      }}>
        <Eyebrow>Lot</Eyebrow>
        <Eyebrow>Player</Eyebrow>
        <Eyebrow>House</Eyebrow>
        <Eyebrow>Date</Eyebrow>
        <Eyebrow>Hammer</Eyebrow>
        <Eyebrow>Confidence</Eyebrow>
        <span/>
      </div>
      {comps.map((c, i) => {
        const player = findPlayer(c.player);
        return (
          <div
            key={c.id}
            style={{
              display: 'grid', gridTemplateColumns: cols,
              padding: '16px 22px', alignItems: 'center',
              borderBottom: i < comps.length - 1 ? `1px solid ${COLORS.borderFaint}` : 'none',
            }}
          >
            <div>
              <div style={{ fontSize: 14, color: COLORS.ink, fontWeight: 500, letterSpacing: '-0.005em' }}>{c.title}</div>
              <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 3 }}>{c.auth} · {c.type}</Eyebrow>
            </div>
            <button
              type="button"
              onClick={() => onPlayer && onPlayer(c.player)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                textAlign: 'left', padding: 0, fontSize: 13, fontWeight: 500, color: COLORS.ink,
              }}
            >
              {player.name}
            </button>
            <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.ink }}>{c.source}</div>
            <Num size={13}>{c.date}</Num>
            <Num size={15} weight={500}>${(c.price || 0).toLocaleString()}</Num>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 4, background: COLORS.paperSunken, maxWidth: 80 }}>
                <div style={{
                  width: `${c.confidence}%`, height: '100%',
                  background: c.confidence >= 90 ? COLORS.field : c.confidence >= 80 ? COLORS.gold : COLORS.clay,
                }}/>
              </div>
              <Num size={11} color={COLORS.inkSubtle}>{c.confidence}</Num>
            </div>
            {c.usedIn ? <Badge kind="field" style={{ fontSize: 9, padding: '3px 6px' }}>USED</Badge> : <span/>}
          </div>
        );
      })}
    </div>
  );
}

export function CompsTableScreen({ onPlayer }) {
  const { api, players } = useApp();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sport, setSport] = useState('All');
  const [itemType, setItemType] = useState('All');
  const [source, setSource] = useState('All');
  const [playerId, setPlayerId] = useState('All');
  const [usedOnly, setUsedOnly] = useState(false);
  const [comps, setComps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.listComps({
      q: debouncedQuery || undefined,
      sport,
      type: itemType,
      source,
      player: playerId,
      usedOnly,
      limit: 200,
    })
      .then(({ comps: list }) => { if (!cancelled) setComps(list || []); })
      .catch(() => { if (!cancelled) setComps([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [api, debouncedQuery, sport, itemType, source, playerId, usedOnly]);

  return (
    <div style={{ padding: '48px 56px 96px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <Eyebrow>Auction comps</Eyebrow>
        <h1 style={{
          fontFamily: "'Geist', sans-serif", fontSize: 40, fontWeight: 500,
          letterSpacing: '-0.03em', margin: '10px 0 12px', lineHeight: 1.05,
        }}>
          Comparable auction sales
        </h1>
        <p style={{ fontSize: 14.5, color: COLORS.inkMuted, lineHeight: 1.55, margin: '0 0 32px', maxWidth: 560 }}>
          Search and filter hammer prices from major houses. These comps power estimates on every piece in Stitched.
        </p>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
          <Eyebrow color={COLORS.inkFaint}>{loading ? 'Loading…' : `${comps.length} results`}</Eyebrow>
        </div>

        <CompsFilters
          query={query}
          setQuery={setQuery}
          sport={sport}
          setSport={setSport}
          itemType={itemType}
          setItemType={setItemType}
          source={source}
          setSource={setSource}
          playerId={playerId}
          setPlayerId={setPlayerId}
          usedOnly={usedOnly}
          setUsedOnly={setUsedOnly}
          players={players}
        />

        {loading ? (
          <div style={{ padding: 32, fontSize: 14, color: COLORS.inkFaint }}>Loading comps…</div>
        ) : (
          <CompsResultsTable comps={comps} onPlayer={onPlayer}/>
        )}
      </div>
    </div>
  );
}
