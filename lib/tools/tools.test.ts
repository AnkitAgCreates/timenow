import { describe, expect, it } from 'vitest';
import { addDays, calendarBreakdown, dateDifference, daysBetween, isValidCalendarDate, parseIsoDate, weekdaysBetween } from './date-difference';
import { formatDecimalHours, formatHoursMinutes, minutesBetween, parseClockTime, payFor, totalMinutes } from './hours-calculator';
import { militaryTable, parseFlexibleTime, spokenMilitary, to12Hour, to24Hour, toMilitary } from './military-time';
import { isoUtc, parseTimestamp, relativeTime, timestampToWallTime, toSeconds, wallTimeToTimestamp } from './unix-timestamp';

describe('date difference', () => {
  it('validates and parses ISO dates, including leap days', () => {
    expect(parseIsoDate('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 });
    expect(parseIsoDate('2023-02-29')).toBeNull();
    expect(parseIsoDate('2026-13-01')).toBeNull();
    expect(isValidCalendarDate({ year: 2026, month: 4, day: 31 })).toBe(false);
  });

  it('counts days, weeks, weekdays and the calendar breakdown', () => {
    const a = { year: 2026, month: 1, day: 1 };
    const b = { year: 2026, month: 12, day: 25 };
    expect(daysBetween(a, b)).toBe(358);
    expect(daysBetween(b, a)).toBe(-358);
    const diff = dateDifference(a, b);
    expect(diff.totalDays).toBe(358);
    expect(diff.weeks).toBe(51);
    expect(diff.remainingDays).toBe(1);
    expect(diff.breakdown).toEqual({ years: 0, months: 11, days: 24 });
    expect(diff.direction).toBe('forward');
    expect(diff.hours).toBe(358 * 24);
    // 2026-01-01 is a Thursday; Jan 1 – Jan 8 (exclusive) has 5 weekdays (Thu, Fri, Mon, Tue, Wed).
    expect(weekdaysBetween(a, { year: 2026, month: 1, day: 8 })).toBe(5);
    expect(weekdaysBetween(a, b) + diff.weekendDays).toBe(358);
  });

  it('includes the end date on request and crosses leap years', () => {
    const diff = dateDifference({ year: 2024, month: 2, day: 28 }, { year: 2024, month: 3, day: 1 }, true);
    expect(diff.totalDays).toBe(3); // Feb 28, Feb 29, Mar 1
    expect(calendarBreakdown({ year: 2024, month: 1, day: 31 }, { year: 2024, month: 3, day: 1 })).toEqual({ years: 0, months: 1, days: 1 });
    expect(calendarBreakdown({ year: 2020, month: 6, day: 15 }, { year: 2026, month: 3, day: 10 })).toEqual({ years: 5, months: 8, days: 23 });
    expect(addDays({ year: 2026, month: 12, day: 31 }, 1)).toEqual({ year: 2027, month: 1, day: 1 });
    expect(dateDifference(a1, a1).direction).toBe('same');
  });
});
const a1 = { year: 2026, month: 5, day: 5 };

describe('hours calculator', () => {
  it('parses time inputs and computes shifts, including overnight and breaks', () => {
    expect(parseClockTime('09:30')).toEqual({ hour: 9, minute: 30 });
    expect(parseClockTime('24:00')).toBeNull();
    expect(minutesBetween({ hour: 9, minute: 0 }, { hour: 17, minute: 30 }, 30)).toBe(480);
    expect(minutesBetween({ hour: 22, minute: 0 }, { hour: 6, minute: 0 })).toBe(480); // night shift
    expect(minutesBetween({ hour: 9, minute: 0 }, { hour: 9, minute: 0 })).toBe(24 * 60); // "same time" reads as a full day
  });

  it('totals rows, ignoring invalid ones, and formats hours and pay', () => {
    const rows = [
      { start: '09:00', end: '17:00', breakMinutes: 60 },
      { start: '10:00', end: '14:15', breakMinutes: 0 },
      { start: '', end: '12:00', breakMinutes: 0 },
    ];
    expect(totalMinutes(rows)).toBe(420 + 255);
    expect(formatDecimalHours(510)).toBe('8.50');
    expect(formatHoursMinutes(510)).toBe('8h 30m');
    expect(formatHoursMinutes(60)).toBe('1h');
    expect(formatHoursMinutes(45)).toBe('45m');
    expect(payFor(510, 20)).toBe(170);
    expect(payFor(100, 15.5)).toBe(25.83);
  });
});

describe('military time', () => {
  it('parses 12-hour, 24-hour and bare military inputs', () => {
    expect(parseFlexibleTime('2:30 pm')).toEqual({ hour: 14, minute: 30 });
    expect(parseFlexibleTime('12:00 AM')).toEqual({ hour: 0, minute: 0 });
    expect(parseFlexibleTime('12 pm')).toEqual({ hour: 12, minute: 0 });
    expect(parseFlexibleTime('1430')).toEqual({ hour: 14, minute: 30 });
    expect(parseFlexibleTime('0900')).toEqual({ hour: 9, minute: 0 });
    expect(parseFlexibleTime('23:59')).toEqual({ hour: 23, minute: 59 });
    expect(parseFlexibleTime('noon')).toEqual({ hour: 12, minute: 0 });
    expect(parseFlexibleTime('13 pm')).toBeNull();
    expect(parseFlexibleTime('25:00')).toBeNull();
  });

  it('formats every direction and reads times aloud', () => {
    const t = { hour: 14, minute: 30 };
    expect(toMilitary(t)).toBe('1430');
    expect(to24Hour(t)).toBe('14:30');
    expect(to12Hour(t)).toBe('2:30 PM');
    expect(to12Hour({ hour: 0, minute: 5 })).toBe('12:05 AM');
    expect(to12Hour({ hour: 12, minute: 0 })).toBe('12:00 PM');
    expect(spokenMilitary({ hour: 9, minute: 0 })).toBe('zero nine hundred hours');
    expect(spokenMilitary({ hour: 14, minute: 30 })).toBe('fourteen thirty hours');
    expect(spokenMilitary({ hour: 0, minute: 5 })).toBe('zero zero zero five hours');
    expect(spokenMilitary({ hour: 21, minute: 45 })).toBe('twenty-one forty-five hours');
    const table = militaryTable();
    expect(table.length).toBe(24);
    expect(table[0]).toEqual({ hour24: '00:00', military: '0000', hour12: '12:00 AM', spoken: 'zero zero hundred hours' });
    expect(table[13]!.hour12).toBe('1:00 PM');
  });
});

describe('unix timestamp', () => {
  it('detects seconds vs milliseconds and rejects garbage', () => {
    expect(parseTimestamp('1700000000')).toEqual({ instant: 1_700_000_000_000, unit: 'seconds' });
    expect(parseTimestamp('1700000000000')).toEqual({ instant: 1_700_000_000_000, unit: 'milliseconds' });
    expect(parseTimestamp('1700000000.5')).toEqual({ instant: 1_700_000_000_500, unit: 'seconds' });
    expect(parseTimestamp('-86400')).toEqual({ instant: -86_400_000, unit: 'seconds' });
    expect(parseTimestamp('1,700,000,000')).toEqual({ instant: 1_700_000_000_000, unit: 'seconds' });
    expect(parseTimestamp('abc')).toBeNull();
    expect(parseTimestamp('99999999999999999')).toBeNull();
  });

  it('converts both ways with DST-correct wall times', () => {
    expect(isoUtc(1_700_000_000_000)).toBe('2023-11-14T22:13:20.000Z');
    expect(toSeconds(1_700_000_000_999)).toBe(1_700_000_000);
    const parts = timestampToWallTime(1_700_000_000_000, 'Asia/Kolkata');
    expect([parts.year, parts.month, parts.day, parts.hour, parts.minute]).toEqual([2023, 11, 15, 3, 43]);
    // 9:00 in New York on 2026-07-04 is 13:00 UTC (EDT).
    expect(wallTimeToTimestamp({ year: 2026, month: 7, day: 4 }, { hour: 9, minute: 0 }, 'America/New_York')).toBe(Date.UTC(2026, 6, 4, 13, 0));
    // …and 14:00 UTC in January (EST).
    expect(wallTimeToTimestamp({ year: 2026, month: 1, day: 4 }, { hour: 9, minute: 0 }, 'America/New_York')).toBe(Date.UTC(2026, 0, 4, 14, 0));
  });

  it('describes relative time', () => {
    const now = 1_700_000_000_000;
    expect(relativeTime(now - 3 * 3_600_000, now)).toBe('3 hours ago');
    expect(relativeTime(now + 2 * 86_400_000, now)).toBe('in 2 days');
    expect(relativeTime(now - 1000, now)).toBe('just now');
    expect(relativeTime(now - 400 * 86_400_000, now)).toBe('1 year ago');
  });
});

describe('stopwatch', () => {
  it('formats centiseconds, minutes and hours', async () => {
    const { formatStopwatch, lapRows } = await import('./stopwatch');
    expect(formatStopwatch(0)).toBe('00:00.00');
    expect(formatStopwatch(83_450)).toBe('01:23.45');
    expect(formatStopwatch(3_723_450)).toBe('1:02:03.45');
    const rows = lapRows([30_000, 58_000, 90_000]);
    expect(rows.map((r) => r.index)).toEqual([3, 2, 1]);
    expect(rows.map((r) => r.lapMs)).toEqual([32_000, 28_000, 30_000]);
    expect(rows.find((r) => r.index === 2)!.fastest).toBe(true);
    expect(rows.find((r) => r.index === 3)!.slowest).toBe(true);
    expect(lapRows([10_000])[0]!.fastest).toBe(false);
  });
});

describe('alarm', () => {
  it('schedules the next occurrence in device-local time and fires once per minute', async () => {
    const { dueAlarms, formatAlarmTime, formatUntil, minuteKey, msUntilAlarm, parseAlarmTime } = await import('./alarm');
    expect(parseAlarmTime('07:30')).toBe(450);
    expect(parseAlarmTime('24:00')).toBeNull();
    const now = new Date(2026, 8, 19, 22, 15, 0); // local 22:15
    expect(msUntilAlarm(now, '22:20')).toBe(5 * 60_000);
    expect(msUntilAlarm(now, '07:30')).toBe((9 * 60 + 15) * 60_000); // tomorrow morning
    expect(formatUntil(5 * 60_000)).toBe('5 min');
    expect(formatUntil((9 * 60 + 15) * 60_000)).toBe('9 h 15 min');
    expect(formatUntil(20_000)).toBe('less than a minute');
    expect(minuteKey(now)).toBe('2026-09-19 22:15');
    const alarms = [
      { id: 'a', time: '22:15', label: 'Tea', enabled: true },
      { id: 'b', time: '22:15', label: 'Fired', enabled: true, lastFired: '2026-09-19 22:15' },
      { id: 'c', time: '22:15', label: 'Off', enabled: false },
      { id: 'd', time: '22:16', label: 'Later', enabled: true },
    ];
    expect(dueAlarms(alarms, now).map((a) => a.id)).toEqual(['a']);
    expect(formatAlarmTime('07:30')).toBe('7:30 AM');
    expect(formatAlarmTime('00:05')).toBe('12:05 AM');
    expect(formatAlarmTime('13:00', '24h')).toBe('13:00');
  });
});
