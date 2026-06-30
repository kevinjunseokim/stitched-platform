// Stitched — Mobile preview screens displayed in iOS frames side by side.
// These are static design previews (not interactive); the production native
// experience lives in the separate mobile app.

import { Avatar, Badge, Delta, Eyebrow, Num, Sparkline } from '../../components/atoms';
import { AuthTick, ItemImage, Pill } from '../../components/primitives';
import { IOSDevice } from '../../components/ios';
import { ITEMS, SERIES, findItem } from '../../data/mocks';
import { COLORS, PITCH_BG } from '../../theme/tokens';

function MTopBar({ title, eyebrow }) {
  return (
    <div style={{ padding: '62px 20px 12px', background: COLORS.paper, borderBottom: '1px solid #E9DFC6' }}>
      <Eyebrow color={COLORS.inkFaint}>{eyebrow || 'WED · OCT 14 · 9:41 AM'}</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 28, fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1, color: COLORS.ink }}>{title}</div>
        <div style={{ display: 'flex', gap: 14 }}>
          <i className="iconoir-search" style={{ fontSize: 20, color: COLORS.ink }}/>
          <div style={{ position: 'relative' }}>
            <i className="iconoir-bell" style={{ fontSize: 20, color: COLORS.ink }}/>
            <span style={{ position: 'absolute', top: 0, right: -2, width: 6, height: 6, background: COLORS.clay }}/>
          </div>
        </div>
      </div>
    </div>
  );
}

function MTabBar({ active }) {
  const tabs = [
    { id: 'feed', label: 'FEED', icon: 'home-simple' },
    { id: 'collection', label: 'COLLECTION', icon: 'archive' },
    { id: 'add', label: '', icon: 'plus' },
    { id: 'indexes', label: 'INDEXES', icon: 'graph-up' },
    { id: 'you', label: 'YOU', icon: 'user' },
  ];
  return (
    <div style={{ background: COLORS.paper, borderTop: '1px solid #E9DFC6', display: 'flex', padding: '12px 8px 22px' }}>
      {tabs.map((t) => {
        const on = t.id === active;
        const isAdd = t.id === 'add';
        if (isAdd) {
          return (
            <div key={t.id} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: 48, height: 48, background: COLORS.clay, color: COLORS.chalk,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${COLORS.ink}`,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
            </div>
          );
        }
        return (
          <div key={t.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: on ? COLORS.ink : COLORS.inkFaint }}>
            <i className={`iconoir-${t.icon}`} style={{ fontSize: 18 }}/>
            <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 9, letterSpacing: '0.16em' }}>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function MobileFeed() {
  return (
    <div style={{ background: COLORS.paper, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <MTopBar title="Feed"/>
      <div style={{ background: COLORS.ink, color: COLORS.chalk, padding: '10px 20px', display: 'flex', gap: 18, overflowX: 'auto' }} className="nice-scroll">
        {[{ l: 'STITCHED 100', v: '1,842', d: 1.8 }, { l: 'MLB', v: '912', d: 2.1 }, { l: 'NBA', v: '1,105', d: -0.4 }].map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexShrink: 0 }}>
            <Eyebrow color="rgba(250,250,245,0.55)">{t.l}</Eyebrow>
            <Num size={11} color={COLORS.chalk}>{t.v}</Num>
            <Delta pct={t.d} size={10}/>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, marginBottom: 14 }}>
          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${COLORS.borderFaint}` }}>
            <Avatar initials="S" size={28} color={COLORS.field}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: COLORS.ink }}><b>Wembanyama</b> moved <b style={{ color: COLORS.fieldMid }}>+7.2%</b> this week.</div>
              <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 2, fontSize: 9 }}>Stitched · 38m ago</Eyebrow>
            </div>
            <Badge kind="hot">↑ MOVER</Badge>
          </div>
          <div style={{ padding: 14 }}>
            <Num size={26} weight={500} style={{ letterSpacing: '-0.02em' }}>2,884.06</Num>
            <Sparkline data={SERIES['victor-wembanyama'].slice(-12)} w={300} h={50}/>
          </div>
        </div>
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, marginBottom: 14 }}>
          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${COLORS.borderFaint}` }}>
            <Avatar initials="VR" size={28} color={COLORS.leather}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: COLORS.ink }}><b>Vincent Reyes</b> added a piece.</div>
              <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 2, fontSize: 9 }}>@vreyes · 18m ago</Eyebrow>
            </div>
            <Badge kind="field">+ ADDED</Badge>
          </div>
          <ItemImage tint={COLORS.field} height={180} glyph="C" badges={[{ kind: 'auth', label: '✓ AUTH' }, { kind: 'game', label: 'PSA 10' }]} eyebrow="GAME-USED · 2014 NLCS · G7"/>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em', lineHeight: 1.3 }}>Bumgarner Game 7 cap.</div>
            <div style={{ fontSize: 12, color: COLORS.inkMuted, marginTop: 6 }}>Photo-matched 8th inning. Slabbed last week.</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 12, paddingTop: 10, borderTop: `1px solid ${COLORS.borderFaint}` }}>
              <Eyebrow>Index value</Eyebrow>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <Num size={20} weight={500} style={{ letterSpacing: '-0.015em' }}>$14,250</Num>
                <Delta pct={2.4} size={11}/>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', borderTop: `1px solid ${COLORS.borderFaint}`, padding: '10px 16px', gap: 18, alignItems: 'center' }}>
            <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 10, letterSpacing: '0.1em', color: COLORS.inkSubtle }}>♥ 142</span>
            <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 10, letterSpacing: '0.1em', color: COLORS.inkSubtle }}>Comments 22</span>
            <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 10, letterSpacing: '0.1em', color: COLORS.inkSubtle, marginLeft: 'auto' }}>WATCH +</span>
          </div>
        </div>
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, marginBottom: 14 }}>
          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${COLORS.borderFaint}` }}>
            <Avatar initials="GO" size={28} color={COLORS.ink}/>
            <div style={{ flex: 1, fontSize: 12 }}>Mahomes SB LIV jersey — <b>$1.07M</b></div>
            <Badge kind="rare">★ NOTABLE</Badge>
          </div>
        </div>
      </div>
      <MTabBar active="feed"/>
    </div>
  );
}

function MobileAddItem() {
  return (
    <div style={{ background: COLORS.paper, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '62px 20px 12px', background: COLORS.paper, borderBottom: '1px solid #E9DFC6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, color: COLORS.inkMuted }}>← Cancel</span>
        <Eyebrow>New piece · 4 of 8</Eyebrow>
        <span style={{ fontSize: 14, color: COLORS.pin, fontWeight: 500 }}>Skip</span>
      </div>
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', height: 4, background: COLORS.paperSunken, marginBottom: 18 }}>
          <div style={{ width: '50%', background: COLORS.field }}/>
        </div>
        <Eyebrow color={COLORS.clay}>Step 04 / 08</Eyebrow>
        <h1 style={{ fontFamily: "'Geist', sans-serif", fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', margin: '8px 0 6px', lineHeight: 1.05 }}>Authentication.</h1>
        <p style={{ fontSize: 13, color: COLORS.inkMuted, margin: '0 0 18px', lineHeight: 1.5 }}>Higher-confidence sources lift estimated value.</p>

        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.field}`, padding: 12, marginBottom: 16, display: 'flex', gap: 10 }}>
          <div style={{ width: 22, height: 22, background: COLORS.field, color: COLORS.chalk, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✦</div>
          <div>
            <Eyebrow color={COLORS.field} style={{ fontSize: 9 }}>Autofill</Eyebrow>
            <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.45 }}>We found this MLB hologram. Want to autofill game details?</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Eyebrow style={{ fontSize: 9, marginBottom: 8 }}>Authentication source</Eyebrow>
          <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.ink}`, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>MLB Authentication</div>
            <span style={{ color: COLORS.inkSubtle }}>▾</span>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Eyebrow style={{ fontSize: 9, marginBottom: 8 }}>Cert / hologram #</Eyebrow>
          <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, padding: '12px 14px', fontFamily: "'Geist', sans-serif", fontSize: 13, letterSpacing: '0.04em' }}>
            MLB-CC-0428-9B
          </div>
        </div>

        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.pin}`, padding: 14 }}>
          <AuthTick source="MLB AUTHENTICATION"/>
          <div style={{ fontSize: 12, marginTop: 8, lineHeight: 1.5 }}><b>Verified.</b> Hologram confirmed. Sept 12, 2023 vs LAD · 7th inning AB.</div>
        </div>
      </div>

      <div style={{ padding: 16, marginTop: 'auto', borderTop: '1px solid #E9DFC6', background: COLORS.paper }}>
        <button style={{
          width: '100%', padding: '14px', background: COLORS.field, color: COLORS.chalk,
          border: `1px solid ${COLORS.ink}`, fontFamily: 'Geist', fontSize: 14, fontWeight: 600,
        }}>Continue →</button>
      </div>
    </div>
  );
}

function MobileItemDetail() {
  const item = findItem('carroll-bat-2023');
  return (
    <div style={{ background: COLORS.paper, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '62px 20px 8px', background: COLORS.paper, borderBottom: '1px solid #E9DFC6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <i className="iconoir-arrow-left" style={{ fontSize: 20 }}/>
        <Eyebrow>Your collection</Eyebrow>
        <i className="iconoir-more-horiz" style={{ fontSize: 20 }}/>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <ItemImage tint={item.tint} height={280} glyph={item.glyph} badges={item.badges} eyebrow={`${item.usage} · 2023`} mono={item.cert}/>
        <div style={{ padding: '16px 20px 0' }}>
          <Eyebrow color={COLORS.inkFaint}>MLB · Corbin carroll · diamondbacks</Eyebrow>
          <h1 style={{ fontFamily: "'Geist', sans-serif", fontSize: 22, fontWeight: 500, letterSpacing: '-0.015em', margin: '10px 0 14px', lineHeight: 1.15 }}>{item.title}</h1>

          <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, padding: 14 }}>
            <Eyebrow color={COLORS.clay}>✦ Stitched estimate</Eyebrow>
            <Num size={28} weight={500} style={{ display: 'block', marginTop: 8, letterSpacing: '-0.02em' }}>${item.estimate.mid.toLocaleString()}</Num>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <Eyebrow color={COLORS.inkFaint} style={{ fontSize: 9 }}>${item.estimate.low.toLocaleString()} – ${item.estimate.high.toLocaleString()} · MED CONFIDENCE</Eyebrow>
              <Delta pct={((item.estimate.mid - item.acquired) / item.acquired) * 100} size={11}/>
            </div>
            <div style={{ marginTop: 12, height: 4, background: COLORS.paperSunken, position: 'relative' }}>
              <div style={{ position: 'absolute', left: '18%', right: '18%', top: 0, bottom: 0, background: COLORS.field }}/>
              <div style={{ position: 'absolute', left: '50%', top: -3, bottom: -3, width: 2, background: COLORS.clay }}/>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
            {item.tags.slice(0, 4).map((t) => <Pill key={t} style={{ fontSize: 9, padding: '5px 8px' }}>{t}</Pill>)}
          </div>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.border}` }}>
            <Eyebrow style={{ marginBottom: 10 }}>Recent comps</Eyebrow>
            {[
              { h: 'MLB AUC', t: 'Sept 14 game-used bat', p: '$2,820' },
              { h: 'GOLDIN', t: 'Rookie RPA /99 PSA 10', p: '$14,250' },
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i === 0 ? `1px solid ${COLORS.borderFaint}` : 'none' }}>
                <div>
                  <Eyebrow color={COLORS.inkFaint} style={{ fontSize: 9 }}>{c.h}</Eyebrow>
                  <div style={{ fontSize: 12, marginTop: 3 }}>{c.t}</div>
                </div>
                <Num size={13} weight={500}>{c.p}</Num>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: 14, background: COLORS.paper, borderTop: '1px solid #E9DFC6', display: 'flex', gap: 10 }}>
        <button style={{ flex: 1, padding: '12px', background: COLORS.field, color: COLORS.chalk, border: `1px solid ${COLORS.ink}`, fontSize: 13, fontWeight: 600 }}>Get fresh estimate</button>
        <button style={{ padding: '12px 14px', background: COLORS.paper, border: `1px solid ${COLORS.ink}` }}><i className="iconoir-share-android" style={{ fontSize: 16 }}/></button>
      </div>
    </div>
  );
}

function MobileCollection() {
  return (
    <div style={{ background: COLORS.paper, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <MTopBar title="Your collection" eyebrow="42 PIECES · 6 PHOTO-MATCHED"/>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ background: PITCH_BG, color: COLORS.chalk, padding: '20px 20px 22px', position: 'relative', borderBottom: `1px solid ${COLORS.ink}` }}>
          <div style={{ position: 'absolute', inset: 8, border: '1px solid rgba(250,250,245,0.22)' }}/>
          <div style={{ position: 'relative' }}>
            <Eyebrow color="rgba(250,250,245,0.6)">Collection value · LIVE</Eyebrow>
            <Num size={40} weight={500} color={COLORS.chalk} style={{ display: 'block', marginTop: 6, letterSpacing: '-0.025em' }}>$208,440</Num>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
              <Delta pct={6.8} size={13}/>
              <Eyebrow color="rgba(250,250,245,0.55)">+$13,240 · 7d</Eyebrow>
            </div>
            <Sparkline data={SERIES.collection.slice(-12)} w={300} h={48} color="#FAFAF5"/>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, background: COLORS.paper, borderBottom: `1px solid ${COLORS.border}` }}>
          {[{ l: 'PAID', v: '$132K' }, { l: 'GAIN', v: '+$76K', color: COLORS.fieldMid }, { l: 'AUTH', v: '96%' }].map((s, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 2 ? `1px solid ${COLORS.borderFaint}` : 'none' }}>
              <Eyebrow style={{ fontSize: 9 }}>{s.l}</Eyebrow>
              <Num size={16} weight={500} color={s.color || COLORS.ink} style={{ display: 'block', marginTop: 4 }}>{s.v}</Num>
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 16px', display: 'flex', gap: 6, overflowX: 'auto' }} className="nice-scroll">
          {['All · 42', 'MLB · 18', 'NBA · 12', 'NFL · 8', 'WNBA · 4'].map((p) => (
            <span key={p} style={{
              fontFamily: "'Geist', sans-serif", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '6px 10px', background: p === 'All · 42' ? COLORS.ink : COLORS.paper, color: p === 'All · 42' ? COLORS.chalk : COLORS.ink,
              border: `1px solid ${p === 'All · 42' ? COLORS.ink : COLORS.border}`, whiteSpace: 'nowrap',
            }}>{p}</span>
          ))}
        </div>
        <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {ITEMS.slice(0, 6).map((it) => (
            <div key={it.id} style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}` }}>
              <ItemImage tint={it.tint} height={120} glyph={it.glyph} mark={false} badges={it.badges.slice(0, 1)}/>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.3, height: 28, overflow: 'hidden', textWrap: 'balance' }}>{it.title.split(' ').slice(0, 4).join(' ')}…</div>
                <Num size={14} weight={500} style={{ display: 'block', marginTop: 8 }}>${(it.estimate.mid / 1000).toFixed(1)}k</Num>
                <Delta pct={((it.estimate.mid - it.acquired) / it.acquired) * 100} size={9}/>
              </div>
            </div>
          ))}
        </div>
      </div>
      <MTabBar active="collection"/>
    </div>
  );
}

export function MobilePreview() {
  return (
    <div style={{ background: COLORS.paper, color: COLORS.ink, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '64px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 36, borderBottom: `1px solid ${COLORS.ink}`, paddingBottom: 22 }}>
          <div>
            <Eyebrow color={COLORS.clay}>Design preview · non-interactive</Eyebrow>
            <h1 style={{ fontFamily: "'Geist', sans-serif", fontSize: 44, fontWeight: 500, letterSpacing: '-0.025em', margin: '12px 0 8px', lineHeight: 1 }}>
              At the show. At the auction. On the floor.
            </h1>
            <p style={{ fontSize: 15, color: COLORS.inkMuted, margin: 0, maxWidth: 640, lineHeight: 1.55 }}>
              Stitched is built mobile-first for collectors who add pieces in motion — from games, shows, and just-won auction lots. Snap the hologram, dictate notes, save to collection.
            </p>
          </div>
          <Eyebrow color={COLORS.inkFaint}>4 Key screens · static</Eyebrow>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, justifyItems: 'center', alignItems: 'start' }}>
          {[
            { Comp: MobileFeed, label: '01 · HOME FEED' },
            { Comp: MobileCollection, label: '02 · COLLECTION' },
            { Comp: MobileItemDetail, label: '03 · ITEM DETAIL' },
            { Comp: MobileAddItem, label: '04 · ADD ITEM' },
          ].map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ transform: 'scale(0.62)', transformOrigin: 'top center', width: 350, height: 542 }}>
                <IOSDevice width={350} height={760}>
                  <m.Comp/>
                </IOSDevice>
              </div>
              <Eyebrow>{m.label}</Eyebrow>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
