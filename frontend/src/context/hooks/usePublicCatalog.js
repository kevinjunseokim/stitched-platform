import { useEffect, useState } from 'react';

import { MARKET_TICKER_ITEMS, NOTABLE_SALES } from '../../data/mocks';
import { registerLivePlayers } from '../../data/registry';

/**
 * Public market catalog — players, ticker, notable sales.
 * Fetched without login so landing and browse screens have live numbers.
 */
export function usePublicCatalog(api) {
  const [players, setPlayers] = useState([]);
  const [liveTicker, setLiveTicker] = useState([]);
  const [liveNotableSales, setLiveNotableSales] = useState([]);

  useEffect(() => {
    let cancelled = false;

    api.listPlayers()
      .then(({ players: list }) => { if (!cancelled && list) setPlayers(list); })
      .catch(() => {});

    api.marketTicker()
      .then(({ ticker }) => { if (!cancelled && ticker) setLiveTicker(ticker); })
      .catch(() => {});

    api.notableSales()
      .then(({ sales }) => { if (!cancelled && sales) setLiveNotableSales(sales); })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [api]);

  useEffect(() => { registerLivePlayers(players); }, [players]);

  return {
    players,
    ticker: liveTicker.length ? liveTicker : MARKET_TICKER_ITEMS,
    notableSales: liveNotableSales.length ? liveNotableSales : NOTABLE_SALES,
  };
}
