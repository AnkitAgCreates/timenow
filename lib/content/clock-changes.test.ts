import { describe, expect, it } from 'vitest';
import {
  clockChangeFaqs,
  clockChangesDescription,
  daysUntil,
  describeNight,
  getCountryChangeRows,
  getDifferenceShifts,
  getNoChangeCountries,
  getUpcomingChanges,
  guideYears,
  nextChangesFor,
} from './clock-changes';

const OCT_18_2026 = Date.UTC(2026, 9, 18, 12);
const row = (now: number, code: string) => getCountryChangeRows(now).find((r) => r.country.code === code);
const dates = (r: ReturnType<typeof row>) => r!.years.map((y) => `${y.year}: +${y.forward?.dateShort} -${y.back?.dateShort}`);

describe('clock changes guide', () => {
  it('covers the render year and the next, rolling over in January', () => {
    expect(guideYears(OCT_18_2026)).toEqual([2026, 2027]);
    expect(guideYears(Date.UTC(2027, 0, 10))).toEqual([2027, 2028]);
  });

  it('lists the next changes in date order: Europe, Egypt, then North America', () => {
    const next = getUpcomingChanges(OCT_18_2026);
    expect(next.slice(0, 3).map((m) => `${m.dateShort} ${m.direction}`)).toEqual(['Oct 25, 2026 back', 'Oct 30, 2026 back', 'Nov 1, 2026 back']);
    const europe = next[0]!;
    const codes = europe.moves.flatMap((m) => m.countries.map((c) => c.country.code));
    for (const code of ['GB', 'IE', 'FR', 'DE', 'GR', 'IL']) expect(codes, code).toContain(code);
    // The UK goes from 2:00 BST to 1:00 GMT; central Europe from 3:00 CEST to 2:00 CET.
    const moveOf = (code: string) => europe.moves.find((m) => m.countries.some((c) => c.country.code === code));
    expect(moveOf('GB')).toMatchObject({ from: '2:00 AM', to: '1:00 AM', abbreviations: 'BST → GMT' });
    expect(moveOf('DE')).toMatchObject({ from: '3:00 AM', to: '2:00 AM', abbreviations: 'CEST → CET' });
    // Countries are listed by their main zone: mainland Spain and Portugal, not the Canary Islands or the Azores.
    expect(moveOf('ES')).toBe(moveOf('DE'));
    expect(moveOf('PT')).toMatchObject({ from: '2:00 AM', to: '1:00 AM', abbreviations: 'WEST → WET' });
    expect(moveOf('PT')!.countries.find((c) => c.country.code === 'PT')!.place).toBeNull();
    const northAmerica = next[2]!.moves.flatMap((m) => m.countries.map((c) => c.country.code));
    expect(northAmerica).toEqual(expect.arrayContaining(['US', 'CA']));
    // Each country appears once per date even with several changing zones.
    expect(northAmerica.filter((c) => c === 'US')).toHaveLength(1);
  });

  it('orders by local date and names regions that change on their own', () => {
    const next = getUpcomingChanges(OCT_18_2026);
    const april = next.filter((m) => m.dateShort.startsWith('Apr') && m.direction === 'back');
    const entry = (m: (typeof next)[number]) =>
      `${m.dateShort} ${m.moves.flatMap((mv) => mv.countries.map((c) => (c.place ? `${c.country.code} (${c.place})` : c.country.code))).sort().join(' ')}`;
    // Easter Island's clocks go back late on Saturday night, mainland Chile's at midnight: separate local dates, in calendar order.
    expect(april.map(entry)).toEqual(['Apr 3, 2027 CL (Easter Island)', 'Apr 4, 2027 AU CL NZ', 'Apr 4, 2027 AU (Lord Howe Island)']);
    expect(april[2]).toMatchObject({ shiftMinutes: 30 });
    // On a shared date the whole-country change comes first, even when the region changes earlier.
    expect(next.filter((m) => m.dateShort === 'Oct 3, 2027').map(entry)).toEqual(['Oct 3, 2027 AU', 'Oct 3, 2027 AU (Lord Howe Island)']);
    // Only northern Mexico changes, so the moving areas are named.
    const mexico = next[2]!.moves.flatMap((m) => m.countries).find((c) => c.country.code === 'MX')!;
    expect(mexico.place).toBe('Tijuana, Ciudad Juárez, Matamoros');
    for (let i = 1; i < next.length; i++) expect(Date.parse(next[i]!.dateShort) >= Date.parse(next[i - 1]!.dateShort), next[i]!.dateShort).toBe(true);
  });

  it('gives each changing country its forward and back dates for both years', () => {
    expect(dates(row(OCT_18_2026, 'GB'))).toEqual(['2026: +Mar 29, 2026 -Oct 25, 2026', '2027: +Mar 28, 2027 -Oct 31, 2027']);
    expect(dates(row(OCT_18_2026, 'US'))).toEqual(['2026: +Mar 8, 2026 -Nov 1, 2026', '2027: +Mar 14, 2027 -Nov 7, 2027']);
    // Southern hemisphere: back in April, forward in the spring there.
    expect(dates(row(OCT_18_2026, 'NZ'))).toEqual(['2026: +Sep 27, 2026 -Apr 5, 2026', '2027: +Sep 26, 2027 -Apr 4, 2027']);
  });

  it('explains countries where only part of the country changes, or parts change on other dates', () => {
    expect(row(OCT_18_2026, 'US')!.notes.join(' ')).toMatch(/^No change in /);
    expect(row(OCT_18_2026, 'AU')!.notes.join(' ')).toMatch(/^No change in /);
    expect(row(OCT_18_2026, 'MX')!.notes.join(' ')).toMatch(/^Only in .+ The rest of the country keeps the same time all year\.$/);
    // Easter Island's next changes (late Saturday night there), not the ones already past.
    expect(row(OCT_18_2026, 'CL')!.notes).toContain('Easter Island changes on other dates: back on Apr 3, 2027, forward on Sep 4, 2027.');
    expect(row(OCT_18_2026, 'AU')!.notes).toContain('Lord Howe Island moves its clocks by 30 minutes instead of 1 hour.');
    expect(row(OCT_18_2026, 'MA')!.notes.join(' ')).toMatch(/Ramadan/);
  });

  it('lists countries that never change, and keeps changing ones out', () => {
    const codes = getNoChangeCountries(OCT_18_2026).map((c) => c.code);
    for (const code of ['IN', 'CN', 'JP', 'BR', 'AR']) expect(codes, code).toContain(code);
    for (const code of ['GB', 'US', 'AU', 'MA']) expect(codes, code).not.toContain(code);
    expect(codes.length + getCountryChangeRows(OCT_18_2026).length).toBe(96);
  });

  it('shows the week when New York is 4 hours behind London instead of 5', () => {
    const nyLondon = getDifferenceShifts(OCT_18_2026).find((s) => s.fromCity === 'New York' && s.toCity === 'London')!;
    expect(nyLondon.usualMinutes).toBe(300);
    // Boundaries are dated where the clocks change: London on Oct 25, New York on Nov 1.
    expect(nyLondon.periods.map((p) => `${p.startLabel} – ${p.endLabel} ${p.minutes / 60}h ${p.lengthLabel ?? ''}`.trim())).toEqual([
      'Mar 29, 2026 – Oct 25, 2026 5h',
      'Oct 25, 2026 – Nov 1, 2026 4h 1 week',
      'Nov 1, 2026 – Mar 14, 2027 5h',
      'Mar 14, 2027 – Mar 28, 2027 4h 2 weeks',
      'Mar 28, 2027 – Oct 31, 2027 5h',
    ]);
    expect(nyLondon.periods[1]).toMatchObject({ start: Date.UTC(2026, 9, 25, 1), end: Date.UTC(2026, 10, 1, 6), brief: true, sentence: 'London is 4 hours ahead of New York' });
    expect(nyLondon.href).toBe('/convert/new-york-to-london/');
  });

  it('marks only the short in-between spells, not the other half of the year', () => {
    const londonSydney = getDifferenceShifts(OCT_18_2026).find((s) => s.fromCity === 'London' && s.toCity === 'Sydney')!;
    const brief = londonSydney.periods.filter((p) => p.brief).map((p) => `${p.startLabel} – ${p.endLabel} ${p.minutes / 60}h`);
    expect(brief).toEqual(['Oct 4, 2026 – Oct 25, 2026 10h', 'Mar 28, 2027 – Apr 4, 2027 10h', 'Oct 3, 2027 – Oct 31, 2027 10h']);
    expect(londonSydney.periods.find((p) => p.brief)!.lengthLabel).toBe('3 weeks');
    // The northern winter (11 hours) and summer (9 hours) are both long seasons.
    expect(londonSydney.periods.filter((p) => !p.brief).map((p) => p.minutes / 60)).toEqual([11, 9]);
    const nyDelhi = getDifferenceShifts(OCT_18_2026).find((s) => s.toCity === 'New Delhi')!;
    expect(nyDelhi.periods.some((p) => p.brief)).toBe(false);
  });

  it('describes the night of a change in plain words', () => {
    const london = nextChangesFor('london', OCT_18_2026)!;
    expect(describeNight(london.city, london.back!)).toBe(
      'On Sunday, October 25, 2026, clocks in London go back from 2:00 AM BST to 1:00 AM GMT. The hour from 1:00 AM to 2:00 AM happens twice that night.',
    );
    const ny = nextChangesFor('new-york', OCT_18_2026)!;
    expect(describeNight(ny.city, ny.forward!)).toBe(
      'On Sunday, March 14, 2027, clocks in New York go forward from 2:00 AM EST to 3:00 AM EDT. Times from 2:00 AM to just before 3:00 AM do not exist that night.',
    );
  });

  it('builds FAQ answers from the engine and counts down to the next change', () => {
    const faqs = clockChangeFaqs(OCT_18_2026);
    expect(faqs[0]!.question).toBe('When do the clocks go back in 2026?');
    expect(faqs[0]!.answer).toContain('Sunday, October 25, 2026');
    expect(faqs[0]!.answer).toContain('Sunday, November 1, 2026');
    expect(faqs[1]!.question).toBe('When do the clocks go forward in 2027?');
    const gap = faqs.find((f) => f.question === 'Why is the time difference between London and New York different for a few weeks?')!;
    expect(gap.answer).toContain('from Oct 25, 2026 to Nov 1, 2026 and from Mar 14, 2027 to Mar 28, 2027 the gap is 4 hours');
    expect(daysUntil(OCT_18_2026, Date.UTC(2026, 9, 25, 1))).toBe('in 7 days');
    expect(daysUntil(OCT_18_2026, OCT_18_2026 + 3_600_000)).toBe('tomorrow');
    expect(clockChangesDescription(OCT_18_2026).length).toBeLessThanOrEqual(160);
  });

  it('starts the next year with Morocco when viewed in January', () => {
    const next = getUpcomingChanges(Date.UTC(2027, 0, 10));
    expect(next[0]).toMatchObject({ direction: 'back' });
    expect(next[0]!.moves[0]!.countries.map((c) => c.country.code)).toEqual(['MA']);
  });
});
