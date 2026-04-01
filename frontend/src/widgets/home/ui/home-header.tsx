'use client';

import { useAtomValue } from 'jotai';
import Image from 'next/image';
import Link from 'next/link';
import { userAtom } from '@/entities/user/model/store';
import { useEffect, useState } from 'react';

export function HomeHeader() {
  const user = useAtomValue(userAtom);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
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
        {!mounted ? (
          <div className="flex gap-4">
            <div className="w-10 h-5 bg-muted rounded animate-pulse" />
            <div className="w-14 h-5 bg-muted rounded animate-pulse" />
          </div>
        ) : user ? (
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
  );
}
