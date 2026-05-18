import { useCallback, useEffect, useMemo, useState } from 'react';

import { makeApiClient } from '../api/client';
import { clearStoredAuth } from '../api/storage';
import { ITEMS, MARKET_TICKER_ITEMS, NOTABLE_SALES } from '../data/mocks';
import {
  cacheItems,
  setLiveItems,
  setLivePlayers as registerLivePlayers,
} from '../data/registry';

import { AppDataContext } from './AppDataContext';

// Owns auth-aware data subscriptions (items, players, feed, follows, watchlist,
// notifications, collection summary) plus the typed API client. Routing-level
// callbacks (openAuth, navigate, openItem, openPlayer, signOut) are injected
// from `App.jsx` so the provider stays decoupled from history state.
export function AppDataProvider({
  auth,
  setAuth,
  openAuth,
  openItem,
  openPlayer,
  navigate,
  signOut,
  children,
}) {
  const [persistedItems, setPersistedItems] = useState([]);
  const [livePlayers, setLivePlayers] = useState([]);
  const [liveTicker, setLiveTicker] = useState([]);
  const [liveNotableSales, setLiveNotableSales] = useState([]);
  const [feedEvents, setFeedEvents] = useState([]);
  const [followsState, setFollowsState] = useState({ players: new Set(), users: new Set() });
  const [watchlistState, setWatchlistState] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsUnread, setNotificationsUnread] = useState(0);
  const [collectionSummary, setCollectionSummary] = useState(null);
  const [sessionReady, setSessionReady] = useState(() => !auth?.access_token);

  const authToken = auth?.access_token;
  const api = useMemo(() => makeApiClient(authToken), [authToken]);

  // Once the user has any persisted items we trust the server view exclusively;
  // before that, fall back to the curated mock list so the UI is never empty.
  const allItems = persistedItems.length ? persistedItems : ITEMS;

  // Some leaf helpers (notably `findPlayer`/`findItem` in `data/mocks`) need to
  // resolve players/items without prop-drilling. Mirror the latest data into a
  // module-level registry so those helpers can read live values.
  useEffect(() => { setLiveItems(allItems); }, [allItems]);
  useEffect(() => { registerLivePlayers(livePlayers); }, [livePlayers]);

  const refreshItems = useCallback(async () => {
    if (!authToken) return [];
    try {
      const { items } = await api.listItems();
      setPersistedItems(items);
      return items;
    } catch {
      return [];
    }
  }, [api, authToken]);

  const refreshFeed = useCallback(async () => {
    if (!authToken) return [];
    try {
      const { events } = await api.feed();
      setFeedEvents(events);
      cacheItems(events.map((e) => e.item).filter(Boolean));
      return events;
    } catch {
      return [];
    }
  }, [api, authToken]);

  const refreshFollows = useCallback(async () => {
    if (!authToken) {
      setFollowsState({ players: new Set(), users: new Set() });
      return;
    }
    try {
      const { follows } = await api.myFollows();
      const players = new Set();
      const users = new Set();
      follows.forEach((f) => {
        if (f.targetType === 'player') players.add(f.targetId);
        if (f.targetType === 'user') users.add(f.targetId);
      });
      setFollowsState({ players, users });
    } catch {
      setFollowsState({ players: new Set(), users: new Set() });
    }
  }, [api, authToken]);

  const refreshWatchlist = useCallback(async () => {
    if (!authToken) {
      setWatchlistState([]);
      return;
    }
    try {
      const { entries } = await api.watchlist();
      setWatchlistState(entries);
    } catch {
      setWatchlistState([]);
    }
  }, [api, authToken]);

  const refreshNotifications = useCallback(async () => {
    if (!authToken) {
      setNotifications([]);
      setNotificationsUnread(0);
      return;
    }
    try {
      const { notifications: items, unread } = await api.notifications();
      setNotifications(items);
      setNotificationsUnread(unread);
    } catch {
      setNotifications([]);
      setNotificationsUnread(0);
    }
  }, [api, authToken]);

  const refreshCollectionSummary = useCallback(async () => {
    if (!authToken) {
      setCollectionSummary(null);
      return;
    }
    try {
      const summary = await api.collectionSummary();
      setCollectionSummary(summary);
    } catch {
      setCollectionSummary(null);
    }
  }, [api, authToken]);

  // Public catalog data (players, market ticker, notable sales) is fetched
  // unauthenticated so the landing/feed screens have live numbers immediately.
  useEffect(() => {
    let cancelled = false;
    api.listPlayers().then(({ players }) => {
      if (!cancelled && players) setLivePlayers(players);
    }).catch(() => {});
    api.marketTicker().then(({ ticker }) => {
      if (!cancelled && ticker) setLiveTicker(ticker);
    }).catch(() => {});
    api.notableSales().then(({ sales }) => {
      if (!cancelled && sales) setLiveNotableSales(sales);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [api]);

  useEffect(() => {
    if (!authToken) {
      setSessionReady(true);
      setPersistedItems([]);
      setFeedEvents([]);
      setFollowsState({ players: new Set(), users: new Set() });
      setWatchlistState([]);
      setNotifications([]);
      setNotificationsUnread(0);
      setCollectionSummary(null);
      return undefined;
    }

    let cancelled = false;
    setSessionReady(false);

    api.me()
      .then(({ user }) => {
        if (!cancelled) setAuth((current) => ({ ...current, user }));
      })
      .catch(() => {
        // Token rejected; clear local state so the user is prompted to sign in.
        clearStoredAuth();
        if (!cancelled) setAuth(null);
      })
      .finally(() => {
        if (!cancelled) setSessionReady(true);
      });

    (async () => {
      await refreshItems();
      if (!cancelled) await refreshCollectionSummary();
    })();
    refreshFeed();
    refreshFollows();
    refreshWatchlist();
    refreshNotifications();

    return () => { cancelled = true; };
  }, [authToken, api, setAuth, refreshItems, refreshFeed, refreshFollows, refreshWatchlist, refreshNotifications, refreshCollectionSummary]);

  const addPersistedItem = useCallback((item) => {
    setPersistedItems((current) => [item, ...current.filter((existing) => existing.id !== item.id)]);
  }, []);

  const value = useMemo(() => ({
    api,
    auth,
    sessionReady,
    user: auth?.user || null,
    items: allItems,
    players: livePlayers,
    ticker: liveTicker.length ? liveTicker : MARKET_TICKER_ITEMS,
    notableSales: liveNotableSales.length ? liveNotableSales : NOTABLE_SALES,
    feed: feedEvents,
    follows: followsState,
    watchlist: watchlistState,
    notifications,
    notificationsUnread,
    collectionSummary,
    refreshItems,
    refreshFeed,
    refreshFollows,
    refreshWatchlist,
    refreshNotifications,
    refreshCollectionSummary,
    addPersistedItem,
    signOut,
    openAuth,
    openItem,
    openPlayer,
    navigate,
  }), [
    api, auth, sessionReady, allItems, livePlayers, liveTicker, liveNotableSales,
    feedEvents, followsState, watchlistState, notifications, notificationsUnread,
    collectionSummary, refreshItems, refreshFeed, refreshFollows, refreshWatchlist,
    refreshNotifications, refreshCollectionSummary, addPersistedItem,
    signOut, openAuth, openItem, openPlayer, navigate,
  ]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
