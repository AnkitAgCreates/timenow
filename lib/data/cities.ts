import { CITIES, COMPARISON_CITY_SLUGS, POPULAR_CITY_SLUGS } from '@/data/cities';
import { canonicalZone } from '@/lib/time';
import type { City } from '@/types/data';

const bySlug = new Map(CITIES.map((city) => [city.slug, city]));

export function getAllCities(): City[] {
  return [...CITIES].sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
}

export function getCity(slug: string): City | undefined {
  return bySlug.get(slug);
}

function resolve(slugs: string[]): City[] {
  return slugs.map((slug) => bySlug.get(slug)).filter((c): c is City => Boolean(c));
}

export function getPopularCities(): City[] {
  return resolve(POPULAR_CITY_SLUGS);
}

export function getCitiesInZones(zones: string[]): City[] {
  const set = new Set(zones);
  return getAllCities().filter((city) => set.has(city.timezone));
}

/** Highest-priority seeded city in the zone (used to label a browser zone). */
export function getRepresentativeCity(timeZone: string): City | undefined {
  const zone = canonicalZone(timeZone);
  return getAllCities().find((city) => city.timezone === zone);
}

/** Great-circle distance in kilometres. */
export function distanceKm(a: Pick<City, 'latitude' | 'longitude'>, b: Pick<City, 'latitude' | 'longitude'>): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function getNearbyCities(city: City, limit = 4, maxKm = 1500): Array<{ city: City; km: number }> {
  return CITIES.filter((other) => other.slug !== city.slug)
    .map((other) => ({ city: other, km: distanceKm(city, other) }))
    .filter((entry) => entry.km <= maxKm)
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}

/** Reference cities for time-difference tables, excluding the city's own zone. */
export function getComparisonCities(city: City, limit = 5): City[] {
  return getComparisonCitiesForZone(city.timezone, limit, city.slug);
}

/** Reference cities for a zone (country pages), excluding cities in that zone. */
export function getComparisonCitiesForZone(timeZone: string, limit = 5, excludeSlug?: string): City[] {
  return resolve(COMPARISON_CITY_SLUGS)
    .filter((other) => other.slug !== excludeSlug && other.timezone !== timeZone)
    .slice(0, limit);
}

/** Cities in a country, best first (priority, then population). */
export function getCitiesInCountry(countryCode: string, limit?: number): City[] {
  const cities = getAllCities()
    .filter((city) => city.countryCode === countryCode)
    .sort((a, b) => a.priority - b.priority || (b.population ?? 0) - (a.population ?? 0) || a.name.localeCompare(b.name));
  return limit ? cities.slice(0, limit) : cities;
}
