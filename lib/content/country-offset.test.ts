import { describe, expect, it } from 'vitest';
import { countryFaqs, countryMetaDescription, describeZoneGroup, getCountryZoneGroups } from './country';
import { describeOffset, getAbbreviationsForOffset, getOffsetUsage, groupOffsetUsage, offsetFaqs, offsetMetaDescription } from './offset';
import { getCountry } from '@/lib/data/countries';
import { makeOffsetPage } from '@/lib/data/offsets';

const SEPT = Date.parse('2026-09-17T12:00:00Z');
const JAN = Date.parse('2026-01-15T12:00:00Z');

describe('country page content', () => {
  it('India: one zone, no DST', () => {
    const india = getCountry('india')!;
    const groups = getCountryZoneGroups(india, SEPT);
    expect(groups).toHaveLength(1);
    expect(describeZoneGroup(groups[0]!)).toBe('India Standard Time (IST, UTC+5:30) all year');
    expect(countryMetaDescription(india, groups)).toContain('time zone India Standard Time (IST, UTC+5:30), no daylight saving time');
    const faqs = countryFaqs(india, groups, SEPT);
    expect(faqs[0]).toEqual({ question: 'What time zone is India in?', answer: 'India uses India Standard Time (IST, UTC+5:30) all year.' });
    expect(faqs[1]?.answer).toMatch(/^No\. India does not change its clocks/);
    expect(faqs.some((f) => f.question === 'What time is it in New Delhi, the capital?')).toBe(true);
  });

  it('United States: several zones, DST observed except Arizona and Hawaii', () => {
    const us = getCountry('united-states')!;
    const groups = getCountryZoneGroups(us, SEPT);
    expect(groups.length).toBeGreaterThanOrEqual(7);
    expect(describeZoneGroup(groups.find((g) => g.name === 'Eastern Time')!)).toBe(
      'Eastern Standard Time (EST, UTC-5), switching to Eastern Daylight Time (EDT, UTC-4) for daylight saving time',
    );
    expect(countryMetaDescription(us, groups)).toMatch(/^The United States spans \d+ time zones, from UTC-10 to UTC-5\./);
    const faqs = countryFaqs(us, groups, SEPT);
    expect(faqs[0]?.answer).toContain('The capital, Washington, D.C., is on Eastern Time.');
    expect(faqs[1]?.answer).toMatch(/^Partly\./);
    expect(faqs[1]?.answer).toContain('Mountain Time (Arizona)');
    expect(faqs[1]?.answer).toContain('starts daylight saving time on Sunday, March 8, 2026 and ends it on Sunday, November 1, 2026');
    expect(faqs.find((f) => f.question.startsWith('How many time zones'))?.answer).toMatch(/^\d+, counting zones that behave differently/);
  });

  it('Australia: southern-hemisphere DST wording', () => {
    const au = getCountry('australia')!;
    const groups = getCountryZoneGroups(au, JAN);
    expect(groups.map((g) => g.name)).toEqual(expect.arrayContaining(['Australian Western Standard Time', 'Australian Central Time', 'Australian Eastern Time', 'Australian Eastern Standard Time']));
    const faqs = countryFaqs(au, groups, JAN);
    expect(faqs[1]?.answer).toContain('leaves daylight saving time on Sunday, April 5, 2026 and starts it again on Sunday, October 4, 2026');
  });

  it('France: single mainland zone with overseas note', () => {
    const fr = getCountry('france')!;
    const groups = getCountryZoneGroups(fr, SEPT);
    expect(groups).toHaveLength(1);
    expect(countryFaqs(fr, groups, SEPT).some((f) => f.answer.startsWith('Mainland France uses a single time zone.'))).toBe(true);
  });
});

describe('UTC offset page content', () => {
  const minus5 = makeOffsetPage(-300);

  it('UTC-5: standard for Eastern Time, daylight for Central Time, all year for Colombia', () => {
    const usage = getOffsetUsage(minus5, JAN);
    const byZone = Object.fromEntries(usage.map((u) => [u.zone, u]));
    expect(byZone['America/New_York']).toMatchObject({ kind: 'standard', abbreviation: 'EST', otherOffset: -240, onOffsetNow: true });
    expect(byZone['America/Chicago']).toMatchObject({ kind: 'daylight', abbreviation: 'CDT', otherOffset: -360, onOffsetNow: false });
    expect(byZone['America/Bogota']).toMatchObject({ kind: 'all-year', abbreviation: 'COT', otherOffset: null, onOffsetNow: true });
    expect(byZone['America/Bogota']?.cities.map((c) => c.slug)).toContain('bogota');
    expect(groupOffsetUsage(minus5, usage).map((g) => g.kind)).toEqual(['all-year', 'standard', 'daylight']);
    expect(getAbbreviationsForOffset(-300).map((tz) => tz.slug).sort()).toEqual(['cdt', 'cot', 'est']);
  });

  it('UTC+1: Morocco is a seasonal shift, not daylight time', () => {
    const plus1 = makeOffsetPage(60);
    const usage = getOffsetUsage(plus1, SEPT);
    expect(usage.find((u) => u.zone === 'Africa/Casablanca')).toMatchObject({ kind: 'standard' });
    const plus0 = getOffsetUsage(makeOffsetPage(0), SEPT);
    expect(plus0.find((u) => u.zone === 'Africa/Casablanca')).toMatchObject({ kind: 'backward' });
  });

  it('writes accurate descriptions and FAQs', () => {
    expect(describeOffset(-300)).toBe('5 hours behind Coordinated Universal Time');
    expect(describeOffset(345)).toBe('5 hours 45 minutes ahead of Coordinated Universal Time');
    const usage = getOffsetUsage(minus5, JAN);
    expect(offsetMetaDescription(minus5, usage)).toMatch(/^Current time at UTC-5 \(UTC−05:00\), 5 hours behind UTC, used in /);
    expect(offsetMetaDescription(minus5, usage).length).toBeLessThanOrEqual(170);
    const faqs = offsetFaqs(minus5, usage, JAN);
    expect(faqs[0]?.answer).toContain('When it is 12:00 PM UTC, it is 7:00 AM at UTC-5.');
    expect(faqs.find((f) => f.question.startsWith('Is UTC-5 the same as GMT-5'))).toBeDefined();
    expect(faqs.find((f) => f.question.startsWith('Which time zone abbreviations'))?.answer).toContain('EST (Eastern Standard Time)');
  });
});
