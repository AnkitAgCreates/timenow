/** Calendar arithmetic for the date-difference tool. Pure, UTC-based (dates only, no zones). */
import type { CalendarDate } from '@/lib/time';

const DAY_MS = 86_400_000;

export function toUtcMs(date: CalendarDate): number {
  return Date.UTC(date.year, date.month - 1, date.day);
}

export function fromUtcMs(ms: number): CalendarDate {
  const d = new Date(ms);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function isValidCalendarDate(date: CalendarDate): boolean {
  if (!Number.isInteger(date.year) || !Number.isInteger(date.month) || !Number.isInteger(date.day)) return false;
  if (date.month < 1 || date.month > 12 || date.day < 1) return false;
  return fromUtcMs(toUtcMs(date)).day === date.day;
}

export function parseIsoDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  return isValidCalendarDate(date) ? date : null;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Signed number of days from `a` to `b` (b − a). */
export function daysBetween(a: CalendarDate, b: CalendarDate): number {
  return Math.round((toUtcMs(b) - toUtcMs(a)) / DAY_MS);
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  return fromUtcMs(toUtcMs(date) + days * DAY_MS);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(date: CalendarDate): number {
  return new Date(toUtcMs(date)).getUTCDay();
}

/** Mondays–Fridays in [a, b) — the end date is not counted, like `daysBetween`. */
export function weekdaysBetween(a: CalendarDate, b: CalendarDate): number {
  const [from, to] = toUtcMs(a) <= toUtcMs(b) ? [a, b] : [b, a];
  const total = daysBetween(from, to);
  const fullWeeks = Math.floor(total / 7);
  let count = fullWeeks * 5;
  let day = weekday(from);
  for (let i = 0; i < total - fullWeeks * 7; i++) {
    if (day !== 0 && day !== 6) count++;
    day = (day + 1) % 7;
  }
  return count;
}

export type CalendarBreakdown = { years: number; months: number; days: number };

/** `date` plus `n` calendar months, clamping the day to the target month (Jan 31 + 1 month → Feb 28/29). */
export function addMonths(date: CalendarDate, n: number): CalendarDate {
  const index = date.month - 1 + n;
  const year = date.year + Math.floor(index / 12);
  const month = ((index % 12) + 12) % 12 + 1;
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}

/**
 * Whole years, months and days from `a` to `b` (a ≤ b), the way people say
 * "2 years, 3 months and 5 days": the largest number of whole months that
 * fits, then the remaining days.
 */
export function calendarBreakdown(a: CalendarDate, b: CalendarDate): CalendarBreakdown {
  const [from, to] = toUtcMs(a) <= toUtcMs(b) ? [a, b] : [b, a];
  let totalMonths = (to.year - from.year) * 12 + (to.month - from.month);
  while (totalMonths > 0 && toUtcMs(addMonths(from, totalMonths)) > toUtcMs(to)) totalMonths -= 1;
  const days = daysBetween(addMonths(from, totalMonths), to);
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12, days };
}

export type DateDifference = {
  /** Absolute number of days; +1 when the end date is included. */
  totalDays: number;
  weeks: number;
  remainingDays: number;
  breakdown: CalendarBreakdown;
  weekdays: number;
  weekendDays: number;
  direction: 'forward' | 'backward' | 'same';
  hours: number;
  minutes: number;
};

export function dateDifference(a: CalendarDate, b: CalendarDate, includeEndDate = false): DateDifference {
  const signed = daysBetween(a, b);
  const base = Math.abs(signed);
  const totalDays = base + (includeEndDate ? 1 : 0);
  const [from, to] = signed >= 0 ? [a, b] : [b, a];
  const weekdays = weekdaysBetween(from, includeEndDate ? addDays(to, 1) : to);
  return {
    totalDays,
    weeks: Math.floor(totalDays / 7),
    remainingDays: totalDays % 7,
    breakdown: calendarBreakdown(from, to),
    weekdays,
    weekendDays: totalDays - weekdays,
    direction: signed === 0 ? 'same' : signed > 0 ? 'forward' : 'backward',
    hours: totalDays * 24,
    minutes: totalDays * 24 * 60,
  };
}
