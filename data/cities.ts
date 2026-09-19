import type { City } from '@/types/data';
import { CITY_IMAGES } from './city-images.generated';
import { GENERATED_CITIES } from './cities.generated';

/**
 * City dataset (Sprint 2: ~470 cities, ~100 countries). Generated from
 * GeoNames by scripts/generate-geo-data.mjs, which also holds the curated
 * overrides (display names, aliases, seed-city priorities, exclusions).
 * Never edit cities.generated.ts by hand — change the script and regenerate.
 *
 * Coordinates are city-centre points used for sunrise/sunset and nearby-city
 * distance. Time facts are never stored: only the IANA zone id.
 */
export const CITIES: City[] = GENERATED_CITIES.map((city) => (CITY_IMAGES[city.slug] ? { ...city, image: CITY_IMAGES[city.slug] } : city));

/** Pixel sizes of the two crops written by scripts/fetch-city-images.mjs. */
export const CITY_IMAGE_SIZES = {
  hero: { width: 1600, height: 400 },
  card: { width: 640, height: 256 },
} as const;

/** Homepage "Popular Cities", in display order. */
export const POPULAR_CITY_SLUGS = ['new-york', 'london', 'dubai', 'singapore', 'tokyo', 'sydney'];

/**
 * Global reference cities used for "time difference" tables on city and
 * country pages, in order of preference. The current city and cities sharing
 * its zone are skipped.
 */
export const COMPARISON_CITY_SLUGS = ['new-york', 'london', 'dubai', 'new-delhi', 'tokyo', 'sydney', 'los-angeles', 'singapore'];
