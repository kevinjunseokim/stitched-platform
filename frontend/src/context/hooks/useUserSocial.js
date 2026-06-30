import { useCallback, useEffect, useState } from 'react';

import { cacheItems } from '../../data/registry';

const EMPTY_FOLLOWS = { players: new Set(), users: new Set() };

function parseFollows(follows) {
  const players = new Set();
  const users = new Set();
  follows.forEach((follow) => {
    if (follow.targetType === 'player') players.add(follow.targetId);
    if (follow.targetType === 'user') users.add(follow.targetId);
  });
  return { players, users };
}

/**
 * Social data for the signed-in user — feed, follows, watchlist, notifications.
 */
export function useUserSocial(api, authToken) {
  const [feedEvents, setFeedEvents] = useState([]);
  const [followsState, setFollowsState] = useState(EMPTY_FOLLOWS);
  const [watchlistState, setWatchlistState] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsUnread, setNotificationsUnread] = useState(0);

  const refreshFeed = useCallback(async () => {
    if (!authToken) return [];
    try {
      const { events } = await api.feed();
      setFeedEvents(events);
      cacheItems(events.map((event) => event.item).filter(Boolean));
      return events;
    } catch {
      return [];
    }
  }, [api, authToken]);

  const refreshFollows = useCallback(async () => {
    if (!authToken) {
      setFollowsState(EMPTY_FOLLOWS);
      return;
    }
    try {
      const { follows } = await api.myFollows();
      setFollowsState(parseFollows(follows));
    } catch {
      setFollowsState(EMPTY_FOLLOWS);
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

  useEffect(() => {
    if (!authToken) {
      setFeedEvents([]);
      setFollowsState(EMPTY_FOLLOWS);
      setWatchlistState([]);
      setNotifications([]);
      setNotificationsUnread(0);
      return undefined;
    }

    refreshFeed();
    refreshFollows();
    refreshWatchlist();
    refreshNotifications();

    return undefined;
  }, [authToken, refreshFeed, refreshFollows, refreshWatchlist, refreshNotifications]);

  return {
    feed: feedEvents,
    follows: followsState,
    watchlist: watchlistState,
    notifications,
    notificationsUnread,
    refreshFeed,
    refreshFollows,
    refreshWatchlist,
    refreshNotifications,
  };
}
