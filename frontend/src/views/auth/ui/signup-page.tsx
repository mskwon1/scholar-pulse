import { Suspense } from 'react';
import { SignupForm } from '@/widgets/auth/ui/signup-form';

export function SignupPage() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-background text-foreground dark">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center w-full min-h-[50vh] space-y-4">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-primary animate-spin"></div>
            </div>
            <p className="text-sm font-medium text-muted-foreground animate-pulse">
              Loading...
            </p>
          </div>
        }
      >
        <SignupForm />
      </Suspense>
    </div>
  );
}
