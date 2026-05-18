import { createContext, useContext } from 'react';

import { makeApiClient } from '../api/client';

// Default shape used by `createContext` so consumers can introspect the
// schema without crashing if used outside a provider. The real values
// come from `AppDataProvider`.
export const AppDataContext = createContext({
  api: makeApiClient(null),
  auth: null,
  sessionReady: true,
  user: null,
  items: [],
  players: [],
  ticker: [],
  notableSales: [],
  feed: [],
  follows: { players: new Set(), users: new Set() },
  watchlist: [],
  notifications: [],
  notificationsUnread: 0,
  collectionSummary: null,
  refreshItems: () => Promise.resolve(),
  refreshFeed: () => Promise.resolve(),
  refreshFollows: () => Promise.resolve(),
  refreshWatchlist: () => Promise.resolve(),
  refreshNotifications: () => Promise.resolve(),
  refreshCollectionSummary: () => Promise.resolve(),
  signOut: () => {},
  openAuth: () => {},
  openItem: () => {},
  openPlayer: () => {},
  navigate: () => {},
});

export const useApp = () => useContext(AppDataContext);
