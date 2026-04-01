'use client';

import { useAtomValue } from 'jotai';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { userAtom } from '@/entities/user/model/store';
import { useEffect, useState } from 'react';

export function HeroSection() {
  const user = useAtomValue(userAtom);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 flex flex-col items-center justify-center text-center">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="space-y-4 mb-4">
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-indigo-400">
                Never Miss a Breakthrough.
              </span>
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl leading-relaxed">
              The AI-powered research assistant that scans top journals and
              pre-prints daily. Let Gemini summarize the signal, while you focus
              on the science.
            </p>
          </div>
          <div className="space-x-4">
            {!mounted ? (
              <div className="flex justify-center gap-4">
                <div className="w-[180px] h-11 bg-muted rounded-md animate-pulse" />
                <div className="w-[120px] h-11 bg-muted rounded-md animate-pulse" />
              </div>
            ) : user ? (
              <Link href="/dashboard">
                <Button size="lg" className="px-8">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="px-8">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="px-8">
                    Login
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
