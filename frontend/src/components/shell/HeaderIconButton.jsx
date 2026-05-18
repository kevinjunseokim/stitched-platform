import { COLORS } from '../../theme/tokens';

export function HeaderIconButton({ label, onClick, active, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      style={{
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active ? COLORS.paperSunken : 'transparent',
        border: active ? `1px solid ${COLORS.border}` : '1px solid transparent',
        cursor: 'pointer',
        color: active ? COLORS.ink : COLORS.inkMuted,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
