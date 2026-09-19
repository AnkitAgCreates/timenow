/** Title budget before the " | TimeNow" suffix; search results truncate around 60 characters. */
export const TITLE_BUDGET = 60;

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
