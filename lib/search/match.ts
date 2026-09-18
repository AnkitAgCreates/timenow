/** Pure search matching shared by the client combobox and tests. */

export type SearchGroup = 'city' | 'country' | 'timezone';

export type SearchItem = {
  type: SearchGroup;
  /** Primary label: "San Diego", "CST". */
  label: string;
  /** Secondary label: "California, United States", "Central Standard Time". */
  detail: string;
  href: string;
  /** Pre-normalised search terms. */
  terms: string[];
  priority: number;
};

export type SearchResults = Record<SearchGroup, SearchItem[]>;

export const GROUP_LABELS: Record<SearchGroup, string> = {
  city: 'Cities',
  country: 'Countries',
  timezone: 'Time Zones',
};

export const GROUP_ORDER: SearchGroup[] = ['city', 'country', 'timezone'];

const LIMITS: Record<SearchGroup, number> = { city: 6, country: 4, timezone: 5 };

/** Lowercase, strip diacritics and punctuation (keeps + and - for offsets). */
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9+\-:\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreTerm(term: string, query: string): number {
  if (term === query) return 100;
  if (term.startsWith(query)) return 80;
  if (term.split(' ').some((word) => word.startsWith(query))) return 60;
  if (query.length >= 3 && term.includes(query)) return 30;
  return 0;
}

export function scoreItem(item: SearchItem, query: string): number {
  let best = 0;
  for (const term of item.terms) best = Math.max(best, scoreTerm(term, query));
  // Earlier terms (the primary name) outrank aliases and country matches.
  if (best > 0 && item.terms[0] && scoreTerm(item.terms[0], query) === best) best += 5;
  return best > 0 ? best + (4 - Math.min(item.priority, 3)) : 0;
}

export function searchItems(items: SearchItem[], rawQuery: string): SearchResults {
  const query = normalizeSearch(rawQuery);
  const results: SearchResults = { city: [], country: [], timezone: [] };
  if (!query) return results;

  const scored = items
    .map((item) => ({ item, score: scoreItem(item, query) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label));

  for (const { item } of scored) {
    if (results[item.type].length < LIMITS[item.type]) results[item.type].push(item);
  }
  return results;
}

export function flattenResults(results: SearchResults): SearchItem[] {
  return GROUP_ORDER.flatMap((group) => results[group]);
}
