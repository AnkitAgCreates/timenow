/** Site-wide constants and environment-driven SEO switches. */

/** The brand is the domain (renamed from TimeNow on 2026-09-19). */
export const SITE_NAME = 'whattimein.world';
export const SITE_TAGLINE = 'The world’s time, made simple.';
export const SITE_DESCRIPTION =
  'Check the current time anywhere, compare time zones, convert times with daylight saving handled correctly, and run free online timers.';

function normaliseOrigin(value: string | undefined): string {
  const origin = (value ?? '').trim().replace(/\/+$/, '');
  return origin || 'http://localhost:3000';
}

/** Canonical origin, e.g. "https://www.example.com". Set NEXT_PUBLIC_SITE_URL in production. */
export const SITE_URL = normaliseOrigin(process.env.NEXT_PUBLIC_SITE_URL);

/**
 * Global indexing kill-switch. Anything other than "true" forces noindex and
 * disallows crawling, so previews/staging can never be indexed by accident.
 */
export const INDEXING_ENABLED = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true';

/** Public source repository (linked from About and Contact). */
export const REPO_URL = 'https://github.com/AnkitAgCreates/timenow';

/** Optional public contact address shown on the contact page; unset = GitHub issues only. */
export const CONTACT_EMAIL = (process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '').trim() || null;

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
