/**
 * "When do the clocks change?" guide (/guides/clock-changes/). Everything here is
 * computed from the time engine for the render instant: which countries change,
 * on which local dates and at which local times, and how time differences shift.
 * The only hand-written facts are one explanatory note (Morocco's Ramadan rule)
 * and the English names of a few island regions.
 */
import { getCity } from '@/lib/data/cities';
import { getConverterPair } from '@/lib/data/converters';
import { getPublishedCountries } from '@/lib/data/countries';
import type { FaqItem } from '@/lib/seo/jsonld';
import { DAY_MS, MINUTE_MS, formatDate, formatDuration, getTransitionsInYear, getUTCOffset, getZonedParts, type OffsetTransition } from '@/lib/time';
import { getDifferencePeriods, toTransitionInfo, type TransitionInfo } from '@/lib/time/transitions';
import type { Country } from '@/types/data';
import { getCountryZoneGroups, type ZoneGroup } from './country';

export type ClockChange = TransitionInfo & { direction: 'forward' | 'back'; shiftMinutes: number };

export type CountryChangeRow = {
  country: Country;
  /** Per covered year, the first change forward and the first change back (either may be null). */
  years: Array<{ year: number; forward: ClockChange | null; back: ClockChange | null }>;
  /** Parts of the country that do not change, or change on other dates. */
  notes: string[];
};

/** A country in a clock move; `place` names the region when only part of the country moves that day. */
export type MovingCountry = { country: Country; place: string | null };

export type ClockMove = { from: string; to: string; abbreviations: string; countries: MovingCountry[] };

export type ChangeMoment = {
  /** "Sunday, October 25, 2026": the local calendar date of the change. */
  dateLabel: string;
  dateShort: string;
  /** Earliest instant among the countries changing on that date. */
  instant: number;
  direction: 'forward' | 'back';
  shiftMinutes: number;
  /** Distinct local clock moves on that date, largest group of countries first. */
  moves: ClockMove[];
  countryCount: number;
};

export type DifferencePeriodView = {
  start: number;
  end: number | null;
  /** Local date of the change that starts/ends the period, in the zone whose clocks changed; null when outside the computed window. */
  startLabel: string | null;
  endLabel: string | null;
  minutes: number;
  /** A spell of under six weeks, like the week between Europe's and North America's changes. */
  brief: boolean;
  /** "1 week", "10 days": set for brief spells. */
  lengthLabel: string | null;
  sentence: string;
};
export type DifferenceShift = { fromCity: string; toCity: string; href?: string; usualMinutes: number; periods: DifferencePeriodView[] };

const NOTES: Record<string, string> = {
  MA: 'Morocco keeps UTC+1 for most of the year and moves its clocks back one hour during Ramadan.',
};

/** Island regions whose zone has no city on the site; IANA names them by a single word. */
const PLACE_NAMES: Record<string, string> = {
  'Atlantic/Azores': 'Azores',
  'Atlantic/Canary': 'Canary Islands',
  'Australia/Lord_Howe': 'Lord Howe Island',
  'Pacific/Chatham': 'Chatham Islands',
  'Pacific/Easter': 'Easter Island',
  'Pacific/Galapagos': 'Galápagos Islands',
};

function toChange(zone: string, transition: OffsetTransition): ClockChange {
  const info = toTransitionInfo(zone, transition);
  return { ...info, direction: info.offsetAfter > info.offsetBefore ? 'forward' : 'back', shiftMinutes: Math.abs(info.offsetAfter - info.offsetBefore) };
}

/** Clock changes (any offset move) in a zone during a calendar year. */
export function changesIn(zone: string, year: number): ClockChange[] {
  return getTransitionsInYear(zone, year)
    .map((t) => toChange(zone, t))
    .filter((c) => c.shiftMinutes > 0);
}

/** "Lord Howe Island", "Perth", "Matamoros": a place name for a zone group. */
const groupLabel = (group: ZoneGroup) =>
  PLACE_NAMES[group.zone] ?? group.cities[0]?.name ?? group.zone.split('/').pop()!.replace(/_/g, ' ');
const signature = (changes: ClockChange[]) => changes.map((c) => `${c.dateShort}${c.direction}`).join('|');

/** The two calendar years the guide covers: the render year and the next. */
export function guideYears(now: number): [number, number] {
  const year = getZonedParts(now, 'UTC').year;
  return [year, year + 1];
}

/** One row per country that has at least one zone changing its clocks in the covered years. */
export function getCountryChangeRows(now: number): CountryChangeRow[] {
  const years = guideYears(now);
  const rows: CountryChangeRow[] = [];
  for (const country of getPublishedCountries()) {
    const groups = getCountryZoneGroups(country, now).map((group) => ({ group, changes: years.flatMap((y) => changesIn(group.zone, y)) }));
    const changing = groups.filter((g) => g.changes.length > 0);
    if (changing.length === 0) continue;
    const primaryChanges = changing.some((g) => g.group.zones.includes(country.primaryZone));
    const reference = changing.find((g) => g.group.zones.includes(country.primaryZone)) ?? changing[0]!;
    const still = groups.filter((g) => g.changes.length === 0);
    const notes: string[] = [];
    if (!primaryChanges) {
      notes.push(`Only in ${changing.map((g) => groupLabel(g.group)).join(', ')}. The rest of the country keeps the same time all year.`);
    } else if (still.length) {
      notes.push(`No change in ${still.map((g) => groupLabel(g.group)).join(', ')}.`);
    }
    const refSignature = signature(reference.changes);
    const refShift = reference.changes[0]!.shiftMinutes;
    for (const other of changing) {
      if (other === reference) continue;
      if (signature(other.changes) !== refSignature) {
        // The next two changes from now (the covered years start in January, so earlier ones may be past).
        const upcoming = other.changes.filter((c) => c.instant >= now);
        const next = (upcoming.length ? upcoming : other.changes).slice(0, 2).map((c) => `${c.direction} on ${c.dateShort}`).join(', ');
        notes.push(`${groupLabel(other.group)} changes on other dates: ${next}.`);
      } else if (other.changes[0]!.shiftMinutes !== refShift) {
        notes.push(`${groupLabel(other.group)} moves its clocks by ${describeShift(other.changes[0]!.shiftMinutes)} instead of ${describeShift(refShift)}.`);
      }
    }
    // tzdata can end a country's changes (a rule abolished); then say so instead of describing the old rule.
    const ahead = reference.changes.some((c) => c.instant >= now);
    if (!ahead) notes.push(`No further changes are scheduled after ${reference.changes[reference.changes.length - 1]!.dateShort}.`);
    const note = NOTES[country.code];
    if (note && ahead) notes.push(note);
    rows.push({
      country,
      years: years.map((year) => {
        const inYear = changesIn(reference.group.zone, year);
        return { year, forward: inYear.find((c) => c.direction === 'forward') ?? null, back: inYear.find((c) => c.direction === 'back') ?? null };
      }),
      notes,
    });
  }
  return rows.sort((a, b) => a.country.name.localeCompare(b.country.name));
}

/** Countries on the site whose clocks never change in the covered years, largest first. */
export function getNoChangeCountries(now: number): Country[] {
  const changing = new Set(getCountryChangeRows(now).map((r) => r.country.code));
  return getPublishedCountries()
    .filter((c) => !changing.has(c.code))
    .sort((a, b) => b.population - a.population);
}

/** Days since the epoch of the local calendar date of a change (before the clocks move), for sorting. */
const localDay = (change: ClockChange) => Math.floor((change.instant + change.offsetBefore * MINUTE_MS) / DAY_MS);
/** A moment where only regions move (Lord Howe Island), no country's main zone. */
const regionalOnly = (moment: ChangeMoment) => moment.moves.every((m) => m.countries.every((c) => c.place !== null));

/**
 * Every clock change from `now` over the next `days`, grouped by local date and direction,
 * in calendar order. A country appears once per date: its main zone's move when the main
 * zone changes that day (mainland Spain, not the Canary Islands), otherwise the moving
 * regions are named ("Australia (Lord Howe Island)").
 */
export function getUpcomingChanges(now: number, days = 366): ChangeMoment[] {
  const until = now + days * DAY_MS;
  const firstYear = getZonedParts(now, 'UTC').year;
  const lastYear = getZonedParts(until, 'UTC').year;
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i);
  const moments = new Map<string, ChangeMoment & { day: number }>();
  for (const country of getPublishedCountries()) {
    // The zones of this country changing on each date, collected before choosing what to show.
    const byDate = new Map<string, Array<{ group: ZoneGroup; change: ClockChange }>>();
    for (const group of getCountryZoneGroups(country, now)) {
      for (const change of years.flatMap((y) => changesIn(group.zone, y))) {
        if (change.instant < now || change.instant >= until) continue;
        const key = `${change.dateShort}|${change.direction}|${change.shiftMinutes}`;
        byDate.set(key, [...(byDate.get(key) ?? []), { group, change }]);
      }
    }
    for (const [key, entries] of byDate) {
      const main = entries.find((e) => e.group.zones.includes(country.primaryZone));
      const { change } = main ?? entries[0]!;
      const place = main ? null : entries.map((e) => groupLabel(e.group)).join(', ');
      let moment = moments.get(key);
      if (!moment) {
        moment = { dateLabel: change.dateLabel, dateShort: change.dateShort, day: localDay(change), instant: change.instant, direction: change.direction, shiftMinutes: change.shiftMinutes, moves: [], countryCount: 0 };
        moments.set(key, moment);
      }
      moment.instant = Math.min(moment.instant, ...entries.map((e) => e.change.instant));
      const abbreviations = `${change.abbreviationBefore} → ${change.abbreviationAfter}`;
      let move = moment.moves.find((m) => m.from === change.localTimeBefore && m.to === change.localTimeAfter && m.abbreviations === abbreviations);
      if (!move) {
        move = { from: change.localTimeBefore, to: change.localTimeAfter, abbreviations, countries: [] };
        moment.moves.push(move);
      }
      move.countries.push({ country, place });
      moment.countryCount += 1;
    }
  }
  return [...moments.values()]
    // Calendar order; on a shared date, whole countries before single regions, then more countries first.
    .sort((a, b) => a.day - b.day || Number(regionalOnly(a)) - Number(regionalOnly(b)) || b.countryCount - a.countryCount || a.instant - b.instant)
    .map((m) => ({
      dateLabel: m.dateLabel,
      dateShort: m.dateShort,
      instant: m.instant,
      direction: m.direction,
      shiftMinutes: m.shiftMinutes,
      moves: [...m.moves].sort((a, b) => b.countries.length - a.countries.length),
      countryCount: m.countryCount,
    }));
}

/** "1 hour", "30 minutes". */
export function describeShift(minutes: number): string {
  return minutes % 60 === 0 ? `${minutes / 60} hour${minutes === 60 ? '' : 's'}` : `${minutes} minutes`;
}

/** "in 7 days", "tomorrow", "today", counted from `now` to the change instant. */
export function daysUntil(now: number, instant: number): string {
  const days = Math.ceil((instant - now) / DAY_MS);
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

const PAIRS: Array<[string, string]> = [
  ['new-york', 'london'],
  ['london', 'sydney'],
  ['new-york', 'new-delhi'],
  ['los-angeles', 'tokyo'],
];

function differenceSentence(from: string, to: string, minutes: number): string {
  if (minutes === 0) return `${to} and ${from} are on the same time`;
  return `${to} is ${formatDuration(minutes)} ${minutes > 0 ? 'ahead of' : 'behind'} ${from}`;
}

/** Spells shorter than this are the in-between weeks when two places have changed on different dates. */
const BRIEF_DAYS = 42;
/** Look back far enough that the current period starts at a real clock change. */
const LOOKBACK_DAYS = 400;

const lengthLabel = (days: number) => (days % 7 === 0 ? `${days / 7} week${days === 7 ? '' : 's'}` : `${days} days`);

/** How the difference between well-known city pairs moves over the coming year. */
export function getDifferenceShifts(now: number): DifferenceShift[] {
  const out: DifferenceShift[] = [];
  const horizon = now + 366 * DAY_MS;
  const windowStart = now - LOOKBACK_DAYS * DAY_MS;
  for (const [fromSlug, toSlug] of PAIRS) {
    const from = getCity(fromSlug);
    const to = getCity(toSlug);
    if (!from || !to) continue;
    // Run a year past the horizon too, so the last period shown ends at a real change.
    const periods = getDifferencePeriods(from.timezone, to.timezone, windowStart, LOOKBACK_DAYS + 2 * 366).filter((p) => (p.end === null || p.end > now) && p.start < horizon);
    if (periods.length < 2) continue;
    // Date each boundary in the zone whose clocks change there, so a UK switch reads as a UK date.
    const boundary = (instant: number) => {
      const zone = getUTCOffset(from.timezone, instant - MINUTE_MS) !== getUTCOffset(from.timezone, instant) ? from.timezone : to.timezone;
      return formatDate(instant - MINUTE_MS, zone, 'short');
    };
    // The difference that holds for most of the coming year is the usual one.
    const totals = new Map<number, number>();
    for (const p of periods) totals.set(p.differenceMinutes, (totals.get(p.differenceMinutes) ?? 0) + Math.min(p.end ?? horizon, horizon) - Math.max(p.start, now));
    const usualMinutes = [...totals.entries()].sort((a, b) => b[1] - a[1])[0]![0];
    const slug = `${fromSlug}-to-${toSlug}`;
    out.push({
      fromCity: from.name,
      toCity: to.name,
      href: getConverterPair(slug) ? `/convert/${slug}/` : undefined,
      usualMinutes,
      periods: periods.map((p) => {
        const days = p.end === null || p.start === windowStart ? null : Math.round((p.end - p.start) / DAY_MS);
        const brief = days !== null && days < BRIEF_DAYS;
        return {
          start: p.start,
          end: p.end,
          startLabel: p.start === windowStart ? null : boundary(p.start),
          endLabel: p.end === null ? null : boundary(p.end),
          minutes: p.differenceMinutes,
          brief,
          lengthLabel: brief && days !== null ? lengthLabel(days) : null,
          sentence: differenceSentence(from.name, to.name, p.differenceMinutes),
        };
      }),
    });
  }
  return out;
}

/** What happens on the night of a change, for one city. */
export function describeNight(cityName: string, change: ClockChange): string {
  if (change.direction === 'back') {
    return `On ${change.dateLabel}, clocks in ${cityName} go back from ${change.localTimeBefore} ${change.abbreviationBefore} to ${change.localTimeAfter} ${change.abbreviationAfter}. The hour from ${change.localTimeAfter} to ${change.localTimeBefore} happens twice that night.`;
  }
  return `On ${change.dateLabel}, clocks in ${cityName} go forward from ${change.localTimeBefore} ${change.abbreviationBefore} to ${change.localTimeAfter} ${change.abbreviationAfter}. Times from ${change.localTimeBefore} to just before ${change.localTimeAfter} do not exist that night.`;
}

/** The next change in each direction for a city, from `now`. */
export function nextChangesFor(citySlug: string, now: number): { city: string; zone: string; back: ClockChange | null; forward: ClockChange | null } | null {
  const city = getCity(citySlug);
  if (!city) return null;
  const [y1, y2] = guideYears(now);
  const upcoming = [y1, y2, y2 + 1].flatMap((y) => changesIn(city.timezone, y)).filter((c) => c.instant >= now);
  return { city: city.name, zone: city.timezone, back: upcoming.find((c) => c.direction === 'back') ?? null, forward: upcoming.find((c) => c.direction === 'forward') ?? null };
}

export function clockChangeFaqs(now: number): FaqItem[] {
  const uk = nextChangesFor('london', now);
  const us = nextChangesFor('new-york', now);
  const sydney = nextChangesFor('sydney', now);
  const noChange = getNoChangeCountries(now);
  const items: FaqItem[] = [];

  if (uk?.back && us?.back) {
    const year = getZonedParts(Math.min(uk.back.instant, us.back.instant), 'UTC').year;
    items.push({
      question: `When do the clocks go back in ${year}?`,
      answer: `In the UK and most of Europe, clocks go back one hour on ${uk.back.dateLabel}, at ${uk.back.localTimeBefore} ${uk.back.abbreviationBefore} in London. In most of the United States and Canada they go back on ${us.back.dateLabel}, at ${us.back.localTimeBefore} local time.`,
    });
  }
  if (uk?.forward && us?.forward) {
    const year = getZonedParts(Math.min(uk.forward.instant, us.forward.instant), 'UTC').year;
    items.push({
      question: `When do the clocks go forward in ${year}?`,
      answer: `In most of the United States and Canada, clocks go forward one hour on ${us.forward.dateLabel}, at ${us.forward.localTimeBefore} local time. In the UK and most of Europe they go forward on ${uk.forward.dateLabel}, at ${uk.forward.localTimeBefore} ${uk.forward.abbreviationBefore} in London.`,
    });
  }
  if (sydney?.forward && sydney?.back) {
    items.push({
      question: 'Do Australia and New Zealand change their clocks at the same time as Europe?',
      answer: `No. They are in the southern hemisphere, so their summer time runs the other way round. In Sydney the clocks go back on ${sydney.back.dateLabel} and forward on ${sydney.forward.dateLabel}.`,
    });
  }
  const nyLondon = getDifferenceShifts(now).find((s) => s.fromCity === 'New York' && s.toCity === 'London');
  const unusual = nyLondon?.periods.filter((p) => p.brief) ?? [];
  if (nyLondon && unusual.length) {
    const spells = unusual.map((p) => `from ${p.startLabel} to ${p.endLabel}`).join(' and ');
    items.push({
      question: 'Why is the time difference between London and New York different for a few weeks?',
      answer: `Europe and North America change their clocks on different dates. Usually London is ${formatDuration(nyLondon.usualMinutes)} ahead of New York, but ${spells} the gap is ${formatDuration(unusual[0]!.minutes)}. A meeting fixed in one city's time moves by an hour for the other city during those weeks.`,
    });
  }
  items.push({
    question: 'Which countries do not change their clocks?',
    answer: `${noChange.length} of the ${getPublishedCountries().length} countries on this site keep the same time all year, including ${noChange
      .slice(0, 8)
      .map((c) => c.name)
      .join(', ')}.`,
  });
  return items;
}

export function clockChangesDescription(now: number): string {
  const [y1, y2] = guideYears(now);
  return `Daylight saving time ${y1} and ${y2}: when the clocks go forward and back in the UK, Europe, the US, Canada, Australia and more, with local times.`;
}
