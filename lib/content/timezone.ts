/** Data-driven copy for time zone abbreviation pages. */
import { getCitiesInZones } from '@/lib/data/cities';
import { getSeasonalZones, getTimezone, getYearRoundZones } from '@/lib/data/timezones';
import type { FaqItem } from '@/lib/seo/jsonld';
import { fitDescription } from '@/lib/seo/title';
import { formatOffset, getZoneGenericName, getZonedParts, observesDST } from '@/lib/time';
import { getDstTransitionsInYear } from '@/lib/time/transitions';
import { joinList } from '@/lib/text';
import { computeAbbreviationStatus } from '@/lib/timezones/status';
import type { TimeZoneEntry } from '@/types/data';

/** Seeded city names that use this abbreviation's offset all year ("Regina", "Mexico City"). */
export function yearRoundExampleCities(entry: TimeZoneEntry): string[] {
  return getCitiesInZones(getYearRoundZones(entry)).map((city) => city.name);
}

/** The zone whose DST behaviour the page explains (Chicago for CST, London for GMT). */
export function watchZoneFor(entry: TimeZoneEntry, now: number): string | null {
  const year = getZonedParts(now, entry.referenceZone).year;
  if (observesDST(entry.referenceZone, year)) return entry.referenceZone;
  return getSeasonalZones(entry)[0] ?? null;
}

export function timezoneMetaDescription(entry: TimeZoneEntry): string {
  const offset = formatOffset(entry.offsetMinutes);
  const counterpart = entry.counterpart ? getTimezone(entry.counterpart) : undefined;
  const lead = `${entry.abbreviation} (${entry.name}) is ${offset}.`;
  if (counterpart) {
    return fitDescription(
      `${lead} ${entry.referenceLabel} right now, whether ${entry.abbreviation} or ${counterpart.abbreviation} applies today, where it is used, and comparisons with other zones.`,
      `${lead} Current time, whether ${entry.abbreviation} or ${counterpart.abbreviation} applies today, where it is used, and comparisons with other zones.`,
    );
  }
  return fitDescription(
    `${lead} Current ${entry.abbreviation} time, where it is used, whether it changes for daylight saving, and comparisons with other zones.`,
    `${lead} Current ${entry.abbreviation} time, where it is used, daylight saving and comparisons with other zones.`,
  );
}

export function timezoneFaqs(entry: TimeZoneEntry, now: number): FaqItem[] {
  const items: FaqItem[] = [];
  const offset = formatOffset(entry.offsetMinutes);
  const counterpart = entry.counterpart ? getTimezone(entry.counterpart) : undefined;
  const watchZone = watchZoneFor(entry, now);
  const regionName = watchZone ? (getZoneGenericName(watchZone) ?? entry.referenceLabel) : entry.referenceLabel;

  items.push({ question: `What is ${entry.abbreviation}?`, answer: entry.summary });

  items.push({
    question: `What is the UTC offset of ${entry.abbreviation}?`,
    answer: counterpart
      ? `${entry.abbreviation} is always ${offset}. When ${regionName} ${entry.kind === 'daylight' ? 'is not on daylight saving time' : 'observes daylight saving time'}, it uses ${counterpart.abbreviation} (${formatOffset(counterpart.offsetMinutes)}) instead.`
      : `${entry.abbreviation} is always ${offset}${entry.kind === 'universal' || entry.seasonalRegions.length === 0 ? ' and never changes for daylight saving time' : ''}.`,
  });

  if (watchZone) {
    const status = computeAbbreviationStatus(entry, now, { yearRoundExamples: yearRoundExampleCities(entry) });
    const other = counterpart?.abbreviation ?? status.currentAbbreviation;
    items.push({
      question: counterpart ? `Is it ${entry.abbreviation} or ${other} right now?` : `Is ${regionName} on ${entry.abbreviation} right now?`,
      answer: `${status.headline}. ${status.detail}`,
    });

    const year = getZonedParts(now, watchZone).year;
    const { start, end } = getDstTransitionsInYear(watchZone, year);
    if (start && end) {
      // The DST-start transition lands on the daylight abbreviation (CDT, BST).
      const daylight = start.abbreviationAfter;
      items.push({
        question: counterpart
          ? `When does ${regionName} switch between ${entry.kind === 'daylight' ? `${counterpart.abbreviation} and ${entry.abbreviation}` : `${entry.abbreviation} and ${counterpart.abbreviation}`}?`
          : `When does ${regionName} change its clocks?`,
        answer:
          end.instant < start.instant
            ? `In ${year}, ${regionName} leaves daylight saving time on ${end.dateLabel} at ${end.localTimeBefore} and returns to ${daylight} on ${start.dateLabel} at ${start.localTimeBefore}.`
            : `In ${year}, ${regionName} switches to ${daylight} on ${start.dateLabel} at ${start.localTimeBefore} (clocks go forward 1 hour) and back on ${end.dateLabel} at ${end.localTimeBefore} (clocks go back 1 hour).`,
      });
    }
  } else {
    items.push({
      question: `Does ${entry.abbreviation} change for daylight saving time?`,
      answer: `No. ${entry.abbreviation} stays at ${offset} all year. Its difference from places that do observe daylight saving time, such as US Eastern Time, changes when those places switch.`,
    });
  }

  if (entry.yearRoundRegions.length > 0 && entry.kind !== 'universal') {
    items.push({
      question: `Where is ${entry.abbreviation} used all year?`,
      // Region labels contain commas, so list them with semicolons.
      answer: `These places use ${offset} all year without daylight saving time: ${entry.yearRoundRegions.map((region) => region.label).join('; ')}.`,
    });
  } else if (entry.kind === 'daylight') {
    items.push({
      question: `Is ${entry.abbreviation} used all year anywhere?`,
      answer: `No major region uses ${entry.abbreviation} all year. It is only in effect during daylight saving time; the rest of the year the same places use ${counterpart?.abbreviation ?? 'standard time'}.`,
    });
  }

  if (entry.slug === 'gmt') {
    items.push({
      question: 'Is GMT the same as UTC?',
      answer:
        'For everyday purposes, yes: GMT and UTC show the same time (UTC+0). UTC is the precise atomic time standard used to define every time zone, while GMT is the name of the time zone. Neither changes for daylight saving time.',
    });
  }

  if (entry.alsoMeans && entry.alsoMeans.length > 0) {
    const meanings = entry.alsoMeans.map((m) => `${m.name} (${formatOffset(m.offsetMinutes)})`);
    items.push({
      question: `Does ${entry.abbreviation} have other meanings?`,
      answer: `Yes. ${entry.abbreviation} can also mean ${joinList(meanings)}. This page covers ${entry.name} (${offset}). When sharing a time, adding the UTC offset avoids confusion.`,
    });
  }

  return items;
}
