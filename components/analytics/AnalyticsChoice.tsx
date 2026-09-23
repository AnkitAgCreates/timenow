'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { analyticsConsentStore, loadRegion, regionStore, requiresConsent, setAnalyticsConsent } from '@/lib/analytics';
import { usePersisted } from '@/lib/clock/persisted';

const buttonClass = 'inline-flex min-h-11 items-center self-start rounded-md border border-border bg-white px-3 text-sm font-medium text-heading hover:border-blue-border';

/** Shows the visitor's current analytics state on the privacy page and lets them change it. */
export function AnalyticsChoice() {
  const consent = usePersisted(analyticsConsentStore);
  const region = useSyncExternalStore(regionStore.subscribe, regionStore.get, regionStore.getServer);

  useEffect(() => {
    if (consent === null) loadRegion();
  }, [consent]);

  let label: string;
  let action: { text: string; next: 'granted' | 'denied' | null } | null = null;
  if (consent === 'granted') {
    label = 'You have accepted analytics on this device.';
    action = { text: 'Change my choice', next: null };
  } else if (consent === 'denied') {
    label = 'You have declined analytics on this device.';
    action = { text: 'Change my choice', next: null };
  } else if (region === null) {
    label = 'Checking your region…';
  } else if (requiresConsent(region)) {
    label = 'You have not made a choice yet; the banner will ask.';
  } else {
    label = 'Analytics is on by default in your region. You can switch it off here.';
    action = { text: 'Turn analytics off', next: 'denied' };
  }

  return (
    <p data-analytics-choice className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <span>{label}</span>
      {action && (
        <button type="button" onClick={() => setAnalyticsConsent(action.next)} className={buttonClass}>
          {action.text}
        </button>
      )}
    </p>
  );
}
