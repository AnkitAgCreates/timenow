import { describe, expect, it } from 'vitest';
import { getZoneLabel } from './abbreviations';
import { convertTime, describeDifference, formatSignedDifference, getTimeDifference } from './difference';
import { formatDate, formatDuration, formatOffset, formatTime, formatTimeFields } from './format';

const utc = (iso: string) => Date.parse(iso);

describe('convertTime', () => {
  it('IST → Eastern in December uses EST (IST is 10h30m ahead)', () => {
    // Corrects the Visual PRD, which showed 10:24 PM IST as 12:54 PM EST.
    const result = convertTime('Asia/Kolkata', 'America/New_York', { year: 2024, month: 12, day: 2, hour: 22, minute: 24 });
    expect(formatTime(result.instant, 'America/New_York', { seconds: false })).toBe('11:54 AM');
    expect(result.toOffset - result.fromOffset).toBe(-630);
    expect(getZoneLabel('America/New_York', result.instant).abbreviation).toBe('EST');

    const specific = convertTime('Asia/Kolkata', 'America/New_York', { year: 2024, month: 12, day: 2, hour: 22, minute: 0 });
    expect(formatTime(specific.instant, 'America/New_York', { seconds: false })).toBe('11:30 AM');
    expect(formatDate(specific.instant, 'America/New_York', 'medium')).toBe('Mon, Dec 2, 2024');
  });

  it('IST → Eastern in September uses EDT (IST is 9h30m ahead)', () => {
    const result = convertTime('Asia/Kolkata', 'America/New_York', { year: 2026, month: 9, day: 16, hour: 22, minute: 0 });
    expect(formatTime(result.instant, 'America/New_York', { seconds: false })).toBe('12:30 PM');
    expect(getZoneLabel('America/New_York', result.instant).abbreviation).toBe('EDT');
  });

  it('handles cross-date conversions', () => {
    const result = convertTime('Asia/Kolkata', 'America/New_York', { year: 2026, month: 9, day: 16, hour: 5, minute: 0 });
    expect(result.to).toMatchObject({ year: 2026, month: 9, day: 15, hour: 19, minute: 30 });
    expect(result.dayShift).toBe(-1);
  });

  it('handles year boundaries', () => {
    const ny = convertTime('America/New_York', 'Asia/Tokyo', { year: 2026, month: 12, day: 31, hour: 20, minute: 0 });
    expect(ny.to).toMatchObject({ year: 2027, month: 1, day: 1, hour: 10, minute: 0 });
    expect(ny.dayShift).toBe(1);

    const fromUtc = convertTime('UTC', 'Asia/Kolkata', { year: 2026, month: 12, day: 31, hour: 23, minute: 30 });
    expect(fromUtc.to).toMatchObject({ year: 2027, month: 1, day: 1, hour: 5, minute: 0 });
  });

  it('handles leap days', () => {
    const result = convertTime('Asia/Kolkata', 'America/New_York', { year: 2028, month: 2, day: 29, hour: 3, minute: 0 });
    expect(result.to).toMatchObject({ year: 2028, month: 2, day: 28, hour: 16, minute: 30 });
  });

  it('flags DST gaps in the source zone', () => {
    const result = convertTime('America/Chicago', 'UTC', { year: 2026, month: 3, day: 8, hour: 2, minute: 15 });
    expect(result.status).toBe('gap');
    expect(result.from).toMatchObject({ hour: 3, minute: 15 });
  });
});

describe('getTimeDifference', () => {
  const winter = utc('2024-12-01T03:54:00Z');

  it('San Diego comparisons in winter (corrects the Visual PRD India value)', () => {
    expect(getTimeDifference('America/Los_Angeles', 'America/New_York', winter)).toBe(180);
    expect(getTimeDifference('America/Los_Angeles', 'Europe/London', winter)).toBe(480);
    expect(getTimeDifference('America/Los_Angeles', 'Asia/Dubai', winter)).toBe(720);
    expect(getTimeDifference('America/Los_Angeles', 'Asia/Kolkata', winter)).toBe(810);
    expect(formatSignedDifference(810)).toBe('+13 hours 30 minutes');
    expect(getTimeDifference('America/Los_Angeles', 'Asia/Tokyo', winter)).toBe(1020);
  });

  it('CST comparisons in winter', () => {
    expect(getTimeDifference('America/Chicago', 'America/New_York', winter)).toBe(60);
    expect(getTimeDifference('America/Chicago', 'America/Los_Angeles', winter)).toBe(-120);
    expect(getTimeDifference('America/Chicago', 'Asia/Kolkata', winter)).toBe(690);
    expect(getTimeDifference('America/Chicago', 'UTC', winter)).toBe(360);
  });

  it('Mexico City matches Chicago in winter but is an hour behind during CDT', () => {
    // Corrects the Visual PRD, which showed Mexico City an hour behind Chicago in December.
    expect(getTimeDifference('America/Chicago', 'America/Mexico_City', winter)).toBe(0);
    expect(getTimeDifference('America/Chicago', 'America/Mexico_City', utc('2026-07-01T12:00:00Z'))).toBe(-60);
  });

  it('EST → PST is usually 3 hours but briefly 4 or 2 hours on transition days', () => {
    expect(getTimeDifference('America/New_York', 'America/Los_Angeles', utc('2026-03-08T06:00:00Z'))).toBe(-180);
    expect(getTimeDifference('America/New_York', 'America/Los_Angeles', utc('2026-03-08T08:00:00Z'))).toBe(-240);
    expect(getTimeDifference('America/New_York', 'America/Los_Angeles', utc('2026-03-08T10:00:00Z'))).toBe(-180);
    expect(getTimeDifference('America/New_York', 'America/Los_Angeles', utc('2026-11-01T07:00:00Z'))).toBe(-120);
  });

  it('US and UK switch on different dates, so New York–London varies', () => {
    expect(getTimeDifference('America/New_York', 'Europe/London', utc('2026-03-15T12:00:00Z'))).toBe(240);
    expect(getTimeDifference('America/New_York', 'Europe/London', utc('2026-04-15T12:00:00Z'))).toBe(300);
  });

  it('describes differences in words', () => {
    expect(describeDifference('IST', 'EST', 630)).toBe('IST is 10 hours 30 minutes ahead of EST');
    expect(describeDifference('PST', 'EST', -180)).toBe('PST is 3 hours behind EST');
    expect(formatSignedDifference(-120)).toBe('-2 hours');
    expect(formatSignedDifference(0)).toBe('Same time');
  });
});

describe('zone labels', () => {
  it('uses verified abbreviations that match the actual offset', () => {
    expect(getZoneLabel('America/Chicago', utc('2026-01-15T12:00:00Z'))).toMatchObject({
      abbreviation: 'CST',
      name: 'Central Standard Time',
      offsetLabel: 'UTC-6',
      isDST: false,
    });
    expect(getZoneLabel('America/Chicago', utc('2026-09-16T12:00:00Z'))).toMatchObject({
      abbreviation: 'CDT',
      name: 'Central Daylight Time',
      offsetLabel: 'UTC-5',
      isDST: true,
    });
    expect(getZoneLabel('America/Los_Angeles', utc('2024-12-01T03:54:00Z'))).toMatchObject({ abbreviation: 'PST', isDST: false });
    expect(getZoneLabel('Asia/Kolkata').abbreviation).toBe('IST');
    expect(getZoneLabel('Asia/Calcutta').abbreviation).toBe('IST');
    expect(getZoneLabel('Europe/London', utc('2026-07-01T12:00:00Z')).abbreviation).toBe('BST');
    expect(getZoneLabel('Australia/Sydney', utc('2026-01-01T12:00:00Z')).abbreviation).toBe('AEDT');
    expect(getZoneLabel('America/Mexico_City', utc('2026-07-01T12:00:00Z')).abbreviation).toBe('CST');
  });

  it('uses dated metadata eras for zones whose rules changed', () => {
    // Mexico City observed DST until 2022-10-30; its metadata records that era.
    expect(getZoneLabel('America/Mexico_City', utc('2022-07-01T12:00:00Z'))).toMatchObject({ abbreviation: 'CDT', isDST: true, verified: true });
    expect(getZoneLabel('America/Mexico_City', utc('2026-07-01T12:00:00Z'))).toMatchObject({ abbreviation: 'CST', isDST: false });
    // Yukon: Pacific Time until 2020-11-01, then permanent UTC-7.
    expect(getZoneLabel('America/Whitehorse', utc('2020-07-01T12:00:00Z'))).toMatchObject({ abbreviation: 'PDT', isDST: true });
    expect(getZoneLabel('America/Whitehorse', utc('2026-01-15T12:00:00Z'))).toMatchObject({ abbreviation: 'MST', name: 'Yukon Time', isDST: false });
  });

  it('keeps ambiguous abbreviations per zone (IST in India vs Ireland)', () => {
    expect(getZoneLabel('Asia/Kolkata', utc('2026-07-01T12:00:00Z'))).toMatchObject({ abbreviation: 'IST', name: 'India Standard Time', offsetMinutes: 330 });
    expect(getZoneLabel('Europe/Dublin', utc('2026-07-01T12:00:00Z'))).toMatchObject({ abbreviation: 'IST', name: 'Irish Standard Time', offsetMinutes: 60, isDST: true });
    expect(getZoneLabel('Europe/Dublin', utc('2026-01-15T12:00:00Z'))).toMatchObject({ abbreviation: 'GMT', isDST: false });
  });

  it('never shows an abbreviation whose offset does not match', () => {
    // Arizona observed DST in 1967 (UTC-6). Phoenix metadata only describes MST,
    // so the label falls back to the offset and DST is inferred from transitions.
    expect(getZoneLabel('America/Phoenix', utc('1967-07-01T12:00:00Z'))).toMatchObject({
      abbreviation: 'UTC-6',
      isDST: true,
      verified: false,
    });
    expect(getZoneLabel('Asia/Kabul', utc('2026-07-01T12:00:00Z'))).toMatchObject({
      abbreviation: 'UTC+4:30',
      verified: false,
    });
    // Zones with metadata but no common abbreviation show the offset with a verified name.
    expect(getZoneLabel('Asia/Colombo', utc('2026-07-01T12:00:00Z'))).toMatchObject({ abbreviation: 'UTC+5:30', name: 'Sri Lanka Standard Time', verified: false });
  });
});

describe('formatting', () => {
  it('formats offsets', () => {
    expect(formatOffset(330)).toBe('UTC+5:30');
    expect(formatOffset(-360)).toBe('UTC-6');
    expect(formatOffset(0)).toBe('UTC+0');
    expect(formatOffset(-210)).toBe('UTC-3:30');
    expect(formatOffset(345, 'GMT')).toBe('GMT+5:45');
  });

  it('formats 12- and 24-hour times', () => {
    expect(formatTimeFields({ hour: 0, minute: 5, second: 9 })).toBe('12:05:09 AM');
    expect(formatTimeFields({ hour: 12, minute: 0, second: 0 })).toBe('12:00:00 PM');
    expect(formatTimeFields({ hour: 21, minute: 54, second: 38 }, { seconds: false })).toBe('9:54 PM');
    expect(formatTimeFields({ hour: 9, minute: 4, second: 0 }, { hourCycle: '24h' })).toBe('09:04:00');
  });

  it('formats durations', () => {
    expect(formatDuration(60)).toBe('1 hour');
    expect(formatDuration(810)).toBe('13 hours 30 minutes');
    expect(formatDuration(45)).toBe('45 minutes');
    expect(formatDuration(1)).toBe('1 minute');
  });

  it('formats dates deterministically', () => {
    expect(formatDate(utc('2026-09-16T16:54:38Z'), 'Asia/Kolkata')).toBe('Wednesday, September 16, 2026');
    expect(formatDate(utc('2026-09-16T16:54:38Z'), 'America/Los_Angeles', 'medium')).toBe('Wed, Sep 16, 2026');
  });
});
