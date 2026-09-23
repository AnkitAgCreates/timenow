import { describe, expect, it } from 'vitest';
import { FOOTER_TIMEZONE_SLUGS, POPULAR_TIMEZONE_SLUGS } from '@/data/timezones';
import { FOOTER_CITY_LIMIT, FOOTER_COUNTRY_LIMIT, getFooterCities, getFooterCountries, getFooterTimezones } from './footer';
import { getPopularCities } from './cities';

describe('footer directory', () => {
  it('lists the largest priority-1 cities, unique and indexable', () => {
    const cities = getFooterCities();
    expect(cities).toHaveLength(FOOTER_CITY_LIMIT);
    expect(new Set(cities.map((c) => c.slug)).size).toBe(cities.length);
    expect(new Set(cities.map((c) => c.name)).size).toBe(cities.length); // no two "London"s side by side
    for (let i = 1; i < cities.length; i += 1) expect((cities[i - 1]!.population ?? 0) >= (cities[i]!.population ?? 0)).toBe(true);
    for (const city of getPopularCities()) expect(cities.some((c) => c.slug === city.slug), city.slug).toBe(true);
  });

  it('lists the most populous published countries with ISO codes', () => {
    const countries = getFooterCountries();
    expect(countries).toHaveLength(FOOTER_COUNTRY_LIMIT);
    expect(new Set(countries.map((c) => c.code)).size).toBe(countries.length);
    for (const country of countries) {
      expect(country.published, country.slug).toBe(true);
      expect(country.code).toMatch(/^[A-Z]{2}$/);
    }
    for (const slug of ['united-states', 'india', 'united-kingdom', 'japan', 'germany']) expect(countries.some((c) => c.slug === slug), slug).toBe(true);
  });

  it('lists a curated set of abbreviation pages that all exist and include the popular six', () => {
    const zones = getFooterTimezones();
    expect(zones.map((z) => z.slug)).toEqual(FOOTER_TIMEZONE_SLUGS);
    expect(new Set(FOOTER_TIMEZONE_SLUGS).size).toBe(FOOTER_TIMEZONE_SLUGS.length);
    for (const slug of POPULAR_TIMEZONE_SLUGS.slice(0, 6)) expect(FOOTER_TIMEZONE_SLUGS, slug).toContain(slug);
  });
});
