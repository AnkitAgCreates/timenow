/**
 * Daylight saving time classification.
 *
 * Intl exposes only the total UTC offset, not whether part of it is DST, so
 * the classification is derived in two layers:
 *
 * 1. **Zone metadata** (lib/time/zone-metadata.ts). Each zone's eras state the
 *    standard offset, the daylight offset and any backward seasonal shift.
 *    An offset matching one of those labels is classified directly. This
 *    handles rule changes (Mexico 2022, Yukon 2020) and backward shifts
 *    (Morocco during Ramadan) that no offset heuristic can.
 *
 * 2. **Transition structure** for zones without metadata, or offsets the
 *    metadata doesn't describe. The period containing the instant is found
 *    from the actual offset changes around it (±400 days):
 *    - no change on either side          → fixed offset, standard time;
 *    - no change on one side             → an open-ended regime such as a
 *                                          permanent offset change (Turkey 2016),
 *                                          so standard time, not DST;
 *    - bounded on both sides             → a seasonal regime. The higher of
 *                                          the alternating offsets is treated
 *                                          as DST, the convention of ICU's
 *                                          rearguard tz data. Zones with
 *                                          backward shifts need metadata.
 *
 * Neither layer uses a calendar year's minimum offset.
 */
import { getZoneEra, type ZoneTimeLabel } from './zone-metadata';
import {
  HOUR_MS,
  getNextTransition,
  getPreviousTransition,
  getTransitionsInYear,
  getUTCOffset,
  parseFixedOffsetZone,
  toEpochMs,
  utcMs,
  type Instant,
} from './zone';

export type SeasonalShift = 'none' | 'forward' | 'backward';

export type DSTState = {
  offsetMinutes: number;
  /** The zone's standard (base) offset in force at this instant. */
  standardOffsetMinutes: number;
  /** Clocks are moved forward from standard time. */
  isDST: boolean;
  /** forward = DST; backward = temporary shift behind standard (e.g. Morocco during Ramadan). */
  seasonalShift: SeasonalShift;
  /**
   * metadata    – classified from explicit zone rules
   * transitions – inferred from the offset changes around the instant
   * fixed       – no offset change within ±400 days
   */
  source: 'metadata' | 'transitions' | 'fixed';
  /** The metadata label matching the offset, when classified from metadata. */
  label?: ZoneTimeLabel;
};

const HORIZON_DAYS = 400;
/** Open-ended periods can't be bounded exactly, so their cached result is reused for an hour. */
const OPEN_ENDED_REUSE_MS = HOUR_MS;
const MAX_CACHED_PERIODS = 32;

type CachedPeriod = { validFrom: number; validTo: number; state: DSTState };
const periodCache = new Map<string, CachedPeriod[]>();

function inferFromTransitions(timeZone: string, ms: number, offset: number): DSTState {
  const cached = periodCache.get(timeZone)?.find((p) => ms >= p.validFrom && ms < p.validTo && p.state.offsetMinutes === offset);
  if (cached) return cached.state;

  const previous = getPreviousTransition(timeZone, ms, HORIZON_DAYS);
  const next = getNextTransition(timeZone, ms, HORIZON_DAYS);

  let state: DSTState;
  if (!previous && !next) {
    state = { offsetMinutes: offset, standardOffsetMinutes: offset, isDST: false, seasonalShift: 'none', source: 'fixed' };
  } else if (!previous || !next) {
    // One side has no change within the horizon: a lasting offset, not a seasonal excursion.
    state = { offsetMinutes: offset, standardOffsetMinutes: offset, isDST: false, seasonalShift: 'none', source: 'transitions' };
  } else {
    const standard = Math.min(offset, previous.offsetBefore, next.offsetAfter);
    const isDST = offset > standard;
    state = {
      offsetMinutes: offset,
      standardOffsetMinutes: standard,
      isDST,
      seasonalShift: isDST ? 'forward' : 'none',
      source: 'transitions',
    };
  }

  const entry: CachedPeriod = {
    validFrom: previous ? previous.instant : ms - OPEN_ENDED_REUSE_MS,
    validTo: next ? next.instant : ms + OPEN_ENDED_REUSE_MS,
    state,
  };
  const list = periodCache.get(timeZone) ?? [];
  list.push(entry);
  if (list.length > MAX_CACHED_PERIODS) list.shift();
  periodCache.set(timeZone, list);
  return state;
}

/** Full DST classification for a zone at an instant. */
export function getDSTState(timeZone: string, instant: Instant = Date.now()): DSTState {
  const ms = toEpochMs(instant);
  const fixed = parseFixedOffsetZone(timeZone);
  if (fixed !== null) {
    return { offsetMinutes: fixed, standardOffsetMinutes: fixed, isDST: false, seasonalShift: 'none', source: 'fixed' };
  }
  const offset = getUTCOffset(timeZone, ms);
  const era = getZoneEra(timeZone, ms);

  if (era) {
    const standardOffsetMinutes = era.standard.offsetMinutes;
    const base = { offsetMinutes: offset, standardOffsetMinutes, source: 'metadata' as const };
    if (offset === era.standard.offsetMinutes) return { ...base, isDST: false, seasonalShift: 'none', label: era.standard };
    if (era.daylight && offset === era.daylight.offsetMinutes) return { ...base, isDST: true, seasonalShift: 'forward', label: era.daylight };
    if (era.seasonalBackward && offset === era.seasonalBackward.offsetMinutes) {
      return { ...base, isDST: false, seasonalShift: 'backward', label: era.seasonalBackward };
    }
    // The zone's real offset isn't described by its metadata (rules changed); infer instead.
  }

  return inferFromTransitions(timeZone, ms, offset);
}

/** Whether daylight saving time (clocks moved forward) is in effect at the instant. */
export function isDST(timeZone: string, instant: Instant = Date.now()): boolean {
  return getDSTState(timeZone, instant).isDST;
}

/** The zone's standard offset in force at the instant, in minutes. */
export function getStandardOffset(timeZone: string, instant: Instant = Date.now()): number {
  return getDSTState(timeZone, instant).standardOffsetMinutes;
}

const observesCache = new Map<string, boolean>();

/**
 * Whether the zone is on daylight saving time at any point in the calendar
 * year: every offset period overlapping the year is classified.
 */
export function observesDST(timeZone: string, year: number): boolean {
  const key = `${timeZone}|${year}`;
  const cached = observesCache.get(key);
  if (cached !== undefined) return cached;
  const periodStarts = [utcMs(year, 1, 1), ...getTransitionsInYear(timeZone, year).map((t) => t.instant)];
  const result = periodStarts.some((start) => getDSTState(timeZone, start).isDST);
  observesCache.set(key, result);
  return result;
}
