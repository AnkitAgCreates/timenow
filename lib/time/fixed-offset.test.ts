import { describe, expect, it } from 'vitest';
import { getZoneLabel } from './abbreviations';
import { getDSTState, observesDST } from './dst';
import { formatTime } from './format';
import {
  fixedOffsetZoneId,
  getNextTransition,
  getPreviousTransition,
  getUTCOffset,
  getZonedParts,
  isValidTimeZone,
  parseFixedOffsetZone,
  resolveWallTime,
} from './zone';

const utc = (iso: string) => Date.parse(iso);

describe('fixed-offset pseudo-zones', () => {
  it('round-trips ids and offsets, including half and quarter hours', () => {
    for (const minutes of [-720, -570, -210, -60, 0, 60, 330, 345, 525, 765, 840]) {
      expect(parseFixedOffsetZone(fixedOffsetZoneId(minutes))).toBe(minutes);
    }
    expect(fixedOffsetZoneId(330)).toBe('UTC+05:30');
    expect(fixedOffsetZoneId(-570)).toBe('UTC-09:30');
    expect(parseFixedOffsetZone('UTC')).toBeNull();
    expect(parseFixedOffsetZone('America/Chicago')).toBeNull();
    expect(parseFixedOffsetZone('UTC+5:30')).toBeNull();
  });

  it('are not IANA zones', () => {
    expect(isValidTimeZone('UTC+05:30')).toBe(false);
  });

  it('compute local time at the exact offset', () => {
    const instant = utc('2026-01-15T12:00:00Z');
    expect(getUTCOffset('UTC+05:30', instant)).toBe(330);
    expect(getZonedParts(instant, 'UTC+05:30')).toMatchObject({ year: 2026, month: 1, day: 15, hour: 17, minute: 30 });
    expect(formatTime(instant, 'UTC-09:30', { seconds: false })).toBe('2:30 AM');
    expect(getZonedParts(utc('2026-12-31T23:30:00Z'), 'UTC+14:00')).toMatchObject({ year: 2027, month: 1, day: 1, hour: 13, minute: 30 });
  });

  it('never change for daylight saving time', () => {
    expect(getDSTState('UTC-03:30', utc('2026-07-01T12:00:00Z'))).toMatchObject({ isDST: false, source: 'fixed', standardOffsetMinutes: -210 });
    expect(observesDST('UTC-03:30', 2026)).toBe(false);
    expect(getNextTransition('UTC+05:45', utc('2026-01-01T00:00:00Z'))).toBeNull();
    expect(getPreviousTransition('UTC+05:45', utc('2026-01-01T00:00:00Z'))).toBeNull();
  });

  it('show the offset as their label and resolve wall times exactly', () => {
    expect(getZoneLabel('UTC+05:45', utc('2026-01-01T00:00:00Z'))).toMatchObject({ abbreviation: 'UTC+5:45', verified: false });
    expect(resolveWallTime({ year: 2026, month: 3, day: 8, hour: 2, minute: 30 }, 'UTC-05:00')).toEqual({
      instant: utc('2026-03-08T07:30:00Z'),
      status: 'exact',
    });
  });
});
