'use client';

import { Lock, Mail } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  useEffect(() => {
    // Listen for implicit grant (from email verification link)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
        router.push('/dashboard');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Login to manage your Scholar Pulse settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-blue-500">{message}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Button
            variant="link"
            className="p-0"
            onClick={() => router.push('/signup')}
          >
            Sign Up
          </Button>
        </p>
        <Button variant="link" size="sm" onClick={() => router.push('/')}>
          Back to Home
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground dark">
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
        <LoginForm />
      </Suspense>
    </div>
  );
}
