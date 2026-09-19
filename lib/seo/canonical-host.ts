import { INDEXING_ENABLED, SITE_URL } from './site';

/** Local hosts (dev server, e2e servers, CI) are never redirected. */
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

export type CanonicalHostOptions = { siteUrl: string; indexing: boolean };

/**
 * Where a request that arrived on a non-canonical host should be sent, or
 * null to serve it as-is. Only active on the indexable production site, so
 * previews (indexing off) and local servers keep working on their own hosts.
 * Covers the `*.vercel.app` aliases and per-deployment URLs, which would
 * otherwise serve duplicates of every page.
 */
export function canonicalRedirect(
  host: string | null,
  pathname: string,
  search = '',
  { siteUrl, indexing }: CanonicalHostOptions = { siteUrl: SITE_URL, indexing: INDEXING_ENABLED },
): string | null {
  if (!indexing || !host || LOCAL_HOST.test(host)) return null;
  let canonicalHost: string;
  try {
    canonicalHost = new URL(siteUrl).host;
  } catch {
    return null;
  }
  if (!canonicalHost || LOCAL_HOST.test(canonicalHost)) return null;
  if (host.toLowerCase() === canonicalHost.toLowerCase()) return null;
  return `${siteUrl.replace(/\/+$/, '')}${pathname}${search}`;
}
