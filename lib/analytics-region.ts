/**
 * Which visitors must be asked before analytics runs. Server-safe (no React).
 *
 * The EU/EEA, the UK and Switzerland require consent for analytics cookies;
 * everywhere else Google Analytics runs by default with an opt-out on the
 * privacy page. An unknown country (no geo header: local, e2e, odd proxies)
 * is treated as a consent region, so the safe behaviour is to ask.
 */

/** ISO 3166-1 alpha-2: EU-27, EEA (IS, LI, NO), United Kingdom, Switzerland. */
export const CONSENT_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO',
  'GB',
  'CH',
]);

export type ConsentRegion = 'eu' | 'other' | 'unknown';

/** Region for a country code as sent by the host in `x-vercel-ip-country`. */
export function consentRegion(countryCode: string | null | undefined): ConsentRegion {
  const code = (countryCode ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return 'unknown';
  return CONSENT_COUNTRIES.has(code) ? 'eu' : 'other';
}

/** True when the visitor must be asked before the tag loads. */
export function requiresConsent(region: ConsentRegion): boolean {
  return region !== 'other';
}
