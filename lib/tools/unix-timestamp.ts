/** Unix timestamp ↔ date conversion. Pure; zone-aware parts come from the time engine. */
import { getZonedParts, wallTimeToInstant, type CalendarDate } from '@/lib/time';
import type { ClockTime } from './hours-calculator';

export type TimestampUnit = 'seconds' | 'milliseconds';

export type ParsedTimestamp = { instant: number; unit: TimestampUnit };

/**
 * Parse "1700000000", "1700000000000", "1700000000.5" or "-86400". Values
 * with more than 11 digits are treated as milliseconds (seconds would be
 * beyond the year 5000), which is how most APIs and logs differ.
 */
export function parseTimestamp(input: string): ParsedTimestamp | null {
  const raw = input.trim().replace(/[,_\s]/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  const digits = raw.replace(/^-/, '').split('.')[0]!.length;
  const unit: TimestampUnit = digits > 11 ? 'milliseconds' : 'seconds';
  const instant = unit === 'seconds' ? Math.round(value * 1000) : Math.round(value);
  if (Math.abs(instant) > 8.64e15) return null; // outside the ECMAScript date range
  return { instant, unit };
}

export function toSeconds(instant: number): number {
  return Math.floor(instant / 1000);
}

/** "2023-11-14T22:13:20.000Z". */
export function isoUtc(instant: number): string {
  return new Date(instant).toISOString();
}

/** Instant for a wall-clock date and time in a zone (DST-correct). */
export function wallTimeToTimestamp(date: CalendarDate, time: ClockTime, timeZone: string): number {
  return wallTimeToInstant({ ...date, hour: time.hour, minute: time.minute }, timeZone);
}

/** Wall-clock parts of an instant in a zone. */
export function timestampToWallTime(instant: number, timeZone: string) {
  return getZonedParts(instant, timeZone);
}

/** "3 hours ago", "in 2 days", "just now". */
export function relativeTime(instant: number, now: number): string {
  const diff = instant - now;
  const abs = Math.abs(diff);
  const units: Array<[number, string]> = [
    [365 * 86_400_000, 'year'],
    [30 * 86_400_000, 'month'],
    [86_400_000, 'day'],
    [3_600_000, 'hour'],
    [60_000, 'minute'],
    [1000, 'second'],
  ];
  if (abs < 5000) return 'just now';
  for (const [ms, name] of units) {
    if (abs >= ms) {
      const n = Math.floor(abs / ms);
      const label = `${n} ${name}${n === 1 ? '' : 's'}`;
      return diff < 0 ? `${label} ago` : `in ${label}`;
    }
  }
  return 'just now';
}

/** Well-known timestamps for the reference table. */
export const TIMESTAMP_LANDMARKS: Array<{ seconds: number; label: string }> = [
  { seconds: 0, label: 'The Unix epoch' },
  { seconds: 1_000_000_000, label: 'One billion seconds' },
  { seconds: 1_234_567_890, label: '1234567890' },
  { seconds: 1_500_000_000, label: '1.5 billion seconds' },
  { seconds: 2_000_000_000, label: 'Two billion seconds' },
  { seconds: 2_147_483_647, label: 'Largest signed 32-bit value (the "year 2038 problem")' },
];
