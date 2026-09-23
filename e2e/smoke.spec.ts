import { REFERENCE_PAGES, expect, freezeTime, test } from './fixtures';

test.describe('reference pages', () => {
  for (const reference of REFERENCE_PAGES) {
    test(`${reference.path} renders one H1, no console errors and no horizontal overflow`, async ({ page, pageErrors }) => {
      const response = await page.goto(reference.path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(reference.h1);
      // Hydration errors are reported right after scripts run; give them a moment to surface.
      // (Not 'networkidle': link prefetching can keep the network busy.)
      await page.waitForLoadState('load');
      await page.waitForTimeout(1_000);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(pageErrors).toEqual([]);
    });
  }

  test('the live clock is filled before hydration and keeps ticking', async ({ page }) => {
    await page.goto('/time/san-diego/');
    const clock = page.locator('#city-clock [data-clock-time]');
    await expect(clock).toHaveText(/^\d{1,2}:\d{2}:\d{2} (AM|PM)$/);
    const first = await clock.textContent();
    await expect(clock).not.toHaveText(first ?? '', { timeout: 3_000 });
  });
});

test.describe('clocks follow real DST rules at explicit instants', () => {
  test.use({ timezoneId: 'Asia/Kolkata' });

  test('homepage uses the browser time zone', async ({ page, pageErrors }) => {
    await freezeTime(page, '2026-01-15T06:30:00Z');
    await page.goto('/');
    const panel = page.locator('#local-clock');
    await expect(panel.locator('[data-clock-time]')).toHaveText('12:00:00 PM');
    await expect(panel).toContainText('Kolkata');
    await expect(panel).toContainText('IST · UTC+5:30');
    expect(pageErrors).toEqual([]);
  });

  test('CST page in January: Central Time is on CST', async ({ page }) => {
    await freezeTime(page, '2026-01-15T18:00:00Z');
    await page.goto('/timezones/cst/');
    const panel = page.locator('#timezone-clock');
    await expect(panel.locator('[data-clock-time]')).toHaveText('12:00:00 PM');
    await expect(panel).toContainText('CST · UTC-6');
    await expect(page.getByText('Central Time is on CST right now', { exact: true })).toBeVisible();
  });

  test('CST page in July: Central Time is on CDT, not CST, while Mexico City stays on CST', async ({ page }) => {
    await freezeTime(page, '2026-07-15T17:00:00Z');
    await page.goto('/timezones/cst/');
    await expect(page.locator('#timezone-clock')).toContainText('CDT · UTC-5');
    await expect(page.getByText('Central Time is on CDT right now, not CST', { exact: true })).toBeVisible();
    await expect(page.locator('#cities a', { hasText: 'Chicago' })).toContainText('CDT');
    await expect(page.locator('#cities a', { hasText: 'Mexico City' })).toContainText('CST');
    await expect(page.locator('#cities a', { hasText: 'Mexico City' })).toContainText('11:00 AM');
  });

  test('San Diego at the Visual PRD moment: PST, and DST is not in effect', async ({ page }) => {
    // The PRD showed "In effect (PST)" for this moment, which is wrong.
    await freezeTime(page, '2024-12-02T03:54:38Z');
    await page.goto('/time/san-diego/');
    const panel = page.locator('#city-clock');
    await expect(panel.locator('[data-clock-time]')).toHaveText('7:54:38 PM');
    await expect(panel).toContainText('Sunday, December 1, 2024');
    await expect(panel).toContainText('PST · UTC-8');
    await expect(page.locator('#overview li', { hasText: 'Daylight Saving Time' })).toContainText('Not in effect');
  });

  test('IST → EST converter at the Visual PRD moment: 10:24 PM IST is 11:54 AM EST', async ({ page }) => {
    // The PRD showed 12:54 PM EST for this moment, which is wrong.
    await freezeTime(page, '2024-12-02T16:54:00Z');
    await page.goto('/convert/ist-to-est/');
    const live = page.getByRole('region', { name: 'Current time in both zones' });
    await expect(live).toContainText('10:24 PM');
    await expect(live).toContainText('11:54 AM');
    await expect(live).toContainText('(EST)');
    await expect(page.locator('#time-difference')).toContainText('India Standard Time is 10 hours 30 minutes ahead of Eastern Time right now');
  });

  test('12/24-hour preference persists across reloads', async ({ page }) => {
    await freezeTime(page, '2026-01-15T20:00:00Z');
    await page.goto('/timezones/cst/');
    const clock = page.locator('#timezone-clock [data-clock-time]');
    await expect(clock).toHaveText('2:00:00 PM');
    await page.getByRole('button', { name: /^24/ }).click();
    await expect(clock).toHaveText('14:00:00');
    await page.reload();
    await expect(clock).toHaveText('14:00:00');
    await expect(page.getByRole('button', { name: /^24/ })).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('interactions', () => {
  test('search finds a city with the keyboard', async ({ page }) => {
    await page.goto('/');
    const search = page.getByRole('combobox');
    await search.fill('san d');
    await expect(page.getByRole('option', { name: /San Diego/ })).toBeVisible();
    await search.press('ArrowDown');
    await search.press('Enter');
    // Client-side navigation can take longer than 5 s when the machine is also building; the app is not at fault.
    await expect(page).toHaveURL(/\/time\/san-diego\/$/, { timeout: 15_000 });
  });

  test('timer starts, pauses and resumes', async ({ page }) => {
    await page.goto('/timer/1-hour/');
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    await expect(page).toHaveTitle(/^00:59:5\d · 1 Hour Timer$/, { timeout: 5_000 });
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
    await expect(page.getByText('Paused', { exact: true })).toBeVisible();
  });

  test('a custom timer reaches zero and announces it', async ({ page }) => {
    await page.goto('/timer/1-minute/');
    await page.getByRole('button', { name: 'Custom' }).click();
    await page.getByLabel('Minutes').fill('0');
    await page.getByLabel('Seconds').fill('2');
    await page.getByRole('button', { name: 'Set timer' }).click();
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.getByText('Time’s up!', { exact: true })).toBeVisible({ timeout: 6_000 });
    await expect(page).toHaveTitle(/^Time’s up!/);
  });

  test('mobile bottom navigation and menu work', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Bottom navigation is mobile-only');
    await page.goto('/timer/1-hour/');
    const bottomNav = page.getByRole('navigation', { name: 'Quick navigation' });
    await expect(bottomNav).toBeVisible();
    await bottomNav.getByRole('button', { name: 'More' }).click();
    const menu = page.getByRole('dialog', { name: 'Menu' });
    await expect(menu).toBeVisible();
    await menu.getByRole('link', { name: 'Time Zones' }).click();
    await expect(page).toHaveURL(/\/timezones\/$/, { timeout: 15_000 });
  });
});

test.describe('routing', () => {
  test('redirects and 404s', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'HTTP checks run once');
    const noFollow = { maxRedirects: 0 };

    const alias = await request.get('/timer/60-minutes/', noFollow);
    expect(alias.status()).toBe(308);
    expect(alias.headers().location).toMatch(/\/timer\/1-hour\/$/);

    const uppercase = await request.get('/TIME/SAN-DIEGO/', noFollow);
    expect(uppercase.status()).toBe(308);
    expect(uppercase.headers().location).toMatch(/\/time\/san-diego\/$/);

    expect((await request.get('/convert/hst-to-nst/')).status()).toBe(404); // unapproved pair (was ist-to-jst until Sprint 4 approved it)
    expect((await request.get('/time/atlantis/')).status()).toBe(404);
  });
});

test.describe('World time directory', () => {
  test('homepage lists ten cities, countries and time zones with live weekday + time and working links', async ({ page, request }) => {
    await page.goto('/');
    const directory = page.locator('[data-world-time-directory]');
    await expect(directory).toBeVisible();
    for (const id of ['directory-cities', 'directory-countries', 'directory-time-zones']) {
      const links = directory.locator(`#${id} ul a`);
      await expect(links).toHaveCount(10);
      // Bootstrap fills the placeholder before hydration; the store keeps it current.
      await expect(links.first().locator('[data-kind="weekday-time-short"]')).toHaveText(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat) \d{1,2}:\d{2}( [AP]M)?$/);
    }
    // One link per column resolves to a real page.
    for (const href of ['/time/paris/', '/countries/japan/', '/timezones/cet/']) {
      await expect(directory.locator(`a[href="${href}"]`)).toHaveCount(1);
      expect((await request.get(href)).status(), href).toBe(200);
    }
    // The abbreviation column shows each abbreviation at its defined offset, so UTC and GMT always agree.
    // (Their rows link to the canonical hubs /utc/ and /gmt/, hence the lookup by full name.)
    const text = async (name: string) => (await directory.locator(`#directory-time-zones a[title="${name}"] [data-kind]`).textContent()) ?? '';
    expect(await text('Coordinated Universal Time')).toBe(await text('Greenwich Mean Time'));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('Footer directory', () => {
  test('every page links the major cities, countries and time zones from the footer', async ({ page, isMobile }) => {
    await page.goto('/timer/1-hour/');
    const footer = page.locator('[data-footer-directory]');
    await expect(footer).toBeVisible();
    await expect(footer.locator('nav[aria-label="Current time in major cities"] a[href^="/time/"]')).toHaveCount(64);
    // 40 country pages; the "All countries" link to the hub is excluded.
    await expect(footer.locator('nav[aria-label="Current time in major countries"] a[href^="/countries/"]:not([href="/countries/"])')).toHaveCount(40);
    await expect(footer.locator('nav[aria-label="Current time in time zones"] a')).toHaveCount(19); // 18 abbreviations + hub
    await expect(footer.locator('a[href="/time/tokyo/"]')).toHaveCount(1);
    await expect(footer.locator('a[href="/countries/india/"]')).toContainText(/IN\s*India/);
    await expect(footer.locator('a[href="/timezones/cet/"]')).toHaveText('CET');
    // On phones only the first rows are visible, with links to the full directories.
    const visibleCities = await footer.locator('nav[aria-label="Current time in major cities"] li:visible').count();
    if (isMobile) {
      expect(visibleCities).toBe(25); // 24 cities + "More cities"
      await expect(footer.locator('a[href="/world-clock/"]:visible')).toHaveCount(1);
    } else {
      expect(visibleCities).toBe(64);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
