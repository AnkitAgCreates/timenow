import { describe, expect, it } from 'vitest';
import { getTimezone } from '@/lib/data/timezones';
import { computeAbbreviationStatus } from '@/lib/timezones/status';
import { describeTransition, getDifferencePeriods, getNextTransitionInfo } from './transitions';

const utc = (iso: string) => Date.parse(iso);

describe('getNextTransitionInfo', () => {
  it('describes the US spring-forward change in local terms', () => {
    const info = getNextTransitionInfo('America/Los_Angeles', utc('2026-01-10T00:00:00Z'))!;
    expect(info).toMatchObject({
      kind: 'dst-start',
      localTimeBefore: '2:00 AM',
      localTimeAfter: '3:00 AM',
      dateLabel: 'Sunday, March 8, 2026',
      abbreviationBefore: 'PST',
      abbreviationAfter: 'PDT',
    });
    expect(describeTransition(info)).toBe('Clocks go forward 1 hour at 2:00 AM on Sunday, March 8, 2026 (PST → PDT).');
  });

  it('describes the fall-back change', () => {
    const info = getNextTransitionInfo('America/Chicago', utc('2026-09-17T00:00:00Z'))!;
    expect(info).toMatchObject({ kind: 'dst-end', localTimeBefore: '2:00 AM', localTimeAfter: '1:00 AM', dateShort: 'Nov 1, 2026' });
    expect(info.abbreviationBefore).toBe('CDT');
    expect(info.abbreviationAfter).toBe('CST');
  });

  it('handles the southern hemisphere (Sydney DST ends in April)', () => {
    const info = getNextTransitionInfo('Australia/Sydney', utc('2026-01-10T00:00:00Z'))!;
    expect(info).toMatchObject({ kind: 'dst-end', localTimeBefore: '3:00 AM', dateLabel: 'Sunday, April 5, 2026', abbreviationAfter: 'AEST' });
  });

  it('returns null for zones without DST', () => {
    expect(getNextTransitionInfo('Asia/Kolkata', utc('2026-01-10T00:00:00Z'))).toBeNull();
  });
});

describe('getDifferencePeriods', () => {
  it('IST → Eastern: 9h30m during EDT, 10h30m during EST', () => {
    const periods = getDifferencePeriods('Asia/Kolkata', 'America/New_York', utc('2026-09-17T00:00:00Z'), 366);
    expect(periods.map((p) => p.differenceMinutes)).toEqual([-570, -630, -570]);
    expect(periods[0]!.end).toBe(utc('2026-11-01T06:00:00Z'));
    expect(periods[1]!.end).toBe(utc('2027-03-14T07:00:00Z'));
    expect(periods[2]!.end).toBeNull();
  });

  it('New York → London has short extra periods because the US and UK switch on different dates', () => {
    const periods = getDifferencePeriods('America/New_York', 'Europe/London', utc('2026-01-01T00:00:00Z'), 365);
    expect(periods.map((p) => p.differenceMinutes)).toEqual([300, 240, 300, 240, 300]);
  });

  it('merges periods when both zones switch at the same moment', () => {
    const periods = getDifferencePeriods('America/New_York', 'America/Toronto', utc('2026-01-01T00:00:00Z'), 365);
    expect(periods).toHaveLength(1);
    expect(periods[0]!.differenceMinutes).toBe(0);
  });
});

describe('computeAbbreviationStatus', () => {
  const cst = getTimezone('cst')!;
  const cdt = getTimezone('cdt')!;

  it('CST page in September: Central Time is on CDT, explained clearly', () => {
    const status = computeAbbreviationStatus(cst, utc('2026-09-17T12:00:00Z'), { yearRoundExamples: ['Regina', 'Mexico City'] });
    expect(status.inEffect).toBe(false);
    expect(status.currentAbbreviation).toBe('CDT');
    expect(status.headline).toBe('Central Time is on CDT right now, not CST');
    expect(status.detail).toBe(
      'CDT is UTC-5, 1 hour ahead of CST (UTC-6). Central Time returns to CST on Sunday, November 1, 2026 at 2:00 AM. Places that stay on CST all year, such as Regina and Mexico City, are on UTC-6 now.',
    );
  });

  it('CST page in January: CST is in effect', () => {
    const status = computeAbbreviationStatus(cst, utc('2027-01-15T12:00:00Z'));
    expect(status.inEffect).toBe(true);
    expect(status.headline).toBe('Central Time is on CST right now');
    expect(status.detail).toBe('CST is UTC-6. Central Time switches to CDT (UTC-5) on Sunday, March 14, 2027 at 2:00 AM.');
  });

  it('CDT page in January: CDT is not in effect', () => {
    const status = computeAbbreviationStatus(cdt, utc('2027-01-15T12:00:00Z'));
    expect(status.headline).toBe('Central Time is on CST right now, not CDT');
    expect(status.detail).toContain('Central Time switches to CDT on Sunday, March 14, 2027 at 2:00 AM.');
  });

  it('IST never changes', () => {
    const status = computeAbbreviationStatus(getTimezone('ist')!, utc('2026-09-17T12:00:00Z'));
    expect(status.seasonal).toBe(false);
    expect(status.headline).toBe('IST does not change for daylight saving time');
  });

  it('GMT page in summer explains the UK is on BST', () => {
    const status = computeAbbreviationStatus(getTimezone('gmt')!, utc('2026-07-01T12:00:00Z'));
    expect(status.watchZone).toBe('Europe/London');
    expect(status.headline).toBe('UK time is on BST right now, not GMT');
    expect(status.detail).toContain('GMT itself is always UTC+0');
  });
});
