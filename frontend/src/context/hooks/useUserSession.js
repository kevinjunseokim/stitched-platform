import { useEffect, useState } from 'react';

import { clearStoredAuth } from '../../api/storage';

/**
 * Validates the stored token on login and exposes `sessionReady` so routes
 * can wait before redirecting unauthenticated users.
 */
export function useUserSession(authToken, api, setAuth) {
  const [sessionReady, setSessionReady] = useState(() => !authToken);

  useEffect(() => {
    if (!authToken) {
      setSessionReady(true);
      return undefined;
    }

    let cancelled = false;
    setSessionReady(false);

    api.me()
      .then(({ user }) => {
        if (!cancelled) setAuth((current) => ({ ...current, user }));
      })
      .catch(() => {
        clearStoredAuth();
        if (!cancelled) setAuth(null);
      })
      .finally(() => {
        if (!cancelled) setSessionReady(true);
      });

    return () => { cancelled = true; };
  }, [authToken, api, setAuth]);

  return { sessionReady };
}
