import { CONVERTER_PAIRS } from '@/data/converters';
import type { ConverterPair, TimeZoneEntry } from '@/types/data';
import { getTimezone } from './timezones';

export type ResolvedConverterPair = ConverterPair & {
  slug: string;
  fromZone: TimeZoneEntry;
  toZone: TimeZoneEntry;
};

export function converterSlug(from: string, to: string): string {
  return `${from}-to-${to}`;
}

function resolvePair(pair: ConverterPair): ResolvedConverterPair {
  const fromZone = getTimezone(pair.from);
  const toZone = getTimezone(pair.to);
  if (!fromZone || !toZone) {
    throw new Error(`Converter pair ${pair.from}-to-${pair.to} references an unknown timezone slug`);
  }
  return { ...pair, slug: converterSlug(pair.from, pair.to), fromZone, toZone };
}

export function getAllConverterPairs(): ResolvedConverterPair[] {
  return [...CONVERTER_PAIRS].sort((a, b) => a.priority - b.priority).map(resolvePair);
}

/** Only allowlisted pairs resolve; everything else is a 404. */
export function getConverterPair(slug: string): ResolvedConverterPair | undefined {
  return getAllConverterPairs().find((pair) => pair.slug === slug);
}

/** Other approved converters that share a zone with this pair. */
export function getRelatedConverterPairs(pair: ConverterPair, limit = 6): ResolvedConverterPair[] {
  return getAllConverterPairs()
    .filter((other) => !(other.from === pair.from && other.to === pair.to))
    .filter((other) => [other.from, other.to].some((slug) => slug === pair.from || slug === pair.to))
    .slice(0, limit);
}

/** Approved converter pages that involve a timezone slug. */
export function getConvertersForTimezone(slug: string): ResolvedConverterPair[] {
  return getAllConverterPairs().filter((pair) => pair.from === slug || pair.to === slug);
}
