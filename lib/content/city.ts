/**
 * Data-driven copy for city pages. Every sentence is computed from the city
 * record and the time engine for an explicit instant — no hardcoded offsets.
 */
import { getCountryByCode } from '@/lib/data/countries';
import type { FaqItem } from '@/lib/seo/jsonld';
import {
  describeDifference,
  formatDate,
  formatDuration,
  formatOffset,
  formatTime,
  getDSTState,
  getSunTimes,
  getTimeDifference,
  getZoneEra,
  getZonedDate,
  getZonedParts,
  observesDST,
  type SunTimes,
} from '@/lib/time';
import { getDstTransitionsInYear, type TransitionInfo } from '@/lib/time/transitions';
import { getZoneDisplayNames, getZoneRegionName, type ZoneDisplayNames } from '@/lib/time/zone-names';
import type { City } from '@/types/data';

/** State for US/Canada/Australia, otherwise the country — used in titles. */
export function cityRegion(city: City): string {
  return ['US', 'CA', 'AU'].includes(city.countryCode) && city.state ? city.state : city.country;
}

export type ZoneFacts = {
  timeZone: string;
  generic: string | null;
  standardAbbreviation: string;
  standardName: string | null;
  /** "UTC-8" */
  standardOffsetLabel: string;
  daylightAbbreviation: string | null;
  daylightName: string | null;
  /** "UTC-7", or null when the zone has no DST in `year`. */
  daylightOffsetLabel: string | null;
  standardOffset: number;
  observesDST: boolean;
  year: number;
  dstStart: TransitionInfo | null;
  dstEnd: TransitionInfo | null;
  /** Standard/daylight names for the live "name-with-abbreviation" field. */
  names: ZoneDisplayNames;
};

/**
 * Time zone facts for a zone in the year containing `now`. Labels and offsets
 * come from zone metadata where available, otherwise from the zone's actual
 * transitions — the daylight offset is never assumed to be standard + 1 hour.
 */
export function getZoneFacts(timeZone: string, now: number): ZoneFacts {
  const year = getZonedParts(now, timeZone).year;
  const state = getDSTState(timeZone, now);
  const era = getZoneEra(timeZone, now);
  const dst = observesDST(timeZone, year);
  const { start, end } = dst ? getDstTransitionsInYear(timeZone, year) : { start: null, end: null };
  const standardOffset = state.standardOffsetMinutes;
  const daylightOffset = dst ? (era?.daylight?.offsetMinutes ?? start?.offsetAfter ?? null) : null;
  const names = getZoneDisplayNames(timeZone, now);
  return {
    timeZone,
    generic: getZoneRegionName(timeZone, now),
    standardAbbreviation: era?.standard.abbreviation ?? formatOffset(standardOffset),
    standardName: era?.standard.name ?? names.standard,
    standardOffsetLabel: formatOffset(standardOffset),
    daylightAbbreviation: daylightOffset === null ? null : (era?.daylight?.abbreviation ?? start?.abbreviationAfter ?? formatOffset(daylightOffset)),
    daylightName: daylightOffset === null ? null : (era?.daylight?.name ?? names.daylight),
    daylightOffsetLabel: daylightOffset === null ? null : formatOffset(daylightOffset),
    standardOffset,
    observesDST: dst,
    year,
    dstStart: start,
    dstEnd: end,
    names,
  };
}

export function getCitySunTimes(city: City, now: number): { dateLabel: string; sun: SunTimes } {
  const date = getZonedDate(now, city.timezone);
  return { dateLabel: formatDate(now, city.timezone, 'short'), sun: getSunTimes(city.latitude, city.longitude, date, city.timezone) };
}

/** "Pacific Time (PST, UTC-8 / PDT, UTC-7)" */
/** "Central Standard Time (Central America)" + "CST, UTC-6" → "Central Standard Time (Central America; CST, UTC-6)", not "(…) (…)". */
export function nameWithDetail(name: string, detail: string): string {
  return name.endsWith(')') ? `${name.slice(0, -1)}; ${detail})` : `${name} (${detail})`;
}

export function zoneSummary(facts: ZoneFacts): string {
  const standard = `${facts.standardAbbreviation}, ${facts.standardOffsetLabel}`;
  const daylight = facts.daylightAbbreviation ? ` / ${facts.daylightAbbreviation}, ${facts.daylightOffsetLabel}` : '';
  return nameWithDetail(facts.generic ?? facts.timeZone, `${standard}${daylight}`);
}

export function cityMetaDescription(city: City, facts: ZoneFacts): string {
  const dst = facts.observesDST ? 'daylight saving dates' : 'no daylight saving time';
  return `What time is it in ${city.name}? See the live local time and date, its time zone — ${zoneSummary(facts)} — ${dst}, sunrise and sunset, and time differences with major cities.`;
}

export function cityFaqs(city: City, facts: ZoneFacts, now: number, comparison: City | undefined): FaqItem[] {
  const items: FaqItem[] = [];
  const zoneName = facts.generic ?? facts.timeZone;
  const today = formatDate(now, city.timezone, 'full');

  items.push({
    question: `What time zone is ${city.name} in?`,
    answer: facts.observesDST
      ? `${city.name} is on ${zoneName} (IANA time zone ${facts.timeZone}). It uses ${nameWithDetail(facts.standardName ?? facts.standardAbbreviation, `${facts.standardAbbreviation}, ${facts.standardOffsetLabel}`)} as standard time and ${nameWithDetail(facts.daylightName ?? facts.daylightAbbreviation ?? '', `${facts.daylightAbbreviation}, ${facts.daylightOffsetLabel}`)} during daylight saving time.`
      : `${city.name} is on ${zoneName} (IANA time zone ${facts.timeZone}), which is ${facts.standardAbbreviation} (${facts.standardOffsetLabel}) all year.`,
  });

  const { dstStart, dstEnd } = facts;
  if (facts.observesDST && dstStart && dstEnd) {
    const startText = `on ${dstStart.dateLabel}, when clocks go forward 1 hour at ${dstStart.localTimeBefore}`;
    const endText = `on ${dstEnd.dateLabel}, when clocks go back 1 hour at ${dstEnd.localTimeBefore}`;
    items.push({
      question: `Does ${city.name} observe daylight saving time?`,
      answer:
        dstEnd.instant < dstStart.instant
          ? `Yes. ${city.name} is in the southern hemisphere, so in ${facts.year} daylight saving time ends ${endText}, and starts again ${startText}.`
          : `Yes. In ${facts.year}, daylight saving time starts ${startText}, and ends ${endText}.`,
    });
  } else {
    items.push({
      question: `Does ${city.name} observe daylight saving time?`,
      answer: `No. ${city.name} does not change its clocks for daylight saving time, so it stays on ${facts.standardAbbreviation} (${facts.standardOffsetLabel}) all year. Its time difference with places that do observe daylight saving time changes during the year.`,
    });
  }

  if (comparison) {
    const minutes = getTimeDifference(city.timezone, comparison.timezone, now);
    items.push({
      question: `What is the time difference between ${city.name} and ${comparison.name}?`,
      answer: `On ${today}, ${describeDifference(comparison.name, city.name, minutes)}. The difference can change when either city switches to or from daylight saving time.`,
    });
  }

  const { sun } = getCitySunTimes(city, now);
  if (sun.polar === null && sun.sunrise !== null && sun.sunset !== null) {
    items.push({
      question: `What time is sunrise and sunset in ${city.name}?`,
      answer: `On ${today}, the sun rises at ${formatTime(sun.sunrise, city.timezone, { seconds: false })} and sets at ${formatTime(sun.sunset, city.timezone, { seconds: false })} local time, giving ${formatDuration(sun.dayLengthMinutes)} of daylight.`,
    });
  }

  const country = getCountryByCode(city.countryCode);
  if (country) {
    const name = country.definiteArticle ? `the ${country.name}` : country.name;
    const Name = country.definiteArticle ? `The ${country.name}` : country.name;
    items.push({
      question: `Is all of ${name} on the same time as ${city.name}?`,
      answer: country.multipleTimeZones
        ? `No. ${Name} has more than one time zone, so local time depends on the region. ${city.name} follows ${zoneName}.`
        : country.overseasTimeZones
          ? `Mainland ${country.name} uses a single time zone, so ${city.name} has the same local time as the rest of the mainland. Overseas regions use different time zones.`
          : `Yes. ${Name} uses a single time zone, so ${city.name} has the same local time as the rest of the country.`,
    });
  }

  return items;
}
