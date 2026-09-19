/** Data-driven content for converter pages. All values are for explicit dates. */
import { getCityConverterPairs, getZoneConverterPairs, type ConverterSide, type ResolvedConverterPair } from '@/lib/data/converters';
import type { FaqItem } from '@/lib/seo/jsonld';
import { fitTitle } from '@/lib/seo/title';
import {
  convertTime,
  dayShiftLabel,
  formatDate,
  formatDuration,
  formatOffset,
  formatTime,
  getTimeDifference,
  getUTCOffset,
  getZoneGenericName,
  getZoneLabel,
  getZonedDate,
  getZonedParts,
  observesDST,
  suggestMeetingSlots,
  type CalendarDate,
} from '@/lib/time';
import { getDifferencePeriods, type DifferencePeriod } from '@/lib/time/transitions';
import { getZoneDisplayNames, getZoneRegionName } from '@/lib/time/zone-names';

/**
 * Name used in sentences: "Eastern Time" for DST-observing regions, the entry's
 * own name otherwise ("India Standard Time"); for cities, the city name.
 */
export function sideName(side: ConverterSide, now: number): string {
  if (side.kind === 'city') return side.label;
  const entry = side.entry!;
  const year = getZonedParts(now, side.zone).year;
  return observesDST(side.zone, year) ? (getZoneGenericName(side.zone) ?? entry.name) : entry.name;
}

/** "9:00 AM EST" for zones (the real abbreviation on that date), "9:00 AM in London (GMT)" for cities. */
function nineAmLabel(side: ConverterSide, abbreviation: string): string {
  return side.kind === 'zone' ? `9:00 AM ${abbreviation}` : `9:00 AM in ${side.label} (${abbreviation})`;
}

export function converterTitle(pair: ResolvedConverterPair): string {
  return pair.kind === 'zone'
    ? `${pair.fromSide.label} to ${pair.toSide.label} Converter`
    : `${pair.fromSide.label} to ${pair.toSide.label} Time Converter`;
}

/** Full <title>: the H1 plus the part a searcher needs to disambiguate. */
export function converterDocumentTitle(pair: ResolvedConverterPair): string {
  if (pair.kind === 'zone') {
    return fitTitle(
      fitTitle(`${converterTitle(pair)} – ${pair.fromSide.name} to ${pair.toSide.entry!.referenceLabel.split(' (')[0]}`, `${converterTitle(pair)} – Time Difference & Table`),
      `${converterTitle(pair)} – Time Difference`,
    );
  }
  return fitTitle(fitTitle(`${converterTitle(pair)} – Time Difference & Best Time to Call`, `${converterTitle(pair)} – Time Difference`), converterTitle(pair));
}

export function converterMetaDescription(pair: ResolvedConverterPair, now: number): string {
  const { fromSide: from, toSide: to } = pair;
  if (pair.kind === 'zone') {
    return `Convert ${from.label} to ${to.label}: live ${sideName(from, now)} and ${sideName(to, now)} clocks, a converter for any date, a DST-aware hourly table and the best hours to call.`;
  }
  return `Convert ${from.label} time to ${to.label} time: live clocks, the current difference with daylight saving applied, an hourly table and the best hours to call.`;
}

export function converterSubtitle(pair: ResolvedConverterPair, now: number): string {
  const { fromSide: from, toSide: to } = pair;
  if (pair.kind === 'zone') {
    const entry = to.entry!;
    const toSuffix = entry.kind === 'universal' ? '' : ` (${to.label}${entry.counterpart ? `/${entry.counterpart.toUpperCase()}` : ''})`;
    return `Convert time between ${from.name} (${from.label}) and ${sideName(to, now)}${toSuffix}.`;
  }
  return `Convert time between ${from.name} and ${to.name}.`;
}

/** Card text for "About" sections: what zone each side is on and whether it changes clocks. */
export function sideSummary(side: ConverterSide, now: number): string {
  if (side.kind === 'zone') return side.entry!.summary;
  const year = getZonedParts(now, side.zone).year;
  const region = getZoneRegionName(side.zone, now) ?? side.zone;
  const names = getZoneDisplayNames(side.zone, now);
  const label = getZoneLabel(side.zone, now);
  const dst = observesDST(side.zone, year)
    ? `It observes daylight saving time, switching between ${names.standard ?? 'standard time'} and ${names.daylight ?? 'daylight time'}, so conversions depend on the date.`
    : `It does not observe daylight saving time, so the offset is the same all year.`;
  return `${side.label} is on ${region} (IANA time zone ${side.zone}), currently ${label.abbreviation} (${label.offsetLabel}). ${dst}`;
}

export type ConversionRow = { fromLabel: string; toLabel: string; toDayShift: string };

/** Each whole hour of `date` (a calendar date in the source zone) converted to the target zone. */
export function conversionTable(pair: ResolvedConverterPair, date: CalendarDate): ConversionRow[] {
  const fromZone = pair.fromSide.zone;
  const toZone = pair.toSide.zone;
  const rows: ConversionRow[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const result = convertTime(fromZone, toZone, { ...date, hour, minute: 0 });
    // Skip the nonexistent hour on a spring-forward day rather than showing it twice.
    if (result.status === 'gap') continue;
    rows.push({
      fromLabel: formatTime(result.instant, fromZone, { seconds: false }),
      toLabel: formatTime(result.instant, toZone, { seconds: false }),
      toDayShift: dayShiftLabel(result.dayShift),
    });
  }
  return rows;
}

export type CallSlot = { fromLabel: string; toLabel: string; quality: 1 | 2 };

/** Anchor on the whole-hour zone so suggestions start on round hours where possible. */
function anchorZone(pair: ResolvedConverterPair, now: number): string {
  const fromZone = pair.fromSide.zone;
  const toZone = pair.toSide.zone;
  const fromWhole = getUTCOffset(fromZone, now) % 60 === 0;
  const toWhole = getUTCOffset(toZone, now) % 60 === 0;
  return fromWhole && !toWhole ? fromZone : toZone;
}

export function bestTimesToCall(pair: ResolvedConverterPair, now: number): { slots: CallSlot[]; anchorDateLabel: string } {
  const fromZone = pair.fromSide.zone;
  const toZone = pair.toSide.zone;
  const anchor = anchorZone(pair, now);
  const slots = suggestMeetingSlots({ zones: [fromZone, toZone], anchorZone: anchor, date: getZonedDate(now, anchor) });
  return {
    anchorDateLabel: formatDate(now, anchor, 'full'),
    slots: slots.map((slot) => ({
      fromLabel: formatTime(slot.start, fromZone, { seconds: false }),
      toLabel: formatTime(slot.start, toZone, { seconds: false }),
      quality: slot.quality,
    })),
  };
}

export type DifferencePeriodText = { range: string; sentence: string; current: boolean };

export function differencePeriods(pair: ResolvedConverterPair, now: number): DifferencePeriodText[] {
  const fromZone = pair.fromSide.zone;
  const toZone = pair.toSide.zone;
  const fromName = sideName(pair.fromSide, now);
  const toName = sideName(pair.toSide, now);
  const periods: DifferencePeriod[] = getDifferencePeriods(fromZone, toZone, now, 366);
  // Date a boundary in the zone whose clocks actually change there, so a UK switch reads as a UK date.
  const boundaryZone = (instant: number) => (getUTCOffset(fromZone, instant - 60_000) !== getUTCOffset(fromZone, instant) ? fromZone : toZone);
  const dateAt = (instant: number) => formatDate(instant, boundaryZone(instant), 'short');
  return periods.map((period, index) => {
    const label = `${getZoneLabel(fromZone, period.start).abbreviation} → ${getZoneLabel(toZone, period.start).abbreviation}`;
    const range =
      index === 0
        ? period.end
          ? `Now until ${dateAt(period.end)}`
          : 'All year'
        : period.end
          ? `${dateAt(period.start)} – ${dateAt(period.end)}`
          : `From ${dateAt(period.start)}`;
    const minutes = -period.differenceMinutes;
    const sentence =
      minutes === 0
        ? `${fromName} and ${toName} show the same time (${label}).`
        : `${fromName} is ${formatDuration(minutes)} ${minutes > 0 ? 'ahead of' : 'behind'} ${toName} (${label}).`;
    return { range, sentence, current: index === 0 };
  });
}

export function converterFaqs(pair: ResolvedConverterPair, now: number): FaqItem[] {
  const { fromSide: from, toSide: to } = pair;
  const fromZone = from.zone;
  const toZone = to.zone;
  const fromName = sideName(from, now);
  const toName = sideName(to, now);
  const date = getZonedDate(now, fromZone);
  const today = formatDate(now, fromZone, 'full');
  const nine = convertTime(fromZone, toZone, { ...date, hour: 9, minute: 0 });
  const nineShift = dayShiftLabel(nine.dayShift);
  const minutes = -getTimeDifference(fromZone, toZone, now);
  const toLabel = getZoneLabel(toZone, now);
  const fromLabel = getZoneLabel(fromZone, now);
  const periods = differencePeriods(pair, now);
  const items: FaqItem[] = [];

  items.push({
    question:
      pair.kind === 'zone'
        ? `What time is it in ${to.label} when it is 9 AM ${from.label}?`
        : `What time is it in ${to.label} when it is 9 AM in ${from.label}?`,
    answer: `On ${today}, ${nineAmLabel(from, fromLabel.abbreviation)} is ${formatTime(nine.instant, toZone, { seconds: false })} ${getZoneLabel(toZone, nine.instant).abbreviation}${nineShift ? ` (${nineShift})` : ''} in ${toName}.`,
  });

  items.push({
    question: `How many hours ahead is ${from.label} from ${to.label}?`,
    answer:
      periods.length > 1
        ? `It depends on the time of year because of daylight saving time. ${periods
            .slice(0, 2)
            .map((p) => `${p.range}: ${p.sentence}`)
            .join(' ')}`
        : minutes === 0
          ? `${fromName} and ${toName} currently show the same time.`
          : `${fromName} is ${formatDuration(minutes)} ${minutes > 0 ? 'ahead of' : 'behind'} ${toName} (${fromLabel.abbreviation} vs ${toLabel.abbreviation}).`,
  });

  const toSeasonal = observesDST(toZone, date.year);
  if (to.kind === 'zone' && to.entry!.kind === 'standard' && to.entry!.counterpart && toSeasonal) {
    const entry = to.entry!;
    items.push({
      question: `Should I use ${to.label} or ${entry.counterpart!.toUpperCase()}?`,
      answer: `${toName} is on ${toLabel.abbreviation} (${toLabel.offsetLabel}) on ${formatDate(now, toZone, 'full')}. Many people write “${to.label}” all year, but strictly ${to.label} means ${entry.name} (always ${formatOffset(entry.offsetMinutes)}). This converter follows the real local time in ${toName}, including daylight saving time.`,
    });
  }

  const call = bestTimesToCall(pair, now);
  if (call.slots.length > 0) {
    items.push({
      question: `What is the best time for a call between ${from.label} and ${to.label}?`,
      answer: `On ${call.anchorDateLabel}, good options are ${call.slots
        .map((s) => `${s.fromLabel} ${fromLabel.abbreviation} (${s.toLabel} ${toLabel.abbreviation})`)
        .join(', ')}. ${call.slots[0]!.quality === 2 ? 'These fall within normal 9 AM–5 PM working hours in both places.' : 'There is no overlap of 9 AM–5 PM working hours, so these fall early or late for one side.'}`,
    });
  }

  for (const side of [from, to]) {
    const zone = side.zone;
    const seasonal = observesDST(zone, date.year);
    if (side.kind === 'zone') {
      const entry = side.entry!;
      items.push({
        question: `Does ${side.label} change for daylight saving time?`,
        answer: seasonal
          ? `The region changes: ${sideName(side, now)} switches between ${entry.kind === 'daylight' ? `${entry.counterpart?.toUpperCase()} and ${side.label}` : `${side.label} and ${entry.counterpart?.toUpperCase() ?? 'daylight time'}`}, so conversions depend on the date. ${side.label} itself always means ${formatOffset(entry.offsetMinutes)}.`
          : `No. ${side.label} stays at ${formatOffset(entry.offsetMinutes)} all year.`,
      });
    } else {
      const names = getZoneDisplayNames(zone, now);
      const label = getZoneLabel(zone, now);
      items.push({
        question: `Does ${side.label} observe daylight saving time?`,
        answer: seasonal
          ? `Yes. ${side.label} switches between ${names.standard ?? 'standard time'} and ${names.daylight ?? 'daylight time'} each year, so the difference with ${side === from ? to.label : from.label} changes on the dates listed above. Right now it is on ${label.abbreviation} (${label.offsetLabel}).`
          : `No. ${side.label} stays on ${label.abbreviation} (${label.offsetLabel}) all year.`,
      });
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Converter hub

export const CONVERTER_HUB_TITLE = 'Time Zone Converter';

export function converterHubDescription(): string {
  return `Convert a date and time between any two cities, time zones or UTC offsets, with daylight saving applied for that date. ${getZoneConverterPairs().length} time zone and ${getCityConverterPairs().length} city conversion pages.`;
}

export const CONVERTER_DST_NOTES = [
  {
    title: 'Rules are applied for the date you pick',
    text: 'Each side uses its IANA time zone rules on the selected date, so a conversion in March can differ from one in November without you changing anything.',
  },
  {
    title: 'Abbreviations follow the real local time',
    text: 'Choosing EST, CST or PST converts to the region’s actual clock (EDT in summer). If you need the strict fixed offset, pick “EST (always UTC-5)” and the other fixed options.',
  },
  {
    title: 'Countries switch on different dates',
    text: 'The US moves clocks in March and November, Europe in late March and late October, and Australia in the opposite direction. The converter and the difference tables show every period.',
  },
  {
    title: 'Missing and repeated hours are explained',
    text: 'On the night clocks jump forward the skipped hour does not exist; on the night they fall back an hour happens twice. The result says which case applies instead of silently picking one.',
  },
] as const;

export function converterHubFaqs(): FaqItem[] {
  return [
    {
      question: 'Can I convert between two cities rather than time zones?',
      answer: 'Yes. Type a city in either field; the converter uses that city’s time zone. Popular city pairs also have their own pages with live clocks and hourly tables.',
    },
    {
      question: 'Does the converter account for daylight saving time?',
      answer: 'Yes. Every result is calculated for the date you enter using each zone’s rules for that date, including the weeks when only one side has switched.',
    },
    {
      question: 'What does “next day” or “previous day” in the result mean?',
      answer: 'The converted time falls on a different calendar date in the destination — for example 9 PM in New York is already 7:30 AM the next day in India.',
    },
    {
      question: 'Why do EST and Eastern Time give different results in summer?',
      answer: 'EST strictly means UTC-5, but the eastern United States is on EDT (UTC-4) from March to November. Choosing “Eastern Time – New York” follows the real clock; choosing “EST (always UTC-5)” keeps the fixed offset.',
    },
    {
      question: 'Which time zones and cities can I choose?',
      answer: 'Any of the cities on this site, every time zone abbreviation page, and every UTC offset in use. Start typing to search; the most common zones are listed when the field is empty.',
    },
  ];
}
