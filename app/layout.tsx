import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@/components/analytics/Analytics';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { SearchDialog } from '@/components/search/SearchDialog';
import { CLOCK_BOOTSTRAP_SCRIPT } from '@/lib/clock/bootstrap';
import { INDEXING_ENABLED, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo/site';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Current Time, Time Zones & Timers`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  robots: INDEXING_ENABLED ? undefined : { index: false, follow: true },
  formatDetection: { telephone: false, date: false, address: false },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Defines window.__tn so live clocks render real values before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: CLOCK_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:shadow-raised">
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1 pb-6 md:pb-0">
          {children}
        </main>
        <Footer />
        <MobileBottomNav />
        <MobileMenu />
        <SearchDialog />
        <Analytics />
      </body>
    </html>
  );
}
