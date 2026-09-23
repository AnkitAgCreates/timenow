import type { Country } from '@/types/data';
import { GENERATED_COUNTRIES } from './countries.generated';

/**
 * Countries with at least one city in the dataset. Generated from GeoNames
 * by scripts/generate-geo-data.mjs; curation (names, zone remaps, the
 * definite-article and overseas-zone flags) lives in that script so the
 * output can be regenerated deterministically.
 */
export const COUNTRIES: Country[] = GENERATED_COUNTRIES;

/** Homepage directory column "Countries" (live time in the primary zone, linked), in display order. */
export const HOMEPAGE_COUNTRY_SLUGS = ['united-states', 'united-kingdom', 'japan', 'france', 'australia', 'china', 'germany', 'india', 'canada', 'brazil'];
