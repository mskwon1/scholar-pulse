import type { Metadata } from 'next';
import 'pretendard/dist/web/variable/pretendardvariable.css';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Scholar Pulse',
    template: '%s | Scholar Pulse',
  },
  description:
    'Your AI-curated daily research insights. Discover breakthroughs without the manual search.',
  icons: {
    icon: '/logo.png',
  },
};

import { Providers } from '@/app/_providers/providers';
import { Toaster } from '@/shared/ui/sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
