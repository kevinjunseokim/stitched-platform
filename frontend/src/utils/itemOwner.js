import { DEMO_COLLECTORS } from '../data/mocks';

/**
 * Normalise an item's owner into a renderable `{ handle, displayName, initials,
 * color }` shape. Persisted items arrive with a full `ownerUser` payload from
 * the backend; legacy mock items only carry a string `owner` handle, which we
 * hydrate from `DEMO_COLLECTORS` (or synthesise a fallback) so the UI never
 * shows a bare handle.
 */
export function resolveItemOwner(item) {
  if (item?.ownerUser?.handle) return item.ownerUser;
  const handle = typeof item?.owner === 'string' ? item.owner : null;
  if (!handle) return null;
  if (DEMO_COLLECTORS[handle]) return DEMO_COLLECTORS[handle];
  return {
    handle,
    displayName: handle.charAt(0).toUpperCase() + handle.slice(1),
    initials: handle.slice(0, 2).toUpperCase(),
  };
}
