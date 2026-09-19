import { SITE_NAME } from './site';

/** Appended to every page title by the layout's title template. */
export const TITLE_SUFFIX = ` | ${SITE_NAME}`;

/**
 * Title budget before the suffix. Search results truncate around 60–70
 * characters, and the audit warns above 70 including the suffix, so the
 * budget shrinks with the brand: 70 − " | whattimein.world" (19) = 51.
 */
export const TITLE_BUDGET = 70 - TITLE_SUFFIX.length;

/** Use the descriptive title when it fits the budget, otherwise the compact one. */
export function fitTitle(preferred: string, compact: string, budget = TITLE_BUDGET): string {
  return preferred.length <= budget ? preferred : compact;
}

/** Meta descriptions are cut around 155–160 characters in search results. */
export const DESCRIPTION_BUDGET = 160;

/** Use the fuller description when it fits the budget, otherwise the compact one. */
export function fitDescription(preferred: string, compact: string, budget = DESCRIPTION_BUDGET): string {
  return preferred.length <= budget ? preferred : compact;
}
