// Stitched — Landing / marketing page.

import { useEffect, useRef, useState } from 'react';

import { Avatar, Button, Delta, Eyebrow, Num } from '../../components/atoms';
import { MarketTicker } from '../../components/shell/MarketTicker';
import { COLORS, PITCH_BG } from '../../theme/tokens';
import { formatFollowers } from '../../utils/format';

const AUCTION_HOUSE_LOGOS = [
  { name: 'Goldin', src: '/assets/auction-houses/goldin.svg', width: 72 },
  { name: 'Heritage Auctions', src: '/assets/auction-houses/heritage.svg', width: 96 },
  { name: "Sotheby's", src: '/assets/auction-houses/sothebys.svg', width: 92 },
  { name: 'MLB Auctions', src: '/assets/auction-houses/mlb.svg', width: 98 },
  { name: 'Fanatics', src: '/assets/auction-houses/fanatics.svg', width: 84 },
  { name: 'Hunt Auctions', src: '/assets/auction-houses/hunt.svg', width: 88 },
  { name: 'Lelands', src: '/assets/auction-houses/lelands.svg', width: 76 },
  { name: 'MeiGray', src: '/assets/auction-houses/meigray.svg', width: 84 },
];

function LandingAuctionPartners() {
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center',
        gap: 36, margin: '0 auto', width: 'fit-content', maxWidth: '100%',
      }}>
        <Eyebrow color={COLORS.inkFaint} style={{ flexShrink: 0 }}>Auction comps from</Eyebrow>
        <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: 22 }}>
          {AUCTION_HOUSE_LOGOS.map((house) => (
            <img
              key={house.name}
              src={house.src}
              alt={house.name}
              style={{ display: 'block', height: 22, width: 'auto', flexShrink: 0, opacity: 0.82, filter: 'grayscale(1)' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LandingNav({ onSignIn, onSignUp }) {
  return (
    <header style={{
      background: COLORS.paper, borderBottom: `1px solid ${COLORS.border}`,
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1320, margin: '0 auto', padding: '0 56px', height: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
          <div style={{
            fontFamily: "'Geist', sans-serif", fontSize: 22, fontWeight: 500,
            letterSpacing: '-0.025em', color: COLORS.ink, lineHeight: 1,
          }}>Stitched<span style={{ color: COLORS.clay }}>.</span></div>
          <nav style={{ display: 'flex', gap: 32 }}>
            {['Product', 'Indexes', 'Auctions', 'Collectors', 'Pricing'].map((t) => (
              <a key={t} href="#" style={{
                fontFamily: "'Geist', sans-serif", fontSize: 14, fontWeight: 500,
                padding: '30px 0', color: COLORS.inkMuted, textDecoration: 'none',
              }}>{t}</a>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button variant="ghost" size="sm" onClick={onSignIn}>Sign in</Button>
          <Button variant="primary" size="sm" onClick={onSignUp}>Get started</Button>
        </div>
      </div>
    </header>
  );
}

function LandingHero({ onSignUp }) {
  const leftColRef = useRef(null);
  const [leftColHeight, setLeftColHeight] = useState(null);

  useEffect(() => {
    const node = leftColRef.current;
    if (!node) return undefined;

    const updateHeight = () => setLeftColHeight(node.offsetHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section style={{ borderBottom: `1px solid ${COLORS.border}` }}>
      <div style={{
        maxWidth: 1320, margin: '0 auto', padding: '112px 56px 112px',
        display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 96, alignItems: 'start',
      }}>
        <div ref={leftColRef}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 14px', background: COLORS.paperSunken, border: `1px solid ${COLORS.border}` }}>
            <span style={{ width: 6, height: 6, background: COLORS.clay, borderRadius: 999 }}/>
            <span style={{ fontSize: 12.5, color: COLORS.inkMuted, fontWeight: 500 }}>For collectors · Now in beta</span>
          </div>
          <h1 style={{
            fontFamily: "'Geist', sans-serif", fontSize: 56, fontWeight: 500,
            letterSpacing: '-0.04em', lineHeight: 1.08, color: COLORS.ink,
            margin: '32px 0 32px',
          }}>
            Track your collection.<br />
            Follow the market.<br />
            <span className="accent" style={{ color: COLORS.fieldMid }}>Share your story.</span>
          </h1>
          <p style={{
            fontFamily: "'Geist', sans-serif", fontSize: 13, fontWeight: 400,
            lineHeight: 1.5, color: COLORS.inkMuted, maxWidth: 560, margin: 0, textWrap: 'pretty',
          }}>
            Manage your sports memorabilia collection, monitor auction comps, and connect with collectors who care about the pieces behind the prices.
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 48 }}>
            <Button variant="primary" size="lg" onClick={onSignUp}>Get started — free</Button>
          </div>
        </div>

        {/* Live index — chart + league breakdown */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 12,
          height: leftColHeight ?? 'auto', minHeight: 0, overflow: 'hidden',
        }}>
          <div style={{
            flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
            background: PITCH_BG, color: COLORS.chalk, padding: 28, position: 'relative',
            border: `1px solid ${COLORS.ink}`,
          }}>
            <div style={{ position: 'absolute', inset: 10, border: '1px solid rgba(250,250,245,0.22)', pointerEvents: 'none' }}/>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Eyebrow color="rgba(250,250,245,0.6)">Stitched 100 · LIVE</Eyebrow>
                <Eyebrow color="rgba(250,250,245,0.55)">Updated 14s ago</Eyebrow>
              </div>
              <Num size={60} weight={500} color={COLORS.chalk} style={{ letterSpacing: '-0.03em', display: 'block', marginTop: 12 }}>1,842.06</Num>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <Num size={15} weight={500} color="#A8CFB6">↑ +1.8%</Num>
                <Eyebrow color="rgba(250,250,245,0.55)">+32.18 Today</Eyebrow>
              </div>
            </div>

            <svg width="100%" viewBox="0 0 360 170" preserveAspectRatio="none" style={{ flex: 1, minHeight: 48, marginTop: 24, display: 'block' }}>
              <defs>
                <linearGradient id="herofill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#FAFAF5" stopOpacity="0.3"/>
                  <stop offset="1" stopColor="#FAFAF5" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <g stroke="rgba(250,250,245,0.18)" strokeWidth="0.5" strokeDasharray="2 4">
                <line x1="0" y1="40" x2="360" y2="40"/>
                <line x1="0" y1="100" x2="360" y2="100"/>
                <line x1="0" y1="150" x2="360" y2="150"/>
              </g>
              <path d="M 0 110 L 36 100 L 72 120 L 108 90 L 144 100 L 180 70 L 216 80 L 252 50 L 288 58 L 324 30 L 360 22 L 360 170 L 0 170 Z" fill="url(#herofill)"/>
              <path d="M 0 110 L 36 100 L 72 120 L 108 90 L 144 100 L 180 70 L 216 80 L 252 50 L 288 58 L 324 30 L 360 22" fill="none" stroke={COLORS.chalk} strokeWidth="1.8" strokeLinecap="square"/>
            </svg>
          </div>

          <div style={{
            flexShrink: 0, background: COLORS.paper, border: `1px solid ${COLORS.border}`,
            padding: '18px 24px', display: 'flex', justifyContent: 'space-between',
          }}>
            {[{ l: 'MLB', v: '912.40', d: 2.1 }, { l: 'NBA', v: '1,104.88', d: -0.4 }, { l: 'NFL', v: '2,201.16', d: 3.8 }].map((x) => (
              <div key={x.l}>
                <Eyebrow color={COLORS.inkMuted}>{x.l}</Eyebrow>
                <Num size={14} weight={500} color={COLORS.ink} style={{ display: 'block', marginTop: 4 }}>{x.v}</Num>
                <div style={{ marginTop: 2 }}><Delta pct={x.d} size={10}/></div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1', marginTop: 24, width: '100%' }}>
          <LandingAuctionPartners/>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ eyebrow, title, body, children, span = 1 }) {
  return (
    <div style={{
      gridColumn: `span ${span}`, background: COLORS.paper, border: `1px solid ${COLORS.border}`,
      padding: 40, display: 'flex', flexDirection: 'column',
    }}>
      <Eyebrow color={COLORS.fieldMid}>{eyebrow}</Eyebrow>
      <h3 style={{
        fontFamily: "'Geist', sans-serif", fontSize: 30, fontWeight: 500, letterSpacing: '-0.025em',
        margin: '20px 0 14px', color: COLORS.ink, lineHeight: 1.05,
      }}>{title}</h3>
      <p style={{ fontSize: 15, lineHeight: 1.55, color: COLORS.inkMuted, margin: 0 }}>{body}</p>
      {children && <div style={{ marginTop: 32 }}>{children}</div>}
    </div>
  );
}

function ValueProps() {
  return (
    <section style={{ maxWidth: 1320, margin: '0 auto', padding: '128px 56px 32px' }}>
      <div style={{ marginBottom: 64, maxWidth: 880 }}>
        <h2 style={{
          fontFamily: "'Geist', sans-serif", fontSize: 56, fontWeight: 500,
          letterSpacing: '-0.035em', lineHeight: 1.02, margin: '20px 0 0', color: COLORS.ink, textWrap: 'balance',
        }}>Your collection, the market,<br />
          and the collectors who move it.<br />
          <span className="accent" style={{ color: COLORS.fieldMid }}>All on Stitched.</span></h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 32 }}>
        <FeatureCard eyebrow="01 · Track" title="Track your collection." body="Catalog every piece — game-used, signed, authenticated, photo-matched. Notes, hologram numbers, purchase price, provenance.">
          <div style={{ background: COLORS.paper, padding: '14px 16px', border: `1px solid ${COLORS.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <Eyebrow>Collection value</Eyebrow>
                <Num size={32} weight={500} style={{ display: 'block', marginTop: 6, letterSpacing: '-0.02em' }}>$208,440</Num>
              </div>
              <Delta pct={6.8}/>
            </div>
            <div style={{ display: 'flex', gap: 18, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${COLORS.borderFaint}` }}>
              <div><Eyebrow>Pieces</Eyebrow><Num size={15} style={{ display: 'block', marginTop: 4 }}>42</Num></div>
              <div><Eyebrow>Unrealized</Eyebrow><Num size={15} color={COLORS.fieldMid} style={{ display: 'block', marginTop: 4 }}>+$76,140</Num></div>
              <div><Eyebrow>Auth</Eyebrow><Num size={15} style={{ display: 'block', marginTop: 4 }}>96%</Num></div>
            </div>
          </div>
        </FeatureCard>

        <FeatureCard eyebrow="02 · Understand" title="Understand market value." body="Live auction comps from MLB Auctions, Goldin, Heritage, Sotheby's, Fanatics, Hunt, Lelands, MeiGray. Confidence scoring tells you when a comp is solid and when it's a stretch.">
          <div style={{ background: COLORS.paper, padding: '14px 16px', border: `1px solid ${COLORS.border}` }}>
            {[
              { house: 'Goldin', title: 'Carroll RPA /99', p: '$14,250', d: '4d' },
              { house: 'MLB Auctions', title: 'Carroll game-used bat', p: '$2,820', d: '14d' },
              { house: 'Lelands', title: 'Carroll photo-match jersey', p: '$18,800', d: '38d' },
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? `1px solid ${COLORS.borderFaint}` : 'none' }}>
                <div>
                  <Eyebrow>{c.house}</Eyebrow>
                  <div style={{ fontSize: 13, color: COLORS.ink, marginTop: 3 }}>{c.title}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Num size={14} weight={500}>{c.p}</Num>
                  <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 3 }}>{c.d}</Eyebrow>
                </div>
              </div>
            ))}
          </div>
        </FeatureCard>

        <FeatureCard eyebrow="03 · Follow" title="Follow player indexes." body="Each player gets an index — composed of authenticated comps, weighted by rarity and recency. Watch movers, get alerts, see where your exposure sits.">
          <div style={{ background: COLORS.field, color: COLORS.chalk, padding: '14px 16px' }}>
            <Eyebrow color="rgba(250,250,245,0.6)">Carroll · MLB</Eyebrow>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
              <Num size={28} weight={500} color={COLORS.chalk} style={{ letterSpacing: '-0.02em' }}>1,284.12</Num>
              <Num size={14} color="#A8CFB6">↑ +8.4%</Num>
            </div>
            <svg width="100%" height="60" viewBox="0 0 320 60" style={{ marginTop: 10 }}>
              <polyline points="0,52 32,48 64,50 96,42 128,40 160,32 192,28 224,20 256,18 288,12 320,8"
                fill="none" stroke="#FAFAF5" strokeWidth="1.5" strokeLinecap="square"/>
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <Eyebrow color="rgba(250,250,245,0.55)">365d</Eyebrow>
              <Eyebrow color="rgba(250,250,245,0.55)">+41.6%</Eyebrow>
            </div>
          </div>
        </FeatureCard>

        <FeatureCard eyebrow="04 · Share" title="Share collection activity." body="Every piece added, sold, photo-matched, or marked authenticated rolls into a feed.">
          <div style={{ background: COLORS.paper, padding: '14px 16px', border: `1px solid ${COLORS.border}` }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Avatar initials="MO" size={32} color={COLORS.pin}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.4 }}><b>Maya Okafor</b> added a 2023 Carroll game-used bat to collection.</div>
                <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 4 }}>2h ago · 18 likes</Eyebrow>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${COLORS.borderFaint}` }}>
              <Avatar initials="A" size={32} color={COLORS.clay}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.4 }}>Mahomes SB LIV jersey hammered at <b>$1.07M</b> at Goldin.</div>
                <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 4 }}>2h ago · 384 likes</Eyebrow>
              </div>
            </div>
          </div>
        </FeatureCard>
      </div>
    </section>
  );
}

const LANDING_TESTIMONIALS = [
  {
    quote: 'I had my collection in five spreadsheets, a Notes app, and an envelope of holograms. Stitched is the first thing that gets it — the comps, the authentication, the people.',
    name: 'Vincent Reyes', handle: 'vreyes', initials: 'VR', color: COLORS.leather,
    ytdIndex: 18.4, itemsUploaded: 24, followers: 318,
  },
  {
    quote: 'I follow twelve collectors whose taste I trust. When someone adds a Carroll or a Wemby piece, I see it immediately — not three weeks later on a forum thread.',
    name: 'Maya Okafor', handle: 'maya', initials: 'MO', color: COLORS.pin,
    ytdIndex: 12.6, itemsUploaded: 142, followers: 2410,
  },
  {
    quote: 'Watching a Wembanyama index move in real time changed how I think about timing. Now I know exactly what moved and why.',
    name: 'Theo Brandt', handle: 'theo', initials: 'TB', color: COLORS.clay,
    ytdIndex: 9.2, itemsUploaded: 38, followers: 891,
  },
  {
    quote: 'Photo-matched game-used is a niche within a niche. Stitched comps are conservative in the right way — I trust them when I am deciding whether to hold or sell.',
    name: 'Camille Lefevre', handle: 'camille', initials: 'CL', color: COLORS.gold,
    ytdIndex: 22.1, itemsUploaded: 72, followers: 1084,
  },
  {
    quote: 'The feed is the part I did not expect to use daily. Serious collectors, real pieces, no noise — just the market and the people who actually move it.',
    name: 'Roland Cho', handle: 'rcho', initials: 'RC', color: COLORS.fieldMid,
    ytdIndex: 14.8, itemsUploaded: 96, followers: 1620,
  },
];

function CollectorQuoteKpis({ testimonial }) {
  const stats = [
    { l: 'YTD index', delta: testimonial.ytdIndex },
    { l: 'Items uploaded', v: String(testimonial.itemsUploaded) },
    { l: 'Followers', v: formatFollowers(testimonial.followers) },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', height: 140, alignSelf: 'center' }}>
      {stats.map((s, i) => (
        <div key={s.l} style={{ padding: '28px 32px', borderRight: i < 2 ? `1px solid ${COLORS.border}` : 'none' }}>
          <Eyebrow>{s.l}</Eyebrow>
          <div style={{ marginTop: 14 }}>
            {s.delta != null
              ? <Delta pct={s.delta} size={36}/>
              : <Num size={36} weight={500} style={{ letterSpacing: '-0.025em' }}>{s.v}</Num>}
          </div>
        </div>
      ))}
    </div>
  );
}

function CollectorQuote() {
  const [active, setActive] = useState(0);
  const count = LANDING_TESTIMONIALS.length;
  const slidePct = 100 / count;

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % count);
    }, 6000);
    return () => window.clearInterval(id);
  }, [count]);

  return (
    <section style={{ maxWidth: 1320, margin: '0 auto', padding: '128px 56px' }}>
      <Eyebrow>From the beta</Eyebrow>
      <div style={{ overflow: 'hidden', width: '100%' }}>
        <div style={{
          display: 'flex', width: `${count * 100}%`,
          transform: `translateX(-${active * slidePct}%)`,
          transition: 'transform 520ms cubic-bezier(0.2, 0.7, 0.1, 1)',
        }}>
          {LANDING_TESTIMONIALS.map((t) => (
            <div key={t.handle} style={{
              flex: 'none', width: `${slidePct}%`,
              display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 96,
              alignItems: 'start', minHeight: 360, boxSizing: 'border-box',
            }}>
              <div style={{ height: 280, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 24 }}>
                <blockquote style={{
                  fontFamily: "'Geist', sans-serif", fontWeight: 500,
                  fontSize: 30, lineHeight: 1.25, letterSpacing: '-0.02em',
                  color: COLORS.ink, margin: 0, textWrap: 'balance',
                }}>
                  "{t.quote}"
                </blockquote>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Avatar initials={t.initials} size={48} color={t.color}/>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{t.name}</div>
                    <Eyebrow color={COLORS.inkFaint} style={{ marginTop: 6 }}>@{t.handle}</Eyebrow>
                  </div>
                </div>
              </div>
              <CollectorQuoteKpis testimonial={t}/>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 32 }}>
        {LANDING_TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show testimonial ${i + 1}`}
            aria-current={i === active ? 'true' : undefined}
            onClick={() => setActive(i)}
            style={{
              width: i === active ? 24 : 8, height: 8, padding: 0, border: 'none', borderRadius: 4,
              background: i === active ? COLORS.fieldMid : COLORS.border, cursor: 'pointer',
              transition: 'width 180ms cubic-bezier(0.2,0.7,0.1,1), background 180ms cubic-bezier(0.2,0.7,0.1,1)',
            }}
          />
        ))}
      </div>
    </section>
  );
}

function LandingCTA({ onSignUp }) {
  return (
    <section style={{ background: COLORS.field, color: COLORS.chalk, borderTop: `1px solid ${COLORS.ink}` }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '128px 56px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 96, alignItems: 'center' }}>
        <div>
          <Eyebrow color={COLORS.gold}>Join the community</Eyebrow>
          <h2 style={{
            fontFamily: "'Geist', sans-serif", fontSize: 64, fontWeight: 500,
            letterSpacing: '-0.04em', lineHeight: 1, margin: '24px 0 24px', color: COLORS.chalk, textWrap: 'balance',
          }}>Start your collection for free.</h2>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: 'rgba(250,250,245,0.78)', maxWidth: 540, margin: 0 }}>
            Add your first piece with a photo, and Stitched helps fill in the details — player, item type, authentication, provenance, and market comps.
          </p>
        </div>
        <div>
          <Button variant="invert" size="lg" onClick={onSignUp} style={{ width: '100%' }}>Create my collection →</Button>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer style={{ background: COLORS.ink, color: COLORS.chalk }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '72px 56px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 56, paddingBottom: 48, borderBottom: '1px solid rgba(250,250,245,0.18)' }}>
          <div>
            <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 24, fontWeight: 500, letterSpacing: '-0.025em' }}>Stitched<span style={{ color: COLORS.clay }}>.</span></div>
            <div style={{ fontSize: 14, lineHeight: 1.6, marginTop: 18, color: 'rgba(250,250,245,0.7)', maxWidth: 320 }}>The social platform for sports memorabilia collectors.</div>
          </div>
          {[
            { h: 'Product', links: ['Feed', 'Collection', 'Indexes', 'Auctions'] },
            { h: 'Collect', links: ['Authentication', 'Photo-match', 'Provenance', 'Insurance'] },
            { h: 'Company', links: ['About', 'Careers', 'Press', 'Contact'] },
          ].map((col) => (
            <div key={col.h}>
              <Eyebrow color="rgba(250,250,245,0.55)">{col.h}</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
                {col.links.map((l) => <a key={l} href="#" style={{ fontSize: 14, color: COLORS.chalk, textDecoration: 'none' }}>{l}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 28 }}>
          <Eyebrow color="rgba(250,250,245,0.55)">© 2026 Stitched · Made for collectors</Eyebrow>
          <Eyebrow color="rgba(250,250,245,0.55)">v0.24 beta · Oct 14</Eyebrow>
        </div>
      </div>
    </footer>
  );
}

export function LandingScreen({ onSignIn, onSignUp }) {
  return (
    <div style={{ background: COLORS.paper, color: COLORS.ink }}>
      <LandingNav onSignIn={onSignIn} onSignUp={onSignUp}/>
      <MarketTicker/>
      <LandingHero onSignUp={onSignUp}/>
      <ValueProps/>
      <CollectorQuote/>
      <LandingCTA onSignUp={onSignUp}/>
      <LandingFooter/>
    </div>
  );
}
