'use client';

import Link from 'next/link';
import type { AnalyticsConsent } from '@/lib/analytics';
import { routes } from '@/lib/routes';

/**
 * Fixed bar asking whether Google Analytics may run. Sits above the mobile
 * bottom navigation and never shifts page content (position: fixed).
 */
export function ConsentBanner({ onChoice }: { onChoice: (choice: AnalyticsConsent) => void }) {
  return (
    <section
      role="region"
      aria-label="Analytics consent"
      data-consent-banner
      className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 px-3 md:bottom-4"
    >
      <div className="card mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3 shadow-raised sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-body">
          <span className="font-semibold text-heading">Can we measure which pages are useful?</span> With your OK, Google Analytics counts page views and tool use. No ads, no
          personal data, and nothing loads until you accept.{' '}
          <Link href={routes.privacy()} className="underline hover:text-primary">
            Privacy
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onChoice('denied')}
            className="inline-flex min-h-11 items-center rounded-md border border-border bg-white px-4 text-sm font-medium text-heading hover:border-blue-border"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => onChoice('granted')}
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Accept
          </button>
        </div>
      </div>
    </section>
  );
}
