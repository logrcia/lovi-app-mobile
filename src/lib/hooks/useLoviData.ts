import { useCallback, useEffect, useState } from 'react';

import { fetchLoviData, type LoviData } from '../repositories/loviData';

export interface LoviDataState {
  status: 'loading' | 'ready' | 'error';
  data: LoviData | null;
  error: string | null;
  /** Re-reads everything from Postgres. Call it after any successful write. */
  refetch: () => void;
}

/** Loads the public dataset for the signed-in profile and re-runs when the user changes. */
export function useLoviData(profileId: string): LoviDataState {
  const [state, setState] = useState<Omit<LoviDataState, 'refetch'>>({
    status: 'loading',
    data: null,
    error: null,
  });
  const [revision, setRevision] = useState(0);

  const refetch = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;

    fetchLoviData(profileId)
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Error desconocido';
        setState((previous) => ({
          // A failed background refresh must not throw away the dataset already on screen:
          // Explore polls this hook, and one transient blip would otherwise blank the feed.
          status: previous.data ? 'ready' : 'error',
          data: previous.data,
          error: message,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [profileId, revision]);

  return { ...state, refetch };
}
