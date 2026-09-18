/**
 * UTC offset pages (/utc/[offset]/).
 *
 * Curation rule: an offset gets a page only when at least one place in the
 * dataset uses it — as standard time, daylight time or a seasonal shift —
 * during the current year. That keeps the set meaningful (UTC+5:45 exists
 * because Nepal uses it; UTC+4:30 does not) and bounded (~40 pages), and
 * lib/data/data-integrity.test.ts enforces it.
 */
import { CITIES } from '@/data/cities';
import { COUNTRIES } from '@/data/countries';
import { fixedOffsetZoneId, formatOffset, getDSTState, getTransitionsInYear, utcMs } from '@/lib/time';

export type OffsetPage = {
  /** "utc-minus-5", "utc-plus-530" */
  slug: string;
  offsetMinutes: number;
  /** "UTC-5", "UTC+5:30" */
  label: string;
  /** "UTC−05:00" (ISO-style, for tables) */
  iso: string;
  /** Fixed-offset pseudo-zone id understood by the time engine: "UTC-05:00". */
  zoneId: string;
  /** Legacy GMT-style slug that redirects here: "gmt-minus-5". */
  gmtSlug: string;
};

function slugForOffset(offsetMinutes: number, prefix: 'utc' | 'gmt'): string {
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return `${prefix}-${offsetMinutes < 0 ? 'minus' : 'plus'}-${hours}${minutes ? String(minutes).padStart(2, '0') : ''}`;
}

/** Parse "utc-minus-5" / "utc-plus-530" → minutes, or null. */
export function parseOffsetSlug(slug: string, prefix: 'utc' | 'gmt' = 'utc'): number | null {
  const match = new RegExp(`^${prefix}-(plus|minus)-(\\d{1,2})(\\d{2})?$`).exec(slug);
  if (!match) return null;
  const hours = Number(match[2]);
  const minutes = match[3] ? Number(match[3]) : 0;
  if (hours > 14 || minutes >= 60) return null;
  const total = hours * 60 + minutes;
  return match[1] === 'minus' ? -total : total;
}

function isoOffset(offsetMinutes: number): string {
  const abs = Math.abs(offsetMinutes);
  return `UTC${offsetMinutes < 0 ? '−' : '+'}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

export function makeOffsetPage(offsetMinutes: number): OffsetPage {
  return {
    slug: slugForOffset(offsetMinutes, 'utc'),
    offsetMinutes,
    label: formatOffset(offsetMinutes),
    iso: isoOffset(offsetMinutes),
    zoneId: fixedOffsetZoneId(offsetMinutes),
    gmtSlug: slugForOffset(offsetMinutes, 'gmt'),
  };
}

/** Every IANA zone referenced by the city and country datasets. */
export function getDatasetZones(): string[] {
  return [...new Set([...CITIES.map((c) => c.timezone), ...COUNTRIES.flatMap((c) => c.zones)])].sort();
}

/** Offsets (minutes) in use by dataset zones during `year`, excluding UTC+0 (covered by the /utc/ hub). */
export function getOffsetsInUse(year: number): number[] {
  const offsets = new Set<number>();
  for (const zone of getDatasetZones()) {
    const starts = [utcMs(year, 1, 1), ...getTransitionsInYear(zone, year).map((t) => t.instant)];
    for (const start of starts) offsets.add(getDSTState(zone, start).offsetMinutes);
  }
  offsets.delete(0);
  return [...offsets].sort((a, b) => a - b);
}

let cache: { year: number; pages: OffsetPage[] } | null = null;

/** Offset pages for the curated set, ordered from UTC-12 upwards. */
export function getAllOffsetPages(year = new Date().getUTCFullYear()): OffsetPage[] {
  if (!cache || cache.year !== year) cache = { year, pages: getOffsetsInUse(year).map(makeOffsetPage) };
  return cache.pages;
}

export function getOffsetPage(slug: string, year?: number): OffsetPage | undefined {
  return getAllOffsetPages(year).find((page) => page.slug === slug);
}

/** Neighbouring offset pages for related links (previous and next in the curated list). */
export function getAdjacentOffsetPages(page: OffsetPage, year?: number): OffsetPage[] {
  const pages = getAllOffsetPages(year);
  const index = pages.findIndex((p) => p.slug === page.slug);
  return [pages[index - 1], pages[index + 1]].filter((p): p is OffsetPage => Boolean(p));
}
