import { REFERENCE_PAGES, expect, test } from './fixtures';

const ORIGIN = 'https://timenow.example';

test.describe('SEO with indexing enabled', () => {
  for (const reference of REFERENCE_PAGES) {
    test(`${reference.path}: canonical, robots and valid JSON-LD`, async ({ page }) => {
      await page.goto(reference.path);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${ORIGIN}${reference.path}`);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index, follow/);

      const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(blocks.length).toBeGreaterThan(0);
      const types = blocks.flatMap((block) => {
        const parsed = JSON.parse(block) as Record<string, unknown> | Record<string, unknown>[];
        return (Array.isArray(parsed) ? parsed : [parsed]).map((item) => item['@type']);
      });
      if (reference.path !== '/') expect(types).toContain('BreadcrumbList');
    });
  }

  test('robots.txt allows crawling and references the sitemap', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text();
    expect(body).toContain('Allow: /');
    expect(body).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });

  test('sitemap index and child sitemaps list only indexable pages', async ({ request }) => {
    const index = await request.get('/sitemap.xml');
    expect(index.status()).toBe(200);
    const children = [...(await index.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
    expect(children.map((url) => url.replace(ORIGIN, ''))).toEqual([
      '/sitemaps/pages-1.xml',
      '/sitemaps/cities-1.xml',
      '/sitemaps/countries-1.xml',
      '/sitemaps/timezones-1.xml',
      '/sitemaps/utc-1.xml',
      '/sitemaps/timers-1.xml',
      '/sitemaps/converters-1.xml',
    ]);

    const urls: string[] = [];
    for (const child of children) {
      const response = await request.get(child.replace(ORIGIN, ''));
      expect(response.status()).toBe(200);
      urls.push(...[...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!.replace(ORIGIN, '')));
    }
    for (const reference of REFERENCE_PAGES) expect(urls).toContain(reference.path);
    // Sprint 5: every hub and tool page is indexable.
    for (const path of ['/timezones/', '/world-clock/', '/tools/', '/meeting-planner/', '/alarm/', '/stopwatch/', '/tools/date-difference/', '/tools/hours-calculator/', '/tools/military-time-converter/', '/tools/unix-timestamp/']) expect(urls).toContain(path);
    // Sprint 4: the converter hub is indexable; zone and city conversion pages are curated.
    for (const path of ['/converter/', '/convert/est-to-pst/', '/convert/london-to-new-york/']) expect(urls).toContain(path);
    // Sprint 3: the timer hub is indexable and curated presets grew to 30.
    for (const path of ['/timer/', '/timer/25-minutes/', '/timer/30-seconds/', '/timer/24-hours/']) expect(urls).toContain(path);
    // Sprint 2: countries, the UTC/GMT hubs and offset pages are indexable; the old UTC/GMT abbreviation URLs are not.
    for (const path of ['/countries/', '/countries/united-states/', '/utc/', '/gmt/', '/utc/utc-minus-5/', '/timezones/cet/']) expect(urls).toContain(path);
    for (const path of ['/timezones/utc/', '/timezones/gmt/']) expect(urls).not.toContain(path);
    expect(urls.length).toBeGreaterThan(600);
  });
});
