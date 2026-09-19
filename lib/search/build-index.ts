import { getAllCities } from '@/lib/data/cities';
import { getAllCountries } from '@/lib/data/countries';
import { getAllOffsetPages } from '@/lib/data/offsets';
import { getAllTimezones } from '@/lib/data/timezones';
import { routes } from '@/lib/routes';
import { formatOffset } from '@/lib/time';
import { normalizeSearch, type SearchItem } from './match';

/**
 * Builds the search index from structured data. Served as a static JSON file
 * (app/api/search-index) and fetched lazily on first search interaction, so it
 * adds nothing to page payloads.
 */
export function buildSearchIndex(): SearchItem[] {
  const cities: SearchItem[] = getAllCities()
    .filter((city) => city.indexable)
    .map((city) => ({
      type: 'city',
      label: city.name,
      detail: [city.state, city.country].filter(Boolean).join(', '),
      href: routes.city(city.slug),
      zone: city.timezone,
      terms: [city.name, ...(city.aliases ?? []), `${city.name} ${city.country}`, city.state ?? '', city.country]
        .filter(Boolean)
        .map(normalizeSearch),
      priority: city.priority,
    }));

  // Countries are only searchable once their pages exist; until then a
  // country query still finds its cities through the city terms above.
  const countries: SearchItem[] = getAllCountries()
    .filter((country) => country.published)
    .map((country) => ({
      type: 'country',
      label: country.name,
      detail: 'Country',
      href: routes.country(country.slug),
      terms: [normalizeSearch(country.name), country.code.toLowerCase()],
      priority: 1,
    }));

  const timezones: SearchItem[] = getAllTimezones()
    .filter((tz) => tz.indexable)
    .map((tz) => ({
      type: 'timezone',
      label: tz.abbreviation,
      detail: `${tz.name} · ${formatOffset(tz.offsetMinutes)}`,
      href: routes.timezone(tz.slug),
      zone: tz.referenceZone,
      terms: [tz.abbreviation, tz.name, tz.referenceLabel, formatOffset(tz.offsetMinutes), formatOffset(tz.offsetMinutes, 'GMT')].map(
        normalizeSearch,
      ),
      priority: tz.priority,
    }));

  // UTC offset pages answer "utc-5" / "gmt+1" queries.
  const offsets: SearchItem[] = getAllOffsetPages().map((page) => ({
    type: 'timezone',
    label: page.label,
    detail: `UTC offset · GMT${page.label.slice(3)} · ${page.iso}`,
    href: routes.utcOffset(page.slug),
    zone: page.zoneId,
    terms: [page.label, `GMT${page.label.slice(3)}`, page.label.replace(/[+-]/, (s) => ` ${s === '+' ? 'plus' : 'minus'} `), page.iso].map(normalizeSearch),
    priority: 3,
  }));

  return [...cities, ...countries, ...timezones, ...offsets];
}
