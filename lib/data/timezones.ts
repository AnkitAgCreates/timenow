import { POPULAR_TIMEZONE_SLUGS, TIMEZONES } from '@/data/timezones';
import type { RegionUsage, TimeZoneEntry } from '@/types/data';

const bySlug = new Map(TIMEZONES.map((tz) => [tz.slug, tz]));

export function getAllTimezones(): TimeZoneEntry[] {
  return [...TIMEZONES].sort((a, b) => a.priority - b.priority || a.abbreviation.localeCompare(b.abbreviation));
}

export function getTimezone(slug: string): TimeZoneEntry | undefined {
  return bySlug.get(slug);
}

export function getTimezones(slugs: string[]): TimeZoneEntry[] {
  return slugs.map((slug) => bySlug.get(slug)).filter((tz): tz is TimeZoneEntry => Boolean(tz));
}

function zonesOf(regions: RegionUsage[]): string[] {
  return [...new Set(regions.flatMap((region) => region.zones))];
}

/** IANA zones that switch between the abbreviation and its counterpart. */
export function getSeasonalZones(entry: TimeZoneEntry): string[] {
  return zonesOf(entry.seasonalRegions);
}

/** IANA zones on the abbreviation's offset all year. */
export function getYearRoundZones(entry: TimeZoneEntry): string[] {
  return zonesOf(entry.yearRoundRegions);
}

/**
 * Abbreviation pages that describe an IANA zone (America/Los_Angeles → PST, PDT).
 * Standard entries come first.
 */
export function getTimezonesForZone(zone: string): TimeZoneEntry[] {
  return getAllTimezones()
    .filter((tz) => tz.referenceZone === zone || getSeasonalZones(tz).includes(zone) || getYearRoundZones(tz).includes(zone))
    .sort((a, b) => (a.kind === 'daylight' ? 1 : 0) - (b.kind === 'daylight' ? 1 : 0));
}

export function getPopularTimezones(): TimeZoneEntry[] {
  return getTimezones(POPULAR_TIMEZONE_SLUGS);
}

/**
 * IANA "Etc/GMT±N" zone for a whole-hour fixed offset. Note the POSIX sign
 * inversion: UTC-6 is "Etc/GMT+6". Returns null for non-whole-hour offsets.
 */
export function fixedOffsetZone(offsetMinutes: number): string | null {
  if (offsetMinutes === 0) return 'UTC';
  if (offsetMinutes % 60 !== 0) return null;
  const hours = -offsetMinutes / 60;
  return `Etc/GMT${hours > 0 ? '+' : ''}${hours}`;
}
