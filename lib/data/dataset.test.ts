import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CITIES } from '@/data/cities';
import { COUNTRIES } from '@/data/countries';
import { getCitiesInCountry, getCity } from '@/lib/data/cities';
import { getCountry, getCountryByCode, getNeighbours } from '@/lib/data/countries';
import { getAllOffsetPages, getOffsetPage, makeOffsetPage, parseOffsetSlug } from '@/lib/data/offsets';
import { getCountryZoneGroups } from '@/lib/content/country';
import { canonicalZone, isValidTimeZone } from '@/lib/time';
import { getZoneMetadata } from '@/lib/time/zone-metadata';
import { getZoneDisplayNames } from '@/lib/time/zone-names';

/** Dataset rules for the GeoNames-generated city and country data (Sprint 2). */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NOW = Date.parse('2026-09-17T12:00:00Z');
const unique = (values: string[]) => new Set(values).size === values.length;

const SEED_CITIES = [
  'new-york', 'los-angeles', 'chicago', 'houston', 'dallas', 'phoenix', 'san-diego', 'san-francisco', 'denver', 'new-orleans',
  'toronto', 'winnipeg', 'regina', 'mexico-city', 'tijuana', 'london', 'paris', 'berlin', 'dubai', 'new-delhi', 'mumbai', 'bengaluru',
  'singapore', 'tokyo', 'sydney',
];

describe('generated cities', () => {
  it('stay within the Sprint 2 size target and keep every Sprint 1 seed city', () => {
    expect(CITIES.length).toBeGreaterThanOrEqual(300);
    expect(CITIES.length).toBeLessThanOrEqual(500);
    for (const slug of SEED_CITIES) expect(getCity(slug), slug).toBeDefined();
  });

  it('have unique, URL-safe slugs and GeoNames provenance', () => {
    expect(unique(CITIES.map((c) => c.slug))).toBe(true);
    for (const city of CITIES) {
      expect(city.slug).toMatch(SLUG);
      expect(city.geonameId, city.slug).toBeGreaterThan(0);
      expect(city.population, city.slug).toBeGreaterThan(0);
    }
  });

  it('exclude city districts and data errors', () => {
    for (const slug of ['brooklyn', 'queens', 'manhattan', 'the-bronx', 'staten-island', 'meads', 'lexington-fayette', 'delhi', 'pimpri', 'central-coast']) {
      expect(getCity(slug), slug).toBeUndefined();
    }
  });

  it('resolve slug collisions by population with a state or country suffix', () => {
    expect(getCity('san-jose')?.state).toBe('California');
    expect(getCity('san-jose-costa-rica')?.countryCode).toBe('CR');
    expect(getCity('london')?.countryCode).toBe('GB');
    expect(getCity('london-ontario')?.countryCode).toBe('CA');
    expect(getCity('columbus')?.state).toBe('Ohio');
    expect(getCity('columbus-georgia')?.state).toBe('Georgia');
  });

  it('apply curated names and aliases', () => {
    expect(getCity('new-delhi')).toMatchObject({ name: 'New Delhi', aliases: ['Delhi'] });
    expect(getCity('new-york')?.aliases).toContain('NYC');
    expect(getCity('washington-dc')?.name).toBe('Washington, D.C.');
    expect(getCity('cologne')?.aliases).toContain('Köln');
    expect(getCity('zurich')).toBeDefined();
    expect(getCity('rajkot')?.name).toBe('Rajkot');
    expect(getCity('sao-paulo')?.name).toBe('São Paulo');
  });

  it('use valid, canonical IANA zones that the engine can label', () => {
    for (const city of CITIES) {
      expect(isValidTimeZone(city.timezone), city.slug).toBe(true);
      expect(canonicalZone(city.timezone), city.slug).toBe(city.timezone);
      const named = getZoneMetadata(city.timezone) !== undefined || getZoneDisplayNames(city.timezone, NOW).standard !== null;
      expect(named, `${city.slug}: ${city.timezone} has neither metadata nor a CLDR name`).toBe(true);
    }
    // Vietnam's cities show the country's own zone rather than tzdata's Bangkok link.
    expect(getCity('hanoi')?.timezone).toBe('Asia/Ho_Chi_Minh');
  });

  it('reference known countries with matching display names', () => {
    for (const city of CITIES) {
      const country = getCountryByCode(city.countryCode);
      expect(country, city.slug).toBeDefined();
      expect(country!.name).toBe(city.country);
    }
  });
});

describe('generated countries', () => {
  it('cover every country with cities, once, with valid slugs', () => {
    const codes = new Set(CITIES.map((c) => c.countryCode));
    expect(new Set(COUNTRIES.map((c) => c.code))).toEqual(codes);
    expect(unique(COUNTRIES.map((c) => c.slug))).toBe(true);
    for (const country of COUNTRIES) expect(country.slug).toMatch(SLUG);
    expect(COUNTRIES.length).toBeGreaterThanOrEqual(80);
  });

  it('have consistent zones, capitals and neighbours', () => {
    for (const country of COUNTRIES) {
      expect(country.zones.length, country.code).toBeGreaterThan(0);
      for (const zone of country.zones) expect(isValidTimeZone(zone), `${country.code}: ${zone}`).toBe(true);
      expect(country.zones, `${country.code}: primaryZone`).toContain(country.primaryZone);
      if (country.capitalSlug) {
        const capital = getCity(country.capitalSlug);
        expect(capital?.countryCode, `${country.code}: capital ${country.capitalSlug}`).toBe(country.code);
        expect(country.primaryZone).toBe(capital!.timezone);
      }
      for (const neighbour of country.neighbours) expect(getCountryByCode(neighbour)?.published, `${country.code} → ${neighbour}`).toBe(true);
      expect(getCitiesInCountry(country.code).length, country.code).toBeGreaterThan(0);
    }
  });

  it('flag multiple time zones only when zone behaviours really differ', () => {
    for (const country of COUNTRIES) {
      const groups = getCountryZoneGroups(country, NOW);
      expect(groups.length > 1, `${country.code}: multipleTimeZones vs ${groups.length} groups`).toBe(country.multipleTimeZones);
    }
    expect(getCountry('india')?.multipleTimeZones).toBe(false);
    expect(getCountry('united-states')?.multipleTimeZones).toBe(true);
    // China officially uses one time zone; tzdata's unofficial Asia/Urumqi is excluded by curation.
    expect(getCountry('china')).toMatchObject({ multipleTimeZones: false, zones: ['Asia/Shanghai'] });
    expect(COUNTRIES.filter((c) => c.overseasTimeZones).map((c) => c.code).sort()).toEqual(['FR', 'NL']);
  });

  it('name zone groups sensibly for the United States', () => {
    const groups = getCountryZoneGroups(getCountry('united-states')!, NOW);
    expect(groups.map((g) => g.name)).toEqual(
      expect.arrayContaining(['Hawaii Time', 'Alaska Time', 'Pacific Time', 'Mountain Time', 'Mountain Time (Arizona)', 'Central Time', 'Eastern Time']),
    );
    const eastern = groups.find((g) => g.name === 'Eastern Time')!;
    expect(eastern.zones).toEqual(expect.arrayContaining(['America/New_York', 'America/Detroit']));
    expect(eastern.cities[0]?.slug).toBe('new-york');
    expect(eastern).toMatchObject({ standardOffset: -300, daylightOffset: -240, standardAbbreviation: 'EST', daylightAbbreviation: 'EDT' });
    expect(groups.find((g) => g.name === 'Mountain Time (Arizona)')).toMatchObject({ daylightOffset: null });
  });

  it('link neighbours both ways when both have pages', () => {
    const us = getCountry('united-states')!;
    expect(getNeighbours(us).map((c) => c.code)).toEqual(['CA', 'CU', 'MX']);
    expect(getNeighbours(getCountry('canada')!).map((c) => c.code)).toEqual(['US']);
  });
});

describe('UTC offset pages', () => {
  const pages = getAllOffsetPages(2026);

  it('exist only for offsets that dataset zones use in the year, excluding UTC+0', () => {
    expect(pages.map((p) => p.slug)).toEqual(expect.arrayContaining(['utc-minus-5', 'utc-plus-1', 'utc-plus-530', 'utc-plus-545', 'utc-minus-330', 'utc-minus-230', 'utc-plus-1245']));
    expect(getOffsetPage('utc-plus-0', 2026)).toBeUndefined();
    // Nobody in the dataset is on UTC+4:30 (Afghanistan has no cities here), so no page.
    expect(getOffsetPage('utc-plus-430', 2026)).toBeUndefined();
    expect(pages.length).toBeGreaterThanOrEqual(30);
    expect(pages.length).toBeLessThanOrEqual(45);
    expect(unique(pages.map((p) => p.slug))).toBe(true);
    for (let i = 1; i < pages.length; i++) expect(pages[i]!.offsetMinutes).toBeGreaterThan(pages[i - 1]!.offsetMinutes);
  });

  it('round-trip slugs, labels and pseudo-zone ids', () => {
    for (const page of pages) {
      expect(parseOffsetSlug(page.slug)).toBe(page.offsetMinutes);
      expect(parseOffsetSlug(page.gmtSlug, 'gmt')).toBe(page.offsetMinutes);
      expect(page.gmtSlug).toBe(page.slug.replace(/^utc/, 'gmt'));
    }
    expect(makeOffsetPage(330)).toMatchObject({ slug: 'utc-plus-530', label: 'UTC+5:30', iso: 'UTC+05:30', zoneId: 'UTC+05:30', gmtSlug: 'gmt-plus-530' });
    expect(makeOffsetPage(-210)).toMatchObject({ slug: 'utc-minus-330', label: 'UTC-3:30', iso: 'UTC−03:30', zoneId: 'UTC-03:30' });
    expect(parseOffsetSlug('utc-plus-99')).toBeNull();
    expect(parseOffsetSlug('utc-plus-5-30')).toBeNull();
    expect(parseOffsetSlug('gmt-minus-5')).toBeNull();
  });
});

describe('generated files', () => {
  it('declare their provenance and match their headers', () => {
    const cities = readFileSync('data/cities.generated.ts', 'utf8');
    expect(cities.startsWith('// Generated by scripts/generate-geo-data.mjs from GeoNames (CC BY 4.0).')).toBe(true);
    expect(cities).toContain(`// ${CITIES.length} cities`);
    const countries = readFileSync('data/countries.generated.ts', 'utf8');
    expect(countries).toContain(`// ${COUNTRIES.length} countries`);
  });
});
