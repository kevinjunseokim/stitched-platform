import { useEffect, useState } from 'react';

import { useApp } from '../context/AppDataContext';
import { COLORS } from '../theme/tokens';
import { Badge, Eyebrow, Num } from './atoms';

// Shared comp list used by item detail and player detail. Fetches on mount and
// re-fetches when the player/type/compact key changes.
export function CompsTable({ playerId, itemType, compact }) {
  const { api } = useApp();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.listComps({ player: playerId, type: itemType, limit: compact ? 6 : 50 })
      .then(({ comps }) => { if (!cancelled) setList(comps || []); })
      .catch(() => { if (!cancelled) setList([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [api, playerId, itemType, compact]);

  if (loading) {
    return <div style={{ padding: 28, color: COLORS.inkFaint, fontSize: 13 }}>Loading comps…</div>;
  }
  if (!list.length) {
    return <div style={{ padding: 28, color: COLORS.inkFaint, fontSize: 13 }}>No comps yet for this player.</div>;
  }

  const visible = compact ? list.slice(0, 4) : list;
  return (
    <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}` }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1.1fr 1fr 1fr 1fr 80px',
        padding: '14px 22px', borderBottom: `1px solid ${COLORS.ink}`,
      }}>
        <Eyebrow>Lot</Eyebrow><Eyebrow>House</Eyebrow><Eyebrow>Date</Eyebrow>
        <Eyebrow>Hammer</Eyebrow><Eyebrow>Confidence</Eyebrow><span/>
      </div>
      {visible.map((c, i) => (
        <div key={c.id} style={{
          display: 'grid', gridTemplateColumns: '2fr 1.1fr 1fr 1fr 1fr 80px',
          padding: '16px 22px', alignItems: 'center',
          borderBottom: i < visible.length - 1 ? `1px solid ${COLORS.borderFaint}` : 'none',
        }}>
          <div>
            <div style={{ fontSize: 14, color: COLORS.ink, fontWeight: 500, letterSpacing: '-0.005em' }}>{c.title}</div>
            <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 3 }}>{c.auth} · {c.type}</Eyebrow>
          </div>
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
      ))}
    </div>
  );
}
