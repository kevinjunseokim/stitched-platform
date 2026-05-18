// Stitched — shared atoms (parallels mobile Atoms but desktop-scaled).
// These are the lowest-level visual primitives shared by every screen.

import { useState } from 'react';

import { COLORS } from '../theme/tokens';

export function Eyebrow({ children, color, style }) {
  return (
    <div style={{
      fontFamily: "'Geist', sans-serif", fontSize: 12, letterSpacing: 0,
      color: color || COLORS.inkMuted, lineHeight: 1.3,
      fontWeight: 500, whiteSpace: 'nowrap', ...style,
    }}>{children}</div>
  );
}

export function Avatar({ initials, size = 36, color = COLORS.leather, style }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, background: color,
      color: COLORS.chalk, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Geist', sans-serif", fontSize: size * 0.34, fontWeight: 600, flexShrink: 0,
      ...style,
    }}>{initials}</div>
  );
}

export function Badge({ children, kind = 'default', style }) {
  const kinds = {
    auth:    { bg: COLORS.pin,         fg: COLORS.chalk, border: COLORS.pin },
    pending: { bg: COLORS.gold,        fg: COLORS.ink,   border: COLORS.gold },
    hot:     { bg: COLORS.clay,        fg: COLORS.chalk, border: COLORS.clay },
    rare:    { bg: COLORS.ink,         fg: '#D4AF52',    border: COLORS.gold },
    game:    { bg: COLORS.paper,       fg: COLORS.ink,   border: COLORS.ink },
    field:   { bg: COLORS.fieldLight,  fg: COLORS.fieldDeep, border: COLORS.field },
    default: { bg: COLORS.paper,       fg: COLORS.ink,   border: COLORS.border },
  };
  const k = kinds[kind] || kinds.default;
  return (
    <span style={{
      fontFamily: "'Geist', sans-serif", fontSize: 10.5, letterSpacing: '0.12em',
      textTransform: 'uppercase', fontWeight: 600, padding: '5px 9px',
      background: k.bg, color: k.fg, border: `1px solid ${k.border}`,
      display: 'inline-flex', alignItems: 'center', gap: 5, lineHeight: 1, whiteSpace: 'nowrap', ...style,
    }}>{children}</span>
  );
}

export function Num({ children, size = 16, weight = 500, color = COLORS.ink, style }) {
  return (
    <span style={{
      fontFamily: "'Geist', sans-serif", fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"',
      fontSize: size, fontWeight: weight, color, letterSpacing: '-0.01em', ...style,
    }}>{children}</span>
  );
}

export function Delta({ pct, size = 13 }) {
  const up = pct >= 0;
  return (
    <Num size={size} weight={500} color={up ? COLORS.fieldMid : COLORS.clay} style={{ whiteSpace: 'nowrap' }}>
      {up ? '↑' : '↓'} {up ? '+' : '−'}{Math.abs(pct).toFixed(1)}%
    </Num>
  );
}

export function Sparkline({ data, w = 100, h = 24, color }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 2 - ((v - min) / range) * (h - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const up = data[data.length - 1] >= data[0];
  const stroke = color || (up ? COLORS.fieldMid : COLORS.clay);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="square"/>
    </svg>
  );
}

export function Button({ children, variant = 'primary', size = 'md', onClick, style, full, as = 'button', disabled = false }) {
  const variants = {
    primary:   { bg: COLORS.field, fg: COLORS.chalk, border: COLORS.ink, hover: COLORS.fieldDeep },
    secondary: { bg: COLORS.paper, fg: COLORS.ink,   border: COLORS.ink, hover: COLORS.paperSunken },
    accent:    { bg: COLORS.clay,  fg: COLORS.chalk, border: COLORS.ink, hover: '#7E2C13' },
    ghost:     { bg: 'transparent', fg: COLORS.ink, border: 'transparent', hover: 'transparent' },
    invert:    { bg: COLORS.chalk, fg: COLORS.ink, border: COLORS.chalk, hover: '#EBEAE0' },
  };
  const v = variants[variant] || variants.primary;
  const sizes = { sm: '8px 14px', md: '12px 22px', lg: '16px 28px' };
  const fontSizes = { sm: 12, md: 14, lg: 16 };
  const [h, setH] = useState(false);
  const Comp = as;
  return (
    <Comp onClick={disabled ? undefined : onClick}
      disabled={as === 'button' ? disabled : undefined}
      onMouseEnter={() => !disabled && setH(true)} onMouseLeave={() => setH(false)}
      style={{
        fontFamily: 'Geist, sans-serif', fontWeight: 600, fontSize: fontSizes[size],
        padding: sizes[size], background: disabled ? v.bg : (h ? v.hover : v.bg), color: v.fg,
        border: `1px solid ${v.border}`, borderRadius: 0, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        display: 'inline-flex', alignItems: 'center', gap: 8, lineHeight: 1,
        width: full ? '100%' : 'auto', justifyContent: 'center',
        textDecoration: variant === 'ghost' ? 'underline' : 'none',
        transition: 'background 80ms cubic-bezier(0.2,0.7,0.1,1)', letterSpacing: 0,
        whiteSpace: 'nowrap',
        ...style,
      }}>{children}</Comp>
  );
}
