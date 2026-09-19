import { expect, test } from './fixtures';

/** Curated city photos: hero + credit on city pages, card crops on lists, skyline fallback elsewhere. */
test.describe('City images', () => {
  test('city page shows the photo with a Commons credit, share image and ImageObject', async ({ page }) => {
    await page.goto('/time/new-york/');
    const hero = page.locator('main figure img').first();
    await expect(hero).toBeVisible();
    await expect(hero).toHaveAttribute('alt', /New York/);
    await expect.poll(() => hero.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { timeout: 15_000 }).toBe(true);
    // The hero is the LCP candidate above the clock: eager, high priority.
    await expect(hero).not.toHaveAttribute('loading', 'lazy');

    const credit = page.locator('main figure figcaption');
    await expect(credit).toContainText('Photo:');
    await expect(credit.locator('a[href^="https://commons.wikimedia.org/wiki/File"]')).toHaveCount(1);
    await expect(credit.locator('a[rel~="license"]')).toHaveCount(1);

    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/cities\/new-york\.webp$/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const webPage = blocks
      .flatMap((b): Record<string, unknown>[] => {
        const parsed = JSON.parse(b) as Record<string, unknown> | Record<string, unknown>[];
        return Array.isArray(parsed) ? parsed : [parsed];
      })
      .find((b) => b['@type'] === 'WebPage') as { primaryImageOfPage?: Record<string, unknown> } | undefined;
    expect(webPage?.primaryImageOfPage?.['@type']).toBe('ImageObject');
    expect(webPage?.primaryImageOfPage?.creditText).toBeTruthy();
    expect(String(webPage?.primaryImageOfPage?.acquireLicensePage)).toMatch(/commons\.wikimedia\.org/);
  });

  test('homepage city cards use the card crop', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('a[href="/time/london/"] img').first();
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('src', /london-card\.webp/);
    // Lazy-loaded: poll until the browser has fetched it.
    await expect.poll(() => card.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { timeout: 15_000 }).toBe(true);
  });

  test('cities without a curated photo keep the skyline placeholder', async ({ page }) => {
    await page.goto('/time/kingston-upon-hull/');
    await expect(page.locator('main figure')).toHaveCount(0);
    await expect(page.locator('main .skyline').first()).toBeVisible();
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
  });
});
