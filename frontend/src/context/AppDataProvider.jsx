import { useMemo } from 'react';

import {
  useApiClient,
  usePublicCatalog,
  useUserCollection,
  useUserSession,
  useUserSocial,
} from './hooks';
import { AppDataContext } from './AppDataContext';

// Composes focused data hooks into one context value. Screens still use
// `useApp()` — routing callbacks are injected from `App.jsx`.
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
  const authToken = auth?.access_token;
  const api = useApiClient(authToken);

  const { sessionReady } = useUserSession(authToken, api, setAuth);
  const { players, ticker, notableSales } = usePublicCatalog(api);
  const {
    items,
    collectionSummary,
    refreshItems,
    refreshCollectionSummary,
    addPersistedItem,
  } = useUserCollection(api, authToken);
  const {
    feed,
    follows,
    watchlist,
    notifications,
    notificationsUnread,
    refreshFeed,
    refreshFollows,
    refreshWatchlist,
    refreshNotifications,
  } = useUserSocial(api, authToken);

  const value = useMemo(() => ({
    api,
    auth,
    sessionReady,
    user: auth?.user || null,
    items,
    players,
    ticker,
    notableSales,
    feed,
    follows,
    watchlist,
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
    api,
    auth,
    sessionReady,
    items,
    players,
    ticker,
    notableSales,
    feed,
    follows,
    watchlist,
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
  ]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
