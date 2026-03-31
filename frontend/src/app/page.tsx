'use client';

import { useAtomValue } from 'jotai';
import { ArrowRight, BookOpen, Mail, Search, Shield, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { userAtom } from '@/lib/store';

export default function Home() {
  const user = useAtomValue(userAtom);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground dark">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="#">
          <Image
            src="/logo.png"
            alt="Scholar Pulse Logo"
            width={28}
            height={28}
            className="rounded-sm shadow-sm"
          />
          <span className="font-extrabold tracking-tight text-lg text-primary">
            Scholar Pulse
          </span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          {user ? (
            <Link
              className="text-sm font-medium hover:underline underline-offset-4"
              href="/dashboard"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                className="text-sm font-medium hover:underline underline-offset-4"
                href="/login"
              >
                Login
              </Link>
              <Link
                className="text-sm font-medium hover:underline underline-offset-4"
                href="/signup"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
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
                  pre-prints daily. Let Gemini summarize the signal, while you
                  focus on the science.
                </p>
              </div>
              <div className="space-x-4">
                {user ? (
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

        {/* How it Works Section */}
        <section className="w-full py-16 md:py-24 bg-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center text-center space-y-4 mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                How it Works
              </h2>
              <p className="max-w-[600px] text-muted-foreground md:text-lg">
                Set it up once, get insights forever.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-3 max-w-5xl mx-auto">
              <div className="flex flex-col items-center text-center space-y-4 relative">
                <div className="bg-primary/10 p-5 rounded-full text-primary">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-xl">1. Set Keywords</h3>
                <p className="text-sm text-muted-foreground">
                  Type natural language or select preset keywords that match
                  your exact research interests.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4 relative">
                <div className="hidden sm:block absolute top-10 -right-16 w-32 border-t-2 border-dashed border-border" />
                <div className="bg-primary/10 p-5 rounded-full text-primary">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-xl">2. AI Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Our Gemini-powered engine scans S2 and arXiv, filtering by SJR
                  Q1/Q2 rank to find top-tier papers.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4 relative">
                <div className="hidden sm:block absolute top-10 -right-16 w-32 border-t-2 border-dashed border-border" />
                <div className="bg-primary/10 p-5 rounded-full text-primary">
                  <Mail className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-xl">3. Morning Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  Wake up to a beautifully formatted daily email with 3-line
                  bullet summaries at 9:00 AM KST.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-secondary/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 border border-border p-6 rounded-lg bg-card hover:border-primary/50 transition-colors">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Daily Automation</h2>
                <p className="text-center text-muted-foreground">
                  We scan top journals and pre-print servers daily so you
                  don&apos;t have to.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 border border-border p-6 rounded-lg bg-card hover:border-primary/50 transition-colors">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Smart Filtering</h2>
                <p className="text-center text-muted-foreground">
                  Filter by SJR rank, citation count, and specific keywords to
                  find the signal in the noise.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 border border-border p-6 rounded-lg bg-card hover:border-primary/50 transition-colors">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Premium Quality</h2>
                <p className="text-center text-muted-foreground">
                  Focus on high-impact publications with our built-in journal
                  ranking filters.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-border">
        <p className="text-xs text-muted-foreground">
          © 2026 Scholar Pulse Inc. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
