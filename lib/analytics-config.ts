/**
 * Build-time analytics configuration, safe to import from Server Components
 * (no React, no browser APIs). The client-side helpers live in lib/analytics.ts.
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';

/** True when a measurement ID is configured for this build. */
export const ANALYTICS_CONFIGURED = GA_MEASUREMENT_ID.length > 0;
