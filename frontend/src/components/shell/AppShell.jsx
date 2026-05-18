import { COLORS } from '../../theme/tokens';

import { AppHeader } from './AppHeader';
import { CollapsibleMarketStrip } from './MarketTicker';

function PageHeading({ title }) {
  return (
    <div style={{
      borderBottom: `1px solid ${COLORS.border}`,
      padding: '28px 56px 24px',
      background: COLORS.paper,
    }}>
      <h1 style={{
        fontFamily: "'Geist', sans-serif", fontSize: 30, fontWeight: 500,
        letterSpacing: '-0.03em', margin: 0, lineHeight: 1.05, color: COLORS.ink,
      }}>{title}</h1>
    </div>
  );
}

export function AppShell({ active, onNav, onAdd, onSearch, title, user, children, hideMarket, tickerItems }) {
  return (
    <div style={{ minHeight: '100vh', background: COLORS.paper }}>
      <AppHeader active={active} onNav={onNav} onAdd={onAdd} onSearch={onSearch} user={user}/>
      {!hideMarket && <CollapsibleMarketStrip items={tickerItems}/>}
      {title != null && title !== '' ? <PageHeading title={title}/> : null}
      <main className="fade-in" key={active}>{children}</main>
    </div>
  );
}
