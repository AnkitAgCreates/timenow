/**
 * Data-driven content for country pages. Zone groups, descriptions and FAQs
 * are computed from the country's IANA zones for an explicit instant.
 */
import { getCitiesInCountry, getComparisonCitiesForZone } from '@/lib/data/cities';
import { countryPhrase, getCountryByCode } from '@/lib/data/countries';
import type { FaqItem } from '@/lib/seo/jsonld';
import { joinList } from '@/lib/text';
import { describeDifference, formatDate, formatOffset, getDSTState, getTimeDifference, getZoneLabel, getZonedParts, observesDST, utcMs } from '@/lib/time';
import { getDstTransitionsInYear } from '@/lib/time/transitions';
import { getZoneDisplayNames, getZoneRegionName, type ZoneDisplayNames } from '@/lib/time/zone-names';
import type { City, Country } from '@/types/data';

export type ZoneGroup = {
  /** "-300/-240" — standard offset / daylight offset (or "none"). */
  key: string;
  zones: string[];
  /** Zone used for live values: the most important city's zone in the group, else the first zone. */
  zone: string;
  standardOffset: number;
  daylightOffset: number | null;
  /** DST-agnostic name: "Eastern Time", "Central Standard Time (Saskatchewan)". */
  name: string;
  names: ZoneDisplayNames;
  /** "EST" / "EDT" (or offset labels when no abbreviation exists). */
  standardAbbreviation: string;
  daylightAbbreviation: string | null;
  cities: City[];
};

function sampleStates(zone: string, year: number) {
  const jan = getDSTState(zone, utcMs(year, 1, 15, 12));
  const jul = getDSTState(zone, utcMs(year, 7, 15, 12));
  return { jan, jul };
}

/**
 * The country's zones grouped by behaviour (standard offset + daylight offset),
 * ordered west to east. Zones with identical behaviour (America/Detroit and
 * America/New_York) form one group so the page reads "Eastern Time", not a
 * list of tzdata ids.
 */
export function getCountryZoneGroups(country: Country, now: number): ZoneGroup[] {
  const year = getZonedParts(now, country.primaryZone).year;
  const cities = getCitiesInCountry(country.code);
  const groups = new Map<string, ZoneGroup>();

  for (const zone of country.zones) {
    const { jan, jul } = sampleStates(zone, year);
    const standardOffset = jan.standardOffsetMinutes;
    const daylightOffset = observesDST(zone, year) ? (jan.isDST ? jan.offsetMinutes : jul.isDST ? jul.offsetMinutes : null) : null;
    const key = `${standardOffset}/${daylightOffset ?? 'none'}`;
    const zoneCities = cities.filter((city) => city.timezone === zone);
    const existing = groups.get(key);
    if (existing) {
      existing.zones.push(zone);
      existing.cities.push(...zoneCities);
      continue;
    }
    const names = getZoneDisplayNames(zone, now);
    const standardState = jan.isDST ? jul : jan;
    const daylightState = jan.isDST ? jan : jul.isDST ? jul : null;
    groups.set(key, {
      key,
      zones: [zone],
      zone,
      standardOffset,
      daylightOffset,
      name: getZoneRegionName(zone, now) ?? formatOffset(standardOffset),
      names,
      standardAbbreviation: getZoneLabel(zone, standardState === jan ? utcMs(year, 1, 15, 12) : utcMs(year, 7, 15, 12)).abbreviation,
      daylightAbbreviation: daylightState ? getZoneLabel(zone, daylightState === jan ? utcMs(year, 1, 15, 12) : utcMs(year, 7, 15, 12)).abbreviation : null,
      cities: [...zoneCities],
    });
  }

  for (const group of groups.values()) {
    group.cities.sort((a, b) => a.priority - b.priority || (b.population ?? 0) - (a.population ?? 0));
    const best = group.cities[0];
    if (best && best.timezone !== group.zone) {
      // Name and live values follow the group's most important city.
      group.zone = best.timezone;
      group.name = getZoneRegionName(best.timezone, now) ?? group.name;
      group.names = getZoneDisplayNames(best.timezone, now);
    }
  }

  return [...groups.values()].sort((a, b) => a.standardOffset - b.standardOffset || (a.daylightOffset ?? -1e9) - (b.daylightOffset ?? -1e9));
}

/** "Eastern Standard Time (EST, UTC-5), switching to Eastern Daylight Time (EDT, UTC-4) for daylight saving time" */
export function describeZoneGroup(group: ZoneGroup): string {
  const standard = `${group.names.standard ?? group.name} (${group.standardAbbreviation}, ${formatOffset(group.standardOffset)})`;
  if (group.daylightOffset === null) return `${standard} all year`;
  const daylight = `${group.names.daylight ?? 'daylight saving time'} (${group.daylightAbbreviation}, ${formatOffset(group.daylightOffset)})`;
  return `${standard}, switching to ${daylight} for daylight saving time`;
}

export function countryTitle(country: Country): string {
  return `Current Time in ${country.name}`;
}

export function countryMetaDescription(country: Country, groups: ZoneGroup[]): string {
  const name = countryPhrase(country);
  if (groups.length === 1) {
    const g = groups[0]!;
    const dst = g.daylightOffset === null ? 'no daylight saving time' : 'daylight saving dates';
    return `What time is it in ${name}? Live local time, the ${g.name} time zone (${g.standardAbbreviation}, ${formatOffset(g.standardOffset)}), ${dst}, major cities and time differences with the rest of the world.`;
  }
  const first = groups[0]!;
  const last = groups[groups.length - 1]!;
  return `${countryPhrase(country, true)} spans ${groups.length} time zones, from ${formatOffset(first.standardOffset)} to ${formatOffset(last.standardOffset)}. See the current time in each zone, major cities, daylight saving rules and time differences.`;
}

export function countryFaqs(country: Country, groups: ZoneGroup[], now: number): FaqItem[] {
  const items: FaqItem[] = [];
  const name = countryPhrase(country);
  const Name = countryPhrase(country, true);
  const primary = groups.find((g) => g.zones.includes(country.primaryZone)) ?? groups[0]!;
  const year = getZonedParts(now, country.primaryZone).year;
  const today = formatDate(now, country.primaryZone, 'full');
  const capital = country.capitalSlug ? getCitiesInCountry(country.code).find((c) => c.slug === country.capitalSlug) : undefined;

  items.push({
    question: `What time zone is ${name} in?`,
    answer:
      groups.length === 1
        ? `${Name} uses ${describeZoneGroup(primary)}.`
        : `${Name} spans ${groups.length} time zones: ${joinList(groups.map((g) => `${g.name} (${formatOffset(g.standardOffset)}${g.daylightOffset !== null ? ` / ${formatOffset(g.daylightOffset)} in daylight saving time` : ''})`))}.${
            capital ? ` The capital, ${capital.name}, is on ${primary.name}.` : ''
          }`,
  });

  const dstGroups = groups.filter((g) => g.daylightOffset !== null);
  if (dstGroups.length === 0) {
    items.push({
      question: `Does ${name} observe daylight saving time?`,
      answer: `No. ${Name} does not change its clocks for daylight saving time, so its time difference with places that do (such as the United States and most of Europe) changes twice a year.`,
    });
  } else {
    const { start, end } = getDstTransitionsInYear(primary.zone, year);
    const dates =
      start && end
        ? end.instant < start.instant
          ? ` In ${year}, ${primary.name} leaves daylight saving time on ${end.dateLabel} and starts it again on ${start.dateLabel}.`
          : ` In ${year}, ${primary.name} starts daylight saving time on ${start.dateLabel} and ends it on ${end.dateLabel}.`
        : '';
    items.push({
      question: `Does ${name} observe daylight saving time?`,
      answer:
        dstGroups.length === groups.length
          ? `Yes.${dates}`
          : `Partly. ${joinList(dstGroups.map((g) => g.name))} ${dstGroups.length === 1 ? 'changes its clocks' : 'change their clocks'}; ${joinList(
              groups.filter((g) => g.daylightOffset === null).map((g) => g.name),
            )} ${groups.length - dstGroups.length === 1 ? 'stays' : 'stay'} on standard time all year.${dates}`,
    });
  }

  if (groups.length > 1) {
    items.push({
      question: `How many time zones does ${name} have?`,
      answer: `${groups.length}, counting zones that behave differently: ${joinList(groups.map((g) => `${g.name} (${formatOffset(g.standardOffset)})`))}.${
        country.overseasTimeZones ? ' Overseas territories use further time zones.' : ''
      }`,
    });
  } else if (country.overseasTimeZones) {
    items.push({
      question: `Is all of ${name} on the same time?`,
      answer: `Mainland ${country.name} uses a single time zone. Overseas regions use different time zones.`,
    });
  }

  const comparison = getComparisonCitiesForZone(country.primaryZone, 1)[0];
  if (comparison) {
    const minutes = getTimeDifference(country.primaryZone, comparison.timezone, now);
    items.push({
      question: `What is the time difference between ${name} and ${comparison.name}?`,
      answer: `On ${today}, ${describeDifference(comparison.name, groups.length > 1 ? `${primary.name} in ${country.name}` : country.name, minutes)}. The difference can change when either place switches to or from daylight saving time.`,
    });
  }

  if (capital) {
    const label = getZoneLabel(capital.timezone, now);
    items.push({
      question: `What time is it in ${capital.name}, the capital?`,
      answer: `${capital.name} is on ${primary.name}, currently ${label.abbreviation} (${label.offsetLabel}). The live time is shown at the top of this page and on the ${capital.name} page.`,
    });
  }

  return items;
}

export function getCountryOf(city: City): Country | undefined {
  return getCountryByCode(city.countryCode);
}
