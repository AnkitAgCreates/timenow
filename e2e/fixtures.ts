import { test as base, expect, type Page } from '@playwright/test';

export const REFERENCE_PAGES = [
  { path: '/', h1: 'Current Time Now' },
  { path: '/time/san-diego/', h1: 'Current Time in San Diego, United States' },
  { path: '/timezones/cst/', h1: 'Central Standard Time (CST)' },
  { path: '/timer/1-hour/', h1: '1 Hour Timer' },
  { path: '/convert/ist-to-est/', h1: 'IST to EST Converter' },
  { path: '/about/', h1: 'About whattimein.world' },
  { path: '/privacy/', h1: 'Privacy Policy' },
  { path: '/contact/', h1: 'Contact' },
] as const;

/**
 * `pageErrors` collects console errors and uncaught exceptions, which is how
 * React reports hydration mismatches. Tests assert it stays empty.
 */
export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await use(errors);
  },
});

export { expect };

/** Freeze the page's clock at an instant before any script runs. */
export async function freezeTime(page: Page, iso: string) {
  await page.clock.setFixedTime(new Date(iso));
}
