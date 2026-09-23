import { COUNTRIES, HOMEPAGE_COUNTRY_SLUGS } from '@/data/countries';
import type { Country } from '@/types/data';

const byCode = new Map(COUNTRIES.map((country) => [country.code, country]));
const bySlug = new Map(COUNTRIES.map((country) => [country.slug, country]));

export function getCountryByCode(code: string): Country | undefined {
  return byCode.get(code);
}

export function getCountry(slug: string): Country | undefined {
  return bySlug.get(slug);
}

/** All countries, alphabetical. */
/** Countries in the homepage directory column, in display order (unknown slugs are skipped). */
export function getHomepageCountries(): Country[] {
  return HOMEPAGE_COUNTRY_SLUGS.map((slug) => getCountry(slug)).filter((c): c is Country => Boolean(c));
}

export function getAllCountries(): Country[] {
  return [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
}

/** Published countries only (those with a page). */
export function getPublishedCountries(): Country[] {
  return getAllCountries().filter((country) => country.published);
}

export const CONTINENT_NAMES: Record<string, string> = {
  AF: 'Africa',
  AS: 'Asia',
  EU: 'Europe',
  NA: 'North America',
  OC: 'Oceania',
  SA: 'South America',
  AN: 'Antarctica',
};

/** Published countries grouped by continent, continents in display order. */
export function getCountriesByContinent(): Array<{ code: string; name: string; countries: Country[] }> {
  const order = ['NA', 'SA', 'EU', 'AF', 'AS', 'OC', 'AN'];
  return order
    .map((code) => ({ code, name: CONTINENT_NAMES[code] ?? code, countries: getPublishedCountries().filter((c) => c.continent === code) }))
    .filter((group) => group.countries.length > 0);
}

/** Neighbouring countries that have pages, alphabetical. */
export function getNeighbours(country: Country): Country[] {
  return country.neighbours
    .map((code) => byCode.get(code))
    .filter((c): c is Country => Boolean(c?.published))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** "the United States" / "India" for mid-sentence use; capitalised variant for sentence starts. */
export function countryPhrase(country: Country, capitalise = false): string {
  if (!country.definiteArticle) return country.name;
  return `${capitalise ? 'The' : 'the'} ${country.name}`;
}
