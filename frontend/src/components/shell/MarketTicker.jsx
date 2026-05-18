import { useState } from 'react';

import { readTickerVisible, storeTickerVisible } from '../../api/storage';
import { MARKET_TICKER_ITEMS } from '../../data/mocks';
import { COLORS } from '../../theme/tokens';
import { Delta, Num } from '../atoms';
import { SportIcon } from '../primitives';

function MarketTickerQuote({ label, value, pct, sport }) {
  return (
    <div className="market-ticker-quote">
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        fontFamily: "'Geist', sans-serif", fontSize: 12, color: 'rgba(250,250,245,0.55)', fontWeight: 500,
      }}>
        {sport && <SportIcon sport={sport} size={13}/>}
        {label}
      </span>
      <Num size={13} weight={500} color={COLORS.chalk}>{value}</Num>
      <Delta pct={pct} size={11}/>
    </div>
  );
}

function MarketTickerTrack({ items }) {
  const renderQuotes = (keyPrefix) =>
    items.map((it, i) => (
      <MarketTickerQuote key={`${keyPrefix}-${i}`} label={it.label} value={it.value} pct={it.pct} sport={it.sport}/>
    ));
  return (
    <div className="market-ticker-track">
      {renderQuotes('a')}
      {renderQuotes('b')}
    </div>
  );
}

export function MarketTicker({ items = MARKET_TICKER_ITEMS }) {
  return (
    <div className="market-ticker" aria-label="Live market indexes">
      <span className="market-ticker-label">Live · 24H</span>
      <div className="market-ticker-viewport">
        <MarketTickerTrack items={items}/>
      </div>
    </div>
  );
}

export function CollapsibleMarketStrip({ items = MARKET_TICKER_ITEMS }) {
  const [visible, setVisible] = useState(() => readTickerVisible());

  const toggle = () => {
    setVisible((current) => {
      const next = !current;
      storeTickerVisible(next);
      return next;
    });
  };

  if (!visible) {
    return (
      <div className="market-ticker market-ticker--collapsed">
        <button
          type="button"
          className="market-ticker-restore"
          onClick={toggle}
          aria-label="Show live market indexes"
        >
          <i className="iconoir-nav-arrow-down" style={{ fontSize: 14 }}/>
          <span>Live indexes</span>
        </button>
      </div>
    );
  }

  return (
    <div className="market-ticker" aria-label="Live market indexes">
      <span className="market-ticker-label">Live · 24H</span>
      <div className="market-ticker-viewport">
        <MarketTickerTrack items={items}/>
      </div>
      <button
        type="button"
        className="market-ticker-toggle"
        onClick={toggle}
        aria-label="Hide live market indexes"
        title="Hide ticker"
      >
        <i className="iconoir-nav-arrow-up" style={{ fontSize: 16 }}/>
      </button>
    </div>
  );
}
