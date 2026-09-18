import type { Country } from '@/types/data';
import { GENERATED_COUNTRIES } from './countries.generated';

/**
 * Countries with at least one city in the dataset. Generated from GeoNames
 * by scripts/generate-geo-data.mjs; curation (names, zone remaps, the
 * definite-article and overseas-zone flags) lives in that script so the
 * output can be regenerated deterministically.
 */
export const COUNTRIES: Country[] = GENERATED_COUNTRIES;
