import { Avatar } from '../atoms';
import { COLORS } from '../../theme/tokens';

import { HeaderIconButton } from './HeaderIconButton';
import { NotificationsBell } from './NotificationsBell';
import { NAV_ITEMS } from './nav';

export function AppHeader({ active, onNav, onAdd, onSearch, user }) {
  const initials = user
    ? user.initials || `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
    : 'U';
  const profileActive = active === 'profile';

  return (
    <header style={{
      background: COLORS.paper,
      borderBottom: `1px solid ${COLORS.border}`,
      padding: '0 56px',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      height: 64,
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <button
        type="button"
        onClick={() => onNav('feed')}
        style={{
          fontFamily: "'Geist', sans-serif", fontSize: 22, fontWeight: 500,
          letterSpacing: '-0.025em', color: COLORS.ink, lineHeight: 1,
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
        }}
      >
        Stitched<span style={{ color: COLORS.clay }}>.</span>
      </button>

      <div style={{
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        minWidth: 0,
      }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }} aria-label="Main">
          {NAV_ITEMS.map((it) => {
            const on = active === it.id;
            return (
              <HeaderIconButton key={it.id} label={it.label} active={on} onClick={() => onNav(it.id)}>
                <i className={`iconoir-${it.icon}`} style={{ fontSize: 20 }}/>
              </HeaderIconButton>
            );
          })}
        </nav>

        <div style={{ width: 1, height: 24, background: COLORS.border, margin: '0 6px', flexShrink: 0 }}/>

        <button
          type="button"
          onClick={onAdd}
          style={{
            padding: '9px 14px',
            background: COLORS.field,
            color: COLORS.chalk,
            border: `1px solid ${COLORS.ink}`,
            fontFamily: "'Geist', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            letterSpacing: 0,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add item
        </button>

        <HeaderIconButton label="Search" onClick={onSearch}>
          <i className="iconoir-search" style={{ fontSize: 20 }}/>
        </HeaderIconButton>

        <NotificationsBell/>

        <button
          type="button"
          title="Profile"
          aria-label="Profile"
          aria-current={profileActive ? 'page' : undefined}
          onClick={() => onNav('profile')}
          style={{
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: profileActive ? COLORS.paperSunken : 'transparent',
            border: profileActive ? `1px solid ${COLORS.border}` : '1px solid transparent',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        >
          <Avatar initials={initials} size={32} color={COLORS.leather}/>
        </button>
      </div>
    </header>
  );
}
