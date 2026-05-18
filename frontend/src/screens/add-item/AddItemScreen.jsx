// Stitched — Add Item multi-step flow.

import { useCallback, useRef, useState } from 'react';

import { Avatar, Button, Eyebrow, Num } from '../../components/atoms';
import { Input, ItemImage, Select, Toggle } from '../../components/primitives';
import { useApp } from '../../context/AppDataContext';
import { PLAYERS, findPlayer } from '../../data/mocks';
import { COLORS } from '../../theme/tokens';

import {
  allStepsComplete,
  canNavigateToStep,
  isStepComplete,
} from './addItemValidation';

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';

const LEAGUE_OPTIONS = ['MLB', 'MiLB', 'NBA', 'WNBA', 'NFL', 'NHL', 'Soccer', 'Tennis', 'Boxing'];

const EMPTY_ITEM_DATA = {
  title: '',
  sport: '',
  type: '',
  season: '',
  gameDate: '',
  player: '',
  team: '',
  usage: '',
  event: '',
  stats: '',
  rookie: false,
  postseason: false,
  auth: '',
  cert: '',
  provenance: '',
  price: '',
  priceDate: '',
  source: '',
  lot: '',
  notes: '',
  visibility: 'public',
  forSale: false,
  asking: '',
  share: true,
  images: [],
};

const STEPS = [
  { id: 'basics', label: 'Item basics' },
  { id: 'player', label: 'Player & team' },
  { id: 'game', label: 'Game usage' },
  { id: 'auth', label: 'Authentication' },
  { id: 'photos', label: 'Photos' },
  { id: 'price', label: 'Purchase details' },
  { id: 'visibility', label: 'Visibility' },
  { id: 'review', label: 'Review & save' },
];

const STEP_HINTS = {
  basics: 'Item title, league, and type are required.',
  player: 'Select a player to continue.',
  game: 'Choose a usage type to continue.',
  auth: 'Select an authentication source to continue.',
  photos: 'Add at least one photo to continue.',
  price: 'Acquisition price, date, and source are required.',
  visibility: 'Enter an asking price when listing for sale.',
  review: 'Complete all steps before saving.',
};

function StepRail({ stepIdx, setStep, data }) {
  return (
    <aside style={{ width: 260, padding: '36px 32px', background: COLORS.paperSunken, borderRight: `1px solid ${COLORS.border}` }}>
      <Eyebrow>New piece</Eyebrow>
      <h2 style={{ fontFamily: "'Geist', sans-serif", fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', margin: '10px 0 32px', lineHeight: 1.05 }}>
        Log your collectible.
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {STEPS.map((s, i) => {
          const current = i === stepIdx;
          const done = isStepComplete(s.id, data) && !current;
          const reachable = canNavigateToStep(i, stepIdx, data, STEPS);
          return (
            <button key={s.id} onClick={() => reachable && setStep(i)} style={{
              display: 'grid', gridTemplateColumns: '28px 1fr', alignItems: 'center', gap: 14,
              padding: '12px 0', background: 'transparent', border: 'none', cursor: reachable ? 'pointer' : 'default', textAlign: 'left',
              opacity: reachable ? (i <= stepIdx ? 1 : 0.7) : 0.4,
            }}>
              <div style={{
                width: 24, height: 24, border: `1px solid ${current || done ? COLORS.ink : COLORS.border}`,
                background: done ? COLORS.field : (current ? COLORS.ink : 'transparent'),
                color: done || current ? COLORS.chalk : COLORS.inkMuted,
                fontFamily: "'Geist', sans-serif", fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                letterSpacing: 0, fontWeight: 500,
              }}>
                {done ? '✓' : String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ fontSize: 13, fontWeight: current ? 600 : 500, color: current ? COLORS.ink : COLORS.inkMuted }}>{s.label}</div>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 40, padding: 18, background: COLORS.paper, border: `1px solid ${COLORS.border}` }}>
        <Eyebrow color={COLORS.clay}>✦ AI Assist</Eyebrow>
        <div style={{ fontSize: 13, color: COLORS.ink, marginTop: 10, lineHeight: 1.5 }}>
          Snap the hologram and we'll prefill <i>player, game date, season, and authentication source</i>.
        </div>
      </div>
    </aside>
  );
}

function StepBasics({ data, set }) {
  return (
    <>
      <Eyebrow>Step 01 / 08</Eyebrow>
      <h1 style={{ fontFamily: "'Geist', sans-serif", fontSize: 36, fontWeight: 500, letterSpacing: '-0.025em', margin: '14px 0 8px', lineHeight: 1.05 }}>Item basics.</h1>
      <p style={{ fontSize: 15, color: COLORS.inkMuted, margin: '0 0 32px' }}>Tell Stitched what this piece is. We'll fill in everything we can.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Input label="ITEM TITLE" value={data.title} onChange={(v) => set({ title: v })} placeholder="e.g. Carroll 2023 rookie game-used bat"/>
        <Select label="LEAGUE" value={data.sport} onChange={(v) => set({ sport: v })} placeholder="Select league" options={LEAGUE_OPTIONS}/>
        <Select label="ITEM TYPE" value={data.type} onChange={(v) => set({ type: v })} placeholder="Select type" options={['Bat', 'Baseball', 'Jersey', 'Cleats', 'Cap', 'Batting Gloves', 'Helmet', 'Card', 'Sneakers', 'Other']}/>
        <Input label="SEASON / YEAR" value={data.season} onChange={(v) => set({ season: v })} placeholder="e.g. 2023"/>
        <Input label="GAME DATE (IF KNOWN)" value={data.gameDate} onChange={(v) => set({ gameDate: v })} placeholder="YYYY-MM-DD" type="date"/>
      </div>
    </>
  );
}

function StepPlayer({ data, set }) {
  const [q, setQ] = useState('');
  const query = q.trim();
  const matches = query
    ? PLAYERS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];
  return (
    <>
      <Eyebrow>Step 02 / 08</Eyebrow>
      <h1 style={{ fontFamily: "'Geist', sans-serif", fontSize: 36, fontWeight: 500, letterSpacing: '-0.025em', margin: '14px 0 8px', lineHeight: 1.05 }}>Player & team.</h1>
      <p style={{ fontSize: 15, color: COLORS.inkMuted, margin: '0 0 32px' }}>Tag the player. Their index, comps, and movers will link to this piece automatically.</p>
      <Input label="SEARCH PLAYER" value={q} onChange={setQ} placeholder="Type a name…"/>
      <div style={{ marginTop: 18, background: COLORS.paper, border: `1px solid ${COLORS.border}` }}>
        {!query && (
          <div style={{ padding: '18px 22px', fontSize: 13, color: COLORS.inkMuted }}>
            Search for a player to tag this piece.
          </div>
        )}
        {query && matches.length === 0 && (
          <div style={{ padding: '18px 22px', fontSize: 13, color: COLORS.inkMuted }}>
            No players match &ldquo;{query}&rdquo;.
          </div>
        )}
        {matches.map((p, i) => {
          const on = data.player === p.id;
          return (
            <button key={p.id} onClick={() => set({ player: p.id, team: p.team })} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', width: '100%',
              border: 'none', background: on ? COLORS.paperSunken : 'transparent', cursor: 'pointer', textAlign: 'left',
              borderBottom: i < matches.length - 1 ? `1px solid ${COLORS.borderFaint}` : 'none',
            }}>
              <Avatar initials={p.initials} size={36} color={p.color}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 4 }}>{p.sport} · {p.team}</Eyebrow>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Eyebrow>Index</Eyebrow>
                <Num size={14} weight={500} style={{ display: 'block', marginTop: 4 }}>{p.index.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Num>
              </div>
              {on && <div style={{ width: 18, height: 18, background: COLORS.field, color: COLORS.chalk, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✓</div>}
            </button>
          );
        })}
      </div>
    </>
  );
}

function StepGame({ data, set }) {
  return (
    <>
      <Eyebrow>Step 03 / 08</Eyebrow>
      <h1 style={{ fontFamily: "'Geist', sans-serif", fontSize: 36, fontWeight: 500, letterSpacing: '-0.025em', margin: '14px 0 8px', lineHeight: 1.05 }}>Game usage.</h1>
      <p style={{ fontSize: 15, color: COLORS.inkMuted, margin: '0 0 32px' }}>How was this piece used? More specificity = stronger comps and higher confidence.</p>
      <Eyebrow style={{ marginBottom: 12 }}>Usage type</Eyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
        {['Game-used', 'Photo-matched', 'Signed', 'Issued'].map((t, i) => {
          const on = data.usage === t;
          return (
            <button key={t} onClick={() => set({ usage: t })} style={{
              padding: '14px 8px', background: on ? COLORS.ink : COLORS.paper, color: on ? COLORS.chalk : COLORS.ink,
              border: 'none', borderRight: i < 3 ? `1px solid ${COLORS.border}` : 'none', cursor: 'pointer',
              fontFamily: "'Geist', sans-serif", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
            }}>{t}</button>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Input label="GAME / EVENT" value={data.event} onChange={(v) => set({ event: v })} placeholder="e.g. vs LAD · 7th inning AB"/>
        <Input label="STAT LINE" value={data.stats} onChange={(v) => set({ stats: v })} placeholder="e.g. 2-for-4, 1 HR"/>
        <Toggle label="Rookie season" help="Stitched will weight rookie-era comps when valuing this piece." checked={data.rookie} onChange={(v) => set({ rookie: v })}/>
        <Toggle label="Postseason" help="Use higher-weighted postseason comps." checked={data.postseason} onChange={(v) => set({ postseason: v })}/>
      </div>
    </>
  );
}

function StepAuth({ data, set }) {
  return (
    <>
      <Eyebrow>Step 04 / 08</Eyebrow>
      <h1 style={{ fontFamily: "'Geist', sans-serif", fontSize: 36, fontWeight: 500, letterSpacing: '-0.025em', margin: '14px 0 8px', lineHeight: 1.05 }}>Authentication & provenance.</h1>
      <p style={{ fontSize: 15, color: COLORS.inkMuted, margin: '0 0 32px' }}>Which house authenticated this? Higher-confidence sources lift estimated value.</p>
      <Select label="AUTHENTICATION SOURCE" value={data.auth} onChange={(v) => set({ auth: v })} placeholder="Select source"
        options={['MLB Authentication', 'Fanatics Authentic', 'MeiGray', 'PSA/DNA', 'Beckett', 'JSA', 'Upper Deck Authenticated', 'Team LOA', 'Photo Match', 'None / Unauthenticated']}/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
        <Input label="CERT / HOLOGRAM #" value={data.cert} onChange={(v) => set({ cert: v })} placeholder="Cert or hologram number"/>
        <Input label="PROVENANCE / SELLER" value={data.provenance} onChange={(v) => set({ provenance: v })} placeholder="e.g. MLB Auctions · lot number"/>
      </div>
    </>
  );
}

function pickImageFiles(fileList) {
  return Array.from(fileList || []).filter((file) => file.type.startsWith('image/'));
}

function StepPhotos({ data, set }) {
  const { api, auth, openAuth } = useApp();
  const images = Array.isArray(data.images) ? data.images : [];
  const [draft, setDraft] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const addUrl = () => {
    const url = draft.trim();
    if (!url) return;
    set({ images: [...images, url] });
    setDraft('');
  };

  const removeUrl = (idx) => set({ images: images.filter((_, i) => i !== idx) });

  const uploadFiles = useCallback(async (fileList) => {
    const files = pickImageFiles(fileList);
    if (!files.length) return;

    if (!auth?.access_token) {
      openAuth('signin');
      setUploadError('Sign in to upload photos from your device.');
      return;
    }

    setUploadError('');
    setUploading(true);
    try {
      const { urls, errors } = await api.uploadImages(files);
      if (urls?.length) {
        set({ images: [...images, ...urls] });
      }
      if (errors?.length) {
        setUploadError(errors.join(' '));
      }
    } catch (err) {
      setUploadError(err.message || 'Unable to upload photos.');
    } finally {
      setUploading(false);
    }
  }, [api, auth?.access_token, images, openAuth, set]);

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    uploadFiles(event.dataTransfer.files);
  };

  const openFilePicker = () => {
    if (!uploading) fileInputRef.current?.click();
  };

  return (
    <>
      <Eyebrow>Step 05 / 08</Eyebrow>
      <h1 style={{ fontFamily: "'Geist', sans-serif", fontSize: 36, fontWeight: 500, letterSpacing: '-0.025em', margin: '14px 0 8px', lineHeight: 1.05 }}>Photos.</h1>
      <p style={{ fontSize: 15, color: COLORS.inkMuted, margin: '0 0 24px' }}>Upload from your device or paste a URL. JPG, PNG, GIF, and WebP up to 10MB each.</p>

      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        style={{ display: 'none' }}
        onChange={(event) => {
          uploadFiles(event.target.files);
          event.target.value = '';
        }}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={openFilePicker}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openFilePicker();
          }
        }}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
        }}
        onDrop={onDrop}
        style={{
          padding: '36px 24px',
          marginBottom: 22,
          border: `1px dashed ${dragging ? COLORS.ink : COLORS.inkSubtle}`,
          background: dragging ? COLORS.paperSunken : COLORS.paper,
          textAlign: 'center',
          cursor: uploading ? 'wait' : 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <Eyebrow color={dragging ? COLORS.ink : COLORS.inkFaint}>{uploading ? 'Uploading…' : 'Drop photos here'}</Eyebrow>
        <div style={{ fontSize: 14, color: COLORS.ink, marginTop: 10, lineHeight: 1.5 }}>
          Drag and drop images, or <span style={{ textDecoration: 'underline' }}>choose files</span>
        </div>
        <div style={{ fontSize: 12, color: COLORS.inkMuted, marginTop: 8 }}>You can select multiple files at once</div>
      </div>

      {uploadError && (
        <div style={{ fontSize: 13, color: COLORS.clay, marginBottom: 18 }}>{uploadError}</div>
      )}

      <Eyebrow color={COLORS.inkFaint} style={{ marginBottom: 12 }}>Or paste a URL</Eyebrow>
      <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
        <Input label="IMAGE URL" value={draft} onChange={setDraft} placeholder="https://…"/>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <Button variant="primary" size="md" onClick={addUrl}>Add URL</Button>
        </div>
      </div>
      {images.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {images.map((url, i) => (
            <div key={`${url}-${i}`} style={{ position: 'relative', height: 180, background: COLORS.paperSunken, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
              <img src={url} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              <button type="button" onClick={() => removeUrl(i)} style={{ position: 'absolute', top: 6, right: 6, background: COLORS.paper, border: `1px solid ${COLORS.ink}`, padding: '4px 8px', fontSize: 11, fontFamily: "'Geist', sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>Remove</button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          padding: 32, border: `1px dashed ${COLORS.inkSubtle}`, textAlign: 'center', color: COLORS.inkMuted,
        }}>
          <Eyebrow color={COLORS.inkFaint}>No photos yet</Eyebrow>
          <div style={{ fontSize: 13, marginTop: 8 }}>Upload or paste a URL to add your first photo.</div>
        </div>
      )}
    </>
  );
}

function StepPrice({ data, set }) {
  return (
    <>
      <Eyebrow>Step 06 / 08</Eyebrow>
      <h1 style={{ fontFamily: "'Geist', sans-serif", fontSize: 36, fontWeight: 500, letterSpacing: '-0.025em', margin: '14px 0 8px', lineHeight: 1.05 }}>Purchase details.</h1>
      <p style={{ fontSize: 15, color: COLORS.inkMuted, margin: '0 0 32px' }}>Stitched only shows this to you — used for unrealized gain/loss math.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Input label="ACQUISITION PRICE" value={data.price} onChange={(v) => set({ price: v })} placeholder="Amount paid" prefix="$"/>
        <Input label="ACQUISITION DATE" value={data.priceDate} onChange={(v) => set({ priceDate: v })} placeholder="YYYY-MM-DD" type="date"/>
        <Select label="SOURCE" value={data.source} onChange={(v) => set({ source: v })} placeholder="Select source" options={['MLB Auctions', 'Goldin', 'Heritage Auctions', 'Sotheby\u2019s', 'Fanatics Auctions', 'Hunt Auctions', 'Lelands', 'MeiGray', 'Private sale', 'Show / floor']}/>
        <Input label="LOT / REFERENCE" value={data.lot} onChange={(v) => set({ lot: v })} placeholder="e.g. lot number"/>
      </div>
      <div style={{ marginTop: 28 }}>
        <Eyebrow style={{ marginBottom: 8 }}>Notes</Eyebrow>
        <textarea value={data.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Optional notes about condition, provenance, or plans for this piece." rows="4" style={{
          width: '100%', padding: 14, border: `1px solid ${COLORS.border}`, background: COLORS.paper,
          fontFamily: "'Geist', sans-serif", fontSize: 14, lineHeight: 1.5, resize: 'vertical',
        }}/>
      </div>
    </>
  );
}

function StepVisibility({ data, set }) {
  return (
    <>
      <Eyebrow>Step 07 / 08</Eyebrow>
      <h1 style={{ fontFamily: "'Geist', sans-serif", fontSize: 36, fontWeight: 500, letterSpacing: '-0.025em', margin: '14px 0 8px', lineHeight: 1.05 }}>Visibility & sharing.</h1>
      <p style={{ fontSize: 15, color: COLORS.inkMuted, margin: '0 0 32px' }}>You control what your followers see. Estimated value is always private.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: `1px solid ${COLORS.border}` }}>
        {[
          { v: 'public', l: 'Public', d: 'Anyone can see this piece on your profile. Counted in leaderboards.' },
          { v: 'followers', l: 'Followers only', d: 'Only collectors who follow you can see this in their feed.' },
          { v: 'private', l: 'Private', d: 'Only you. Useful for grail pieces in transit.' },
          { v: 'showcase', l: 'Showcase', d: 'Pinned to the top of your collection and on your profile hero.' },
        ].map((o, i) => {
          const on = data.visibility === o.v;
          return (
            <button key={o.v} onClick={() => set({ visibility: o.v })} style={{
              padding: '20px 22px', textAlign: 'left', background: on ? COLORS.field : COLORS.paper, color: on ? COLORS.chalk : COLORS.ink,
              border: 'none', borderRight: i % 2 === 0 ? `1px solid ${COLORS.border}` : 'none',
              borderBottom: i < 2 ? `1px solid ${COLORS.border}` : 'none', cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 17, fontWeight: 500, letterSpacing: '-0.01em' }}>{o.l}</div>
                {on && <div style={{ width: 16, height: 16, background: COLORS.chalk, color: COLORS.field, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>✓</div>}
              </div>
              <div style={{ fontSize: 13, marginTop: 8, color: on ? 'rgba(250,250,245,0.75)' : COLORS.inkMuted, lineHeight: 1.45 }}>{o.d}</div>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 24, padding: 20, background: COLORS.paper, border: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Toggle checked={data.forSale} onChange={(v) => set({ forSale: v })} label="For sale" help="Show a 'For sale' tag on this piece. Followers can DM you. No checkout yet."/>
        {data.forSale && <Input label="ASKING PRICE" prefix="$" placeholder="4,600" value={data.asking} onChange={(v) => set({ asking: v })}/>}
        <Toggle checked={data.share} onChange={(v) => set({ share: v })} label="Post to feed" help="Share an 'added' card to followers. Cover image + title only."/>
      </div>
    </>
  );
}

function formatAcquired(data) {
  const parts = [];
  if (data.price) {
    const amount = Number(String(data.price).replace(/[$,]/g, ''));
    parts.push(Number.isFinite(amount) ? `$${amount.toLocaleString()}` : `$${data.price}`);
  }
  if (data.source) parts.push(data.source);
  if (data.lot) parts.push(data.lot);
  return parts.join(' · ');
}

function StepReview({ data }) {
  const player = data.player ? findPlayer(data.player) : null;
  const usageParts = [data.usage, data.event, data.stats].filter(Boolean);
  const authParts = [data.auth, data.cert].filter(Boolean);
  const imageEyebrow = [data.usage, data.season].filter(Boolean).join(' · ').toUpperCase();
  const badges = [];
  if (data.auth) badges.push({ kind: 'auth', label: '✓ AUTH' });
  if (data.rookie) badges.push({ kind: 'field', label: 'ROOKIE' });

  const rows = [
    { l: 'TITLE', v: data.title },
    { l: 'PLAYER', v: player ? `${player.name} · ${player.team}` : data.team },
    { l: 'USAGE', v: usageParts.join(' · ') },
    { l: 'AUTHENTICATION', v: authParts.join(' · ') },
    { l: 'ACQUIRED', v: formatAcquired(data) },
    { l: 'VISIBILITY', v: (data.visibility || 'public') + (data.forSale ? ' · FOR SALE' : '') },
  ];

  return (
    <>
      <Eyebrow>Step 08 / 08</Eyebrow>
      <h1 style={{ fontFamily: "'Geist', sans-serif", fontSize: 36, fontWeight: 500, letterSpacing: '-0.025em', margin: '14px 0 8px', lineHeight: 1.05 }}>Review & save.</h1>
      <p style={{ fontSize: 15, color: COLORS.inkMuted, margin: '0 0 32px' }}>Comparable auction comps will be ready in about 30 seconds after save.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        <ItemImage
          tint={COLORS.leather}
          height={320}
          glyph={(data.type || '?').charAt(0).toUpperCase()}
          badges={badges}
          eyebrow={imageEyebrow || undefined}
          mono={data.cert || undefined}
        />
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}` }}>
          {rows.map((row, i) => (
            <div key={row.l} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 18, padding: '14px 20px', borderBottom: i < rows.length - 1 ? `1px solid ${COLORS.borderFaint}` : 'none' }}>
              <Eyebrow color={COLORS.inkFaint}>{row.l}</Eyebrow>
              <div style={{ fontSize: 14, color: row.v ? COLORS.ink : COLORS.inkMuted }}>{row.v || '—'}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 24, padding: 18, background: COLORS.paper, border: `1px solid ${COLORS.field}` }}>
        <Eyebrow color={COLORS.field}>✦ Next: AI valuation</Eyebrow>
        <div style={{ fontSize: 14, color: COLORS.ink, marginTop: 8, lineHeight: 1.5 }}>
          After save, Stitched runs comparable auction comps and returns an estimated range with confidence.
        </div>
      </div>
    </>
  );
}

export function AddItemScreen({ onCancel, onDone }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(EMPTY_ITEM_DATA);
  const set = (patch) => setData((d) => ({ ...d, ...patch }));
  const stepId = STEPS[step].id;
  const canAdvance = isStepComplete(stepId, data);
  const canSave = allStepsComplete(data, STEPS);
  const stepHint = !canAdvance && step < STEPS.length - 1
    ? STEP_HINTS[stepId]
    : (!canSave && step === STEPS.length - 1 ? STEP_HINTS.review : '');

  const saveItem = async () => {
    if (!canSave) {
      setError(STEP_HINTS.review);
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onDone(data);
    } catch (err) {
      setError(err.message || 'Unable to save this item.');
    } finally {
      setSaving(false);
    }
  };
  const renderStep = () => {
    switch (STEPS[step].id) {
      case 'basics': return <StepBasics data={data} set={set}/>;
      case 'player': return <StepPlayer data={data} set={set}/>;
      case 'game': return <StepGame data={data} set={set}/>;
      case 'auth': return <StepAuth data={data} set={set}/>;
      case 'photos': return <StepPhotos data={data} set={set}/>;
      case 'price': return <StepPrice data={data} set={set}/>;
      case 'visibility': return <StepVisibility data={data} set={set}/>;
      case 'review': return <StepReview data={data}/>;
      default: return null;
    }
  };
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,13,8,0.78)', zIndex: 90,
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        width: 1180, maxWidth: '100%', maxHeight: '94vh', background: COLORS.paper,
        border: `1px solid ${COLORS.ink}`, display: 'grid', gridTemplateColumns: '260px 1fr',
        overflow: 'hidden',
      }} className="fade-in">
        <StepRail stepIdx={step} setStep={setStep} data={data}/>
        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '94vh' }}>
          <div style={{
            padding: '24px 36px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex',
            alignItems: 'center', justifyContent: 'space-between', background: COLORS.paper,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 17, fontWeight: 500 }}>Add to collection</div>
            </div>
            <button onClick={onCancel} style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: COLORS.inkSubtle }}>✕</button>
          </div>
          <div style={{ flex: 1, padding: '36px 48px', overflowY: 'auto' }}>
            {renderStep()}
          </div>
          <div style={{ padding: '20px 36px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: COLORS.paper }}>
            <Button variant="ghost" size="md" onClick={() => (step > 0 ? setStep(step - 1) : onCancel())}>{step > 0 ? '← Back' : 'Cancel'}</Button>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {(error || stepHint) && (
                <span style={{ fontSize: 13, color: COLORS.clay, maxWidth: 280, textAlign: 'right' }}>{error || stepHint}</span>
              )}
              <Eyebrow color={COLORS.inkFaint}>STEP {step + 1} OF 8</Eyebrow>
              {step < STEPS.length - 1
                ? <Button variant="primary" size="md" disabled={!canAdvance} onClick={() => setStep(step + 1)}>Continue →</Button>
                : <Button variant="primary" size="md" disabled={!canSave || saving} onClick={saveItem}>{saving ? 'Saving…' : 'Save to collection →'}</Button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
