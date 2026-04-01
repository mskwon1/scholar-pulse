'use client';

import { useEffect } from 'react';
import { supabase } from '@/shared/api/supabase';
import { useSetAtom } from 'jotai';
import { userAtom } from '@/entities/user/model/store';

export function AuthListener() {
  const setUser = useSetAtom(userAtom);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED' ||
        event === 'INITIAL_SESSION'
      ) {
        setUser(session?.user || null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return null;
}
