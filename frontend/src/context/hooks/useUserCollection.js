import { useCallback, useEffect, useState } from 'react';

import { ITEMS } from '../../data/mocks';
import { setLiveItems } from '../../data/registry';

/**
 * The signed-in user's collection — persisted items and portfolio summary.
 */
export function useUserCollection(api, authToken) {
  const [persistedItems, setPersistedItems] = useState([]);
  const [collectionSummary, setCollectionSummary] = useState(null);

  const allItems = persistedItems.length ? persistedItems : ITEMS;

  useEffect(() => { setLiveItems(allItems); }, [allItems]);

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

  const addPersistedItem = useCallback((item) => {
    setPersistedItems((current) => [
      item,
      ...current.filter((existing) => existing.id !== item.id),
    ]);
  }, []);

  useEffect(() => {
    if (!authToken) {
      setPersistedItems([]);
      setCollectionSummary(null);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      await refreshItems();
      if (!cancelled) await refreshCollectionSummary();
    })();

    return () => { cancelled = true; };
  }, [authToken, refreshItems, refreshCollectionSummary]);

  return {
    items: allItems,
    collectionSummary,
    refreshItems,
    refreshCollectionSummary,
    addPersistedItem,
  };
}
