import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Playwright fixtures call a parameter named `use`, which the React hooks rules misread as a hook.
    files: ['e2e/**/*.ts'],
    rules: { 'react-hooks/rules-of-hooks': 'off' },
  },
  globalIgnores([
    '.next/**',
    '.next-e2e/**',
    '.next-audit/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'exports/**',
    'next-env.d.ts',
    'references/**',
  ]),
]);

export default eslintConfig;
