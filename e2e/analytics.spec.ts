import { expect, test } from './fixtures';

/**
 * The indexed e2e build sets a fake NEXT_PUBLIC_GA_MEASUREMENT_ID, so the
 * consent banner renders. Requests to Google are intercepted and aborted; the
 * tests only check whether the tag was *attempted*, never talk to Google.
 */
test.describe('Analytics consent', () => {
  test('nothing loads before a choice; Decline is remembered', async ({ page }) => {
    const attempted: string[] = [];
    await page.route('https://www.googletagmanager.com/**', (route) => {
      attempted.push(route.request().url());
      return route.abort();
    });

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

  test('Accept loads the tag, and the privacy page can withdraw the choice', async ({ page }) => {
    const attempted: string[] = [];
    await page.route('https://www.googletagmanager.com/**', (route) => {
      attempted.push(route.request().url());
      return route.abort();
    });

    await page.goto('/timer/1-hour/');
    await page.locator('[data-consent-banner]').getByRole('button', { name: 'Accept' }).click();
    await expect(page.locator('[data-consent-banner]')).toHaveCount(0);
    await expect.poll(() => attempted.length, { timeout: 10_000 }).toBeGreaterThan(0);
    expect(attempted[0]).toMatch(/gtag\/js\?id=G-/);

    await page.goto('/privacy/');
    await expect(page.locator('[data-analytics-choice]')).toContainText('accepted');
    await page.getByRole('button', { name: 'Change my choice' }).click();
    await expect(page.locator('[data-consent-banner]')).toBeVisible();
  });
});
