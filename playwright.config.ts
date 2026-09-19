import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end smoke tests against real production builds.
 *
 * Two production builds are served (see e2e/serve-builds.mjs) because
 * NEXT_PUBLIC_* values are inlined at build time:
 *   - "indexed"  (NEXT_PUBLIC_ALLOW_INDEXING=true)  → product + SEO checks
 *   - "noindex"  (indexing switch off)               → kill-switch checks
 *
 * Locally the installed Google Chrome is used (no browser download). In CI,
 * run `npx playwright install chromium` and leave PLAYWRIGHT_CHANNEL unset.
 */
const INDEXED_PORT = 3310;
const NOINDEX_PORT = 3311;
const channel = process.env.PLAYWRIGHT_CHANNEL ?? (process.env.CI ? undefined : 'chrome');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: { trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      testMatch: /(smoke|seo|sprint2|sprint3)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], channel, baseURL: `http://127.0.0.1:${INDEXED_PORT}` },
    },
    {
      name: 'mobile',
      testMatch: /(smoke|sprint2|sprint3)\.spec\.ts/,
      use: { ...devices['Pixel 7'], channel, baseURL: `http://127.0.0.1:${INDEXED_PORT}` },
    },
    {
      name: 'kill-switch',
      testMatch: /kill-switch\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], channel, baseURL: `http://127.0.0.1:${NOINDEX_PORT}` },
    },
  ],
  webServer: {
    // Builds both variants sequentially, then serves them on INDEXED_PORT and NOINDEX_PORT.
    command: 'node e2e/serve-builds.mjs',
    url: `http://127.0.0.1:${NOINDEX_PORT}/robots.txt`,
    // Always test fresh builds unless explicitly asked to reuse running servers.
    reuseExistingServer: process.env.PW_REUSE_SERVER === '1',
    timeout: 600_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
