'use client';

import Script from 'next/script';
import { useSyncExternalStore } from 'react';
import { analyticsConsentStore, GA_MEASUREMENT_ID, setAnalyticsConsent } from '@/lib/analytics';
import { usePersisted } from '@/lib/clock/persisted';
import { ConsentBanner } from './ConsentBanner';

const subscribeNoop = () => () => {};
/** True only after hydration, so returning visitors never see the banner flash. */
const useHydrated = () => useSyncExternalStore(subscribeNoop, () => true, () => false);

/**
 * Loads Google Analytics 4 only when a measurement ID is configured AND the
 * visitor has accepted the banner. Before a choice the banner is shown and no
 * request goes to Google; after a refusal nothing is rendered at all.
 */
export function Analytics() {
  const hydrated = useHydrated();
  const consent = usePersisted(analyticsConsentStore);
  if (!GA_MEASUREMENT_ID || !hydrated) return null;
  if (consent === 'granted') return <GoogleTag id={GA_MEASUREMENT_ID} />;
  if (consent === 'denied') return null;
  return <ConsentBanner onChoice={setAnalyticsConsent} />;
}

function GoogleTag({ id }: { id: string }) {
  const json = JSON.stringify(id);
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});
gtag('js',new Date());gtag('config',${json},{anonymize_ip:true});`}
      </Script>
    </>
  );
}
