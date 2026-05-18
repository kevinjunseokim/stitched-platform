// Stitched — Search & discovery.

import { useCallback, useEffect, useState } from 'react';

import { Avatar, Badge, Button, Delta, Eyebrow, Num } from '../../components/atoms';
import { Card } from '../../components/primitives';
import { useApp } from '../../context/AppDataContext';
import { COLORS } from '../../theme/tokens';

export function SearchScreen({ onItem, onPlayer, onProfile }) {
  const { api, user, openAuth } = useApp();
  const [q, setQ] = useState('');
  const [results, setResults] = useState({ items: [], players: [], comps: [], collectors: [] });
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chips, setChips] = useState([]);
  const [notice, setNotice] = useState('');

  const refreshSaved = useCallback(async () => {
    if (!user) { setSaved([]); return; }
    try {
      const { savedSearches } = await api.savedSearches();
      setSaved(savedSearches || []);
    } catch { setSaved([]); }
  }, [api, user]);

  useEffect(() => { refreshSaved(); }, [refreshSaved]);

  useEffect(() => {
    const query = q.trim();
    if (!query) { setResults({ items: [], players: [], comps: [], collectors: [] }); return undefined; }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await api.search(query);
        setResults(res);
        const tokens = query.split(/\s+/).filter(Boolean).slice(0, 6);
        setChips(tokens);
      } catch {
        // Leave previous results in place on transient failures.
      } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(handle);
  }, [q, api]);

  const saveCurrent = async () => {
    if (!user) { openAuth('signin'); return; }
    if (!q.trim()) return;
    try {
      await api.saveSearch({ name: q.trim(), query: q.trim() });
      setNotice('Saved search.');
      refreshSaved();
      setTimeout(() => setNotice(''), 2000);
    } catch (err) { setNotice(err.message || 'Could not save'); }
  };

  const createAlert = async () => {
    if (!user) { openAuth('signin'); return; }
    if (!q.trim()) return;
    try {
      const { savedSearch } = await api.saveSearch({ name: q.trim(), query: q.trim() });
      await api.addWatchlist({ targetType: 'saved_search', targetId: String(savedSearch.id), label: q.trim(), alertPct: 5, alertFreq: 'daily', channels: ['push'] });
      setNotice('Alert created.');
      refreshSaved();
      setTimeout(() => setNotice(''), 2000);
    } catch (err) { setNotice(err.message || 'Could not create alert'); }
  };

  const removeChip = (chip) => {
    setQ((prev) => prev.split(/\s+/).filter((t) => t.toLowerCase() !== chip.toLowerCase()).join(' '));
  };

  return (
    <div style={{ padding: '48px 56px 96px' }}>
      <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.ink}`, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <i className="iconoir-search" style={{ fontSize: 22, color: COLORS.inkSubtle }}/>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search players, items, comps, collectors…" style={{
            flex: 1, border: 'none', background: 'transparent', outline: 'none',
            fontFamily: "'Geist', sans-serif", fontSize: 24, fontWeight: 500,
            color: COLORS.ink, letterSpacing: '-0.015em',
          }}/>
          <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 11, color: COLORS.inkFaint, letterSpacing: '0.08em' }}>{loading ? 'Searching…' : '⌘K'}</span>
        </div>
        {chips.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, paddingTop: 16, borderTop: `1px solid ${COLORS.borderFaint}`, flexWrap: 'wrap' }}>
            <Eyebrow color={COLORS.clay}>✦ Tokens</Eyebrow>
            {chips.map((c) => (
              <span key={c} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontFamily: "'Geist', sans-serif", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
                padding: '6px 10px', background: COLORS.paper, border: `1px solid ${COLORS.ink}`,
              }}>
                {c}
                <button type="button" onClick={() => removeChip(c)} style={{ color: COLORS.inkSubtle, cursor: 'pointer', background: 'transparent', border: 'none', padding: 0, fontSize: 11 }}>✕</button>
              </span>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
              {notice && <Eyebrow color={COLORS.field}>{notice}</Eyebrow>}
              <Button variant="secondary" size="sm" onClick={createAlert}><i className="iconoir-bell" style={{ fontSize: 12, marginRight: 6 }}/> Create alert</Button>
              <Button variant="primary" size="sm" onClick={saveCurrent}><i className="iconoir-bookmark" style={{ fontSize: 12, marginRight: 6 }}/> Save search</Button>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginTop: 32 }}>
        {results.players.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: `1px solid ${COLORS.ink}`, paddingBottom: 14, marginBottom: 18 }}>
              <Eyebrow>Players</Eyebrow>
              <Eyebrow color={COLORS.inkFaint}>{results.players.length} matches</Eyebrow>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {results.players.map((p) => (
                <button key={p.id} onClick={() => onPlayer(p.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 18, padding: 18,
                  background: COLORS.paper, border: `1px solid ${COLORS.border}`, cursor: 'pointer', textAlign: 'left', width: '100%',
                }}>
                  <Avatar initials={p.initials} size={48} color={p.color}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>{p.name}</div>
                    <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 4 }}>{p.sport} · {p.team}</Eyebrow>
                  </div>
                  <div><Eyebrow>Index</Eyebrow><Num size={18} weight={500} style={{ display: 'block', marginTop: 4 }}>{Number(p.index || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Num></div>
                  <div><Eyebrow>30d</Eyebrow><div style={{ marginTop: 4 }}><Delta pct={p.d30}/></div></div>
                </button>
              ))}
            </div>
          </section>
        )}

        {results.items.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: `1px solid ${COLORS.ink}`, paddingBottom: 14, marginBottom: 18 }}>
              <Eyebrow>Items</Eyebrow>
              <Eyebrow color={COLORS.inkFaint}>{results.items.length} matches</Eyebrow>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {results.items.map((it) => (
                <button key={it.id} onClick={() => onItem(it.id)} style={{
                  display: 'flex', gap: 14, padding: 14, background: COLORS.paper, border: `1px solid ${COLORS.border}`, cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ width: 80, height: 100, background: `linear-gradient(155deg, ${it.tint || COLORS.leather}, ${COLORS.leatherDeep})`, position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', inset: 4, border: '1px solid rgba(250,250,245,0.18)' }}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.ink, letterSpacing: '-0.005em', lineHeight: 1.3, textWrap: 'balance' }}>{it.title}</div>
                    <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 6 }}>
                      {it.sport} · {it.type}
                      {it.ownerUser?.handle && (
                        <> · <span
                          role="link"
                          tabIndex={0}
                          onClick={(event) => { event.stopPropagation(); onProfile?.(it.ownerUser.handle); }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              event.stopPropagation();
                              onProfile?.(it.ownerUser.handle);
                            }
                          }}
                          style={{ textDecoration: 'underline', cursor: 'pointer' }}
                        >@{it.ownerUser.handle}</span></>
                      )}
                    </Eyebrow>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {(it.badges || []).slice(0, 2).map((b, j) => <Badge key={j} kind={b.kind}>{b.label}</Badge>)}
                    </div>
                    <Num size={16} weight={500} style={{ display: 'block', marginTop: 10 }}>${(it.estimate?.mid || 0).toLocaleString()}</Num>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {results.comps.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: `1px solid ${COLORS.ink}`, paddingBottom: 14, marginBottom: 18 }}>
              <Eyebrow>Auction comps</Eyebrow>
              <Eyebrow color={COLORS.inkFaint}>{results.comps.length} matches</Eyebrow>
            </div>
            <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '14px 22px', borderBottom: `1px solid ${COLORS.ink}` }}>
                <Eyebrow>Lot</Eyebrow><Eyebrow>House</Eyebrow><Eyebrow>Date</Eyebrow><Eyebrow>Hammer</Eyebrow>
              </div>
              {results.comps.map((c, i, arr) => (
                <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '14px 22px', alignItems: 'center', borderBottom: i < arr.length - 1 ? `1px solid ${COLORS.borderFaint}` : 'none' }}>
                  <div>
                    <div style={{ fontSize: 14, color: COLORS.ink, fontWeight: 500 }}>{c.title}</div>
                    <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 3 }}>{c.auth} · {c.type}</Eyebrow>
                  </div>
                  <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{c.source}</div>
                  <Num size={13}>{c.date}</Num>
                  <Num size={15} weight={500}>${(c.price || 0).toLocaleString()}</Num>
                </div>
              ))}
            </div>
          </section>
        )}

        {results.collectors.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: `1px solid ${COLORS.ink}`, paddingBottom: 14, marginBottom: 18 }}>
              <Eyebrow>Collectors</Eyebrow>
              <Eyebrow color={COLORS.inkFaint}>{results.collectors.length} matches</Eyebrow>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {results.collectors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => c.handle && onProfile?.(c.handle)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: 16,
                    background: COLORS.paper, border: `1px solid ${COLORS.border}`,
                    cursor: c.handle ? 'pointer' : 'default', width: '100%', textAlign: 'left',
                  }}
                >
                  <Avatar initials={c.initials || (c.displayName || '').split(' ').map((s) => s[0]).join('').slice(0, 2)} size={42}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{c.displayName}</div>
                    <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 4 }}>@{c.handle}</Eyebrow>
                  </div>
                  <i className="iconoir-nav-arrow-right" style={{ fontSize: 16, color: COLORS.inkFaint }}/>
                </button>
              ))}
            </div>
          </section>
        )}

        {!loading && q && results.items.length === 0 && results.players.length === 0 && results.comps.length === 0 && results.collectors.length === 0 && (
          <Card style={{ padding: 28, textAlign: 'center' }}>
            <Eyebrow color={COLORS.inkFaint}>No matches</Eyebrow>
            <div style={{ fontSize: 14, color: COLORS.inkMuted, marginTop: 8 }}>Try a player name, lot title, or item type.</div>
          </Card>
        )}

        {user && saved.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: `1px solid ${COLORS.ink}`, paddingBottom: 14, marginBottom: 18 }}>
              <Eyebrow>Your saved searches · {saved.length}</Eyebrow>
            </div>
            <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}` }}>
              {saved.map((s, i, arr) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: i < arr.length - 1 ? `1px solid ${COLORS.borderFaint}` : 'none' }}>
                  <i className="iconoir-bookmark-solid" style={{ fontSize: 16, color: COLORS.field }}/>
                  <button onClick={() => setQ(s.query || s.name)} style={{ flex: 1, textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, color: COLORS.ink }}>{s.name}</button>
                  <button onClick={async () => { try { await api.deleteSavedSearch(s.id); refreshSaved(); } catch { /* silent */ } }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: COLORS.inkSubtle, fontSize: 13 }}>Remove</button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
