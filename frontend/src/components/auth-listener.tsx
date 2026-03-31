'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSetAtom } from 'jotai';
import { userAtom } from '@/lib/store';

export function AuthListener() {
  const setUser = useSetAtom(userAtom);

  useEffect(() => {
    // Optionally trigger an initial check here if needed, 
    // but atomWithStorage already triggers initial load.
    // However, onAuthStateChange fires an INITIAL_SESSION event natively too.
    
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
