import type { ConverterPair } from '@/types/data';

/**
 * Approved converter pages (/convert/[from]-to-[to]/). This is an allowlist:
 * any pair not listed here returns 404 and is never indexed.
 * `from`/`to` are slugs from data/timezones.ts.
 */
export const CONVERTER_PAIRS: ConverterPair[] = [
  { from: 'ist', to: 'est', priority: 1, indexable: true },
  { from: 'est', to: 'ist', priority: 1, indexable: true },
  { from: 'cst', to: 'ist', priority: 1, indexable: true },
  { from: 'pst', to: 'ist', priority: 1, indexable: true },
  { from: 'gmt', to: 'ist', priority: 2, indexable: true },
  { from: 'utc', to: 'ist', priority: 2, indexable: true },
  { from: 'cst', to: 'est', priority: 2, indexable: true },
  { from: 'est', to: 'pst', priority: 2, indexable: true },
];
