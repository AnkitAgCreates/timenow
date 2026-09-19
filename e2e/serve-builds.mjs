// Builds and serves the two production variants used by the Playwright suite.
// Builds run sequentially (parallel `next build`s race on the file system),
// then both servers start. Playwright waits for the last port and stops this
// process tree when the run ends.
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const nextBin = require.resolve('next/dist/bin/next');

const VARIANTS = [
  {
    name: 'indexed',
    port: 3310,
    // The fake GA id only makes the consent banner render; tests intercept every request to Google.
    env: { NEXT_PUBLIC_ALLOW_INDEXING: 'true', NEXT_PUBLIC_SITE_URL: 'https://timenow.example', NEXT_PUBLIC_GA_MEASUREMENT_ID: 'G-E2ETEST000' },
  },
  {
    name: 'noindex',
    port: 3311,
    env: { NEXT_PUBLIC_ALLOW_INDEXING: 'false', NEXT_PUBLIC_SITE_URL: 'https://preview.timenow.example' },
  },
];

const envFor = (variant) => ({
  ...process.env,
  ...variant.env,
  TIMENOW_DIST_DIR: `.next-e2e/${variant.name}`,
  NEXT_TELEMETRY_DISABLED: '1',
});

async function waitForServer(url, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

for (const variant of VARIANTS) {
  console.log(`[e2e] building ${variant.name}…`);
  const result = spawnSync(process.execPath, [nextBin, 'build'], { stdio: 'inherit', env: envFor(variant) });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const children = [];
for (const variant of VARIANTS) {
  console.log(`[e2e] starting ${variant.name} on port ${variant.port}`);
  children.push(spawn(process.execPath, [nextBin, 'start', '--port', String(variant.port)], { stdio: 'inherit', env: envFor(variant) }));
  await waitForServer(`http://127.0.0.1:${variant.port}/robots.txt`);
}

const shutdown = () => {
  for (const child of children) child.kill();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
