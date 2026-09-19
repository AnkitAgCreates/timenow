import { CONVERTER_PAIRS } from '@/data/converters';
import { routes } from '@/lib/routes';
import type { City, ConverterPair, TimeZoneEntry } from '@/types/data';
import { getCity } from './cities';
import { getTimezone } from './timezones';

/**
 * One end of a conversion: either a time zone abbreviation page (IST, EST …)
 * or a dataset city (London, New York …). Everything the template needs is
 * resolved here so content and pages never branch on the raw slug.
 */
export type ConverterSide = {
  kind: 'zone' | 'city';
  slug: string;
  /** IANA zone that drives clocks, tables and differences. */
  zone: string;
  /** Short label for titles, breadcrumbs and questions: "IST" or "London". */
  label: string;
  /** Long name: "India Standard Time" or "London, United Kingdom". */
  name: string;
  href: string;
  entry?: TimeZoneEntry;
  city?: City;
};

export type ResolvedConverterPair = ConverterPair & {
  slug: string;
  kind: 'zone' | 'city';
  fromSide: ConverterSide;
  toSide: ConverterSide;
};

export function converterSlug(from: string, to: string): string {
  return `${from}-to-${to}`;
}

/** Time zone slugs win over city slugs (no dataset city is called "est"; a test guarantees it). */
export function resolveConverterSide(slug: string): ConverterSide | undefined {
  const entry = getTimezone(slug);
  if (entry) {
    return { kind: 'zone', slug, zone: entry.referenceZone, label: entry.abbreviation, name: entry.name, href: routes.timezone(slug), entry };
  }
  const city = getCity(slug);
  if (city) {
    return { kind: 'city', slug, zone: city.timezone, label: city.name, name: `${city.name}, ${city.country}`, href: routes.city(slug), city };
  }
  return undefined;
}

function resolvePair(pair: ConverterPair): ResolvedConverterPair {
  const fromSide = resolveConverterSide(pair.from);
  const toSide = resolveConverterSide(pair.to);
  if (!fromSide || !toSide) {
    throw new Error(`Converter pair ${pair.from}-to-${pair.to} references an unknown time zone or city slug`);
  }
  if (fromSide.kind !== toSide.kind) {
    throw new Error(`Converter pair ${pair.from}-to-${pair.to} mixes a time zone with a city`);
  }
  return { ...pair, slug: converterSlug(pair.from, pair.to), kind: fromSide.kind, fromSide, toSide };
}

let cache: ResolvedConverterPair[] | null = null;

export function getAllConverterPairs(): ResolvedConverterPair[] {
  cache ??= [...CONVERTER_PAIRS].sort((a, b) => a.priority - b.priority).map(resolvePair);
  return cache;
}

export function getZoneConverterPairs(): ResolvedConverterPair[] {
  return getAllConverterPairs().filter((pair) => pair.kind === 'zone');
}

export function getCityConverterPairs(): ResolvedConverterPair[] {
  return getAllConverterPairs().filter((pair) => pair.kind === 'city');
}

/** Only allowlisted pairs resolve; everything else is a 404. */
export function getConverterPair(slug: string): ResolvedConverterPair | undefined {
  return getAllConverterPairs().find((pair) => pair.slug === slug);
}

/** Other approved converters of the same kind that share a side with this pair, busiest first. */
export function getRelatedConverterPairs(pair: ConverterPair, limit = 6): ResolvedConverterPair[] {
  const kind = getConverterPair(converterSlug(pair.from, pair.to))?.kind;
  return getAllConverterPairs()
    .filter((other) => other.kind === kind && !(other.from === pair.from && other.to === pair.to))
    .filter((other) => [other.from, other.to].some((slug) => slug === pair.from || slug === pair.to))
    .slice(0, limit);
}

/** Approved converter pages that involve a time zone abbreviation slug. */
export function getConvertersForTimezone(slug: string): ResolvedConverterPair[] {
  return getZoneConverterPairs().filter((pair) => pair.from === slug || pair.to === slug);
}

/** Approved city-to-city converter pages that involve a city slug. */
export function getConvertersForCity(slug: string): ResolvedConverterPair[] {
  return getCityConverterPairs().filter((pair) => pair.from === slug || pair.to === slug);
}

/** Zone pairs grouped by their "from" side, in priority order — used by the hub. */
export function getZoneConvertersByFrom(): Array<{ side: ConverterSide; pairs: ResolvedConverterPair[] }> {
  const groups = new Map<string, { side: ConverterSide; pairs: ResolvedConverterPair[] }>();
  for (const pair of getZoneConverterPairs()) {
    const group = groups.get(pair.from) ?? { side: pair.fromSide, pairs: [] };
    group.pairs.push(pair);
    groups.set(pair.from, group);
  }
  return [...groups.values()].sort((a, b) => b.pairs.length - a.pairs.length || a.side.label.localeCompare(b.side.label));
}
