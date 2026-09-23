import { expect, test } from './fixtures';

/**
 * The indexed e2e build sets a fake NEXT_PUBLIC_GA_MEASUREMENT_ID, so the
 * consent logic is active. Requests to Google are intercepted and aborted; the
 * tests only check whether the tag was *attempted*, never talk to Google.
 *
 * The region comes from the `x-vercel-ip-country` request header, which Vercel
 * sets in production; here Playwright sets it to simulate a visitor's country.
 * Without the header the region is "unknown" and the banner is shown.
 */
async function interceptGoogle(page: import('@playwright/test').Page) {
  const attempted: string[] = [];
  await page.route('https://www.googletagmanager.com/**', (route) => {
    attempted.push(route.request().url());
    return route.abort();
  });
  return attempted;
}

test.describe('Analytics consent', () => {
  test('unknown region: nothing loads before a choice; Decline is remembered', async ({ page }) => {
    const attempted = await interceptGoogle(page);

    await page.goto('/time/london/');
    const banner = page.locator('[data-consent-banner]');
    await expect(banner).toBeVisible();
    await expect(banner.getByRole('button', { name: 'Accept' })).toBeVisible();
    await page.waitForTimeout(500);
    expect(attempted).toEqual([]);

    await banner.getByRole('button', { name: 'Decline' }).click();
    await expect(banner).toHaveCount(0);
    await page.reload();
    await expect(page.locator('[data-consent-banner]')).toHaveCount(0);
    await page.waitForTimeout(500);
    expect(attempted).toEqual([]);

    await page.goto('/privacy/');
    await expect(page.locator('[data-analytics-choice]')).toContainText('declined');
  });

  test('EU visitor: banner shown; Accept loads the tag; the privacy page can withdraw the choice', async ({ page }) => {
    const attempted = await interceptGoogle(page);
    await page.setExtraHTTPHeaders({ 'x-vercel-ip-country': 'DE' });

    await page.goto('/timer/1-hour/');
    const banner = page.locator('[data-consent-banner]');
    await expect(banner).toBeVisible();
    await page.waitForTimeout(500);
    expect(attempted).toEqual([]);

    await banner.getByRole('button', { name: 'Accept' }).click();
    await expect(banner).toHaveCount(0);
    await expect.poll(() => attempted.length, { timeout: 10_000 }).toBeGreaterThan(0);
    expect(attempted[0]).toMatch(/gtag\/js\?id=G-/);

    await page.goto('/privacy/');
    await expect(page.locator('[data-analytics-choice]')).toContainText('accepted');
    await page.getByRole('button', { name: 'Change my choice' }).click();
    await expect(page.locator('[data-consent-banner]')).toBeVisible();
  });

  test('visitor outside the consent regions: no banner, tag loads by default, opt-out works', async ({ page }) => {
    const attempted = await interceptGoogle(page);
    await page.setExtraHTTPHeaders({ 'x-vercel-ip-country': 'IN' });

    await page.goto('/time/new-delhi/');
    await expect.poll(() => attempted.length, { timeout: 10_000 }).toBeGreaterThan(0);
    expect(attempted[0]).toMatch(/gtag\/js\?id=G-/);
    await expect(page.locator('[data-consent-banner]')).toHaveCount(0);

    await page.goto('/privacy/');
    const choice = page.locator('[data-analytics-choice]');
    await expect(choice).toContainText('on by default');
    await page.getByRole('button', { name: 'Turn analytics off' }).click();
    await expect(choice).toContainText('declined');

    const before = attempted.length;
    await page.goto('/time/mumbai/');
    await expect(page.locator('[data-consent-banner]')).toHaveCount(0);
    await page.waitForTimeout(700);
    expect(attempted.length).toBe(before);
  });
});
