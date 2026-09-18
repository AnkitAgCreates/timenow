import { expect, freezeTime, test } from './fixtures';

/** Sprint 2 templates: countries, UTC/GMT hubs, offset pages, new abbreviation pages. */
test.describe('Sprint 2 pages', () => {
  test.use({ timezoneId: 'Asia/Kolkata' });

  for (const [path, h1] of [
    ['/countries/', 'Current Time by Country'],
    ['/countries/united-states/', 'Current Time in United States'],
    ['/countries/india/', 'Current Time in India'],
    ['/utc/', 'Coordinated Universal Time (UTC)'],
    ['/gmt/', 'Greenwich Mean Time (GMT)'],
    ['/utc/utc-minus-5/', 'UTC-5 Time Now'],
    ['/utc/utc-plus-530/', 'UTC+5:30 Time Now'],
    ['/timezones/cet/', 'Central European Time (CET)'],
    ['/timezones/aest/', 'Australian Eastern Standard Time (AEST)'],
    ['/time/lagos/', 'Current Time in Lagos, Nigeria'],
  ] as const) {
    test(`${path} renders one H1, no console errors and no horizontal overflow`, async ({ page, pageErrors }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(h1);
      await page.waitForLoadState('load');
      await page.waitForTimeout(1_000);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(pageErrors).toEqual([]);
    });
  }

  test('country page: United States in January is on EST, Arizona never changes', async ({ page }, testInfo) => {
    await freezeTime(page, '2026-01-15T18:00:00Z');
    await page.goto('/countries/united-states/');
    const hero = page.locator('#country-clock');
    await expect(hero.locator('[data-clock-time]')).toHaveText('1:00:00 PM');
    await expect(hero).toContainText('EST · UTC-5');
    // Phones get one card per zone group; wider screens get the table. Only one variant is visible.
    const isMobile = testInfo.project.name === 'mobile';
    await expect(page.locator('#zones table')).toBeVisible({ visible: !isMobile });
    await expect(page.locator('#zones li[data-zone-group]').first()).toBeVisible({ visible: isMobile });
    const rows = page.locator('#zones [data-zone-group]:visible');
    await expect(rows).toHaveCount(8);
    await expect(rows.filter({ hasText: 'Mountain Time (Arizona)' })).toContainText('Not observed');
    await expect(rows.filter({ hasText: 'Eastern Time' }).first()).toContainText('Not in effect');
    await expect(rows.filter({ hasText: 'Hawaii Time' })).toContainText('8:00 AM');
  });

  test('country page: United States in July is on EDT', async ({ page }) => {
    await freezeTime(page, '2026-07-15T17:00:00Z');
    await page.goto('/countries/united-states/');
    await expect(page.locator('#country-clock')).toContainText('EDT · UTC-4');
    await expect(page.locator('#zones [data-zone-group]:visible').filter({ hasText: 'Eastern Time' }).first()).toContainText('In effect (EDT)');
  });

  test('city breadcrumbs now link to the country page', async ({ page }) => {
    await page.goto('/time/san-diego/');
    const crumb = page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'United States' });
    await expect(crumb).toHaveAttribute('href', '/countries/united-states/');
  });

  test('UTC offset page shows the fixed-offset clock and the UTC reference', async ({ page }) => {
    await freezeTime(page, '2026-01-15T12:00:00Z');
    await page.goto('/utc/utc-minus-5/');
    await expect(page.locator('#offset-clock [data-clock-time]')).toHaveText('7:00:00 AM');
    await expect(page.locator('#offset-clock')).toContainText('Fixed offset UTC-5');
    await expect(page.getByText('UTC now:')).toContainText('12:00:00 PM');
    await expect(page.locator('#places')).toContainText('UTC-5 all year');
    await expect(page.locator('#places')).toContainText('UTC-5 as daylight saving time');
    await expect(page.locator('#your-time')).toContainText('Your time zone is Kolkata (IST)');
    await expect(page.locator('#your-time')).toContainText('UTC-5 is 10 hours 30 minutes behind your local time');
  });

  test('UTC hub lists every offset with a live time', async ({ page }) => {
    await freezeTime(page, '2026-01-15T12:00:00Z');
    await page.goto('/utc/');
    await expect(page.locator('#timezone-clock [data-clock-time]')).toHaveText('12:00:00 PM');
    const row = page.locator('#offsets tbody tr').filter({ hasText: 'UTC+5:30' });
    await expect(row).toContainText('5:30 PM');
    await expect(row.getByRole('link')).toHaveAttribute('href', '/utc/utc-plus-530/');
  });

  test('search finds countries', async ({ page }) => {
    await page.goto('/');
    const search = page.getByRole('combobox');
    await search.fill('germ');
    // Results are grouped (cities, then countries), so German cities precede the country itself.
    const germany = page.getByRole('option', { name: /^Germany/ });
    await expect(germany).toBeVisible();
    await germany.click();
    await expect(page).toHaveURL(/\/countries\/germany\/$/);
  });
});

test.describe('Sprint 2 routing', () => {
  test('UTC and GMT redirects and offset 404s', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'HTTP checks run once');
    const noFollow = { maxRedirects: 0 };
    const utc = await request.get('/timezones/utc/', noFollow);
    expect(utc.status()).toBe(308);
    expect(utc.headers().location).toMatch(/\/utc\/$/);
    const gmt = await request.get('/timezones/gmt/', noFollow);
    expect(gmt.status()).toBe(308);
    expect(gmt.headers().location).toMatch(/\/gmt\/$/);
    const gmtOffset = await request.get('/gmt/gmt-minus-5/', noFollow);
    expect(gmtOffset.status()).toBe(308);
    expect(gmtOffset.headers().location).toMatch(/\/utc\/utc-minus-5\/$/);
    // Offsets nobody uses and unknown countries are 404, not thin pages.
    expect((await request.get('/utc/utc-plus-430/')).status()).toBe(404);
    expect((await request.get('/countries/atlantis/')).status()).toBe(404);
  });
});
