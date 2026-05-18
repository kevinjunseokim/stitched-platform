// Stitched — My Collection dashboard.

import { useEffect, useMemo, useState } from 'react';

import { Button, Delta, Eyebrow, Num } from '../../components/atoms';
import { AreaChart, ItemImage, Pill } from '../../components/primitives';
import { useApp } from '../../context/AppDataContext';
import { ITEMS, SPORT_FILTERS, findPlayer } from '../../data/mocks';
import { COLORS } from '../../theme/tokens';
import { chartValuesForRange, itemEstimateMid, mergeCollectionSummary } from '../../utils/collectionTotals';

function CollectionHero({ totals }) {
  const t = totals || {};
  const totalValue = t.estimate || 0;
  const acquired = t.acquired || 0;
  const gain = t.gain != null ? t.gain : (totalValue - acquired);
  const gainPct = acquired > 0 ? Math.round((gain / acquired) * 100 * 10) / 10 : 0;
  const authPct = t.authenticatedPct ?? 0;
  return (
    <div style={{ padding: '48px 56px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 56, paddingBottom: 40, borderBottom: `1px solid ${COLORS.border}` }}>
        <div>
          <Eyebrow>Total collection value</Eyebrow>
          <Num size={56} weight={500} style={{ display: 'block', marginTop: 16, letterSpacing: '-0.035em', lineHeight: 1 }}>${totalValue.toLocaleString()}</Num>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
            <Delta pct={t.delta30d ?? 0} size={15}/>
            <span style={{ fontSize: 13, color: COLORS.inkMuted }}>vs. 30 days ago</span>
          </div>
        </div>
        <div>
          <Eyebrow>Acquisition cost</Eyebrow>
          <Num size={32} weight={500} style={{ display: 'block', marginTop: 16, letterSpacing: '-0.025em', lineHeight: 1 }}>${acquired.toLocaleString()}</Num>
          <div style={{ fontSize: 13, color: COLORS.inkMuted, marginTop: 14 }}>across {t.pieces || 0} pieces</div>
        </div>
        <div>
          <Eyebrow>Unrealized gain</Eyebrow>
          <Num size={32} weight={500} color={gain >= 0 ? COLORS.fieldMid : COLORS.clay} style={{ display: 'block', marginTop: 16, letterSpacing: '-0.025em', lineHeight: 1 }}>{gain >= 0 ? '+' : ''}${gain.toLocaleString()}</Num>
          <div style={{ fontSize: 13, color: COLORS.inkMuted, marginTop: 14 }}>{gain >= 0 ? '+' : ''}{gainPct}% on cost</div>
        </div>
        <div>
          <Eyebrow>Authentication rate</Eyebrow>
          <Num size={32} weight={500} style={{ display: 'block', marginTop: 16, letterSpacing: '-0.025em', lineHeight: 1 }}>{authPct}%</Num>
          <div style={{ fontSize: 13, color: COLORS.inkMuted, marginTop: 14 }}>{t.pieces || 0} pieces tracked</div>
        </div>
      </div>
    </div>
  );
}

const RANGE_LABELS = ['30D', '90D', '1Y', '2Y', 'All'];

function CollectionChart({ totals, history }) {
  const [range, setRange] = useState('All');
  const data = useMemo(() => chartValuesForRange(history, range), [history, range]);
  const totalValue = totals?.estimate || (data.length ? data[data.length - 1] : 0);
  const compareValue = data.length ? data[0] : totalValue;
  const pct = compareValue > 0 ? ((totalValue - compareValue) / compareValue) * 100 : 0;
  return (
    <div style={{ padding: '48px 56px 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <Eyebrow>Collection value · {range === 'All' ? 'all time' : range}</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 14 }}>
            <Num size={36} weight={500} style={{ letterSpacing: '-0.025em' }}>${totalValue.toLocaleString()}</Num>
            <Delta pct={pct} size={15}/>
            <span style={{ fontSize: 13, color: COLORS.inkMuted }}>vs. start of range</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {RANGE_LABELS.map((r) => {
            const active = range === r;
            return (
              <button key={r} onClick={() => setRange(r)} style={{
                padding: '10px 16px', fontFamily: "'Geist', sans-serif", fontSize: 13, fontWeight: 500,
                background: active ? COLORS.ink : 'transparent', color: active ? COLORS.chalk : COLORS.inkMuted,
                border: `1px solid ${active ? COLORS.ink : COLORS.border}`, cursor: 'pointer',
                marginRight: -1,
              }}>{r}</button>
            );
          })}
        </div>
      </div>
      {data.length > 1 ? (
        <AreaChart data={data} w={1180} h={280}/>
      ) : (
        <div style={{ padding: '40px 0', textAlign: 'center', color: COLORS.inkFaint, fontSize: 13 }}>
          Add items to your collection to see value history grow over time.
        </div>
      )}
    </div>
  );
}

function CollectionBreakdown({ summary }) {
  const bySport = summary?.bySport || [];
  const byType = summary?.byType || [];
  const totalValue = bySport.reduce((sum, s) => sum + (s.value || 0), 0) || 1;
  const totalCount = byType.reduce((sum, t) => sum + (t.count || 0), 0) || 1;
  const palette = [COLORS.leather, COLORS.ink, COLORS.pin, COLORS.clay, COLORS.field, COLORS.gold];
  const sports = bySport.slice(0, 6).map((s, i) => ({
    ...s,
    pct: Math.round((s.value / totalValue) * 100),
    color: palette[i % palette.length],
  }));
  const types = byType.slice(0, 6).map((t) => ({
    ...t,
    pct: Math.round((t.count / totalCount) * 100),
  }));
  if (!sports.length && !types.length) return null;
  return (
    <div style={{ padding: '64px 56px 0', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 80 }}>
      <div>
        <Eyebrow>By sport</Eyebrow>
        <div style={{ display: 'flex', height: 8, marginTop: 24 }}>
          {sports.map((e, i) => <div key={e.sport} style={{ width: `${e.pct}%`, background: e.color, marginRight: i < sports.length - 1 ? 2 : 0 }}/>)}
        </div>
        <div style={{ marginTop: 8 }}>
          {sports.map((e) => (
            <div key={e.sport} style={{ display: 'grid', gridTemplateColumns: '14px 1fr auto auto', alignItems: 'center', gap: 16, padding: '14px 0' }}>
              <div style={{ width: 8, height: 8, background: e.color }}/>
              <div style={{ fontSize: 14, color: COLORS.ink }}>{e.sport}</div>
              <Num size={14}>${(e.value || 0).toLocaleString()}</Num>
              <span style={{ minWidth: 44, textAlign: 'right', fontSize: 12, color: COLORS.inkFaint }}>{e.pct}%</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Eyebrow>By item type</Eyebrow>
        <div style={{ marginTop: 24 }}>
          {types.map((t) => (
            <div key={t.type} style={{ padding: '14px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 10 }}>
                <span>{t.type}</span>
                <span style={{ color: COLORS.inkFaint }}>{t.count} · {t.pct}%</span>
              </div>
              <div style={{ height: 4, background: COLORS.paperSunken }}>
                <div style={{ width: `${t.pct}%`, height: '100%', background: COLORS.field }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CollectionFilters({ activeSport, setActiveSport, forSaleOnly, setForSaleOnly, totalCount, publicCount }) {
  return (
    <div style={{ padding: '64px 56px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, paddingBottom: 24, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
          <h2 style={{ fontFamily: "'Geist', sans-serif", fontSize: 24, fontWeight: 500, letterSpacing: '-0.025em', margin: 0, lineHeight: 1 }}>Your pieces</h2>
          <span style={{ fontSize: 13, color: COLORS.inkMuted }}>{totalCount} in collection · {publicCount} public</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SPORT_FILTERS.map((s) => (
            <Pill key={s} active={activeSport === s} onClick={() => setActiveSport(s)}>{s}</Pill>
          ))}
          <span style={{ width: 1, background: COLORS.border, marginInline: 4 }}/>
          <Pill active={forSaleOnly} onClick={() => setForSaleOnly(!forSaleOnly)}>For sale</Pill>
        </div>
      </div>
    </div>
  );
}

function CollectionGrid({ items, onItem, onAdd }) {
  return (
    <div style={{ padding: '32px 56px 96px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
        {items.map((it) => (
          <button key={it.id} onClick={() => onItem(it.id)} style={{
            background: COLORS.paper, border: `1px solid ${COLORS.border}`, padding: 0,
            cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column',
          }}>
            <ItemImage tint={it.tint} height={240} glyph={it.glyph} badges={(it.badges || []).slice(0, 2)} eyebrow={it.usage}/>
            <div style={{ padding: '28px 28px 24px' }}>
              <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 18, fontWeight: 500, color: COLORS.ink, letterSpacing: '-0.015em', lineHeight: 1.3, textWrap: 'balance' }}>{it.title}</div>
              <div style={{ fontSize: 13, color: COLORS.inkMuted, marginTop: 10 }}>{findPlayer(it.player).name} · {it.sport}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 32 }}>
                <div>
                  <Eyebrow>Est. value</Eyebrow>
                  <Num size={22} weight={500} style={{ display: 'block', marginTop: 10, letterSpacing: '-0.015em' }}>${itemEstimateMid(it).toLocaleString()}</Num>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Eyebrow color={COLORS.inkFaint}>Vs. paid</Eyebrow>
                  <div style={{ marginTop: 10 }}><Delta pct={it.acquired > 0 ? ((itemEstimateMid(it) - it.acquired) / it.acquired) * 100 : 0}/></div>
                </div>
              </div>
            </div>
          </button>
        ))}
        <div
          role="button"
          tabIndex={0}
          onClick={onAdd}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onAdd?.();
            }
          }}
          style={{
            background: 'transparent', border: `1px dashed ${COLORS.inkSubtle}`,
            padding: '40px 28px', cursor: 'pointer', minHeight: 440,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18,
            color: COLORS.inkMuted,
          }}
        >
          <div style={{ fontSize: 40, lineHeight: 1, color: COLORS.inkSubtle, fontWeight: 300 }}>＋</div>
          <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 18, fontWeight: 500, color: COLORS.ink, letterSpacing: '-0.015em' }}>Add your next piece</div>
          <div style={{ fontSize: 13, color: COLORS.inkMuted, textAlign: 'center', maxWidth: 260, lineHeight: 1.55 }}>Snap the hologram and Stitched fills in the game, player, and comps.</div>
          <Button as="span" variant="secondary" size="sm" style={{ marginTop: 4, pointerEvents: 'none' }}>Add item →</Button>
        </div>
      </div>
    </div>
  );
}

export function CollectionScreen({ onItem, onAdd, items: collectionItems = ITEMS }) {
  const { collectionSummary, refreshCollectionSummary } = useApp();
  const [sport, setSport] = useState('All');
  const [forSaleOnly, setForSaleOnly] = useState(false);

  useEffect(() => { refreshCollectionSummary(); }, [refreshCollectionSummary, collectionItems.length]);

  const summary = useMemo(
    () => mergeCollectionSummary(collectionSummary, collectionItems),
    [collectionSummary, collectionItems],
  );

  const filtered = collectionItems.filter((i) => {
    if (sport !== 'All' && i.sport !== sport) return false;
    if (forSaleOnly && !i.forSale) return false;
    return true;
  });
  const publicCount = collectionItems.filter((i) => (i.visibility || 'public') === 'public').length;
  return (
    <>
      <CollectionHero totals={summary.totals}/>
      <CollectionChart totals={summary.totals} history={summary.history}/>
      <CollectionBreakdown summary={summary}/>
      <CollectionFilters activeSport={sport} setActiveSport={setSport} forSaleOnly={forSaleOnly} setForSaleOnly={setForSaleOnly} totalCount={collectionItems.length} publicCount={publicCount}/>
      <CollectionGrid items={filtered.length ? filtered : collectionItems} onItem={onItem} onAdd={onAdd}/>
    </>
  );
}
