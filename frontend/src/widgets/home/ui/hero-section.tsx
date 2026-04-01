'use client';

import { useAtomValue } from 'jotai';
import { ArrowRight, Sparkles } from 'lucide-react';
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
    <section className="relative w-full py-20 lg:py-40 flex flex-col items-center justify-center text-center overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-background to-background" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center space-y-8">
          
          <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-800 shadow-sm mb-6">
            <Sparkles className="mr-2 h-4 w-4 text-indigo-600" />
            <span>Powered by Gemini 1.5 Flash</span>
          </div>

          <div className="space-y-6 max-w-4xl">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              Curate Research with{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-cyan-500">
                AI Precision.
              </span>
            </h1>
            <p className="mx-auto max-w-[750px] text-muted-foreground md:text-xl lg:text-2xl leading-relaxed tracking-tight">
              Create up to 5 customized topic feeds. We scan ArXiv and Semantic Scholar, filtering by impact, and deliver 3-line Gemini summaries straight to your inbox.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            {!mounted ? (
              <div className="flex justify-center gap-4">
                <div className="w-[180px] h-12 bg-muted rounded-full animate-pulse" />
                <div className="w-[120px] h-12 bg-muted rounded-full animate-pulse" />
              </div>
            ) : user ? (
              <Link href="/dashboard">
                <Button size="lg" className="rounded-full px-8 h-12 text-base shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all">
                  Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="rounded-full px-8 h-12 text-base shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all">
                    Start Curating Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base border-border hover:bg-muted/50">
                    Log In
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
