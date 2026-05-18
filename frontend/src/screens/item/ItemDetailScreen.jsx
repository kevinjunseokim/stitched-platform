// Stitched — Item detail page.

import { useEffect, useState } from 'react';

import { Avatar, Badge, Button, Delta, Eyebrow, Num } from '../../components/atoms';
import { CompsTable } from '../../components/CompsTable';
import { Modal } from '../../components/Modal';
import { SectionHeading } from '../../components/SectionHeading';
import { AuthTick, Input, ItemImage, Pill, Toggle } from '../../components/primitives';
import { useApp } from '../../context/AppDataContext';
import { findItem, findPlayer } from '../../data/mocks';
import { cacheItem } from '../../data/registry';
import { COLORS } from '../../theme/tokens';
import { formatRelative } from '../../utils/format';
import { resolveItemOwner } from '../../utils/itemOwner';

function ItemOwnerLink({ owner, isOwner, onProfile }) {
  if (!owner?.handle) return null;
  const label = isOwner ? 'You' : (owner.displayName || owner.handle);
  const openProfile = () => onProfile?.(owner.handle);

  return (
    <button
      type="button"
      onClick={openProfile}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
        background: COLORS.paper, border: `1px solid ${COLORS.border}`, cursor: 'pointer',
        textAlign: 'left', width: '100%',
      }}
    >
      <Avatar initials={owner.initials || label.slice(0, 2).toUpperCase()} size={28} color={owner.color || COLORS.leather}/>
      <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.ink, whiteSpace: 'nowrap' }}>{label}</span>
      <Eyebrow color={COLORS.inkFaint} style={{ whiteSpace: 'nowrap' }}>@{owner.handle}</Eyebrow>
    </button>
  );
}

function itemToEstimatePayload(item) {
  return {
    player: item.player,
    type: item.type,
    sport: item.sport,
    team: item.team,
    usage: item.usage,
    auth: item.auth,
    rookie: item.rookie,
    postseason: item.postseason,
    notes: item.notes,
    provenance: item.provenance,
    acquired: item.acquired,
    season: item.season,
    gameDate: item.gameDate,
  };
}

/** Prefer trait/comp adjustments; fall back to index anchor when those are absent. */
function getDisplayFactors(valuation) {
  const all = valuation?.factors || [];
  const adjustments = all.filter((f) => f.weight !== 'base');
  return (adjustments.length ? adjustments : all).slice(0, 6);
}

function buildFactorsFromItem(item) {
  const factors = [];
  const player = item.player ? findPlayer(item.player) : null;
  if (player?.name) {
    factors.push({
      dir: 'up',
      label: `${player.name} index`,
      weight: 'base',
    });
  }
  const usage = (item.usage || '').toLowerCase();
  if (usage.includes('photo')) {
    factors.push({ dir: 'up', label: 'Photo-matched', weight: '+35%' });
  } else if (usage.includes('game')) {
    factors.push({ dir: 'up', label: 'Game-used', weight: '+15%' });
  } else if (usage.includes('signed')) {
    factors.push({ dir: 'up', label: 'Signed', weight: '+10%' });
  }
  if (item.rookie) factors.push({ dir: 'up', label: 'Rookie season', weight: '+18%' });
  if (item.postseason) factors.push({ dir: 'up', label: 'Postseason game', weight: '+25%' });
  if (item.auth) factors.push({ dir: 'up', label: `${item.auth} authenticated`, weight: '+10%' });
  return getDisplayFactors({ factors });
}

function backLabelForItem(isOwner, owner) {
  if (isOwner) return 'My collection';
  if (owner?.displayName) return `${owner.displayName}'s collection`;
  if (owner?.handle) return `@${owner.handle}'s collection`;
  return 'Collection';
}

function ItemHeader({ item, onBack, backLabel }) {
  return (
    <div style={{ padding: '36px 56px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: COLORS.inkMuted, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8, padding: 0 }}>
          <i className="iconoir-arrow-left" style={{ fontSize: 14 }}/> {backLabel}
        </button>
        <span style={{ color: COLORS.inkFaint }}>/</span>
        <Eyebrow color={COLORS.inkFaint}>{item.sport} · {findPlayer(item.player).name}</Eyebrow>
      </div>
    </div>
  );
}

function ItemGallery({ item }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 80 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ height: 80, background: `linear-gradient(155deg, ${item.tint}, ${COLORS.leatherDeep})`, border: `1px solid ${i === 0 ? COLORS.ink : COLORS.border}`, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 4, border: '1px solid rgba(250,250,245,0.16)' }}/>
            <div style={{ position: 'absolute', bottom: 4, left: 6, fontFamily: "'Geist', sans-serif", fontSize: 8, letterSpacing: '0.1em', color: 'rgba(250,250,245,0.65)' }}>0{i + 1}</div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }}>
        <ItemImage tint={item.tint} height={520} glyph={item.glyph} badges={item.badges} eyebrow={`${item.usage} · ${item.season}${item.gameDate ? ' · ' + new Date(item.gameDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}`} mono={item.cert}/>
      </div>
    </div>
  );
}

function ItemSummary({ item, onPlayer, onProfile, onRevalue, onEdit, onListToggle, isOwner, busy }) {
  const player = findPlayer(item.player);
  const owner = resolveItemOwner(item);
  const { api, user, openAuth } = useApp();
  const mid = item.estimate?.mid || 0;
  const low = item.estimate?.low || mid;
  const high = item.estimate?.high || mid;
  const acquired = item.acquired || 0;
  const gainPct = acquired ? ((mid - acquired) / acquired) * 100 : 0;
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes || 0);
  const [likeBusy, setLikeBusy] = useState(false);

  useEffect(() => { setLikeCount(item.likes || 0); }, [item.id, item.likes]);

  const toggleLike = async () => {
    if (!user) { openAuth('signin'); return; }
    setLikeBusy(true);
    try {
      if (liked) {
        await api.unlike('item', item.id);
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        await api.like('item', item.id);
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    } catch {
      // Heart state self-corrects on next item refresh.
    } finally { setLikeBusy(false); }
  };

  return (
    <div>
      {owner?.handle && (
        <div style={{ marginBottom: 18, width: '100%' }}>
          <ItemOwnerLink owner={owner} isOwner={isOwner} onProfile={onProfile}/>
        </div>
      )}
      <Eyebrow>{item.sport}{item.usage ? ` · ${item.usage}` : ''}{item.gameDate ? ` · ${item.gameDate}` : ''}</Eyebrow>
      <h1 style={{ fontFamily: "'Geist', sans-serif", fontSize: 40, fontWeight: 500, letterSpacing: '-0.025em', margin: '14px 0 18px', lineHeight: 1.05, textWrap: 'balance' }}>
        {item.title}
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => onPlayer(item.player)} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
          background: COLORS.paper, border: `1px solid ${COLORS.border}`, cursor: 'pointer',
        }}>
          <Avatar initials={player.initials} size={26} color={player.color}/>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{player.name}</span>
          <Eyebrow color={COLORS.inkFaint}>{player.team}</Eyebrow>
        </button>
        {item.auth && <AuthTick source={item.auth}/>}
      </div>

      <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, padding: '22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
          <div>
            <Eyebrow>Estimated value · stitched</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 10 }}>
              <Num size={36} weight={500} style={{ letterSpacing: '-0.02em' }}>${mid.toLocaleString()}</Num>
              <Eyebrow color={COLORS.inkFaint}>${low.toLocaleString()} – ${high.toLocaleString()}</Eyebrow>
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Badge kind={item.confidence === 'High' ? 'field' : item.confidence === 'Medium' ? 'pending' : 'default'}>{item.confidence || 'Medium'} CONFIDENCE</Badge>
              {item.forSale && <Badge kind="pending">FOR SALE{item.askingPrice ? ` · $${item.askingPrice.toLocaleString()}` : ''}</Badge>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Eyebrow>You paid</Eyebrow>
            <Num size={20} weight={500} style={{ display: 'block', marginTop: 8 }}>${acquired.toLocaleString()}</Num>
            <div style={{ marginTop: 6 }}><Delta pct={gainPct}/></div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
        {isOwner && <Button variant="primary" size="md" onClick={onRevalue}>{busy ? 'Re-valuing…' : 'Get fresh estimate'}</Button>}
        {isOwner && <Button variant="secondary" size="md" onClick={onEdit}>Edit details</Button>}
        {isOwner && (
          <Button variant="secondary" size="md" onClick={onListToggle}>
            {item.forSale ? 'Unlist' : 'List for sale'}
          </Button>
        )}
        <button onClick={toggleLike} disabled={likeBusy} style={{
          padding: '12px 14px', background: COLORS.paper, border: `1px solid ${COLORS.ink}`,
          cursor: likeBusy ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
          color: liked ? COLORS.clay : COLORS.ink, fontSize: 13, fontFamily: "'Geist', sans-serif", letterSpacing: '0.08em',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          {likeCount}
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 22 }}>
        {(item.tags || []).map((t) => <Pill key={t} style={{ pointerEvents: 'none' }}>{t}</Pill>)}
      </div>
    </div>
  );
}

function ItemEditModal({ item, onClose, onSaved }) {
  const { api } = useApp();
  const [draft, setDraft] = useState({
    title: item.title || '',
    sport: item.sport || '',
    type: item.type || '',
    season: item.season || '',
    team: item.team || '',
    usage: item.usage || '',
    auth: item.auth || '',
    notes: item.notes || '',
    asking: item.askingPrice || '',
    visibility: item.visibility || 'public',
    forSale: !!item.forSale,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { item: updated } = await api.updateItem(item.id, draft);
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Unable to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal width={560} onClose={onClose} zIndex={110}>
      <Eyebrow>Edit item</Eyebrow>
      <h2 style={{ fontFamily: "'Geist', sans-serif", fontSize: 24, fontWeight: 500, margin: '8px 0 24px', letterSpacing: '-0.02em' }}>{item.title}</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="TITLE" value={draft.title} onChange={(v) => setDraft((d) => ({ ...d, title: v }))}/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Input label="SPORT" value={draft.sport} onChange={(v) => setDraft((d) => ({ ...d, sport: v }))}/>
          <Input label="TYPE" value={draft.type} onChange={(v) => setDraft((d) => ({ ...d, type: v }))}/>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Input label="SEASON" value={draft.season} onChange={(v) => setDraft((d) => ({ ...d, season: v }))}/>
          <Input label="TEAM" value={draft.team} onChange={(v) => setDraft((d) => ({ ...d, team: v }))}/>
        </div>
        <Input label="USAGE" value={draft.usage} onChange={(v) => setDraft((d) => ({ ...d, usage: v }))}/>
        <Input label="AUTHENTICATION" value={draft.auth} onChange={(v) => setDraft((d) => ({ ...d, auth: v }))}/>
        <Input label="NOTES" value={draft.notes} onChange={(v) => setDraft((d) => ({ ...d, notes: v }))}/>
        <Toggle checked={draft.forSale} onChange={(v) => setDraft((d) => ({ ...d, forSale: v }))} label="List for sale" help="Other collectors can see your asking price."/>
        {draft.forSale && (
          <Input label="ASKING PRICE" value={draft.asking} onChange={(v) => setDraft((d) => ({ ...d, asking: v }))} prefix="$"/>
        )}
        {error && <div style={{ fontSize: 13, color: COLORS.clay }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md">{saving ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function AIValuationModule({ item, valuation, onRevalue, busy }) {
  const mid = item.estimate?.mid || 0;
  const low = item.estimate?.low || mid;
  const high = item.estimate?.high || mid;
  const compsUsed = valuation?.compsUsed || [];
  const compsConsidered = valuation?.compsConsidered;
  const factors = valuation
    ? getDisplayFactors(valuation)
    : buildFactorsFromItem(item);

  return (
    <section style={{ marginTop: 36 }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        borderBottom: `1px solid ${COLORS.ink}`, paddingBottom: 14, marginBottom: 22,
      }}>
        <div>
          <Eyebrow color={COLORS.clay}>✦ AI Valuation · stitched</Eyebrow>
          <h2 style={{ fontFamily: "'Geist', sans-serif", fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', margin: '8px 0 0', lineHeight: 1 }}>How we got to <Num size={28} weight={500}>${mid.toLocaleString()}</Num>.</h2>
        </div>
        <Button variant="secondary" size="sm" onClick={onRevalue}>{busy ? 'Re-running…' : 'Re-run with latest comps'}</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, padding: '22px 24px' }}>
          <Eyebrow>Range</Eyebrow>
          <div style={{ marginTop: 18 }}>
            <div style={{ position: 'relative', width: '100%', minHeight: 48, marginBottom: 14 }}>
              <div style={{
                position: 'absolute',
                left: '46%',
                top: 0,
                transform: 'translateX(-50%)',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}>
                <Eyebrow color={COLORS.clay}>Stitched est</Eyebrow>
                <Num size={20} weight={500} style={{ display: 'block', marginTop: 4, lineHeight: 1.2 }}>${mid.toLocaleString()}</Num>
              </div>
            </div>
            <div style={{ position: 'relative', height: 6, background: COLORS.paperSunken, border: `1px solid ${COLORS.border}`, marginBottom: 10 }}>
              <div style={{ position: 'absolute', left: '18%', right: '18%', top: 0, bottom: 0, background: COLORS.field }}/>
              <div style={{
                position: 'absolute',
                left: '46%',
                top: 0,
                width: 2,
                height: 22,
                background: COLORS.clay,
                transform: 'translate(-50%, 0)',
              }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Geist', sans-serif", fontSize: 14, fontWeight: 500 }}>
              <span>${low.toLocaleString()}</span>
              <span>${high.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${COLORS.borderFaint}` }}>
            <Eyebrow style={{ marginBottom: 10 }}>What's moving the needle</Eyebrow>
            {factors.length === 0 ? (
              <div style={{ fontSize: 13, color: COLORS.inkFaint, padding: '8px 0 4px' }}>
                Re-run valuation to see index, trait, and comp drivers for this piece.
              </div>
            ) : (
              factors.map((f, i) => {
                const isBase = f.weight === 'base';
                return (
                  <div key={`${f.label}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < factors.length - 1 ? `1px solid ${COLORS.borderFaint}` : 'none' }}>
                    <div style={{
                      width: 22, height: 22, fontFamily: "'Geist', sans-serif", fontSize: 12,
                      background: isBase ? COLORS.paperSunken : (f.dir === 'up' ? COLORS.field : COLORS.clay),
                      color: isBase ? COLORS.inkMuted : COLORS.chalk,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>{isBase ? '◎' : (f.dir === 'up' ? '↑' : '↓')}</div>
                    <div style={{ flex: 1, fontSize: 13.5 }}>{f.label}</div>
                    <Num size={13} weight={500} color={isBase ? COLORS.inkMuted : (f.dir === 'up' ? COLORS.fieldMid : COLORS.clay)}>
                      {isBase ? 'Anchor' : f.weight}
                    </Num>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div style={{ background: COLORS.field, color: COLORS.chalk, padding: '22px 24px' }}>
          <Eyebrow color="rgba(250,250,245,0.6)">Suggested listing</Eyebrow>
          <Num size={28} weight={500} color={COLORS.chalk} style={{ display: 'block', marginTop: 10, letterSpacing: '-0.02em' }}>${Math.round(mid * 1.05).toLocaleString()} – ${Math.round(high * 1.05).toLocaleString()}</Num>
          <div style={{ fontSize: 13, color: 'rgba(250,250,245,0.78)', marginTop: 12, lineHeight: 1.55 }}>
            Based on {compsUsed.length || 'recent'} comps{compsConsidered ? ` (of ${compsConsidered} considered)` : ''} matching {item.type || 'this item type'} for {findPlayer(item.player).name}.
          </div>
          <div style={{ marginTop: 22, padding: 14, background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(250,250,245,0.22)' }}>
            <Eyebrow color="rgba(250,250,245,0.55)">Disclaimer</Eyebrow>
            <div style={{ fontSize: 12, color: 'rgba(250,250,245,0.78)', marginTop: 6, lineHeight: 1.5 }}>
              Estimates are not appraisals. Stitched draws on public auction results plus our authentication-weighted index. Treat them as a working range, not a guarantee.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ItemComments({ item }) {
  const { api, user, openAuth } = useApp();
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.listComments('item', item.id)
      .then(({ comments: list }) => { if (!cancelled) setComments(list || []); })
      .catch(() => { if (!cancelled) setComments([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [api, item.id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) { openAuth('signin'); return; }
    if (!draft.trim()) return;
    setPosting(true);
    try {
      const { comment } = await api.postComment('item', item.id, draft.trim());
      setComments((prev) => [...prev, comment]);
      setDraft('');
    } catch {
      // Surface via toast in a future iteration.
    } finally { setPosting(false); }
  };

  return (
    <section style={{ marginTop: 40 }}>
      <SectionHeading title="Comments" meta={`${comments.length} · Oldest first`} style={{ marginBottom: 22 }}/>
      <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}` }}>
        {loading && <div style={{ padding: 22, color: COLORS.inkFaint, fontSize: 13 }}>Loading…</div>}
        {!loading && comments.length === 0 && (
          <div style={{ padding: 22, color: COLORS.inkFaint, fontSize: 13 }}>No comments yet. Be the first.</div>
        )}
        {comments.map((c, i, arr) => (
          <div key={c.id} style={{ display: 'flex', gap: 14, padding: '18px 22px', borderBottom: i < arr.length ? `1px solid ${COLORS.borderFaint}` : 'none' }}>
            <Avatar initials={c.author?.initials || 'U'} size={36}/>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{c.author?.displayName || 'Collector'}</div>
                <Eyebrow color={COLORS.inkFaint}>{formatRelative(c.createdAt).toUpperCase()} AGO</Eyebrow>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: COLORS.ink, margin: '8px 0 0' }}>{c.body}</p>
            </div>
          </div>
        ))}
        <form onSubmit={submit} style={{ display: 'flex', gap: 12, padding: '18px 22px' }}>
          <Avatar initials={user?.initials || 'U'} size={32} color={COLORS.leather}/>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a comment…" style={{
            flex: 1, padding: '10px 12px', border: `1px solid ${COLORS.border}`,
            background: COLORS.paper, fontFamily: 'inherit', fontSize: 14, color: COLORS.ink,
          }}/>
          <Button variant="primary" size="sm">{posting ? 'Posting…' : 'Post'}</Button>
        </form>
      </div>
    </section>
  );
}

function ItemDetailExtras({ item }) {
  return (
    <>
      <section style={{ marginTop: 40 }}>
        <SectionHeading
          title="Comparable auction sales"
          meta={`${findPlayer(item.player).name} · ${item.type}`}
          style={{ marginBottom: 22 }}
        />
        <CompsTable playerId={item.player} itemType={item.type}/>
      </section>

      <section style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        <div>
          <Eyebrow style={{ marginBottom: 12 }}>Owner notes</Eyebrow>
          <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, padding: '20px 22px' }}>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: COLORS.ink, margin: 0, textWrap: 'pretty' }}>{item.notes || 'No notes yet.'}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.borderFaint}` }}>
              <Avatar initials="KV" size={28} color={COLORS.leather}/>
              <Eyebrow color={COLORS.inkFaint}>ADDED {formatRelative(item.createdAt).toUpperCase()} AGO</Eyebrow>
            </div>
          </div>
        </div>
        <div>
          <Eyebrow style={{ marginBottom: 12 }}>Details</Eyebrow>
          <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}` }}>
            {[
              { l: 'TYPE', v: item.type },
              { l: 'SEASON', v: item.season },
              { l: 'AUTHENTICATION', v: item.auth },
              { l: 'CERT #', v: item.cert, mono: true },
              { l: 'USAGE', v: item.usage },
              { l: 'ACQUIRED', v: item.acquired ? `$${item.acquired.toLocaleString()}${item.acquiredDate ? ` · ${item.acquiredDate}` : ''}` : '—' },
              { l: 'VISIBILITY', v: item.forSale ? 'Public · For sale' : (item.visibility ? item.visibility.charAt(0).toUpperCase() + item.visibility.slice(1) : 'Public') },
            ].filter((r) => r.v).map((r, i, arr) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, padding: '12px 18px', borderBottom: i < arr.length - 1 ? `1px solid ${COLORS.borderFaint}` : 'none' }}>
                <Eyebrow color={COLORS.inkFaint}>{r.l}</Eyebrow>
                <div style={{ fontSize: 13, fontFamily: "'Geist', sans-serif", letterSpacing: r.mono ? '0.06em' : 0, color: COLORS.ink }}>{r.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ItemComments item={item}/>
    </>
  );
}

function ItemDetailLoading({ onBack, backLabel, message }) {
  return (
    <>
      <div style={{ padding: '36px 56px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <button onClick={onBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: COLORS.inkMuted, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8, padding: 0 }}>
            <i className="iconoir-arrow-left" style={{ fontSize: 14 }}/> {backLabel || 'Back'}
          </button>
        </div>
      </div>
      <div style={{ padding: '32px 56px 96px' }}>
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, padding: '40px 32px', textAlign: 'center' }}>
          <Eyebrow color={COLORS.inkFaint}>{message || 'Loading piece…'}</Eyebrow>
        </div>
      </div>
    </>
  );
}

export function ItemDetailScreen({ id, onPlayer, onProfile, onBack }) {
  const { user, refreshItems, refreshFeed, refreshCollectionSummary, api } = useApp();
  const initialItem = findItem(id);
  const [liveItem, setLiveItem] = useState(initialItem);
  const [valuation, setValuation] = useState(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLiveItem(findItem(id));
    setLoadError(false);
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    api.getItem(id)
      .then(({ item, valuation: breakdown }) => {
        if (cancelled) return;
        setLiveItem(item);
        cacheItem(item);
        if (breakdown) {
          setValuation(breakdown);
          return;
        }
        if (!user) return;
        api.estimateItem(itemToEstimatePayload(item))
          .then(({ valuation: estimate }) => {
            if (!cancelled && estimate) setValuation(estimate);
          })
          .catch(() => {});
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => { cancelled = true; };
  }, [api, id, user]);

  const item = liveItem;
  const previewItem = item || findItem(id);
  const owner = previewItem ? resolveItemOwner(previewItem) : null;
  const isOwner = !!(user && previewItem?.userId && user.id === previewItem.userId);
  const backLabel = backLabelForItem(isOwner, owner);
  const handleBack = () => {
    if (isOwner) onBack?.();
    else if (owner?.handle) onProfile?.(owner.handle);
    else onBack?.();
  };

  const handleRevalue = async () => {
    if (!isOwner || !item) return;
    setBusy(true);
    try {
      const result = await api.revalueItem(item.id);
      setLiveItem(result.item);
      cacheItem(result.item);
      setValuation(result.valuation);
      refreshCollectionSummary();
    } catch {
      // Estimates fall back to last cached values.
    } finally { setBusy(false); }
  };

  const handleListToggle = async () => {
    if (!isOwner || !item) return;
    setBusy(true);
    try {
      const action = item.forSale ? api.unlist(item.id) : api.listForSale(item.id, { askingPrice: item.askingPrice || item.estimate?.mid || 0 });
      const { item: updated } = await action;
      setLiveItem(updated);
      cacheItem(updated);
      refreshItems();
      refreshFeed();
    } catch {
      // Forsale toggle reverts on next refresh.
    } finally { setBusy(false); }
  };

  if (!item) {
    return (
      <ItemDetailLoading
        onBack={handleBack}
        backLabel={backLabel}
        message={loadError ? 'This piece is unavailable or private.' : 'Loading piece…'}
      />
    );
  }

  return (
    <>
      <ItemHeader item={item} onBack={handleBack} backLabel={backLabel}/>
      <div style={{ padding: '32px 56px 96px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 64 }}>
          <ItemGallery item={item}/>
          <ItemSummary
            item={item}
            onPlayer={onPlayer}
            onProfile={onProfile}
            onRevalue={handleRevalue}
            onEdit={() => setEditing(true)}
            onListToggle={handleListToggle}
            isOwner={isOwner}
            busy={busy}
          />
        </div>
        <AIValuationModule item={item} valuation={valuation} onRevalue={handleRevalue} busy={busy}/>
        <ItemDetailExtras item={item}/>
      </div>
      {editing && (
        <ItemEditModal item={item} onClose={() => setEditing(false)} onSaved={(updated) => {
          setLiveItem(updated);
          cacheItem(updated);
          refreshItems();
          refreshCollectionSummary();
        }}/>
      )}
    </>
  );
}
