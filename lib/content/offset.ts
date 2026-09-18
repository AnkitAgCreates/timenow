/** Data-driven content for UTC offset pages (/utc/[offset]/). */
import { getAllCities, getCitiesInZones } from '@/lib/data/cities';
import { getCountryByCode } from '@/lib/data/countries';
import { getDatasetZones, type OffsetPage } from '@/lib/data/offsets';
import { getAllTimezones } from '@/lib/data/timezones';
import type { FaqItem } from '@/lib/seo/jsonld';
import { joinList } from '@/lib/text';
import { formatOffset, formatTime, getDSTState, getTransitionsInYear, getUTCOffset, getZoneLabel, getZonedParts, utcMs } from '@/lib/time';
import { getZoneDisplayNames, getZoneRegionName } from '@/lib/time/zone-names';
import type { City, TimeZoneEntry } from '@/types/data';

export type OffsetUsageKind =
  /** The zone stays on this offset all year. */
  | 'all-year'
  /** This is the zone's standard time; it moves forward for daylight saving time. */
  | 'standard'
  /** This is the zone's daylight saving time. */
  | 'daylight'
  /** A temporary backward shift (Morocco during Ramadan). */
  | 'backward';

export type OffsetUsage = {
  zone: string;
  kind: OffsetUsageKind;
  /** "Eastern Time" */
  name: string;
  /** "EST" — the abbreviation the zone uses while on this offset (or the offset label). */
  abbreviation: string;
  /** The other offset the zone uses (for seasonal zones). */
  otherOffset: number | null;
  cities: City[];
  countryNames: string[];
  /** Whether the zone is on this offset at `now`. */
  onOffsetNow: boolean;
};

/** Every dataset zone that uses the page's offset during the year of `now`, with how and when. */
export function getOffsetUsage(page: OffsetPage, now: number): OffsetUsage[] {
  const year = getZonedParts(now, 'UTC').year;
  const usages: OffsetUsage[] = [];

  for (const zone of getDatasetZones()) {
    const starts = [utcMs(year, 1, 1), ...getTransitionsInYear(zone, year).map((t) => t.instant)];
    const states = starts.map((start) => getDSTState(zone, start));
    const onOffset = states.find((s) => s.offsetMinutes === page.offsetMinutes);
    if (!onOffset) continue;

    const offsets = [...new Set(states.map((s) => s.offsetMinutes))];
    const kind: OffsetUsageKind =
      offsets.length === 1 ? 'all-year' : onOffset.seasonalShift === 'backward' ? 'backward' : onOffset.isDST ? 'daylight' : 'standard';
    const sampleInstant = starts[states.indexOf(onOffset)]!;
    const cities = getCitiesInZones([zone]).slice(0, 6);
    const countryNames = [...new Set(cities.map((c) => getCountryByCode(c.countryCode)?.name).filter((n): n is string => Boolean(n)))];
    usages.push({
      zone,
      kind,
      name: getZoneRegionName(zone, now) ?? formatOffset(onOffset.standardOffsetMinutes),
      abbreviation: getZoneLabel(zone, sampleInstant).abbreviation,
      otherOffset: offsets.find((o) => o !== page.offsetMinutes) ?? null,
      cities,
      countryNames,
      onOffsetNow: getUTCOffset(zone, now) === page.offsetMinutes,
    });
  }

  // Zones with dataset cities first, then by name.
  return usages.sort((a, b) => Number(b.cities.length > 0) - Number(a.cities.length > 0) || a.name.localeCompare(b.name));
}

export type OffsetUsageGroup = { kind: OffsetUsageKind; title: string; description: string; usages: OffsetUsage[] };

export function groupOffsetUsage(page: OffsetPage, usages: OffsetUsage[]): OffsetUsageGroup[] {
  const groups: Array<[OffsetUsageKind, string, string]> = [
    ['all-year', `${page.label} all year`, 'These places do not change their clocks.'],
    ['standard', `${page.label} as standard time`, `These places move forward for daylight saving time, so they are on ${page.label} only part of the year.`],
    ['daylight', `${page.label} as daylight saving time`, `These places are on ${page.label} only while daylight saving time is in effect.`],
    ['backward', `${page.label} as a seasonal shift`, 'These places move their clocks back temporarily (for example around Ramadan).'],
  ];
  return groups
    .map(([kind, title, description]) => ({ kind, title, description, usages: usages.filter((u) => u.kind === kind) }))
    .filter((group) => group.usages.length > 0);
}

/** Abbreviation pages that denote exactly this offset (UTC-5 → EST, CDT). */
export function getAbbreviationsForOffset(offsetMinutes: number): TimeZoneEntry[] {
  return getAllTimezones().filter((tz) => tz.offsetMinutes === offsetMinutes && tz.indexable);
}

export function offsetTitle(page: OffsetPage): string {
  return `${page.label} Time Now`;
}

export function offsetMetaDescription(page: OffsetPage, usages: OffsetUsage[]): string {
  const places = usages.flatMap((u) => u.cities.slice(0, 2).map((c) => c.name)).slice(0, 4);
  const where = places.length ? ` Used in ${joinList(places)} and more.` : '';
  return `Current time at ${page.label} (${page.iso}), the offset ${describeOffset(page.offsetMinutes)}.${where} See which places use ${page.label}, convert it to your time zone and to UTC.`;
}

/** "5 hours behind Coordinated Universal Time" */
export function describeOffset(offsetMinutes: number): string {
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const amount = [hours ? `${hours} hour${hours === 1 ? '' : 's'}` : '', minutes ? `${minutes} minutes` : ''].filter(Boolean).join(' ');
  return `${amount} ${offsetMinutes < 0 ? 'behind' : 'ahead of'} Coordinated Universal Time`;
}

export function offsetFaqs(page: OffsetPage, usages: OffsetUsage[], now: number): FaqItem[] {
  const items: FaqItem[] = [];
  const abbreviations = getAbbreviationsForOffset(page.offsetMinutes);
  const allYear = usages.filter((u) => u.kind === 'all-year');
  const seasonal = usages.filter((u) => u.kind !== 'all-year');

  items.push({
    question: `What time is it in ${page.label} right now?`,
    answer: `${page.label} is ${describeOffset(page.offsetMinutes)}. When it is ${formatTime(now, 'UTC', { seconds: false })} UTC, it is ${formatTime(now, page.zoneId, { seconds: false })} at ${page.label}. The clock at the top of this page shows the live time.`,
  });

  items.push({
    question: `Which places use ${page.label}?`,
    answer:
      usages.length === 0
        ? `No major city in this dataset uses ${page.label} today.`
        : `${allYear.length ? `All year: ${joinList(allYear.slice(0, 6).map((u) => describeUsagePlaces(u)))}.` : ''}${
            seasonal.length ? ` Part of the year: ${joinList(seasonal.slice(0, 6).map((u) => `${describeUsagePlaces(u)} (${u.kind === 'daylight' ? 'daylight saving time' : 'standard time'})`))}.` : ''
          }`.trim(),
  });

  items.push({
    question: `Is ${page.label} the same as GMT${formatOffset(page.offsetMinutes).slice(3)}?`,
    answer: `Yes. GMT${formatOffset(page.offsetMinutes).slice(3)} and ${page.label} describe the same offset. UTC is the modern time standard and GMT is the older name for the same reference; neither changes for daylight saving time.`,
  });

  if (abbreviations.length > 0) {
    items.push({
      question: `Which time zone abbreviations mean ${page.label}?`,
      answer: `${joinList(abbreviations.map((tz) => `${tz.abbreviation} (${tz.name})`))} ${abbreviations.length === 1 ? 'is' : 'are'} defined as ${page.label}. Note that regions using a standard-time abbreviation such as ${abbreviations[0]!.abbreviation} may be on a different offset during daylight saving time.`,
    });
  }

  items.push({
    question: `How do I convert ${page.label} to my local time?`,
    answer: `Find your own UTC offset and take the difference. For example, if you are at UTC+1 and want ${page.label}, ${
      page.offsetMinutes < 60 ? 'subtract' : 'add'
    } ${Math.abs(page.offsetMinutes - 60) / 60} hours. The converter on this page does this automatically using your browser's time zone, including daylight saving time.`,
  });

  return items;
}

function describeUsagePlaces(usage: OffsetUsage): string {
  if (usage.cities.length === 0) return usage.name;
  const names = usage.cities.slice(0, 3).map((c) => c.name);
  return `${usage.name} — ${names.join(', ')}`;
}

/** Cities from the dataset currently on the hub's offset (UTC+0), for the /utc/ and /gmt/ hubs. */
export function getCitiesOnOffsetNow(offsetMinutes: number, now: number, limit = 12): City[] {
  return getAllCities()
    .filter((city) => getUTCOffset(city.timezone, now) === offsetMinutes)
    .slice(0, limit);
}

export { getZoneDisplayNames };
