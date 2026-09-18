/**
 * Deterministic display formatting.
 *
 * Strings are assembled from numeric Intl parts rather than Intl's own
 * localized output, because ICU versions differ between Node and browsers
 * (e.g. U+202F vs a regular space before "AM"). Building the text ourselves
 * guarantees server and client render byte-identical strings.
 */
import { getUTCOffset, getZonedParts, type Instant, type ZonedParts } from './zone';

export type HourCycle = '12h' | '24h';

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const pad2 = (n: number) => String(n).padStart(2, '0');

type TimeFields = Pick<ZonedParts, 'hour' | 'minute' | 'second'>;

/** "10:24:38 AM" / "22:24:38" (or without seconds). */
export function formatTimeFields(
  fields: TimeFields,
  { hourCycle = '12h', seconds = true }: { hourCycle?: HourCycle; seconds?: boolean } = {},
): string {
  const tail = seconds ? `:${pad2(fields.second)}` : '';
  if (hourCycle === '24h') return `${pad2(fields.hour)}:${pad2(fields.minute)}${tail}`;
  const suffix = fields.hour < 12 ? 'AM' : 'PM';
  const h12 = fields.hour % 12 === 0 ? 12 : fields.hour % 12;
  return `${h12}:${pad2(fields.minute)}${tail} ${suffix}`;
}

/** Time of an instant in a zone. */
export function formatTime(
  instant: Instant,
  timeZone: string,
  options: { hourCycle?: HourCycle; seconds?: boolean } = {},
): string {
  return formatTimeFields(getZonedParts(instant, timeZone), options);
}

type DateFields = Pick<ZonedParts, 'year' | 'month' | 'day' | 'weekday'>;

export type DateStyle =
  /** Wednesday, September 16, 2026 */
  | 'full'
  /** Wed, Sep 16, 2026 */
  | 'medium'
  /** Wed, Sep 16 */
  | 'weekday-short'
  /** Sep 16, 2026 */
  | 'short'
  /** Sep 16 */
  | 'day-month';

export function formatDateFields(fields: DateFields, style: DateStyle = 'full'): string {
  const month = MONTHS[fields.month - 1] ?? '';
  const monthShort = MONTHS_SHORT[fields.month - 1] ?? '';
  switch (style) {
    case 'full':
      return `${WEEKDAYS[fields.weekday]}, ${month} ${fields.day}, ${fields.year}`;
    case 'medium':
      return `${WEEKDAYS_SHORT[fields.weekday]}, ${monthShort} ${fields.day}, ${fields.year}`;
    case 'weekday-short':
      return `${WEEKDAYS_SHORT[fields.weekday]}, ${monthShort} ${fields.day}`;
    case 'short':
      return `${monthShort} ${fields.day}, ${fields.year}`;
    case 'day-month':
      return `${monthShort} ${fields.day}`;
  }
}

export function formatDate(instant: Instant, timeZone: string, style: DateStyle = 'full'): string {
  return formatDateFields(getZonedParts(instant, timeZone), style);
}

/** "UTC+5:30", "UTC-6", "UTC+0". Uses ASCII hyphen-minus to match how people search. */
export function formatOffset(offsetMinutes: number, prefix = 'UTC'): string {
  const sign = offsetMinutes < 0 ? '-' : '+';
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return `${prefix}${sign}${hours}${minutes ? `:${pad2(minutes)}` : ''}`;
}

/** "UTC+05:30" — fixed-width form for tables and selects. */
export function formatOffsetPadded(offsetMinutes: number, prefix = 'UTC'): string {
  const sign = offsetMinutes < 0 ? '-' : '+';
  const abs = Math.abs(offsetMinutes);
  return `${prefix}${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
}

export function formatZoneOffset(timeZone: string, instant: Instant = Date.now()): string {
  return formatOffset(getUTCOffset(timeZone, instant));
}

/** "3 hours", "1 hour 30 minutes", "45 minutes", "0 minutes". */
export function formatDuration(totalMinutes: number): string {
  const abs = Math.abs(totalMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const parts: string[] = [];
  if (hours) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  if (minutes || !hours) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  return parts.join(' ');
}

/** "2h 45m" compact form. */
export function formatDurationCompact(totalMinutes: number): string {
  const abs = Math.abs(totalMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  if (!hours) return `${minutes}m`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

/** ISO-8601 with the zone's offset, e.g. "2026-09-16T22:24:38+05:30". */
export function toZonedISOString(instant: Instant, timeZone: string): string {
  const p = getZonedParts(instant, timeZone);
  const offset = getUTCOffset(timeZone, instant);
  const offsetText = offset === 0 ? 'Z' : formatOffsetPadded(offset, '');
  return `${String(p.year).padStart(4, '0')}-${pad2(p.month)}-${pad2(p.day)}T${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)}${offsetText}`;
}

/** Countdown display "HH:MM:SS" for a number of seconds (rounded up so 0.2s shows 00:00:01). */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${pad2(h)}:${pad2(m)}:${pad2(s % 60)}`;
}
