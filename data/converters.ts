import type { ConverterPair } from '@/types/data';

/**
 * Approved converter pages (/convert/[from]-to-[to]/). This is an allowlist:
 * any pair not listed here returns 404 and is never indexed.
 *
 * Corridors are curated by hand; each yields one page per direction (the
 * table, FAQs and "9 AM" answers differ by direction). `a`/`b` are slugs from
 * data/timezones.ts (zone corridors) or data/cities.ts (city corridors).
 * Priority 1 = the busiest corridors (US ↔ India, US coasts, US ↔ UK/Europe).
 */
export type ConverterCorridor = { a: string; b: string; priority: 1 | 2 | 3 };

export const ZONE_CORRIDORS: ConverterCorridor[] = [
  // India ↔ the world
  { a: 'ist', b: 'est', priority: 1 },
  { a: 'ist', b: 'pst', priority: 1 },
  { a: 'ist', b: 'cst', priority: 1 },
  { a: 'ist', b: 'gmt', priority: 1 },
  { a: 'ist', b: 'utc', priority: 1 },
  { a: 'ist', b: 'bst', priority: 2 },
  { a: 'ist', b: 'cet', priority: 2 },
  { a: 'ist', b: 'aest', priority: 2 },
  { a: 'ist', b: 'jst', priority: 2 },
  { a: 'ist', b: 'sgt', priority: 2 },
  { a: 'ist', b: 'gst', priority: 2 },
  // US Eastern
  { a: 'est', b: 'pst', priority: 1 },
  { a: 'est', b: 'cst', priority: 1 },
  { a: 'est', b: 'mst', priority: 2 },
  { a: 'est', b: 'gmt', priority: 1 },
  { a: 'est', b: 'bst', priority: 2 },
  { a: 'est', b: 'cet', priority: 1 },
  { a: 'est', b: 'utc', priority: 2 },
  { a: 'est', b: 'aest', priority: 1 },
  { a: 'est', b: 'jst', priority: 2 },
  { a: 'est', b: 'sgt', priority: 2 },
  { a: 'est', b: 'hkt', priority: 3 },
  { a: 'est', b: 'gst', priority: 2 },
  { a: 'est', b: 'pht', priority: 3 },
  // US Pacific
  { a: 'pst', b: 'cst', priority: 2 },
  { a: 'pst', b: 'mst', priority: 2 },
  { a: 'pst', b: 'gmt', priority: 1 },
  { a: 'pst', b: 'bst', priority: 2 },
  { a: 'pst', b: 'cet', priority: 1 },
  { a: 'pst', b: 'utc', priority: 2 },
  { a: 'pst', b: 'aest', priority: 1 },
  { a: 'pst', b: 'jst', priority: 2 },
  { a: 'pst', b: 'sgt', priority: 2 },
  { a: 'pst', b: 'hkt', priority: 3 },
  { a: 'pst', b: 'pht', priority: 2 },
  // US Central and Mountain
  { a: 'cst', b: 'mst', priority: 2 },
  { a: 'cst', b: 'gmt', priority: 2 },
  { a: 'cst', b: 'cet', priority: 2 },
  { a: 'cst', b: 'aest', priority: 3 },
  // UK / UTC ↔ Europe and Asia-Pacific
  { a: 'gmt', b: 'cet', priority: 1 },
  { a: 'gmt', b: 'eet', priority: 3 },
  { a: 'gmt', b: 'aest', priority: 2 },
  { a: 'gmt', b: 'jst', priority: 2 },
  { a: 'gmt', b: 'sgt', priority: 2 },
  { a: 'gmt', b: 'hkt', priority: 3 },
  { a: 'gmt', b: 'gst', priority: 2 },
  { a: 'utc', b: 'cet', priority: 2 },
  { a: 'utc', b: 'aest', priority: 3 },
  { a: 'cet', b: 'bst', priority: 2 },
  { a: 'cet', b: 'eet', priority: 2 },
  { a: 'cet', b: 'aest', priority: 3 },
  { a: 'cet', b: 'jst', priority: 3 },
  // Asia-Pacific
  { a: 'aest', b: 'jst', priority: 3 },
  { a: 'aest', b: 'nzst', priority: 3 },
];

/** City ↔ city corridors (both directions). Both slugs must be dataset cities in different zones. */
export const CITY_CORRIDORS: ConverterCorridor[] = [
  { a: 'london', b: 'new-york', priority: 1 },
  { a: 'london', b: 'tokyo', priority: 2 },
  { a: 'london', b: 'dubai', priority: 2 },
  { a: 'london', b: 'sydney', priority: 2 },
  { a: 'london', b: 'singapore', priority: 2 },
  { a: 'london', b: 'new-delhi', priority: 2 },
  { a: 'london', b: 'los-angeles', priority: 2 },
  { a: 'london', b: 'paris', priority: 2 },
  { a: 'london', b: 'hong-kong', priority: 3 },
  { a: 'london', b: 'toronto', priority: 3 },
  { a: 'new-york', b: 'tokyo', priority: 2 },
  { a: 'new-york', b: 'sydney', priority: 2 },
  { a: 'new-york', b: 'paris', priority: 2 },
  { a: 'new-york', b: 'los-angeles', priority: 1 },
  { a: 'new-york', b: 'chicago', priority: 2 },
  { a: 'new-york', b: 'dubai', priority: 2 },
  { a: 'new-york', b: 'new-delhi', priority: 2 },
  { a: 'new-york', b: 'singapore', priority: 3 },
  { a: 'new-york', b: 'hong-kong', priority: 3 },
  { a: 'new-york', b: 'berlin', priority: 3 },
  { a: 'los-angeles', b: 'tokyo', priority: 2 },
  { a: 'los-angeles', b: 'sydney', priority: 2 },
  { a: 'dubai', b: 'new-delhi', priority: 2 },
  { a: 'sydney', b: 'tokyo', priority: 3 },
];

function expand(corridors: ConverterCorridor[]): ConverterPair[] {
  return corridors.flatMap(({ a, b, priority }) => [
    { from: a, to: b, priority, indexable: true },
    { from: b, to: a, priority, indexable: true },
  ]);
}

export const CONVERTER_PAIRS: ConverterPair[] = [...expand(ZONE_CORRIDORS), ...expand(CITY_CORRIDORS)];
