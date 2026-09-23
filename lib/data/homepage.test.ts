import { describe, expect, it } from 'vitest';
import { HOMEPAGE_CITY_SLUGS } from '@/data/cities';
import { HOMEPAGE_COUNTRY_SLUGS } from '@/data/countries';
import { POPULAR_TIMEZONE_SLUGS } from '@/data/timezones';
import { getHomepageCities } from './cities';
import { getHomepageCountries } from './countries';
import { getPopularTimezones } from './timezones';

describe('homepage directory lists', () => {
  it('lists ten distinct cities that all exist in the dataset', () => {
    expect(new Set(HOMEPAGE_CITY_SLUGS).size).toBe(10);
    const cities = getHomepageCities();
    expect(cities.map((c) => c.slug)).toEqual(HOMEPAGE_CITY_SLUGS);
    for (const city of cities) expect(city.indexable, city.slug).toBe(true);
  });

  it('lists ten distinct published countries with a primary zone', () => {
    expect(new Set(HOMEPAGE_COUNTRY_SLUGS).size).toBe(10);
    const countries = getHomepageCountries();
    expect(countries.map((c) => c.slug)).toEqual(HOMEPAGE_COUNTRY_SLUGS);
    for (const country of countries) {
      expect(country.published, country.slug).toBe(true);
      expect(country.primaryZone, country.slug).toMatch(/\//);
      expect(country.code, country.slug).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('lists ten time zone abbreviations, the six from the brief first, each with a defined offset', () => {
    expect(POPULAR_TIMEZONE_SLUGS.slice(0, 6)).toEqual(['utc', 'est', 'cst', 'pst', 'ist', 'gmt']);
    expect(new Set(POPULAR_TIMEZONE_SLUGS).size).toBe(10);
    const zones = getPopularTimezones();
    expect(zones.map((z) => z.slug)).toEqual(POPULAR_TIMEZONE_SLUGS);
    for (const zone of zones) expect(Number.isInteger(zone.offsetMinutes), zone.slug).toBe(true);
  });
});
