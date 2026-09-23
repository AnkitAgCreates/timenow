import { FOOTER_TIMEZONE_SLUGS } from '@/data/timezones';
import { getAllCities } from '@/lib/data/cities';
import { getPublishedCountries } from '@/lib/data/countries';
import { getTimezones } from '@/lib/data/timezones';
import type { City, Country, TimeZoneEntry } from '@/types/data';

/**
 * Site-wide footer directory: links (no live times) to the most important
 * city, country and abbreviation pages, rendered on every page so each of
 * them has a strong internal-link source. Derived from the dataset, not
 * hand-maintained: priority-1 cities and published countries by population.
 */
export const FOOTER_CITY_LIMIT = 64;
export const FOOTER_COUNTRY_LIMIT = 40;
/** How many of each list stay visible on phones; the rest are desktop-only (still in the HTML). */
export const FOOTER_MOBILE_CITIES = 24;
export const FOOTER_MOBILE_COUNTRIES = 16;

export function getFooterCities(limit = FOOTER_CITY_LIMIT): City[] {
  return getAllCities()
    .filter((city) => city.priority === 1 && city.indexable)
    .sort((a, b) => (b.population ?? 0) - (a.population ?? 0) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function getFooterCountries(limit = FOOTER_COUNTRY_LIMIT): Country[] {
  return getPublishedCountries()
    .filter((country) => country.indexable)
    .sort((a, b) => (b.population ?? 0) - (a.population ?? 0) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function getFooterTimezones(): TimeZoneEntry[] {
  return getTimezones(FOOTER_TIMEZONE_SLUGS);
}
