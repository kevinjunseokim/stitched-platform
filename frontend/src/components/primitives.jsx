// Stitched — extended atoms specific to this prototype. These build on
// `atoms.jsx` and add product-shaped UI (Card, Pill, ItemImage, Input, etc).

import { COLORS } from '../theme/tokens';
import { Badge, Eyebrow } from './atoms';

export function Icon({ name, size = 18, color = 'currentColor', style }) {
  // Iconoir loaded via CDN; use class names.
  return <i className={`iconoir-${name}`} style={{ fontSize: size, color, lineHeight: 1, ...style }}/>;
}

export function SportIcon({ sport, size = 13, color = 'rgba(250,250,245,0.55)' }) {
  const svgProps = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.6, strokeLinecap: 'square' };
  if (sport === 'MLB') {
    return (
      <svg {...svgProps} aria-hidden>
        <circle cx="12" cy="12" r="8.5"/>
        <path d="M8.5 6.5c2 3.5 2 7.5 0 11M15.5 6.5c-2 3.5-2 7.5 0 11"/>
      </svg>
    );
  }
  if (sport === 'NHL') {
    return (
      <svg {...svgProps} aria-hidden>
        <ellipse cx="12" cy="17" rx="5" ry="2"/>
        <path d="M6 17l10-11 2 2-8 9"/>
      </svg>
    );
  }
  const icon = { NBA: 'basketball', NFL: 'football-ball' }[sport];
  if (!icon) return null;
  return <Icon name={icon} size={size} color={color} style={{ flexShrink: 0 }}/>;
}

export function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: COLORS.paper,
      border: `1px solid ${COLORS.border}`,
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</div>
  );
}

export function Pill({ children, active, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: "'Geist', sans-serif", fontSize: 13, letterSpacing: 0,
      fontWeight: 500, padding: '8px 14px',
      background: active ? COLORS.ink : 'transparent',
      color: active ? COLORS.chalk : COLORS.inkMuted,
      border: `1px solid ${active ? COLORS.ink : COLORS.border}`,
      cursor: 'pointer', lineHeight: 1, whiteSpace: 'nowrap', ...style,
    }}>{children}</button>
  );
}

// Item image: tinted gradient with a placeholder "S" mark + optional badge overlays.
export function ItemImage({ tint = COLORS.leather, height = 220, badges = [], eyebrow, glyph = 'S', mark, mono, style }) {
  return (
    <div style={{
      height, background: `linear-gradient(155deg, ${tint}, ${COLORS.leatherDeep})`,
      position: 'relative', overflow: 'hidden', flexShrink: 0,
      ...style,
    }}>
      <div style={{ position: 'absolute', inset: 12, border: '1px solid rgba(250,250,245,0.18)' }}/>
      <svg viewBox="0 0 400 300" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.16 }}>
        <path d="M 40 260 C 120 260, 200 60, 360 40" stroke="#FAFAF5" strokeWidth="1" strokeDasharray="4 6" fill="none"/>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: height * 0.55, fontWeight: 400,
        color: 'rgba(250,250,245,0.16)', letterSpacing: '-0.04em',
      }}>{glyph}</div>
      {mark !== false && (
        <div style={{
          position: 'absolute', top: 12, right: 14,
          fontFamily: "'Geist', sans-serif", fontSize: 9, letterSpacing: '0.14em',
          color: 'rgba(250,250,245,0.55)', textTransform: 'uppercase',
        }}>PHOTO PLACEHOLDER</div>
      )}
      {badges.length > 0 && (
        <div style={{ position: 'absolute', top: 18, left: 20, display: 'flex', gap: 5 }}>
          {badges.map((b, i) => <Badge key={i} kind={b.kind}>{b.label}</Badge>)}
        </div>
      )}
      {eyebrow && (
        <div style={{ position: 'absolute', bottom: 18, left: 20 }}>
          <Eyebrow color="rgba(250,250,245,0.65)">{eyebrow}</Eyebrow>
        </div>
      )}
      {mono && (
        <div style={{ position: 'absolute', bottom: 14, right: 18, fontFamily: "'Geist', sans-serif", fontSize: 10, color: 'rgba(250,250,245,0.55)', letterSpacing: '0.12em' }}>
          {mono}
        </div>
      )}
    </div>
  );
}

export function Input({ label, value, onChange, placeholder, type = 'text', help, prefix, suffix, style, inputStyle }) {
  return (
    <label style={{ display: 'block', ...style }}>
      {label && <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.inkSubtle, marginBottom: 8 }}>{label}</div>}
      <div style={{
        display: 'flex', alignItems: 'center',
        border: `1px solid ${COLORS.border}`, background: COLORS.paper,
      }}>
        {prefix && <div style={{ paddingLeft: 12, color: COLORS.inkSubtle, fontSize: 14 }}>{prefix}</div>}
        <input
          type={type} value={value || ''} onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          placeholder={placeholder}
          style={{
            border: 'none', background: 'transparent', padding: '12px 14px', fontSize: 14,
            color: COLORS.ink, width: '100%', outline: 'none', letterSpacing: '-0.005em',
            ...inputStyle,
          }}
        />
        {suffix && <div style={{ paddingRight: 12, color: COLORS.inkSubtle, fontSize: 12, fontFamily: "'Geist', sans-serif", letterSpacing: '0.1em' }}>{suffix}</div>}
      </div>
      {help && <div style={{ fontSize: 12, color: COLORS.inkSubtle, marginTop: 6 }}>{help}</div>}
    </label>
  );
}

export function FilterDropdown({ label, value, onChange, options, style, minWidth = 152 }) {
  const normalized = (options || []).map((o) => (
    typeof o === 'string' ? { v: o, l: o } : o
  ));
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth, ...style }}>
      {label && <Eyebrow color={COLORS.inkFaint}>{label}</Eyebrow>}
      <div style={{ position: 'relative', border: `1px solid ${COLORS.border}`, background: COLORS.paper }}>
        <select
          value={value ?? ''}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          style={{
            width: '100%', border: 'none', background: 'transparent',
            padding: '10px 32px 10px 12px', fontSize: 13, fontFamily: 'inherit',
            color: COLORS.ink, outline: 'none', appearance: 'none', cursor: 'pointer',
          }}
        >
          {normalized.map((o) => (
            <option key={o.v} value={o.v}>{o.l}</option>
          ))}
        </select>
        <span style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', color: COLORS.inkSubtle, fontSize: 11, lineHeight: 1,
        }}>▾</span>
      </div>
    </label>
  );
}

export function Select({ label, value, onChange, options, style, placeholder }) {
  return (
    <label style={{ display: 'block', ...style }}>
      {label && <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.inkSubtle, marginBottom: 8 }}>{label}</div>}
      <div style={{
        display: 'flex', alignItems: 'center',
        border: `1px solid ${COLORS.border}`, background: COLORS.paper,
        position: 'relative',
      }}>
        <select value={value ?? ''} onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          style={{
            border: 'none', background: 'transparent', padding: '12px 14px', fontSize: 14,
            color: value ? COLORS.ink : COLORS.inkSubtle, width: '100%', outline: 'none', appearance: 'none', cursor: 'pointer',
          }}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => <option key={typeof o === 'string' ? o : o.v} value={typeof o === 'string' ? o : o.v}>{typeof o === 'string' ? o : o.l}</option>)}
        </select>
        <div style={{ position: 'absolute', right: 12, pointerEvents: 'none', color: COLORS.inkSubtle }}>▾</div>
      </div>
    </label>
  );
}

export function Toggle({ checked, onChange, label, help }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
      <div style={{ flex: 1 }}>
        {label && <div style={{ fontSize: 14, color: COLORS.ink, fontWeight: 500 }}>{label}</div>}
        {help && <div style={{ fontSize: 12, color: COLORS.inkSubtle, marginTop: 4, lineHeight: 1.4 }}>{help}</div>}
      </div>
      <button onClick={() => onChange && onChange(!checked)} style={{
        width: 42, height: 24, border: `1px solid ${COLORS.ink}`,
        background: checked ? COLORS.field : COLORS.paperSunken,
        padding: 2, cursor: 'pointer', flexShrink: 0,
      }}>
        <div style={{
          width: 16, height: 16, background: checked ? COLORS.chalk : COLORS.ink,
          transform: `translateX(${checked ? 18 : 0}px)`, transition: 'transform 120ms cubic-bezier(0.2,0.7,0.1,1)',
        }}/>
      </button>
    </div>
  );
}

// Bigger chart used on player + collection pages.
export function AreaChart({ data, w = 720, h = 220, color = COLORS.field, fillOpacity = 0.12, gridY = 4 }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const padY = 16;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - padY - ((v - min) / range) * (h - padY * 2);
    return [x, y];
  });
  const line = pts.map((p) => p.join(',')).join(' ');
  const area = `M 0,${h} L ${line.split(' ').join(' L ')} L ${w},${h} Z`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {[...Array(gridY)].map((_, i) => {
        const y = padY + ((h - padY * 2) / (gridY - 1)) * i;
        return <line key={i} x1="0" y1={y} x2={w} y2={y} stroke={COLORS.border} strokeWidth="0.5" strokeDasharray="2 4"/>;
      })}
      <path d={area} fill={color} fillOpacity={fillOpacity}/>
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="square"/>
    </svg>
  );
}

// Authentication "tick" inline glyph.
export function AuthTick({ source = 'MLB AUTHENTICATION' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: "'Geist', sans-serif", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
      color: COLORS.pin, fontWeight: 600,
    }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><polyline points="20 6 9 17 4 12"/></svg>
      {source}
    </span>
  );
}
