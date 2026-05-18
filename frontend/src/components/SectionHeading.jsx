import { COLORS } from '../theme/tokens';
import { Eyebrow } from './atoms';

// Repeated pattern across screens: a heading with an underscore rule, plus an
// optional trailing meta label on the right.
export function SectionHeading({ title, eyebrow, meta, size = 'md', children, style }) {
  const fontSize = size === 'lg' ? 28 : size === 'sm' ? 20 : 24;
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      borderBottom: `1px solid ${COLORS.ink}`, paddingBottom: 14, marginBottom: 18,
      gap: 16, ...style,
    }}>
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        {title && (
          <h2 style={{
            fontFamily: "'Geist', sans-serif", fontSize, fontWeight: 500,
            letterSpacing: '-0.02em', margin: eyebrow ? '8px 0 0' : 0, lineHeight: 1.1,
          }}>{title}</h2>
        )}
      </div>
      {meta != null && <Eyebrow color={COLORS.inkFaint}>{meta}</Eyebrow>}
      {children}
    </div>
  );
}
