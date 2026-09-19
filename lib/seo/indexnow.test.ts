import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildIndexNowPayloads, describeIndexNowStatus, extractSitemapLocs, INDEXNOW_KEY, INDEXNOW_MAX_URLS } from './indexnow';

describe('IndexNow', () => {
  it('serves the key file that the engines verify', () => {
    const file = path.resolve(__dirname, '../../public', `${INDEXNOW_KEY}.txt`);
    expect(INDEXNOW_KEY).toMatch(/^[a-f0-9]{32}$/);
    expect(existsSync(file), `${file} missing`).toBe(true);
    expect(readFileSync(file, 'utf8').trim()).toBe(INDEXNOW_KEY);
  });

  it('reads locs from sitemap indexes and url sets', () => {
    const xml = '<sitemapindex><sitemap><loc>https://whattimein.world/sitemaps/cities-1.xml</loc></sitemap></sitemapindex>';
    expect(extractSitemapLocs(xml)).toEqual(['https://whattimein.world/sitemaps/cities-1.xml']);
    expect(extractSitemapLocs('<urlset><url><loc> https://whattimein.world/time/london/ </loc></url></urlset>')).toEqual(['https://whattimein.world/time/london/']);
  });

  it('builds payloads for same-host URLs only, deduplicated and chunked', () => {
    const urls = ['https://whattimein.world/', '/time/london/', 'https://whattimein.world/time/london/', 'https://other.example/x/', 'not a url'];
    const [payload, ...rest] = buildIndexNowPayloads('https://whattimein.world', urls, 'abc');
    expect(rest).toEqual([]);
    expect(payload).toEqual({
      host: 'whattimein.world',
      key: 'abc',
      keyLocation: 'https://whattimein.world/abc.txt',
      urlList: ['https://whattimein.world/', 'https://whattimein.world/time/london/'],
    });
    const many = Array.from({ length: INDEXNOW_MAX_URLS + 5 }, (_, i) => `https://whattimein.world/p/${i}/`);
    const chunks = buildIndexNowPayloads('https://whattimein.world', many);
    expect(chunks.map((c) => c.urlList.length)).toEqual([INDEXNOW_MAX_URLS, 5]);
  });

  it('explains response codes', () => {
    expect(describeIndexNowStatus(200)).toMatch(/accepted/i);
    expect(describeIndexNowStatus(403)).toMatch(/key/i);
    expect(describeIndexNowStatus(418)).toBe('HTTP 418');
  });
});
