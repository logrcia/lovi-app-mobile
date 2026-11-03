import { useCallback, useEffect, useState } from 'react';

import { countUnreadNotifications } from '../repositories/notifications';

/**
 * How often the bell re-counts while the app is open. A count is one indexed `head` request,
 * so this can be much livelier than the full-dataset refresh Explore uses.
 */
const UNREAD_REFRESH_MS = 20_000;

export interface UnreadNotificationsState {
  count: number;
  /** Re-counts right away, e.g. when coming back to the feed. */
  refresh: () => void;
  /** Clears the badge locally once the inbox has marked everything as read. */
  clear: () => void;
}

export function useUnreadNotifications(profileId: string): UnreadNotificationsState {
  const [count, setCount] = useState(0);
  const [revision, setRevision] = useState(0);

  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  const clear = useCallback(() => setCount(0), []);

  useEffect(() => {
    let cancelled = false;

    const run = () => {
      countUnreadNotifications(profileId)
        .then((next) => {
          if (!cancelled) setCount(next);
        })
        // A failed count keeps the last known badge; the next tick tries again.
        .catch(() => undefined);
    };

    run();
    const interval = setInterval(run, UNREAD_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [profileId, revision]);

  return { count, refresh, clear };
}
