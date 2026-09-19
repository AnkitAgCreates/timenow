'use client';

import { analyticsConsentStore, setAnalyticsConsent } from '@/lib/analytics';
import { usePersisted } from '@/lib/clock/persisted';

/** Shows the visitor's current analytics choice on the privacy page and lets them change it. */
export function AnalyticsChoice() {
  const consent = usePersisted(analyticsConsentStore);
  const label = consent === 'granted' ? 'You have accepted analytics on this device.' : consent === 'denied' ? 'You have declined analytics on this device.' : 'You have not made a choice yet; the banner will ask.';
  return (
    <p data-analytics-choice className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <span>{label}</span>
      {consent !== null && (
        <button
          type="button"
          onClick={() => setAnalyticsConsent(null)}
          className="inline-flex min-h-11 items-center self-start rounded-md border border-border bg-white px-3 text-sm font-medium text-heading hover:border-blue-border"
        >
          Change my choice
        </button>
      )}
    </p>
  );
}
