/**
 * IndexNow (https://www.indexnow.org): tell Bing, Yandex, Naver, Seznam and
 * the other participating engines which URLs changed, instead of waiting for
 * a crawl. The key is public by design — the engines verify it by fetching
 * `https://<host>/<key>.txt`, which is served from /public — so it lives in
 * source, not in a secret. Pure helpers here; the CLI is scripts/seo/indexnow.mts.
 */

/** Must match the file name and content of public/<key>.txt. */
export const INDEXNOW_KEY = '07b1687f827a41ccb39859bdc08c4d3b';

/** Shared endpoint: one submission reaches every participating engine. */
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

/** Protocol limit per request. */
export const INDEXNOW_MAX_URLS = 10_000;

export type IndexNowPayload = { host: string; key: string; keyLocation: string; urlList: string[] };

/** Absolute page URLs from a sitemap or sitemap index body. */
export function extractSitemapLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]!);
}

/**
 * Request bodies for `urls` (absolute, same host as `siteUrl`). Foreign hosts
 * and duplicates are dropped; the list is chunked to the protocol limit.
 */
export function buildIndexNowPayloads(siteUrl: string, urls: string[], key = INDEXNOW_KEY): IndexNowPayload[] {
  const origin = new URL(siteUrl);
  const keyLocation = `${origin.origin}/${key}.txt`;
  const accepted: string[] = [];
  const seen = new Set<string>();
  for (const raw of urls) {
    const trimmed = raw.trim();
    // Only absolute http(s) URLs or site-relative paths; anything else is garbage, not a page.
    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('/')) continue;
    let url: URL;
    try {
      url = new URL(trimmed, origin.origin);
    } catch {
      continue;
    }
    if (url.host !== origin.host || seen.has(url.href)) continue;
    seen.add(url.href);
    accepted.push(url.href);
  }
  const payloads: IndexNowPayload[] = [];
  for (let i = 0; i < accepted.length; i += INDEXNOW_MAX_URLS) {
    payloads.push({ host: origin.host, key, keyLocation, urlList: accepted.slice(i, i + INDEXNOW_MAX_URLS) });
  }
  return payloads;
}

/** Human-readable meaning of an IndexNow response status. */
export function describeIndexNowStatus(status: number): string {
  switch (status) {
    case 200:
      return 'OK — URLs accepted';
    case 202:
      return 'Accepted — key validation pending';
    case 400:
      return 'Bad request — invalid format';
    case 403:
      return 'Forbidden — key not valid for this host (is /<key>.txt live?)';
    case 422:
      return 'Unprocessable — URLs do not belong to the host, or key file mismatch';
    case 429:
      return 'Too many requests — slow down';
    default:
      return `HTTP ${status}`;
  }
}
