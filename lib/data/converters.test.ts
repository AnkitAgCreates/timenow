import { describe, expect, it } from 'vitest';
import { CITY_CORRIDORS, CONVERTER_PAIRS, ZONE_CORRIDORS } from '@/data/converters';
import { TIMEZONES } from '@/data/timezones';
import {
  converterDocumentTitle,
  converterFaqs,
  converterHubDescription,
  converterHubFaqs,
  converterMetaDescription,
  converterSubtitle,
  converterTitle,
  conversionTable,
  differencePeriods,
  sideSummary,
} from '@/lib/content/converter';
import {
  converterSlug,
  getAllConverterPairs,
  getCityConverterPairs,
  getConverterPair,
  getConvertersForCity,
  getConvertersForTimezone,
  getRelatedConverterPairs,
  getZoneConverterPairs,
  getZoneConvertersByFrom,
  resolveConverterSide,
} from '@/lib/data/converters';

const unique = <T,>(values: T[]) => new Set(values).size === values.length;
const pair = (slug: string) => {
  const found = getConverterPair(slug);
  if (!found) throw new Error(`${slug} is not an approved pair`);
  return found;
};

describe('converter allowlist (Sprint 4 rules)', () => {
  it('stays curated: every corridor yields both directions, nothing else', () => {
    expect(CONVERTER_PAIRS.length).toBe((ZONE_CORRIDORS.length + CITY_CORRIDORS.length) * 2);
    expect(getZoneConverterPairs().length).toBeGreaterThanOrEqual(40);
    expect(getZoneConverterPairs().length).toBeLessThanOrEqual(140);
    expect(getCityConverterPairs().length).toBeGreaterThanOrEqual(20);
    expect(getCityConverterPairs().length).toBeLessThanOrEqual(80);
    expect(unique(getAllConverterPairs().map((p) => p.slug))).toBe(true);
    for (const corridor of [...ZONE_CORRIDORS, ...CITY_CORRIDORS]) {
      expect(getConverterPair(converterSlug(corridor.a, corridor.b))).toBeDefined();
      expect(getConverterPair(converterSlug(corridor.b, corridor.a))).toBeDefined();
    }
  });

  it('keeps the eight Sprint 1 pairs', () => {
    for (const slug of ['ist-to-est', 'est-to-ist', 'cst-to-ist', 'pst-to-ist', 'gmt-to-ist', 'utc-to-ist', 'cst-to-est', 'est-to-pst']) {
      expect(getConverterPair(slug), slug).toBeDefined();
    }
  });

  it('resolves every side, never mixes kinds and never converts a zone to itself', () => {
    for (const p of getAllConverterPairs()) {
      expect(p.fromSide.kind).toBe(p.toSide.kind);
      expect(p.from).not.toBe(p.to);
      expect(p.fromSide.zone, p.slug).not.toBe(p.toSide.zone);
      expect([1, 2, 3]).toContain(p.priority);
      expect(p.indexable).toBe(true);
    }
  });

  it('forbids pointless zone pairs: standard ↔ its daylight counterpart, and UTC ↔ GMT', () => {
    for (const p of getZoneConverterPairs()) {
      const entry = p.fromSide.entry!;
      expect(entry.counterpart, p.slug).not.toBe(p.to);
      expect(new Set([p.from, p.to])).not.toEqual(new Set(['utc', 'gmt']));
    }
  });

  it('never lets a city slug shadow a time zone slug', () => {
    const zoneSlugs = new Set(TIMEZONES.map((tz) => tz.slug));
    for (const corridor of CITY_CORRIDORS) {
      for (const slug of [corridor.a, corridor.b]) {
        expect(zoneSlugs.has(slug), slug).toBe(false);
        expect(resolveConverterSide(slug)?.kind, slug).toBe('city');
      }
    }
    expect(resolveConverterSide('est')?.kind).toBe('zone');
    expect(resolveConverterSide('atlantis')).toBeUndefined();
  });

  it('relates pages of the same kind that share a side, busiest first, without itself', () => {
    const related = getRelatedConverterPairs(pair('ist-to-est'));
    expect(related.length).toBeLessThanOrEqual(6);
    expect(related.every((p) => p.kind === 'zone' && (p.from === 'ist' || p.to === 'ist' || p.from === 'est' || p.to === 'est'))).toBe(true);
    expect(related.map((p) => p.slug)).not.toContain('ist-to-est');
    expect(related.map((p) => p.slug)).toContain('est-to-ist');
    const cityRelated = getRelatedConverterPairs(pair('london-to-new-york'));
    expect(cityRelated.every((p) => p.kind === 'city')).toBe(true);
    expect(cityRelated.map((p) => p.slug)).toContain('new-york-to-london');
  });

  it('exposes converters per time zone and per city, and groups the hub by source zone', () => {
    expect(getConvertersForTimezone('ist').every((p) => p.kind === 'zone' && (p.from === 'ist' || p.to === 'ist'))).toBe(true);
    expect(getConvertersForTimezone('ist').length).toBeGreaterThanOrEqual(20);
    expect(getConvertersForCity('london').every((p) => p.kind === 'city')).toBe(true);
    expect(getConvertersForCity('london').length).toBeGreaterThanOrEqual(10);
    const groups = getZoneConvertersByFrom();
    expect(groups[0]!.side.label).toBe('EST'); // most corridors
    expect(groups.flatMap((g) => g.pairs).length).toBe(getZoneConverterPairs().length);
  });
});

describe('converter copy', () => {
  const winter = Date.UTC(2026, 0, 15, 17, 0); // 12:00 EST, 09:00 PST, 22:30 IST
  const onlyUsSwitched = Date.UTC(2026, 2, 20, 12, 0); // London GMT (switches Mar 29), New York already EDT (Mar 8)

  it('titles and describes zone pairs as before and city pairs as "time converters"', () => {
    const ist = pair('ist-to-est');
    expect(converterTitle(ist)).toBe('IST to EST Converter');
    expect(converterDocumentTitle(ist)).toBe('IST to EST Converter – Time Difference & Table');
    expect(converterSubtitle(ist, winter)).toBe('Convert time between India Standard Time (IST) and Eastern Time (EST/EDT).');
    const city = pair('london-to-new-york');
    expect(converterTitle(city)).toBe('London to New York Time Converter');
    expect(converterDocumentTitle(city)).toBe('London to New York Time Converter – Time Difference'); // the longer form exceeds the 60-character title budget
    expect(converterSubtitle(city, winter)).toBe('Convert time between London, United Kingdom and New York, United States.');
    expect(converterMetaDescription(city, winter)).toContain('Convert London time to New York time');
    for (const p of getCityConverterPairs()) expect(converterMetaDescription(p, winter).length, p.slug).toBeLessThanOrEqual(165);
    expect(unique(getAllConverterPairs().map((p) => converterMetaDescription(p, winter)))).toBe(true);
  });

  it('summarises a city side from its IANA zone, including whether it observes DST', () => {
    const london = pair('london-to-new-york').fromSide;
    expect(sideSummary(london, winter)).toContain('IANA time zone Europe/London');
    expect(sideSummary(london, winter)).toContain('observes daylight saving time');
    const delhi = pair('new-delhi-to-london').fromSide;
    expect(sideSummary(delhi, winter)).toContain('does not observe daylight saving time');
  });

  it('gets the difference right in the weeks when only one side has switched (London → New York)', () => {
    const periods = differencePeriods(pair('london-to-new-york'), onlyUsSwitched);
    expect(periods[0]!.sentence).toBe('London is 4 hours ahead of New York (GMT → EDT).');
    expect(periods[0]!.range).toContain('Mar 29');
    expect(periods[1]!.sentence).toBe('London is 5 hours ahead of New York (BST → EDT).');
    const faqs = converterFaqs(pair('london-to-new-york'), onlyUsSwitched);
    expect(faqs[0]!.question).toBe('What time is it in New York when it is 9 AM in London?');
    expect(faqs[0]!.answer).toContain('9:00 AM in London (GMT) is 5:00 AM EDT in New York');
    expect(faqs.some((f) => f.question === 'Does London observe daylight saving time?')).toBe(true);
    expect(unique(faqs.map((f) => f.question))).toBe(true);
  });

  it('keeps the zone-pair FAQs and tables working (EST → PST in January)', () => {
    const est = pair('est-to-pst');
    const faqs = converterFaqs(est, winter);
    expect(faqs[0]!.question).toBe('What time is it in PST when it is 9 AM EST?');
    expect(faqs[0]!.answer).toContain('9:00 AM EST is 6:00 AM PST');
    const rows = conversionTable(est, { year: 2026, month: 1, day: 15 });
    expect(rows.length).toBe(24);
    expect(rows[9]).toEqual({ fromLabel: '9:00 AM', toLabel: '6:00 AM', toDayShift: '' });
    expect(unique(faqs.map((f) => f.question))).toBe(true);
  });

  it('describes the hub from the dataset', () => {
    expect(converterHubDescription()).toContain(`${getZoneConverterPairs().length} time zone and ${getCityConverterPairs().length} city conversion pages`);
    expect(converterHubDescription().length).toBeLessThanOrEqual(165);
    expect(converterHubFaqs().length).toBe(5);
  });
});
