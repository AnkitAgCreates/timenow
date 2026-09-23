'use client';

import Script from 'next/script';
import { useEffect, useSyncExternalStore } from 'react';
import { analyticsConsentStore, GA_MEASUREMENT_ID, loadRegion, regionStore, requiresConsent, setAnalyticsConsent } from '@/lib/analytics';
import { usePersisted } from '@/lib/clock/persisted';
import { ConsentBanner } from './ConsentBanner';

const subscribeNoop = () => () => {};
/** True only after hydration, so returning visitors never see the banner flash. */
const useHydrated = () => useSyncExternalStore(subscribeNoop, () => true, () => false);

/**
 * Loads Google Analytics 4 when a measurement ID is configured and either the
 * visitor accepted the banner or they are outside the regions that require
 * consent (EU/EEA, UK, Switzerland). A stored "denied" always wins. Before a
 * choice in a consent region the banner is shown and nothing goes to Google.
 */
export function Analytics() {
  const hydrated = useHydrated();
  const consent = usePersisted(analyticsConsentStore);
  const region = useSyncExternalStore(regionStore.subscribe, regionStore.get, regionStore.getServer);
  const needRegion = hydrated && Boolean(GA_MEASUREMENT_ID) && consent === null;

  useEffect(() => {
    if (needRegion) loadRegion();
  }, [needRegion]);

  if (!GA_MEASUREMENT_ID || !hydrated) return null;
  if (consent === 'granted') return <GoogleTag id={GA_MEASUREMENT_ID} />;
  if (consent === 'denied') return null;
  if (region === null) return null; // still resolving
  if (!requiresConsent(region)) return <GoogleTag id={GA_MEASUREMENT_ID} />;
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
