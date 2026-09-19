import { expect, test } from './fixtures';

const jsonLdTypes = async (page: import('@playwright/test').Page) => {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((block) => {
    const parsed = JSON.parse(block) as Record<string, unknown> | Record<string, unknown>[];
    return (Array.isArray(parsed) ? parsed : [parsed]).map((item) => item['@type']);
  });
};

/** Sprint 5: world clock, meeting planner, alarm, stopwatch and the four calculators; hubs become indexable. */
test.describe('Sprint 5 tools', () => {
  for (const [path, h1] of [
    ['/world-clock/', 'World Clock'],
    ['/meeting-planner/', 'Meeting Planner'],
    ['/stopwatch/', 'Online Stopwatch'],
    ['/alarm/', 'Online Alarm Clock'],
    ['/tools/date-difference/', 'Date Difference Calculator'],
    ['/tools/hours-calculator/', 'Hours Calculator'],
    ['/tools/military-time-converter/', 'Military Time Converter'],
    ['/tools/unix-timestamp/', 'Unix Timestamp Converter'],
    ['/tools/', 'Time Tools'],
    ['/timezones/', 'Time Zone Abbreviations'],
  ] as const) {
    test(`${path} is indexable, has one H1, structured data, no console errors and no horizontal overflow`, async ({ page, pageErrors }) => {
      await page.goto(path);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(h1);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index, follow/);
      const types = await jsonLdTypes(page);
      expect(types).toContain('BreadcrumbList');
      expect(types.some((t) => t === 'WebApplication' || t === 'WebPage')).toBe(true);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(pageErrors).toEqual([]);
    });
  }

  test('world clock: add a city, keep it after reload, remove it', async ({ page }) => {
    await page.goto('/world-clock/');
    const rows = page.locator('[data-world-clock-row]');
    await expect(rows).toHaveCount(8);
    const picker = page.getByRole('combobox', { name: 'Add a city, time zone or UTC offset' });
    // Berlin is not in the default list (Tokyo is, and duplicates are ignored).
    await picker.fill('berl');
    await expect(page.getByRole('option', { name: /^Berlin/ })).toBeVisible();
    await page.getByRole('option', { name: /^Berlin/ }).click();
    await expect(rows).toHaveCount(9);
    await expect(rows.last()).toContainText('Berlin');
    await expect(rows.last()).toContainText(/CES?T/);
    await page.reload();
    await expect(page.locator('[data-world-clock-row]')).toHaveCount(9);
    await page.getByRole('button', { name: 'Remove Berlin' }).click();
    await expect(page.locator('[data-world-clock-row]')).toHaveCount(8);
  });

  test('stopwatch: start, lap, pause, reset', async ({ page }) => {
    await page.goto('/stopwatch/');
    const display = page.locator('[data-stopwatch-display]');
    await expect(display).toHaveText('00:00.00');
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(display).not.toHaveText('00:00.00');
    await page.getByRole('button', { name: 'Lap' }).click();
    await expect(page.getByRole('table', { name: 'Lap times' }).locator('tbody tr')).toHaveCount(1);
    await page.getByRole('button', { name: 'Pause' }).click();
    const paused = await display.textContent();
    await page.waitForTimeout(300);
    await expect(display).toHaveText(paused!);
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(display).toHaveText('00:00.00');
  });

  test('alarm: set one for the current minute and it rings; the list persists', async ({ page }) => {
    await page.goto('/alarm/');
    const hhmm = await page.evaluate(() => {
      const d = new Date();
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });
    await page.getByLabel('Time', { exact: true }).fill(hhmm);
    await page.getByLabel('Label (optional)').fill('Tea');
    await page.getByRole('button', { name: 'Set alarm' }).click();
    await expect(page.locator('[data-alarm-row]')).toHaveCount(1);
    const ringing = page.locator('[data-alarm-ringing]');
    await expect(ringing).toContainText('Tea', { timeout: 5_000 });
    await page.getByRole('button', { name: 'Stop' }).click();
    await expect(ringing).toHaveCount(0);
    await page.reload();
    await expect(page.locator('[data-alarm-row]')).toHaveCount(1);
    await page.getByRole('button', { name: /^Delete/ }).click();
    await expect(page.locator('[data-alarm-row]')).toHaveCount(0);
  });

  test('date difference counts days and can include the end date', async ({ page }) => {
    await page.goto('/tools/date-difference/');
    await page.getByLabel('Start date', { exact: true }).fill('2026-01-01');
    await page.getByLabel('End date', { exact: true }).fill('2026-12-25');
    const result = page.locator('[data-date-result]');
    await expect(result).toContainText('358 days');
    await expect(result).toContainText('51 weeks, 1 day');
    await expect(result).toContainText('0y 11m 24d');
    await page.getByLabel('Include end date (count both days)').check();
    await expect(result).toContainText('359 days');
  });

  test('hours calculator totals shifts with breaks and decimal hours', async ({ page }) => {
    await page.goto('/tools/hours-calculator/');
    const total = page.locator('[data-hours-total]');
    await expect(total).toContainText('7h 30m');
    await expect(total).toContainText('7.50 decimal hours');
    await page.getByRole('button', { name: '+ Add shift' }).click();
    await expect(total).toContainText('15h 30m');
  });

  test('military time converts both ways', async ({ page }) => {
    await page.goto('/tools/military-time-converter/');
    const input = page.getByLabel('Time in any format (2:30 PM, 14:30 or 1430)');
    await input.fill('1430');
    await expect(page.locator('[data-military-result]')).toContainText('2:30 PM');
    await input.fill('12:00 AM');
    await expect(page.locator('[data-military-result]')).toContainText('0000');
    await expect(page.locator('#chart')).toContainText('thirteen hundred hours');
  });

  test('unix timestamp converts to a date and back', async ({ page }) => {
    await page.goto('/tools/unix-timestamp/');
    await page.getByLabel('Unix timestamp (seconds or milliseconds)').fill('1700000000');
    await expect(page.locator('[data-unix-result]')).toContainText('2023-11-14T22:13:20.000Z');
    await expect(page.locator('[data-unix-result]')).toContainText('Read as seconds');
    await page.getByLabel('Date', { exact: true }).fill('2026-07-04');
    await page.getByLabel('Time', { exact: true }).fill('13:00');
    await expect(page.locator('[data-unix-from-date]')).toContainText(String(Date.UTC(2026, 6, 4, 13, 0) / 1000));
  });

  test('meeting planner suggests slots for New York and London and summarises a selected column', async ({ page }) => {
    await page.goto('/meeting-planner/');
    await expect(page.locator('[data-meeting-grid] tbody tr')).toHaveCount(2);
    const slots = page.locator('[data-meeting-slots] li');
    await expect(slots.first()).toBeVisible();
    await slots.first().click();
    const selected = page.locator('[data-meeting-selected]');
    await expect(selected).toContainText('New York');
    await expect(selected).toContainText('London');
    // A share link pre-fills the participants.
    await page.goto('/meeting-planner/?z=Asia%2FTokyo%2CEurope%2FBerlin&d=2026-10-05&m=30');
    await expect(page.locator('[data-meeting-grid] tbody th').first()).toContainText('Tokyo');
    await expect(page.locator('[data-meeting-grid] tbody th').nth(1)).toContainText('Berlin');
  });
});

test.describe('Sprint 5 routing', () => {
  test('every tool page and hub returns 200 and the tools hub links to all ten tools', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'HTTP checks run once');
    for (const path of ['/world-clock/', '/meeting-planner/', '/alarm/', '/stopwatch/', '/tools/', '/tools/date-difference/', '/tools/hours-calculator/', '/tools/military-time-converter/', '/tools/unix-timestamp/', '/timezones/']) {
      expect((await request.get(path)).status(), path).toBe(200);
    }
    const hub = await (await request.get('/tools/')).text();
    for (const href of ['/converter/', '/meeting-planner/', '/timer/', '/alarm/', '/stopwatch/', '/tools/date-difference/', '/tools/hours-calculator/', '/tools/military-time-converter/', '/tools/unix-timestamp/', '/world-clock/']) {
      expect(hub, href).toContain(`href="${href}"`);
    }
  });
});
