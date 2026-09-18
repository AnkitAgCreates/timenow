import { describe, expect, it } from 'vitest';
import { getStandardOffset, isDST, observesDST } from './dst';
import {
  addDays,
  getNextTransition,
  getPreviousTransition,
  getTransitionsInYear,
  getUTCOffset,
  getZonedParts,
  isValidTimeZone,
  resolveWallTime,
  wallTimeToInstant,
} from './zone';

const utc = (iso: string) => Date.parse(iso);

describe('test environment', () => {
  it('runs under a non-UTC host zone so local-time leaks would be caught', () => {
    expect(process.env.TZ).toBe('Pacific/Chatham');
    expect(new Date(utc('2026-01-15T00:00:00Z')).getTimezoneOffset()).not.toBe(0);
  });
});

describe('getUTCOffset', () => {
  it('IST is UTC+5:30 all year with no DST', () => {
    expect(getUTCOffset('Asia/Kolkata', utc('2026-01-15T12:00:00Z'))).toBe(330);
    expect(getUTCOffset('Asia/Kolkata', utc('2026-07-15T12:00:00Z'))).toBe(330);
    expect(isDST('Asia/Kolkata', utc('2026-07-15T12:00:00Z'))).toBe(false);
    expect(observesDST('Asia/Kolkata', 2026)).toBe(false);
  });

  it('UTC is always 0', () => {
    expect(getUTCOffset('UTC', utc('2026-01-15T12:00:00Z'))).toBe(0);
    expect(getUTCOffset('UTC', utc('2026-07-15T12:00:00Z'))).toBe(0);
    expect(observesDST('UTC', 2026)).toBe(false);
  });

  it('America/New_York: EST (UTC-5) in winter, EDT (UTC-4) in summer', () => {
    expect(getUTCOffset('America/New_York', utc('2026-01-15T12:00:00Z'))).toBe(-300);
    expect(getUTCOffset('America/New_York', utc('2026-07-15T12:00:00Z'))).toBe(-240);
    expect(isDST('America/New_York', utc('2026-01-15T12:00:00Z'))).toBe(false);
    expect(isDST('America/New_York', utc('2026-07-15T12:00:00Z'))).toBe(true);
    expect(getStandardOffset('America/New_York', utc('2026-07-15T12:00:00Z'))).toBe(-300);
  });

  it('America/Chicago: CST (UTC-6) in winter, CDT (UTC-5) in summer', () => {
    expect(getUTCOffset('America/Chicago', utc('2026-01-15T12:00:00Z'))).toBe(-360);
    expect(getUTCOffset('America/Chicago', utc('2026-07-15T12:00:00Z'))).toBe(-300);
    expect(isDST('America/Chicago', utc('2026-07-15T12:00:00Z'))).toBe(true);
  });

  it('America/Los_Angeles: PST (UTC-8) in winter, PDT (UTC-7) in summer', () => {
    expect(getUTCOffset('America/Los_Angeles', utc('2026-01-15T12:00:00Z'))).toBe(-480);
    expect(getUTCOffset('America/Los_Angeles', utc('2026-07-15T12:00:00Z'))).toBe(-420);
  });

  it('southern hemisphere DST: Sydney is on AEDT in January', () => {
    expect(getUTCOffset('Australia/Sydney', utc('2026-01-15T00:00:00Z'))).toBe(660);
    expect(getUTCOffset('Australia/Sydney', utc('2026-07-15T00:00:00Z'))).toBe(600);
    expect(getStandardOffset('Australia/Sydney', utc('2026-01-15T00:00:00Z'))).toBe(600);
    expect(isDST('Australia/Sydney', utc('2026-01-15T00:00:00Z'))).toBe(true);
  });

  it('Mexico City abolished DST in 2022 and stays on UTC-6', () => {
    expect(observesDST('America/Mexico_City', 2022)).toBe(true);
    expect(observesDST('America/Mexico_City', 2026)).toBe(false);
    expect(getUTCOffset('America/Mexico_City', utc('2026-07-15T12:00:00Z'))).toBe(-360);
  });

  it('Phoenix and Regina do not observe DST', () => {
    expect(observesDST('America/Phoenix', 2026)).toBe(false);
    expect(getUTCOffset('America/Phoenix', utc('2026-07-15T12:00:00Z'))).toBe(-420);
    expect(observesDST('America/Regina', 2026)).toBe(false);
    expect(getUTCOffset('America/Regina', utc('2026-07-15T12:00:00Z'))).toBe(-360);
  });
});

describe('DST transition boundaries (2026)', () => {
  it('New York springs forward at 2:00 EST on March 8 (07:00 UTC)', () => {
    expect(getUTCOffset('America/New_York', utc('2026-03-08T06:59:59Z'))).toBe(-300);
    expect(getUTCOffset('America/New_York', utc('2026-03-08T07:00:00Z'))).toBe(-240);
    expect(getNextTransition('America/New_York', utc('2026-01-01T00:00:00Z'))).toEqual({
      instant: utc('2026-03-08T07:00:00Z'),
      offsetBefore: -300,
      offsetAfter: -240,
    });
  });

  it('New York falls back at 2:00 EDT on November 1 (06:00 UTC)', () => {
    expect(getUTCOffset('America/New_York', utc('2026-11-01T05:59:59Z'))).toBe(-240);
    expect(getUTCOffset('America/New_York', utc('2026-11-01T06:00:00Z'))).toBe(-300);
    expect(getNextTransition('America/New_York', utc('2026-09-16T12:00:00Z'))?.instant).toBe(utc('2026-11-01T06:00:00Z'));
  });

  it('Chicago and Los Angeles transition at 2:00 local time', () => {
    expect(getTransitionsInYear('America/Chicago', 2026).map((t) => t.instant)).toEqual([
      utc('2026-03-08T08:00:00Z'),
      utc('2026-11-01T07:00:00Z'),
    ]);
    expect(getTransitionsInYear('America/Los_Angeles', 2026).map((t) => t.instant)).toEqual([
      utc('2026-03-08T10:00:00Z'),
      utc('2026-11-01T09:00:00Z'),
    ]);
  });

  it('London switches at 01:00 UTC on the last Sundays of March and October', () => {
    expect(getTransitionsInYear('Europe/London', 2026).map((t) => t.instant)).toEqual([
      utc('2026-03-29T01:00:00Z'),
      utc('2026-10-25T01:00:00Z'),
    ]);
  });

  it('finds the previous transition at or before an instant', () => {
    expect(getPreviousTransition('America/New_York', utc('2026-09-16T12:00:00Z'))).toEqual({
      instant: utc('2026-03-08T07:00:00Z'),
      offsetBefore: -300,
      offsetAfter: -240,
    });
    expect(getPreviousTransition('America/New_York', utc('2026-03-08T07:00:00Z'))?.instant).toBe(utc('2026-03-08T07:00:00Z'));
    expect(getPreviousTransition('Asia/Kolkata', utc('2026-09-16T12:00:00Z'))).toBeNull();
  });

  it('zones without DST have no transitions', () => {
    expect(getNextTransition('Asia/Kolkata', utc('2026-01-01T00:00:00Z'))).toBeNull();
    expect(getNextTransition('UTC', utc('2026-01-01T00:00:00Z'))).toBeNull();
  });
});

describe('resolveWallTime', () => {
  it('resolves ordinary wall times exactly', () => {
    expect(resolveWallTime({ year: 2026, month: 9, day: 16, hour: 22, minute: 0 }, 'Asia/Kolkata')).toEqual({
      instant: utc('2026-09-16T16:30:00Z'),
      status: 'exact',
    });
  });

  it('moves nonexistent spring-forward times forward (compatible)', () => {
    const wall = { year: 2026, month: 3, day: 8, hour: 2, minute: 30 };
    expect(resolveWallTime(wall, 'America/New_York')).toEqual({ instant: utc('2026-03-08T07:30:00Z'), status: 'gap' });
    expect(wallTimeToInstant(wall, 'America/New_York', 'earlier')).toBe(utc('2026-03-08T06:30:00Z'));
    expect(() => resolveWallTime(wall, 'America/New_York', 'reject')).toThrow(RangeError);
  });

  it('resolves repeated fall-back times to the earlier instant by default', () => {
    const wall = { year: 2026, month: 11, day: 1, hour: 1, minute: 30 };
    expect(resolveWallTime(wall, 'America/New_York')).toEqual({ instant: utc('2026-11-01T05:30:00Z'), status: 'overlap' });
    expect(wallTimeToInstant(wall, 'America/New_York', 'later')).toBe(utc('2026-11-01T06:30:00Z'));
  });
});

describe('calendar helpers', () => {
  it('handles leap years and year boundaries', () => {
    expect(addDays({ year: 2028, month: 2, day: 28 }, 1)).toEqual({ year: 2028, month: 2, day: 29 });
    expect(addDays({ year: 2027, month: 2, day: 28 }, 1)).toEqual({ year: 2027, month: 3, day: 1 });
    expect(addDays({ year: 2026, month: 12, day: 31 }, 1)).toEqual({ year: 2027, month: 1, day: 1 });
  });

  it('computes zoned parts including weekday', () => {
    expect(getZonedParts(utc('2026-09-16T16:54:38Z'), 'Asia/Kolkata')).toEqual({
      year: 2026,
      month: 9,
      day: 16,
      hour: 22,
      minute: 24,
      second: 38,
      weekday: 3,
    });
  });

  it('validates zone ids and rejects abbreviation ids', () => {
    expect(isValidTimeZone('America/Chicago')).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('Not/AZone')).toBe(false);
    // ICU accepts these with inconsistent meanings, so they must be rejected.
    expect(isValidTimeZone('CST')).toBe(false);
    expect(isValidTimeZone('EST')).toBe(false);
    expect(isValidTimeZone('IST')).toBe(false);
  });

  it('documents why abbreviations must never be passed to Intl', () => {
    const july = Date.parse('2026-07-01T12:00:00Z');
    // "CST" is silently treated as Chicago (on CDT in July) …
    expect(getUTCOffset('CST', july)).toBe(-300);
    // … while "EST" is treated as Panama (no DST).
    expect(getUTCOffset('EST', july)).toBe(-300);
  });
});
