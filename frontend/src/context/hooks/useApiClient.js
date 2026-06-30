import { useMemo } from 'react';

import { makeApiClient } from '../../api/client';

/** Builds the authenticated API client from the current access token. */
export function useApiClient(authToken) {
  return useMemo(() => makeApiClient(authToken), [authToken]);
}
