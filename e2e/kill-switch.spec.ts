import { REFERENCE_PAGES, expect, test } from './fixtures';

/** Runs against a build where NEXT_PUBLIC_ALLOW_INDEXING is not "true" (e.g. previews, staging). */
test.describe('indexing kill switch (indexing disabled)', () => {
  test('robots.txt disallows everything and advertises no sitemap', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text();
    expect(body).toContain('Disallow: /');
    expect(body).not.toContain('Allow: /');
    expect(body).not.toContain('Sitemap:');
  });

  test('the sitemap index and every child sitemap return 404', async ({ request }) => {
    expect((await request.get('/sitemap.xml')).status()).toBe(404);
    for (const file of ['pages-1', 'cities-1', 'countries-1', 'timezones-1', 'utc-1', 'timers-1', 'converters-1']) {
      expect((await request.get(`/sitemaps/${file}.xml`)).status(), file).toBe(404);
    }
  });

  for (const reference of REFERENCE_PAGES) {
    test(`${reference.path} is noindex`, async ({ page }) => {
      await page.goto(reference.path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    });
  }
});
