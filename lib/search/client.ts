import type { SearchItem } from './match';

let indexPromise: Promise<SearchItem[]> | null = null;

/** Fetch the static search index once per session, on first interaction (shared by search and the converter picker). */
export function loadSearchIndex(): Promise<SearchItem[]> {
  indexPromise ??= fetch('/api/search-index/')
    .then((response) => (response.ok ? (response.json() as Promise<SearchItem[]>) : []))
    .catch(() => {
      indexPromise = null;
      return [];
    });
  return indexPromise;
}
