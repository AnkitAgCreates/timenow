import { describe, expect, it } from 'vitest';
import { getDSTState, isDST, observesDST } from './dst';
import { getNextTransitionInfo } from './transitions';
import { getTransitionsInYear } from './zone';

const utc = (iso: string) => Date.parse(iso);

/**
 * Each case below was misclassified by the previous "minimum offset of the
 * calendar year is standard time" rule. Expected offsets come from tzdata
 * 2026a as shipped in Node's ICU.
 */
describe('getDSTState — metadata layer', () => {
  it('classifies ordinary seasonal zones from explicit rules', () => {
    expect(getDSTState('America/Chicago', utc('2026-07-15T12:00:00Z'))).toMatchObject({
      offsetMinutes: -300,
      standardOffsetMinutes: -360,
      isDST: true,
      seasonalShift: 'forward',
      source: 'metadata',
    });
    expect(getDSTState('Australia/Sydney', utc('2026-07-15T00:00:00Z'))).toMatchObject({ isDST: false, standardOffsetMinutes: 600, source: 'metadata' });
  });

  it('Yukon: DST in summer 2020, then permanent UTC-7 as standard time', () => {
    expect(getDSTState('America/Whitehorse', utc('2020-07-01T12:00:00Z'))).toMatchObject({ isDST: true, standardOffsetMinutes: -480 });
    // The old rule took 2020's minimum (-480) as standard and called December 2020 "DST".
    expect(getDSTState('America/Whitehorse', utc('2020-12-01T12:00:00Z'))).toMatchObject({
      offsetMinutes: -420,
      standardOffsetMinutes: -420,
      isDST: false,
      source: 'metadata',
    });
    expect(observesDST('America/Whitehorse', 2020)).toBe(true);
    expect(observesDST('America/Whitehorse', 2021)).toBe(false);
  });

  it('Mexico City: DST until October 2022, none since', () => {
    expect(isDST('America/Mexico_City', utc('2022-07-01T12:00:00Z'))).toBe(true);
    expect(isDST('America/Mexico_City', utc('2022-12-01T12:00:00Z'))).toBe(false);
    expect(observesDST('America/Mexico_City', 2022)).toBe(true);
    expect(observesDST('America/Mexico_City', 2023)).toBe(false);
  });

  it('Morocco: UTC+1 is standard; the Ramadan move to UTC+0 is a backward shift, not DST', () => {
    const transitions = getTransitionsInYear('Africa/Casablanca', 2026);
    const backStart = transitions.find((t) => t.offsetAfter < t.offsetBefore);
    const backEnd = transitions.find((t) => backStart && t.instant > backStart.instant && t.offsetAfter > t.offsetBefore);
    expect(backStart && backEnd).toBeTruthy();
    const duringRamadanShift = (backStart!.instant + backEnd!.instant) / 2;

    // The old rule took UTC+0 as standard and reported most of the year as DST.
    expect(getDSTState('Africa/Casablanca', utc('2026-07-01T12:00:00Z'))).toMatchObject({
      offsetMinutes: 60,
      standardOffsetMinutes: 60,
      isDST: false,
      seasonalShift: 'none',
    });
    expect(getDSTState('Africa/Casablanca', duringRamadanShift)).toMatchObject({
      offsetMinutes: 0,
      standardOffsetMinutes: 60,
      isDST: false,
      seasonalShift: 'backward',
    });
    expect(observesDST('Africa/Casablanca', 2026)).toBe(false);
    // Moving clocks back for Ramadan is an offset change, not the end of DST.
    expect(getNextTransitionInfo('Africa/Casablanca', utc('2026-01-01T00:00:00Z'))?.kind).toBe('offset-change');
  });

  it('Ireland: GMT in winter, clocks forward to Irish Standard Time in summer', () => {
    expect(getDSTState('Europe/Dublin', utc('2026-07-01T12:00:00Z'))).toMatchObject({ isDST: true, standardOffsetMinutes: 0 });
    expect(getDSTState('Europe/Dublin', utc('2026-01-15T12:00:00Z'))).toMatchObject({ isDST: false, standardOffsetMinutes: 0 });
  });
});

describe('getDSTState — metadata layer, rule changes', () => {
  it('Türkiye: seasonal EET/EEST until September 2016, permanent UTC+3 since', () => {
    expect(getDSTState('Europe/Istanbul', utc('2015-07-01T12:00:00Z'))).toMatchObject({ offsetMinutes: 180, standardOffsetMinutes: 120, isDST: true, source: 'metadata' });
    expect(getDSTState('Europe/Istanbul', utc('2015-12-01T12:00:00Z'))).toMatchObject({ isDST: false, standardOffsetMinutes: 120 });
    // The old rule called December 2016 "DST" because 2016's minimum offset was UTC+2.
    expect(getDSTState('Europe/Istanbul', utc('2016-12-01T12:00:00Z'))).toMatchObject({ offsetMinutes: 180, standardOffsetMinutes: 180, isDST: false, source: 'metadata' });
    expect(observesDST('Europe/Istanbul', 2017)).toBe(false);
  });

  it('Chihuahua: Mountain Time with DST until October 2022, then Central Standard Time', () => {
    expect(getDSTState('America/Chihuahua', utc('2022-07-01T12:00:00Z'))).toMatchObject({ offsetMinutes: -360, standardOffsetMinutes: -420, isDST: true });
    expect(getDSTState('America/Chihuahua', utc('2022-12-01T12:00:00Z'))).toMatchObject({ offsetMinutes: -360, standardOffsetMinutes: -360, isDST: false, source: 'metadata' });
    expect(observesDST('America/Chihuahua', 2026)).toBe(false);
  });
});

describe('getDSTState — transition layer (zones without metadata)', () => {
  it('Chatham Islands: a bounded seasonal regime is classified as DST in the southern summer', () => {
    expect(getDSTState('Pacific/Chatham', utc('2026-01-15T12:00:00Z'))).toMatchObject({
      offsetMinutes: 825,
      standardOffsetMinutes: 765,
      isDST: true,
      source: 'transitions',
    });
    expect(getDSTState('Pacific/Chatham', utc('2026-07-15T12:00:00Z'))).toMatchObject({ isDST: false, standardOffsetMinutes: 765 });
  });

  it('Kazakhstan 2024: a permanent change to UTC+5 is standard time, not DST', () => {
    // Clocks in Almaty went back an hour on 2024-03-01 and never changed again.
    expect(getDSTState('Asia/Almaty', utc('2024-12-01T12:00:00Z'))).toMatchObject({
      offsetMinutes: 300,
      standardOffsetMinutes: 300,
      isDST: false,
      source: 'transitions',
    });
    expect(getDSTState('Asia/Almaty', utc('2026-07-01T12:00:00Z'))).toMatchObject({ isDST: false, source: 'fixed' });
  });

  it('falls back to transitions when metadata does not describe the offset (Arizona, 1967)', () => {
    expect(getDSTState('America/Phoenix', utc('1967-07-01T12:00:00Z'))).toMatchObject({
      offsetMinutes: -360,
      standardOffsetMinutes: -420,
      isDST: true,
      source: 'transitions',
    });
  });

  it('zones with no offset changes are fixed', () => {
    expect(getDSTState('Asia/Kabul', utc('2026-07-01T12:00:00Z'))).toMatchObject({
      offsetMinutes: 270,
      standardOffsetMinutes: 270,
      isDST: false,
      source: 'fixed',
    });
  });

  it('returns identical results from cache for instants in the same period', () => {
    const a = getDSTState('Pacific/Chatham', utc('2026-01-05T00:00:00Z'));
    const b = getDSTState('Pacific/Chatham', utc('2026-03-01T00:00:00Z'));
    expect(b).toEqual(a);
  });
});
