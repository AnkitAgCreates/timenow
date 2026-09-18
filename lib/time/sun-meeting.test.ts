import { describe, expect, it } from 'vitest';
import { formatTime } from './format';
import { suggestMeetingSlots } from './meeting';
import { getSunTimes } from './sun';

import usno from './__fixtures__/sun-usno.json';

type UsnoCase = {
  name: string;
  latitude: number;
  longitude: number;
  date: string;
  timeZone: string;
  utcOffsetHours: number;
  sunrise: string | null;
  sunset: string | null;
};

/** USNO local "HH:MM" on `date` at a fixed UTC offset → epoch ms. */
function usnoInstant(date: string, time: string, utcOffsetHours: number): number {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return Date.UTC(y!, m! - 1, d!, hh!, mm!) - utcOffsetHours * 3_600_000;
}

// USNO rounds to the minute; the engine currently agrees to within 0.51 min on every case.
const TOLERANCE_MINUTES = 1;

describe('getSunTimes vs U.S. Naval Observatory reference data', () => {
  it('fixture provenance is recorded', () => {
    expect(usno.source).toContain('U.S. Naval Observatory');
    expect(usno.cases.length).toBeGreaterThanOrEqual(15);
  });

  it.each((usno.cases as UsnoCase[]).map((c) => [c.name, c] as const))('%s', (_name, c) => {
    const [year, month, day] = c.date.split('-').map(Number) as [number, number, number];
    const times = getSunTimes(c.latitude, c.longitude, { year, month, day }, c.timeZone);

    if (c.sunrise === null || c.sunset === null) {
      // USNO reports the Sun continuously above or below the horizon.
      expect(times.polar).not.toBeNull();
      expect(times.sunrise).toBeNull();
      expect(times.sunset).toBeNull();
      return;
    }

    expect(times.polar).toBeNull();
    const riseDiff = Math.abs(times.sunrise! - usnoInstant(c.date, c.sunrise, c.utcOffsetHours)) / 60_000;
    const setDiff = Math.abs(times.sunset! - usnoInstant(c.date, c.sunset, c.utcOffsetHours)) / 60_000;
    expect(riseDiff, `sunrise differs by ${riseDiff.toFixed(1)} min`).toBeLessThanOrEqual(TOLERANCE_MINUTES);
    expect(setDiff, `sunset differs by ${setDiff.toFixed(1)} min`).toBeLessThanOrEqual(TOLERANCE_MINUTES);
  });

  it('distinguishes polar day from polar night', () => {
    expect(getSunTimes(78.2232, 15.6267, { year: 2025, month: 6, day: 21 }, 'Arctic/Longyearbyen').polar).toBe('day');
    expect(getSunTimes(78.2232, 15.6267, { year: 2025, month: 12, day: 21 }, 'Arctic/Longyearbyen').polar).toBe('night');
  });

  it('returns events on the requested local date for far-east zones', () => {
    const times = getSunTimes(35.6762, 139.6503, { year: 2026, month: 9, day: 16 }, 'Asia/Tokyo');
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(times.sunrise!);
    expect(day).toBe('2026-09-16');
  });
});

describe('suggestMeetingSlots', () => {
  const zones = ['Asia/Kolkata', 'America/New_York'];

  it('India ↔ US East during EDT: New York mornings map to IST evenings', () => {
    const slots = suggestMeetingSlots({ zones, anchorZone: 'America/New_York', date: { year: 2026, month: 9, day: 16 } });
    expect(slots.map((s) => formatTime(s.start, 'America/New_York', { seconds: false }))).toEqual(['9:00 AM', '10:00 AM', '11:00 AM']);
    expect(slots.map((s) => formatTime(s.start, 'Asia/Kolkata', { seconds: false }))).toEqual(['6:30 PM', '7:30 PM', '8:30 PM']);
    expect(slots.every((s) => s.quality === 1)).toBe(true);
  });

  it('India ↔ US East during EST: one fewer workable slot', () => {
    // Corrects the Visual PRD table, which used a 9h30m gap in December.
    const slots = suggestMeetingSlots({ zones, anchorZone: 'America/New_York', date: { year: 2024, month: 12, day: 2 } });
    expect(slots.map((s) => formatTime(s.start, 'America/New_York', { seconds: false }))).toEqual(['9:00 AM', '10:00 AM']);
    expect(slots.map((s) => formatTime(s.start, 'Asia/Kolkata', { seconds: false }))).toEqual(['7:30 PM', '8:30 PM']);
  });

  it('prefers true business-hour overlap when it exists', () => {
    const slots = suggestMeetingSlots({
      zones: ['Europe/London', 'America/New_York'],
      anchorZone: 'America/New_York',
      date: { year: 2026, month: 9, day: 16 },
    });
    expect(slots.every((s) => s.quality === 2)).toBe(true);
    expect(slots.map((s) => formatTime(s.start, 'America/New_York', { seconds: false }))).toEqual(['9:00 AM', '10:00 AM', '11:00 AM']);
  });
});
