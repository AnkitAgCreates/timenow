import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**', '.next-e2e/**', 'e2e/**'],
    // Time logic must never depend on the machine's zone. Run under a zone that
    // is neither UTC nor any zone under test so accidental local-time use fails.
    env: { TZ: 'Pacific/Chatham' },
    // Dataset tests classify hundreds of zones; cold Intl caches can take a few seconds.
    testTimeout: 20_000,
  },
});
