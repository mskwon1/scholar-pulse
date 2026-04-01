'use client';

import { useEffect } from 'react';
import { supabase } from '@/shared/api/supabase';
import { useSetAtom } from 'jotai';
import { userAtom, authLoadingAtom } from '@/entities/user/model/store';

export function AuthListener() {
  const setUser = useSetAtom(userAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (
        event === 'SIGNED_IN' ||
        event === 'SIGNED_OUT' ||
        event === 'INITIAL_SESSION'
      ) {
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setAuthLoading]);

  return null;
}
