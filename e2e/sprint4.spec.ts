import { expect, freezeTime, test } from './fixtures';

/** Sprint 4: indexable converter hub with a city/zone picker, curated zone and city conversion pages. */
test.describe('Sprint 4 converter', () => {
  test('converter hub is indexable and the picker converts a city chosen by search', async ({ page, pageErrors }) => {
    await freezeTime(page, '2026-01-15T17:00:00Z');
    await page.goto('/converter/');
    await expect(page.locator('h1')).toHaveText('Time Zone Converter');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index, follow/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/converter\/$/);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = blocks.flatMap((block) => {
      const parsed = JSON.parse(block) as Record<string, unknown> | Record<string, unknown>[];
      return (Array.isArray(parsed) ? parsed : [parsed]).map((item) => item['@type']);
    });
    expect(types).toEqual(expect.arrayContaining(['WebApplication', 'FAQPage', 'BreadcrumbList']));

    // Defaults: New York → India at the current hour (12:00 EST → 10:30 PM IST).
    const result = page.locator('[data-converter-result]');
    await expect(result).toContainText('10:30 PM');
    await expect(result).toContainText('IST');

    // Search a city for the "To" side and pick it with the keyboard.
    const to = page.getByRole('combobox', { name: 'To' });
    await to.fill('toky');
    await expect(page.getByRole('option', { name: /^Tokyo/ })).toBeVisible();
    await to.press('ArrowDown');
    await to.press('Enter');
    await expect(to).toHaveValue('Tokyo');
    await expect(result).toContainText('2:00 AM'); // 12:00 EST = 02:00 JST next day
    await expect(result).toContainText('JST');
    await expect(result).toContainText('next day');

    // Directory links exist for zone corridors and city pairs.
    await expect(page.locator('#popular-conversions a[href="/convert/est-to-pst/"]')).toBeVisible();
    await expect(page.locator('#city-conversions a[href="/convert/london-to-new-york/"]')).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(pageErrors).toEqual([]);
  });

  test('a new zone pair page converts correctly in January (EST → PST)', async ({ page }) => {
    await freezeTime(page, '2026-01-15T17:00:00Z');
    await page.goto('/convert/est-to-pst/');
    await expect(page.locator('h1')).toHaveText('EST to PST Converter');
    const live = page.getByRole('region', { name: 'Current time in both zones' });
    await expect(live).toContainText('12:00 PM');
    await expect(live).toContainText('9:00 AM');
    await expect(page.locator('#time-difference')).toContainText('Eastern Time is 3 hours ahead of Pacific Time');
    // FAQs are server-rendered for the build date, so the abbreviations may be EDT/PDT; the 3-hour gap is the fact.
    await expect(page.locator('#faqs')).toContainText('What time is it in PST when it is 9 AM EST?');
    await expect(page.locator('#faqs')).toContainText(/9:00 AM E[SD]T is 6:00 AM P[SD]T/);
    await expect(page.locator('#related a[href="/convert/pst-to-est/"]')).toBeVisible();
  });

  test('a city pair page is right when only the US has switched to daylight time (London → New York)', async ({ page }) => {
    await freezeTime(page, '2026-03-20T12:00:00Z');
    await page.goto('/convert/london-to-new-york/');
    await expect(page.locator('h1')).toHaveText('London to New York Time Converter');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index, follow/);
    const live = page.getByRole('region', { name: 'Current time in both zones' });
    await expect(live).toContainText('12:00 PM');
    await expect(live).toContainText('GMT');
    await expect(live).toContainText('8:00 AM');
    await expect(live).toContainText('EDT');
    // Live sentence follows the frozen instant (GMT vs EDT = 4 h); the period list is server-rendered for the build date.
    await expect(page.locator('#time-difference')).toContainText('London is 4 hours ahead of New York');
    await expect(page.locator('#time-difference')).toContainText(/London is [45] hours ahead of New York \((GMT|BST) → E[DS]T\)/);
    await expect(page.locator('#about-zones a[href="/time/london/"]')).toBeVisible();
    await expect(page.locator('#about-zones a[href="/time/new-york/"]')).toBeVisible();
    await expect(page.locator('#related a[href="/convert/new-york-to-london/"]')).toBeVisible();
  });
});

test.describe('Sprint 4 routing', () => {
  test('approved pairs resolve in both directions; unapproved and pointless pairs 404', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'HTTP checks run once');
    for (const path of ['/convert/ist-to-jst/', '/convert/jst-to-ist/', '/convert/new-york-to-london/', '/convert/gmt-to-cet/']) {
      expect((await request.get(path)).status(), path).toBe(200);
    }
    for (const path of ['/convert/hst-to-nst/', '/convert/est-to-edt/', '/convert/utc-to-gmt/', '/convert/london-to-berlin/', '/convert/london-to-est/']) {
      expect((await request.get(path)).status(), path).toBe(404);
    }
  });
});
