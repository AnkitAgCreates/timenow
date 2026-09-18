/** Data-driven content for converter pages. All values are for explicit dates. */
import type { ResolvedConverterPair } from '@/lib/data/converters';
import type { FaqItem } from '@/lib/seo/jsonld';
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
import type { TimeZoneEntry } from '@/types/data';

/** "Eastern Time" for DST-observing regions, otherwise the entry's own name ("India Standard Time"). */
export function sideName(entry: TimeZoneEntry, now: number): string {
  const year = getZonedParts(now, entry.referenceZone).year;
  return observesDST(entry.referenceZone, year) ? (getZoneGenericName(entry.referenceZone) ?? entry.name) : entry.name;
}

export function converterTitle(pair: ResolvedConverterPair): string {
  return `${pair.fromZone.abbreviation} to ${pair.toZone.abbreviation} Converter`;
}

export function converterMetaDescription(pair: ResolvedConverterPair, now: number): string {
  const { fromZone: from, toZone: to } = pair;
  return `Convert ${from.abbreviation} to ${to.abbreviation}: live ${sideName(from, now)} and ${sideName(to, now)} clocks, a converter for any date and time, a daylight-saving-aware conversion table and the best hours to call.`;
}

export type ConversionRow = { fromLabel: string; toLabel: string; toDayShift: string };

/** Each whole hour of `date` (a calendar date in the source zone) converted to the target zone. */
export function conversionTable(pair: ResolvedConverterPair, date: CalendarDate): ConversionRow[] {
  const fromZone = pair.fromZone.referenceZone;
  const toZone = pair.toZone.referenceZone;
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
  const fromZone = pair.fromZone.referenceZone;
  const toZone = pair.toZone.referenceZone;
  const fromWhole = getUTCOffset(fromZone, now) % 60 === 0;
  const toWhole = getUTCOffset(toZone, now) % 60 === 0;
  return fromWhole && !toWhole ? fromZone : toZone;
}

export function bestTimesToCall(pair: ResolvedConverterPair, now: number): { slots: CallSlot[]; anchorDateLabel: string } {
  const fromZone = pair.fromZone.referenceZone;
  const toZone = pair.toZone.referenceZone;
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
  const fromZone = pair.fromZone.referenceZone;
  const toZone = pair.toZone.referenceZone;
  const fromName = sideName(pair.fromZone, now);
  const toName = sideName(pair.toZone, now);
  const periods: DifferencePeriod[] = getDifferencePeriods(fromZone, toZone, now, 366);
  return periods.map((period, index) => {
    const label = `${getZoneLabel(fromZone, period.start).abbreviation} → ${getZoneLabel(toZone, period.start).abbreviation}`;
    const range =
      index === 0
        ? period.end
          ? `Now until ${formatDate(period.end, toZone, 'short')}`
          : 'All year'
        : period.end
          ? `${formatDate(period.start, toZone, 'short')} – ${formatDate(period.end, toZone, 'short')}`
          : `From ${formatDate(period.start, toZone, 'short')}`;
    const minutes = -period.differenceMinutes;
    const sentence =
      minutes === 0
        ? `${fromName} and ${toName} show the same time (${label}).`
        : `${fromName} is ${formatDuration(minutes)} ${minutes > 0 ? 'ahead of' : 'behind'} ${toName} (${label}).`;
    return { range, sentence, current: index === 0 };
  });
}

export function converterFaqs(pair: ResolvedConverterPair, now: number): FaqItem[] {
  const { fromZone: from, toZone: to } = pair;
  const fromZone = from.referenceZone;
  const toZone = to.referenceZone;
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
    question: `What time is it in ${to.abbreviation} when it is 9 AM ${from.abbreviation}?`,
    answer: `On ${today}, 9:00 AM ${fromLabel.abbreviation} is ${formatTime(nine.instant, toZone, { seconds: false })} ${getZoneLabel(toZone, nine.instant).abbreviation}${nineShift ? ` (${nineShift})` : ''} in ${toName}.`,
  });

  items.push({
    question: `How many hours ahead is ${from.abbreviation} from ${to.abbreviation}?`,
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
  if (to.kind === 'standard' && to.counterpart && toSeasonal) {
    items.push({
      question: `Should I use ${to.abbreviation} or ${to.counterpart.toUpperCase()}?`,
      answer: `${toName} is on ${toLabel.abbreviation} (${toLabel.offsetLabel}) on ${formatDate(now, toZone, 'full')}. Many people write “${to.abbreviation}” all year, but strictly ${to.abbreviation} means ${to.name} (always ${formatOffset(to.offsetMinutes)}). This converter follows the real local time in ${toName}, including daylight saving time.`,
    });
  }

  const call = bestTimesToCall(pair, now);
  if (call.slots.length > 0) {
    items.push({
      question: `What is the best time for a call between ${from.abbreviation} and ${to.abbreviation}?`,
      answer: `On ${call.anchorDateLabel}, good options are ${call.slots
        .map((s) => `${s.fromLabel} ${fromLabel.abbreviation} (${s.toLabel} ${toLabel.abbreviation})`)
        .join(', ')}. ${call.slots[0]!.quality === 2 ? 'These fall within normal 9 AM–5 PM working hours in both places.' : 'There is no overlap of 9 AM–5 PM working hours, so these fall early or late for one side.'}`,
    });
  }

  for (const entry of [from, to]) {
    const zone = entry.referenceZone;
    items.push({
      question: `Does ${entry.abbreviation} change for daylight saving time?`,
      answer: observesDST(zone, date.year)
        ? `The region changes: ${sideName(entry, now)} switches between ${entry.kind === 'daylight' ? `${entry.counterpart?.toUpperCase()} and ${entry.abbreviation}` : `${entry.abbreviation} and ${entry.counterpart?.toUpperCase() ?? 'daylight time'}`}, so conversions depend on the date. ${entry.abbreviation} itself always means ${formatOffset(entry.offsetMinutes)}.`
        : `No. ${entry.abbreviation} stays at ${formatOffset(entry.offsetMinutes)} all year.`,
    });
  }

  return items;
}
