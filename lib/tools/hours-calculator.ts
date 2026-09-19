/** Time-card arithmetic for the hours calculator. Pure. */

export type ClockTime = { hour: number; minute: number };

/** "HH:MM" (from an <input type="time">) → ClockTime, or null. */
export function parseClockTime(value: string): ClockTime | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour <= 23 && minute <= 59 ? { hour, minute } : null;
}

export function toMinutes(time: ClockTime): number {
  return time.hour * 60 + time.minute;
}

/**
 * Minutes worked from `start` to `end`, minus an unpaid break. An end time at
 * or before the start is treated as the next day (a night shift).
 */
export function minutesBetween(start: ClockTime, end: ClockTime, breakMinutes = 0): number {
  let span = toMinutes(end) - toMinutes(start);
  if (span <= 0) span += 24 * 60;
  return Math.max(0, span - Math.max(0, breakMinutes));
}

export type ShiftRow = { start: string; end: string; breakMinutes: number };

export type ShiftResult = { minutes: number; valid: boolean };

export function shiftMinutes(row: ShiftRow): ShiftResult {
  const start = parseClockTime(row.start);
  const end = parseClockTime(row.end);
  if (!start || !end) return { minutes: 0, valid: false };
  return { minutes: minutesBetween(start, end, row.breakMinutes), valid: true };
}

export function totalMinutes(rows: ShiftRow[]): number {
  return rows.reduce((sum, row) => sum + shiftMinutes(row).minutes, 0);
}

/** 510 → "8.50" (decimal hours, two places). */
export function formatDecimalHours(minutes: number): string {
  return (minutes / 60).toFixed(2);
}

/** 510 → "8h 30m", 60 → "1h", 45 → "45m", 0 → "0m". */
export function formatHoursMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

/** Pay for `minutes` at an hourly rate, rounded to cents. */
export function payFor(minutes: number, hourlyRate: number): number {
  return Math.round((minutes / 60) * hourlyRate * 100) / 100;
}
