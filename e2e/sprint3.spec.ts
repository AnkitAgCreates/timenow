import { expect, test } from './fixtures';

/** Sprint 3: indexable timer hub and curated programmatic timer pages. */
test.describe('Sprint 3 timer pages', () => {
  test('timer hub is indexable, structured and lists every curated timer', async ({ page, pageErrors }) => {
    await page.goto('/timer/');
    await expect(page.locator('h1')).toHaveText('Online Timer');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index, follow/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/timer\/$/);

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = blocks.flatMap((block) => {
      const parsed = JSON.parse(block) as Record<string, unknown> | Record<string, unknown>[];
      return (Array.isArray(parsed) ? parsed : [parsed]).map((item) => item['@type']);
    });
    expect(types).toEqual(expect.arrayContaining(['WebApplication', 'FAQPage', 'BreadcrumbList']));

    // Grouped directory: seconds, minutes and hours, one card per preset.
    const directory = page.locator('#timers');
    await expect(directory.getByRole('heading', { name: 'Seconds' })).toBeVisible();
    await expect(directory.getByRole('heading', { name: 'Hours' })).toBeVisible();
    expect(await directory.locator('a[href^="/timer/"]').count()).toBe(30);
    await expect(directory.locator('a[href="/timer/25-minutes/"]')).toContainText('Pomodoro');

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(pageErrors).toEqual([]);
  });

  test('a new curated preset works end to end (25 minutes, Pomodoro)', async ({ page }) => {
    await page.goto('/timer/25-minutes/');
    await expect(page.locator('h1')).toHaveText('25 Minute Timer');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index, follow/);
    await expect(page.locator('#about')).toContainText('The Pomodoro length');
    // Preset-specific FAQ comes first.
    await expect(page.locator('#faqs')).toContainText('Is a 25-minute timer the same as a Pomodoro timer?');
    // Related timers include the curated pair (5-minute break) and the neighbours.
    for (const href of ['/timer/5-minutes/', '/timer/20-minutes/', '/timer/30-minutes/']) {
      await expect(page.locator(`#related a[href="${href}"]`)).toBeVisible();
    }
    // The compact directory marks the current page instead of linking to it.
    await expect(page.locator('#all-timers [aria-current="page"]')).toHaveText('25 Minutes');
    expect(await page.locator('#all-timers a[href="/timer/25-minutes/"]').count()).toBe(0);

    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page).toHaveTitle(/^00:24:5\d · 25 Minute Timer$/, { timeout: 5_000 });
  });

  test('a seconds preset counts down in seconds (30 seconds)', async ({ page }) => {
    await page.goto('/timer/30-seconds/');
    await expect(page.locator('h1')).toHaveText('30 Second Timer');
    await expect(page.getByRole('timer')).toHaveAttribute('aria-label', /00:00:30 remaining/);
    await expect(page.locator('#faqs')).toContainText('How long is 30 seconds?');
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page).toHaveTitle(/^00:00:2\d · 30 Second Timer$/, { timeout: 5_000 });
  });
});

test.describe('Sprint 3 routing', () => {
  test('second/minute/hour spellings redirect and unapproved lengths still 404', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'HTTP checks run once');
    const noFollow = { maxRedirects: 0 };
    for (const [from, to] of [
      ['/timer/30-sec/', '/timer/30-seconds/'],
      ['/timer/90-min/', '/timer/90-minutes/'],
      ['/timer/1440-minutes/', '/timer/24-hours/'],
      ['/timer/60-minutes/', '/timer/1-hour/'],
    ]) {
      const response = await request.get(from!, noFollow);
      expect(response.status(), from).toBe(308);
      expect(response.headers()['location'], from).toBe(to);
    }
    expect((await request.get('/timer/7-minutes/')).status()).toBe(200); // new in Sprint 3 (was 404)
    for (const path of ['/timer/11-minutes/', '/timer/pomodoro/', '/timer/100-hours/']) {
      expect((await request.get(path)).status(), path).toBe(404);
    }
  });
});
