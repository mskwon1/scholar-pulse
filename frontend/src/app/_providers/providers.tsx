'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';
import { type ReactNode, useState, useEffect } from 'react';
import { AuthListener } from '@/features/auth/ui/auth-listener';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const handleWheel = () => {
      if (
        document.activeElement?.tagName === 'INPUT' &&
        (document.activeElement as HTMLInputElement).type === 'number'
      ) {
        (document.activeElement as HTMLInputElement).blur();
      }
    };
    
    // Add event listener with passive: false to allow preventDefault if we wanted to
    // Here blurring the input is a foolproof way to prevent incrementing.
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <AuthListener />
        {children}
      </JotaiProvider>
    </QueryClientProvider>
  );
}
