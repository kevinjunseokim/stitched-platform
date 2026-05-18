// Shared market landing sections for the player indexes page.

import { useMemo } from 'react';

import { Avatar, Delta, Eyebrow, Num } from '../../components/atoms';
import { Card } from '../../components/primitives';
import { MARKET_TICKER_ITEMS, PLAYERS, findPlayer } from '../../data/mocks';
import { COLORS } from '../../theme/tokens';

export const SPORTS_LEADERBOARD = ['MLB', 'NBA', 'NFL', 'NHL'];
export const TOP_PER_SPORT = 4;
export const MOVERS_GAINERS = 6;
export const MOVERS_DECLINERS = 3;

export function groupTopBySport(players, perSport = TOP_PER_SPORT) {
  return SPORTS_LEADERBOARD.map((sport) => ({
    sport,
    leaders: [...players]
      .filter((p) => (p.sport || '').toUpperCase() === sport)
      .sort((a, b) => (b.index || 0) - (a.index || 0))
      .slice(0, perSport),
  }));
}

export function PlayerIndexesHero({ playerCount, avgD30, loading }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <Eyebrow>Player indexes</Eyebrow>
      <h1 style={{
        fontFamily: "'Geist', sans-serif", fontSize: 44, fontWeight: 500,
        letterSpacing: '-0.03em', margin: '10px 0 14px', lineHeight: 1.02, maxWidth: 720,
      }}>
        The market at a glance
      </h1>
      <p style={{ fontSize: 15, color: COLORS.inkMuted, lineHeight: 1.55, margin: '0 0 36px', maxWidth: 640 }}>
        Index leaders by league, 30-day movers, and recent hammer prices from major houses — the same data that powers item valuations across Stitched.
      </p>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0,
        paddingBottom: 36, borderBottom: `1px solid ${COLORS.border}`,
      }}>
        {[
          { label: 'Indexed athletes', value: loading ? '…' : playerCount },
          { label: 'Avg. 30d change', value: loading ? '…' : null, delta: avgD30 },
          { label: 'Leagues', value: 'MLB · NBA · NFL · NHL' },
          { label: 'Coverage', value: 'Game-used · Signed · Rookie' },
        ].map((stat) => (
          <div key={stat.label}>
            <Eyebrow>{stat.label}</Eyebrow>
            {stat.delta != null && !loading ? (
              <div style={{ marginTop: 12 }}><Delta pct={stat.delta} size={28}/></div>
            ) : typeof stat.value === 'number' ? (
              <Num size={32} weight={500} style={{ display: 'block', marginTop: 12, letterSpacing: '-0.025em' }}>
                {stat.value}
              </Num>
            ) : (
              <div style={{ fontSize: 15, color: COLORS.ink, marginTop: 12, fontWeight: 500, lineHeight: 1.35 }}>
                {stat.value}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarketSnapshot({ ticker }) {
  // Only league-level indexes (and the Stitched 100 composite) appear here —
  // individual players are surfaced in the leaderboards/movers sections below.
  const entries = (ticker?.length ? ticker : MARKET_TICKER_ITEMS).filter(
    (t) => !t.sport || t.label === t.sport,
  );
  return (
    <section style={{ marginBottom: 56 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
        <Eyebrow>Market snapshot</Eyebrow>
        <Eyebrow color={COLORS.inkFaint}>24h · Index levels</Eyebrow>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {entries.map((t) => (
          <Card key={t.label} style={{ padding: '18px 20px' }}>
            <Eyebrow color={COLORS.inkFaint}>{t.sport || 'Composite'}</Eyebrow>
            <div style={{ fontSize: 15, fontWeight: 500, color: COLORS.ink, marginTop: 8 }}>{t.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 10 }}>
              <Num size={20} weight={500}>{t.value}</Num>
              <Delta pct={t.pct} size={12}/>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function SportLeaderboards({ groups, onPlayer, onSportFocus }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Eyebrow>Index leaders</Eyebrow>
          <h2 style={{
            fontFamily: "'Geist', sans-serif", fontSize: 26, fontWeight: 500,
            letterSpacing: '-0.02em', margin: '8px 0 0', lineHeight: 1.1,
          }}>
            Top athletes by sport
          </h2>
        </div>
        <Eyebrow color={COLORS.inkFaint}>Ranked by index</Eyebrow>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {groups.map(({ sport, leaders }) => (
          <Card key={sport} style={{ padding: 0, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => onSportFocus && onSportFocus(sport)}
              style={{
                width: '100%', padding: '16px 20px', border: 'none', borderBottom: `1px solid ${COLORS.border}`,
                background: COLORS.paperSunken, cursor: 'pointer', textAlign: 'left',
              }}
            >
              <Eyebrow>{sport}</Eyebrow>
              <div style={{ fontSize: 13, color: COLORS.inkMuted, marginTop: 6 }}>Top {leaders.length} by index</div>
            </button>
            {leaders.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPlayer && onPlayer(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '14px 20px', background: 'transparent', border: 'none',
                  borderBottom: i < leaders.length - 1 ? `1px solid ${COLORS.borderFaint}` : 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 12, color: COLORS.inkFaint, width: 16, flexShrink: 0 }}>{i + 1}</span>
                <Avatar initials={p.initials} size={32} color={p.color}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 3 }}>{p.team}</Eyebrow>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Num size={13} weight={500}>
                    {Number(p.index || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Num>
                  <div style={{ marginTop: 3 }}><Delta pct={p.d30} size={10}/></div>
                </div>
              </button>
            ))}
          </Card>
        ))}
      </div>
    </section>
  );
}

export function MoversSection({ gainers, decliners, onPlayer }) {
  const renderRow = (p, rank) => (
    <button
      key={p.id}
      type="button"
      onClick={() => onPlayer && onPlayer(p.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%',
        padding: '14px 0', background: 'transparent', border: 'none',
        borderBottom: `1px solid ${COLORS.borderFaint}`, cursor: 'pointer', textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 12, color: COLORS.inkFaint, width: 18 }}>{rank}</span>
      <Avatar initials={p.initials} size={36} color={p.color}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.ink }}>{p.name}</div>
        <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 4 }}>{p.sport} · {p.team}</Eyebrow>
      </div>
      <div style={{ textAlign: 'right' }}>
        <Num size={14} weight={500}>
          {Number(p.index || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </Num>
        <div style={{ marginTop: 4 }}><Delta pct={p.d30} size={12}/></div>
      </div>
    </button>
  );

  return (
    <section style={{ marginBottom: 56 }}>
      <div style={{ marginBottom: 24 }}>
        <Eyebrow>30-day movers</Eyebrow>
        <h2 style={{
          fontFamily: "'Geist', sans-serif", fontSize: 26, fontWeight: 500,
          letterSpacing: '-0.02em', margin: '8px 0 0', lineHeight: 1.1,
        }}>
          Who&apos;s moving the market
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        <Card style={{ padding: '8px 24px 12px' }}>
          <Eyebrow color={COLORS.field} style={{ display: 'block', padding: '16px 0 8px' }}>Gainers</Eyebrow>
          {gainers.map((p, i) => renderRow(p, i + 1))}
        </Card>
        <Card style={{ padding: '8px 24px 12px' }}>
          <Eyebrow color={COLORS.clay} style={{ display: 'block', padding: '16px 0 8px' }}>Decliners</Eyebrow>
          {decliners.length === 0 ? (
            <div style={{ padding: '20px 0', fontSize: 13, color: COLORS.inkFaint }}>No negative movers in catalog.</div>
          ) : (
            decliners.map((p, i) => renderRow(p, i + 1))
          )}
        </Card>
      </div>
    </section>
  );
}

export function NotableSalesSection({ sales, onPlayer }) {
  const display = (sales || []).slice(0, 6);
  if (!display.length) return null;
  return (
    <section style={{ marginBottom: 56 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <Eyebrow>Headline hammer prices</Eyebrow>
          <h2 style={{
            fontFamily: "'Geist', sans-serif", fontSize: 26, fontWeight: 500,
            letterSpacing: '-0.02em', margin: '8px 0 0', lineHeight: 1.1,
          }}>
            Notable recent sales
          </h2>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {display.map((s, i) => {
          const player = s.player ? findPlayer(s.player) : null;
          const priceLabel = s.price >= 1000000
            ? `$${(s.price / 1000000).toFixed(2)}M`
            : `$${(s.price || 0).toLocaleString()}`;
          return (
            <Card key={i} style={{ padding: '18px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.ink, lineHeight: 1.35 }}>{s.title}</div>
                  <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 6 }}>{s.house} · {s.date}</Eyebrow>
                  {player && (
                    <button
                      type="button"
                      onClick={() => onPlayer && onPlayer(player.id)}
                      style={{
                        marginTop: 10, background: 'transparent', border: 'none', cursor: 'pointer',
                        padding: 0, fontSize: 12, color: COLORS.inkMuted, fontWeight: 500,
                      }}
                    >
                      {player.name} →
                    </button>
                  )}
                </div>
                <Num size={18} weight={500} style={{ flexShrink: 0 }}>{priceLabel}</Num>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export function usePlayerMarketData(players) {
  const allPlayers = players?.length ? players : PLAYERS;
  return useMemo(() => {
    const sportGroups = groupTopBySport(allPlayers);
    const gainers = [...allPlayers].sort((a, b) => (b.d30 || 0) - (a.d30 || 0)).slice(0, MOVERS_GAINERS);
    const decliners = [...allPlayers]
      .filter((p) => (p.d30 || 0) < 0)
      .sort((a, b) => (a.d30 || 0) - (b.d30 || 0))
      .slice(0, MOVERS_DECLINERS);
    const avgD30 = allPlayers.length
      ? Math.round((allPlayers.reduce((sum, p) => sum + (p.d30 || 0), 0) / allPlayers.length) * 10) / 10
      : 0;
    return { allPlayers, sportGroups, gainers, decliners, avgD30 };
  }, [allPlayers]);
}
