/**
 * Core IANA time zone primitives built on Intl.DateTimeFormat.
 *
 * Every function takes explicit instants (epoch milliseconds or Date) and an
 * IANA zone id. Nothing here reads the host machine's local zone, so results
 * are identical on the server, in the browser and in tests.
 */

export const MINUTE_MS = 60_000;
export const HOUR_MS = 3_600_000;
export const DAY_MS = 86_400_000;

export type Instant = Date | number;

/** Calendar fields of an instant as observed in a specific time zone. */
export type ZonedParts = {
  year: number;
  /** 1–12 */
  month: number;
  /** 1–31 */
  day: number;
  /** 0–23 */
  hour: number;
  minute: number;
  second: number;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
};

/** A local wall-clock date and time without a zone attached. */
export type WallTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
};

export type CalendarDate = { year: number; month: number; day: number };

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getPartsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatterCache.set(timeZone, formatter);
  }
  return formatter;
}

export function toEpochMs(instant: Instant): number {
  return typeof instant === 'number' ? instant : instant.getTime();
}

/** Date.UTC that also handles years 0–99 correctly. */
export function utcMs(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): number {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, 0);
  return date.getTime();
}

/** Day of week (0 = Sunday) for a proleptic Gregorian calendar date. */
export function weekdayOf(year: number, month: number, day: number): number {
  return new Date(utcMs(year, month, day)).getUTCDay();
}

/**
 * True for IANA "Area/Location" ids (plus "UTC") that the runtime supports.
 *
 * ICU also accepts legacy abbreviation ids with inconsistent meanings —
 * "CST" resolves to America/Chicago (which observes CDT) while "EST" resolves
 * to America/Panama (which never does). Those are rejected here so an
 * abbreviation can never silently become a zone; abbreviations are modelled
 * explicitly in data/timezones.ts instead.
 */
export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone || (timeZone !== 'UTC' && !timeZone.includes('/'))) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Fixed-offset pseudo-zones such as "UTC+05:30" or "UTC-09:30".
 *
 * They are not IANA zones (isValidTimeZone rejects them) but every time
 * engine function accepts them, so a page can show the live time at an exact
 * UTC offset — including half- and quarter-hour offsets that have no fixed
 * Etc/GMT zone. They never change for daylight saving time.
 */
const FIXED_OFFSET_ZONE = /^UTC([+-])(\d{2}):(\d{2})$/;

export function fixedOffsetZoneId(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? '-' : '+';
  const abs = Math.abs(offsetMinutes);
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

/** Offset in minutes for a fixed-offset pseudo-zone id, or null for any other id. */
export function parseFixedOffsetZone(timeZone: string): number | null {
  const match = FIXED_OFFSET_ZONE.exec(timeZone);
  if (!match) return null;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === '-' ? -minutes : minutes;
}

/** Calendar fields for an instant in the given zone. */
export function getZonedParts(instant: Instant, timeZone: string): ZonedParts {
  const ms = toEpochMs(instant);
  const fixed = parseFixedOffsetZone(timeZone);
  if (fixed !== null) {
    const d = new Date(Math.floor(ms / 1000) * 1000 + fixed * MINUTE_MS);
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
  const values: Record<string, number> = {};
  for (const part of getPartsFormatter(timeZone).formatToParts(ms)) {
    if (part.type !== 'literal') values[part.type] = Number(part.value);
  }
  const year = values.year ?? 1970;
  const month = values.month ?? 1;
  const day = values.day ?? 1;
  // Some engines emit "24" for midnight even with h23; normalise defensively.
  const hour = (values.hour ?? 0) % 24;
  return {
    year,
    month,
    day,
    hour,
    minute: values.minute ?? 0,
    second: values.second ?? 0,
    weekday: weekdayOf(year, month, day),
  };
}

/**
 * UTC offset in minutes for a zone at an instant (east of Greenwich is
 * positive): Asia/Kolkata → 330, America/Chicago in January → -360.
 */
export function getUTCOffset(timeZone: string, instant: Instant = Date.now()): number {
  const fixed = parseFixedOffsetZone(timeZone);
  if (fixed !== null) return fixed;
  const ms = Math.floor(toEpochMs(instant) / 1000) * 1000;
  const p = getZonedParts(ms, timeZone);
  const wallAsUtc = utcMs(p.year, p.month, p.day, p.hour, p.minute, p.second);
  return Math.round((wallAsUtc - ms) / MINUTE_MS);
}

export type Disambiguation = 'compatible' | 'earlier' | 'later' | 'reject';

export type WallTimeResolution = {
  /** Resolved instant in epoch milliseconds. */
  instant: number;
  /**
   * `exact`   – the wall time exists exactly once.
   * `gap`     – the wall time was skipped (clocks sprang forward).
   * `overlap` – the wall time occurred twice (clocks fell back).
   */
  status: 'exact' | 'gap' | 'overlap';
};

/**
 * Resolve a local wall time in a zone to an instant.
 *
 * Follows Temporal's disambiguation semantics:
 * - `compatible` (default): gaps resolve forward by the gap length, overlaps
 *   resolve to the earlier instant.
 * - `earlier` / `later`: pick the earlier/later interpretation.
 * - `reject`: throw for gaps and overlaps.
 */
export function resolveWallTime(
  wall: WallTime,
  timeZone: string,
  disambiguation: Disambiguation = 'compatible',
): WallTimeResolution {
  const wallMs = utcMs(wall.year, wall.month, wall.day, wall.hour, wall.minute, wall.second ?? 0);
  const offsetBefore = getUTCOffset(timeZone, wallMs - DAY_MS);
  const offsetAfter = getUTCOffset(timeZone, wallMs + DAY_MS);

  const candidates = new Set<number>();
  for (const offset of [offsetBefore, offsetAfter]) {
    const instant = wallMs - offset * MINUTE_MS;
    if (getUTCOffset(timeZone, instant) === offset) candidates.add(instant);
  }
  const valid = [...candidates].sort((a, b) => a - b);

  if (valid.length === 1) return { instant: valid[0]!, status: 'exact' };

  if (valid.length > 1) {
    if (disambiguation === 'reject') throw new RangeError('Ambiguous local time (DST overlap)');
    const instant = disambiguation === 'later' ? valid[valid.length - 1]! : valid[0]!;
    return { instant, status: 'overlap' };
  }

  if (disambiguation === 'reject') throw new RangeError('Nonexistent local time (DST gap)');
  // In a gap, interpreting the wall time with the pre-transition offset lands
  // after the gap (moves forward); the post-transition offset lands before it.
  const offset = disambiguation === 'earlier' ? offsetAfter : offsetBefore;
  return { instant: wallMs - offset * MINUTE_MS, status: 'gap' };
}

/** Convenience wrapper returning only the resolved instant. */
export function wallTimeToInstant(
  wall: WallTime,
  timeZone: string,
  disambiguation: Disambiguation = 'compatible',
): number {
  return resolveWallTime(wall, timeZone, disambiguation).instant;
}

/** Calendar date (in the zone) of an instant. */
export function getZonedDate(instant: Instant, timeZone: string): CalendarDate {
  const { year, month, day } = getZonedParts(instant, timeZone);
  return { year, month, day };
}

/** Add whole days to a calendar date. */
export function addDays(date: CalendarDate, days: number): CalendarDate {
  const d = new Date(utcMs(date.year, date.month, date.day) + days * DAY_MS);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
  return utcMs(a.year, a.month, a.day) - utcMs(b.year, b.month, b.day);
}

export type OffsetTransition = {
  /** First instant (epoch ms) at which the new offset applies. */
  instant: number;
  offsetBefore: number;
  offsetAfter: number;
};

/**
 * Next change of UTC offset strictly after `from`, searching up to
 * `horizonDays` ahead. Returns null when the zone does not change offset
 * in that window.
 */
export function getNextTransition(
  timeZone: string,
  from: Instant = Date.now(),
  horizonDays = 400,
): OffsetTransition | null {
  if (parseFixedOffsetZone(timeZone) !== null) return null;
  const start = Math.floor(toEpochMs(from) / MINUTE_MS) * MINUTE_MS;
  const startOffset = getUTCOffset(timeZone, start);
  const end = start + horizonDays * DAY_MS;

  // Coarse scan first (no real-world offset regime is shorter than a week),
  // then a fine scan inside the first changed window, then a binary search.
  let lo = start;
  for (let coarse = Math.min(start + COARSE_STEP_MS, end); ; coarse = Math.min(coarse + COARSE_STEP_MS, end)) {
    if (getUTCOffset(timeZone, coarse) !== startOffset) {
      let fineLo = lo;
      for (let t = lo + FINE_STEP_MS; t <= coarse; t = Math.min(t + FINE_STEP_MS, coarse)) {
        if (getUTCOffset(timeZone, t) !== startOffset) {
          const instant = bisectTransition(timeZone, fineLo, t, startOffset);
          return { instant, offsetBefore: startOffset, offsetAfter: getUTCOffset(timeZone, instant) };
        }
        fineLo = t;
        if (t === coarse) break;
      }
    }
    if (coarse >= end) return null;
    lo = coarse;
  }
}

const COARSE_STEP_MS = 7 * DAY_MS;
const FINE_STEP_MS = 6 * HOUR_MS;

/** Minute-precision instant at which the offset stops being `offsetBefore`, given lo (old) < hi (new). */
function bisectTransition(timeZone: string, lo: number, hi: number, offsetBefore: number): number {
  let loMin = lo / MINUTE_MS;
  let hiMin = hi / MINUTE_MS;
  while (hiMin - loMin > 1) {
    const mid = Math.floor((loMin + hiMin) / 2);
    if (getUTCOffset(timeZone, mid * MINUTE_MS) === offsetBefore) loMin = mid;
    else hiMin = mid;
  }
  return hiMin * MINUTE_MS;
}

/**
 * Most recent change of UTC offset at or before `from` (the transition that
 * started the period containing `from`), searching up to `horizonDays` back.
 * Returns null when the offset did not change in that window.
 */
export function getPreviousTransition(
  timeZone: string,
  from: Instant = Date.now(),
  horizonDays = 400,
): OffsetTransition | null {
  if (parseFixedOffsetZone(timeZone) !== null) return null;
  const end = Math.floor(toEpochMs(from) / MINUTE_MS) * MINUTE_MS;
  const endOffset = getUTCOffset(timeZone, end);
  const start = end - horizonDays * DAY_MS;

  let hi = end;
  for (let coarse = Math.max(end - COARSE_STEP_MS, start); ; coarse = Math.max(coarse - COARSE_STEP_MS, start)) {
    if (getUTCOffset(timeZone, coarse) !== endOffset) {
      let fineHi = hi;
      for (let t = hi - FINE_STEP_MS; t >= coarse; t = Math.max(t - FINE_STEP_MS, coarse)) {
        if (getUTCOffset(timeZone, t) !== endOffset) {
          // Binary search between t (old offset) and fineHi (current offset).
          let loMin = t / MINUTE_MS;
          let hiMin = fineHi / MINUTE_MS;
          while (hiMin - loMin > 1) {
            const mid = Math.floor((loMin + hiMin) / 2);
            if (getUTCOffset(timeZone, mid * MINUTE_MS) === endOffset) hiMin = mid;
            else loMin = mid;
          }
          return { instant: hiMin * MINUTE_MS, offsetBefore: getUTCOffset(timeZone, loMin * MINUTE_MS), offsetAfter: endOffset };
        }
        fineHi = t;
        if (t === coarse) break;
      }
    }
    if (coarse <= start) return null;
    hi = coarse;
  }
}

const yearTransitionsCache = new Map<string, OffsetTransition[]>();

/** All offset transitions for a zone within a calendar year (UTC bounds). */
export function getTransitionsInYear(timeZone: string, year: number): OffsetTransition[] {
  const key = `${timeZone}|${year}`;
  const cached = yearTransitionsCache.get(key);
  if (cached) return cached;
  const transitions: OffsetTransition[] = [];
  let cursor = utcMs(year, 1, 1) - 1;
  const end = utcMs(year + 1, 1, 1);
  while (cursor < end) {
    const next = getNextTransition(timeZone, cursor, Math.ceil((end - cursor) / DAY_MS));
    if (!next || next.instant >= end) break;
    transitions.push(next);
    cursor = next.instant;
  }
  yearTransitionsCache.set(key, transitions);
  return transitions;
}

/** Minutes since local midnight for an instant in a zone. */
export function minutesOfDay(instant: Instant, timeZone: string): number {
  const p = getZonedParts(instant, timeZone);
  return p.hour * 60 + p.minute;
}
