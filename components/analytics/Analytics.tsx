import Script from 'next/script';
import { GA_MEASUREMENT_ID } from '@/lib/analytics';

/** Loads GA4 only when a measurement ID is configured via environment variable. */
export function Analytics() {
  if (!GA_MEASUREMENT_ID) return null;
  const id = JSON.stringify(GA_MEASUREMENT_ID);
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${id});`}
      </Script>
    </>
  );
}
