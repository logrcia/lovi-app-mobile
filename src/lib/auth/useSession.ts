import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { supabase } from '../db/client';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export interface AuthState {
  status: AuthStatus;
  session: Session | null;
}

/**
 * Single source of truth for "who is logged in".
 *
 * `getSession()` restores the persisted session from AsyncStorage on cold start;
 * `onAuthStateChange` keeps it in sync for sign in, sign out and token refresh.
 */
export function useSession(): AuthState {
  const [state, setState] = useState<AuthState>({ status: 'loading', session: null });

  useEffect(() => {
    let cancelled = false;

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setState(
        data.session
          ? { status: 'signedIn', session: data.session }
          : { status: 'signedOut', session: null }
      );
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(
        session ? { status: 'signedIn', session } : { status: 'signedOut', session: null }
      );
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return state;
}
