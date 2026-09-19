#!/usr/bin/env node
/**
 * Submit URLs to IndexNow (Bing, Yandex, Naver, Seznam, …).
 *
 *   node scripts/seo/indexnow.mts                          # every URL in the live sitemaps
 *   node scripts/seo/indexnow.mts --urls /time/london/,/timer/1-hour/
 *   node scripts/seo/indexnow.mts --site-url https://whattimein.world --dry-run
 *
 * The key is public (lib/seo/indexnow.ts) and must be served at /<key>.txt on the
 * site; the script checks that first. Exit code 1 on any rejected request.
 */
import { buildIndexNowPayloads, describeIndexNowStatus, extractSitemapLocs, INDEXNOW_ENDPOINT, INDEXNOW_KEY } from '../../lib/seo/indexnow.ts';

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
const siteUrl = (flag('site-url') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://whattimein.world').replace(/\/+$/, '');
const dryRun = args.includes('--dry-run');
const explicit = flag('urls')?.split(',').map((u) => u.trim()).filter(Boolean);

async function text(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'whattimein.world IndexNow script' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

async function sitemapUrls(): Promise<string[]> {
  const index = await text(`${siteUrl}/sitemap.xml`);
  const children = extractSitemapLocs(index);
  const urls: string[] = [];
  for (const child of children) urls.push(...extractSitemapLocs(await text(child)));
  console.log(`Sitemap index lists ${children.length} sitemaps, ${urls.length} URLs.`);
  return urls;
}

async function main() {
  const keyUrl = `${siteUrl}/${INDEXNOW_KEY}.txt`;
  const served = (await text(keyUrl)).trim();
  if (served !== INDEXNOW_KEY) throw new Error(`Key file at ${keyUrl} does not contain the key (got "${served.slice(0, 40)}")`);
  console.log(`Key file OK: ${keyUrl}`);

  const urls = explicit ?? (await sitemapUrls());
  const payloads = buildIndexNowPayloads(siteUrl, urls);
  const total = payloads.reduce((n, p) => n + p.urlList.length, 0);
  if (!total) throw new Error('No URLs to submit.');
  console.log(`${total} URL(s) in ${payloads.length} request(s)${dryRun ? ' — dry run, nothing sent' : ''}.`);
  if (dryRun) {
    console.log(JSON.stringify({ ...payloads[0], urlList: payloads[0]!.urlList.slice(0, 5).concat(total > 5 ? [`… ${total - 5} more`] : []) }, null, 2));
    return;
  }

  let failed = 0;
  for (const [i, payload] of payloads.entries()) {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const ok = res.status === 200 || res.status === 202;
    if (!ok) failed += 1;
    console.log(`Request ${i + 1}/${payloads.length}: ${payload.urlList.length} URLs → ${res.status} ${describeIndexNowStatus(res.status)}`);
  }
  if (failed) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
