// Stitched — Public profile / collection page.

import { useCallback, useEffect, useState } from 'react';

import { Avatar, Badge, Button, Delta, Eyebrow, Num } from '../../components/atoms';
import { Modal } from '../../components/Modal';
import { Card, Input, ItemImage, Pill } from '../../components/primitives';
import { useApp } from '../../context/AppDataContext';
import { SPORT_FILTERS, findPlayer } from '../../data/mocks';
import { COLORS } from '../../theme/tokens';
import { formatRelative } from '../../utils/format';

function ProfileEditModal({ user, onClose, onSaved }) {
  const { api } = useApp();
  const [draft, setDraft] = useState({
    displayName: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    handle: user.handle || '',
    bio: user.bio || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { user: updated } = await api.updateMe(draft);
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Unable to save.');
    } finally { setSaving(false); }
  };

  return (
    <Modal width={480} onClose={onClose} zIndex={110}>
      <Eyebrow>Edit profile</Eyebrow>
      <h2 style={{ fontFamily: "'Geist', sans-serif", fontSize: 24, fontWeight: 500, margin: '8px 0 22px', letterSpacing: '-0.02em' }}>Your details</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="DISPLAY NAME" value={draft.displayName} onChange={(v) => setDraft((d) => ({ ...d, displayName: v }))}/>
        <Input label="HANDLE" value={draft.handle} onChange={(v) => setDraft((d) => ({ ...d, handle: v.toLowerCase() }))}/>
        <Input label="BIO" value={draft.bio} onChange={(v) => setDraft((d) => ({ ...d, bio: v }))}/>
        {error && <div style={{ fontSize: 13, color: COLORS.clay }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
          <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md">{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ProfileCollectionTab({ items, sport, setSport, onItem }) {
  const sports = SPORT_FILTERS;
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
        <Eyebrow>Public collection · {items.length} pieces</Eyebrow>
        <div style={{ display: 'flex', gap: 8 }}>
          {sports.map((s) => <Pill key={s} active={s === sport} onClick={() => setSport(s)}>{s}</Pill>)}
        </div>
      </div>
      {items.length === 0 ? (
        <Card style={{ padding: 28, textAlign: 'center' }}>
          <Eyebrow color={COLORS.inkFaint}>Nothing public yet</Eyebrow>
          <div style={{ fontSize: 14, color: COLORS.inkMuted, marginTop: 8 }}>Add items to your collection — public pieces show here.</div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {items.map((it) => (
            <button key={it.id} onClick={() => onItem(it.id)} style={{
              background: COLORS.paper, border: `1px solid ${COLORS.border}`, padding: 0, cursor: 'pointer', textAlign: 'left',
            }}>
              <ItemImage tint={it.tint} height={180} glyph={it.glyph} mark={false} badges={(it.badges || []).slice(0, 1)}/>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, textWrap: 'balance' }}>{it.title}</div>
                <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 8 }}>{findPlayer(it.player).name}</Eyebrow>
                <Num size={16} weight={500} style={{ display: 'block', marginTop: 10 }}>${(it.estimate?.mid || 0).toLocaleString()}</Num>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function ActivityTab({ events }) {
  if (!events || events.length === 0) {
    return <Card style={{ padding: 24 }}><Eyebrow color={COLORS.inkFaint}>No recent activity</Eyebrow></Card>;
  }
  const labelFor = (k) => ({ added: '+ ADDED', listed: 'FOR SALE', sold: 'SOLD', updated: 'UPDATED' }[k] || (k || '').toUpperCase());
  const badgeFor = (k) => ({ added: 'field', listed: 'pending', sold: 'pending', updated: 'default' }[k] || 'default');
  return (
    <>
      <Eyebrow style={{ marginBottom: 14 }}>Recent activity</Eyebrow>
      <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}` }}>
        {events.map((e, i, arr) => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 22px', borderBottom: i < arr.length - 1 ? `1px solid ${COLORS.borderFaint}` : 'none' }}>
            <Badge kind={badgeFor(e.kind)} style={{ minWidth: 140, justifyContent: 'center' }}>{labelFor(e.kind)}</Badge>
            <div style={{ flex: 1, fontSize: 14 }}>{e.payload?.title || e.subjectType || 'Activity'}</div>
            <Eyebrow color={COLORS.inkFaint} style={{ minWidth: 80, textAlign: 'right' }}>{formatRelative(e.createdAt).toUpperCase()} AGO</Eyebrow>
          </div>
        ))}
      </div>
    </>
  );
}

function SoldTab({ items }) {
  if (!items || items.length === 0) {
    return <Card style={{ padding: 24 }}><Eyebrow color={COLORS.inkFaint}>Nothing sold yet</Eyebrow></Card>;
  }
  const realized = items.reduce((sum, i) => sum + ((i.soldPrice || 0) - (i.acquired || 0)), 0);
  return (
    <>
      <Eyebrow style={{ marginBottom: 14 }}>Sold · {items.length} pieces · realized {realized >= 0 ? '+' : ''}${realized.toLocaleString()}</Eyebrow>
      <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '14px 22px', borderBottom: `1px solid ${COLORS.ink}` }}>
          {['ITEM', 'BUYER', 'SOLD', 'PAID', 'GAIN'].map((l) => <Eyebrow key={l}>{l}</Eyebrow>)}
        </div>
        {items.map((r, i, arr) => {
          const sold = r.soldPrice || 0;
          const paid = r.acquired || 0;
          const gainPct = paid > 0 ? Math.round(((sold - paid) / paid) * 100) : 0;
          return (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '14px 22px', alignItems: 'center', borderBottom: i < arr.length - 1 ? `1px solid ${COLORS.borderFaint}` : 'none' }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{r.title}</div>
              <Eyebrow>{r.soldTo || '—'}</Eyebrow>
              <Num size={14} weight={500}>${sold.toLocaleString()}</Num>
              <Num size={13} color={COLORS.inkMuted}>${paid.toLocaleString()}</Num>
              <Delta pct={gainPct}/>
            </div>
          );
        })}
      </div>
    </>
  );
}

function FollowersTab({ handle }) {
  const { api } = useApp();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    if (!handle) { setLoading(false); return undefined; }
    api.userFollowers(handle)
      .then(({ followers: list }) => { if (!cancelled) setFollowers(list || []); })
      .catch(() => { if (!cancelled) setFollowers([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [api, handle]);

  if (loading) return <Card style={{ padding: 24 }}><Eyebrow color={COLORS.inkFaint}>Loading…</Eyebrow></Card>;
  if (!followers.length) return <Card style={{ padding: 24 }}><Eyebrow color={COLORS.inkFaint}>No followers yet.</Eyebrow></Card>;
  return (
    <>
      <Eyebrow style={{ marginBottom: 14 }}>Followers · {followers.length}</Eyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {followers.map((c) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: COLORS.paper, border: `1px solid ${COLORS.border}` }}>
            <Avatar initials={c.initials} size={40} color={COLORS.leather}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{c.displayName}</div>
              <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 4 }}>@{c.handle}</Eyebrow>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function ProfileScreen({ onItem, profileHandle: profileHandleProp }) {
  const { user: currentUser, api, refreshFollows, follows } = useApp();
  const [tab, setTab] = useState('Collection');
  const [sportFilter, setSportFilter] = useState('All');
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const isOwnProfile = !profileHandleProp;
  const handle = profileHandleProp || currentUser?.handle;
  const profileLoaded = profile?.user?.handle === handle;
  const targetUser = profileLoaded
    ? profile.user
    : (isOwnProfile ? currentUser : null);
  const stats = profileLoaded ? (profile.stats || {}) : {};
  const items = (profileLoaded ? (profile.items || []) : [])
    .filter((it) => sportFilter === 'All' || it.sport === sportFilter);
  const isMe = currentUser && targetUser && currentUser.id === targetUser.id;
  const followed = targetUser ? follows?.users?.has?.(targetUser.id) : false;

  const loadProfile = useCallback(async () => {
    if (!handle) return;
    try {
      const data = await api.profile(handle);
      setProfile(data);
    } catch { setProfile(null); }
  }, [api, handle]);

  useEffect(() => { setProfile(null); }, [handle]);
  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleFollowToggle = async () => {
    if (!targetUser || isMe) return;
    setFollowBusy(true);
    try {
      if (followed) await api.unfollow('user', targetUser.id);
      else await api.follow('user', targetUser.id);
      refreshFollows();
    } catch {
      // Follow state self-corrects on next refresh.
    } finally { setFollowBusy(false); }
  };

  if (!targetUser) {
    return <div style={{ padding: '48px 56px', color: COLORS.inkFaint, fontSize: 13 }}>Loading profile…</div>;
  }

  const displayName = targetUser.displayName || `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim();
  const handleStr = targetUser.handle ? `@${targetUser.handle}` : '';
  const initials = targetUser.initials || `${(targetUser.firstName || 'U')[0]}${(targetUser.lastName || '')[0] || ''}`.toUpperCase();

  return (
    <>
      <div style={{ background: COLORS.field, color: COLORS.chalk }}>
        <div style={{ padding: '36px 56px 28px', display: 'flex', alignItems: 'center', gap: 32 }}>
          <Avatar initials={initials} size={104} color={COLORS.leather} style={{ border: `2px solid ${COLORS.chalk}` }}/>
          <div style={{ flex: 1 }}>
            <Eyebrow color="rgba(250,250,245,0.65)">Public profile {handleStr && `· ${handleStr}`}</Eyebrow>
            <h1 style={{ fontFamily: "'Geist', sans-serif", fontSize: 44, fontWeight: 500, letterSpacing: '-0.025em', margin: '8px 0 6px', lineHeight: 1, color: COLORS.chalk }}>{displayName || handleStr || 'Collector'}</h1>
            <p style={{ fontSize: 15, color: 'rgba(250,250,245,0.78)', margin: '0 0 16px', maxWidth: 560, lineHeight: 1.5 }}>
              {targetUser.bio || 'No bio yet.'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 180 }}>
            {isMe ? (
              <Button variant="invert" size="md" full onClick={() => setEditing(true)}>Edit profile</Button>
            ) : (
              <Button variant="invert" size="md" full onClick={handleFollowToggle}>{followBusy ? '…' : (followed ? '✓ Following' : 'Follow')}</Button>
            )}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, padding: '0 56px 28px', borderTop: '1px solid rgba(250,250,245,0.22)', paddingTop: 20 }}>
          {[
            { l: 'PIECES · PUBLIC', v: stats.publicPieces ?? 0 },
            { l: 'COLLECTION · ESTIMATE', v: `$${(stats.totalEstimate || 0).toLocaleString()}` },
            { l: 'ACQUIRED', v: `$${(stats.totalAcquired || 0).toLocaleString()}` },
            { l: 'FOLLOWERS', v: (stats.followers ?? 0).toLocaleString() },
            { l: 'FOLLOWING', v: (stats.following ?? 0).toLocaleString() },
          ].map((s, i) => (
            <div key={i} style={{ paddingRight: i < 4 ? 24 : 0 }}>
              <Eyebrow color="rgba(250,250,245,0.55)">{s.l}</Eyebrow>
              <Num size={20} weight={500} color={COLORS.chalk} style={{ display: 'block', marginTop: 4 }}>{s.v}</Num>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderBottom: `1px solid ${COLORS.border}`, background: COLORS.paper }}>
        <div style={{ padding: '0 56px', display: 'flex', gap: 28 }}>
          {['Collection', 'Activity', 'Sold', 'Followers'].map((t) => {
            const on = tab === t;
            return (
              <button key={t} onClick={() => setTab(t)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '14px 0',
                fontFamily: "'Geist', sans-serif", fontSize: 11, letterSpacing: '0.16em',
                textTransform: 'uppercase', fontWeight: 500,
                color: on ? COLORS.ink : COLORS.inkMuted,
                borderBottom: on ? `2px solid ${COLORS.ink}` : '2px solid transparent',
              }}>{t}{t === 'Collection' && stats.publicPieces != null ? ` · ${stats.publicPieces}` : ''}</button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '48px 56px 96px' }}>
        {tab === 'Collection' && (
          <ProfileCollectionTab items={items} sport={sportFilter} setSport={setSportFilter} onItem={onItem}/>
        )}
        {tab === 'Activity' && <ActivityTab events={profileLoaded ? (profile.activity || []) : []}/>}
        {tab === 'Sold' && <SoldTab items={profileLoaded ? (profile.soldItems || []) : []}/>}
        {tab === 'Followers' && <FollowersTab handle={targetUser.handle}/>}
      </div>

      {editing && (
        <ProfileEditModal user={targetUser} onClose={() => setEditing(false)} onSaved={(u) => {
          setProfile((p) => (p ? { ...p, user: u } : p));
        }}/>
      )}
    </>
  );
}
