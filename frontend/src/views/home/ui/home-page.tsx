import Link from 'next/link';
import { HeroSection } from '@/widgets/home/ui/hero-section';
import { HowItWorksSection } from '@/widgets/home/ui/how-it-works-section';
import { FeaturesSection } from '@/widgets/home/ui/features-section';
import { HomeHeader } from '@/widgets/home/ui/home-header';

export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground dark">
      <HomeHeader />

      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
      </main>

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
