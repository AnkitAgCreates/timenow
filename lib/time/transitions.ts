import { getZoneLabel } from './abbreviations';
import { getDSTState } from './dst';
import { getTimeDifference } from './difference';
import { formatDateFields, formatTimeFields } from './format';
import {
  DAY_MS,
  MINUTE_MS,
  getNextTransition,
  getTransitionsInYear,
  toEpochMs,
  type Instant,
  type OffsetTransition,
  type ZonedParts,
} from './zone';

export type TransitionInfo = {
  instant: number;
  offsetBefore: number;
  offsetAfter: number;
  /** dst-start/dst-end: clocks move into/out of DST. offset-change: anything else (incl. permanent changes, backward seasonal shifts). */
  kind: 'dst-start' | 'dst-end' | 'offset-change';
  /** Local clock reading at the moment of change, before it jumps: "2:00 AM". */
  localTimeBefore: string;
  /** Local clock reading right after the change: "3:00 AM". */
  localTimeAfter: string;
  /** "Sunday, March 8, 2026" (local date of the change). */
  dateLabel: string;
  /** "Mar 8, 2026" */
  dateShort: string;
  abbreviationBefore: string;
  abbreviationAfter: string;
};

function wallAtOffset(instant: number, offsetMinutes: number): ZonedParts {
  const d = new Date(instant + offsetMinutes * MINUTE_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    weekday: d.getUTCDay(),
  };
}

/** Next offset change for a zone with human-readable local details, or null if none within ~13 months. */
export function getNextTransitionInfo(timeZone: string, from: Instant = Date.now()): TransitionInfo | null {
  const transition = getNextTransition(timeZone, from);
  return transition ? toTransitionInfo(timeZone, transition) : null;
}

/** Human-readable local details for a known offset transition. */
export function toTransitionInfo(timeZone: string, transition: OffsetTransition): TransitionInfo {
  const { instant, offsetBefore, offsetAfter } = transition;
  const before = wallAtOffset(instant, offsetBefore);
  const after = wallAtOffset(instant, offsetAfter);
  const wasDST = getDSTState(timeZone, instant - MINUTE_MS).isDST;
  const nowDST = getDSTState(timeZone, instant).isDST;

  let kind: TransitionInfo['kind'] = 'offset-change';
  if (!wasDST && nowDST) kind = 'dst-start';
  else if (wasDST && !nowDST) kind = 'dst-end';

  return {
    instant,
    offsetBefore,
    offsetAfter,
    kind,
    localTimeBefore: formatTimeFields(before, { seconds: false }),
    localTimeAfter: formatTimeFields(after, { seconds: false }),
    dateLabel: formatDateFields(before, 'full'),
    dateShort: formatDateFields(before, 'short'),
    abbreviationBefore: getZoneLabel(timeZone, instant - MINUTE_MS).abbreviation,
    abbreviationAfter: getZoneLabel(timeZone, instant).abbreviation,
  };
}

/** DST start and end for a zone in a calendar year (either may be null). */
export function getDstTransitionsInYear(timeZone: string, year: number): { start: TransitionInfo | null; end: TransitionInfo | null } {
  const infos = getTransitionsInYear(timeZone, year).map((t) => toTransitionInfo(timeZone, t));
  return {
    start: infos.find((info) => info.kind === 'dst-start') ?? null,
    end: infos.find((info) => info.kind === 'dst-end') ?? null,
  };
}

/** "Clocks go forward 1 hour at 2:00 AM on Sunday, March 8, 2026 (PST → PDT)." */
export function describeTransition(info: TransitionInfo): string {
  const shift = Math.abs(info.offsetAfter - info.offsetBefore);
  const amount = shift % 60 === 0 ? `${shift / 60} hour${shift === 60 ? '' : 's'}` : `${shift} minutes`;
  const direction = info.offsetAfter > info.offsetBefore ? 'forward' : 'back';
  return `Clocks go ${direction} ${amount} at ${info.localTimeBefore} on ${info.dateLabel} (${info.abbreviationBefore} → ${info.abbreviationAfter}).`;
}

export type DifferencePeriod = {
  start: number;
  /** Exclusive end, or null if the period continues past the window. */
  end: number | null;
  /** Minutes `toZone` is ahead of `fromZone`. */
  differenceMinutes: number;
};

/**
 * Split a window into periods with a constant difference between two zones.
 * Used to explain how, e.g., IST–Eastern changes from 9h30m to 10h30m.
 */
export function getDifferencePeriods(fromZone: string, toZone: string, start: Instant = Date.now(), days = 366): DifferencePeriod[] {
  const startMs = toEpochMs(start);
  const endMs = startMs + days * DAY_MS;
  const changes = new Set<number>();

  for (const zone of new Set([fromZone, toZone])) {
    let cursor = startMs;
    for (;;) {
      const remainingDays = Math.ceil((endMs - cursor) / DAY_MS);
      if (remainingDays <= 0) break;
      const next = getNextTransition(zone, cursor, remainingDays);
      if (!next || next.instant >= endMs) break;
      changes.add(next.instant);
      cursor = next.instant;
    }
  }

  const boundaries = [...changes].sort((a, b) => a - b);
  const periods: DifferencePeriod[] = [];
  let periodStart = startMs;
  for (const boundary of [...boundaries, null]) {
    const differenceMinutes = getTimeDifference(fromZone, toZone, periodStart);
    const last = periods[periods.length - 1];
    if (last && last.differenceMinutes === differenceMinutes) last.end = boundary;
    else periods.push({ start: periodStart, end: boundary, differenceMinutes });
    if (boundary === null) break;
    periodStart = boundary;
  }
  return periods;
}
