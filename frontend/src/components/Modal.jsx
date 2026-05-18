import { COLORS } from '../theme/tokens';

// Shared modal overlay used by Auth, Item Edit, Profile Edit, and the Add Item
// flow. Renders a fixed full-screen scrim with a paper-toned card centred
// inside it; consumers control the card's width and inner padding.
export function Modal({ width = 480, padding = 36, onClose, zIndex = 100, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,13,8,0.78)', zIndex,
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div
        className="fade-in"
        style={{
          width, maxWidth: '100%', background: COLORS.paper, border: `1px solid ${COLORS.ink}`,
          maxHeight: '94vh', overflow: 'hidden', position: 'relative',
        }}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: 18, right: 18, width: 32, height: 32, zIndex: 1,
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 18, color: COLORS.inkSubtle,
            }}
          >✕</button>
        )}
        <div style={{ padding, overflowY: 'auto', maxHeight: '94vh' }}>{children}</div>
      </div>
    </div>
  );
}
