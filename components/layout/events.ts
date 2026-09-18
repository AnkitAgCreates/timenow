/** Cross-island UI events (avoids wrapping the app in client context providers). */
export const OPEN_SEARCH_EVENT = 'tn:open-search';
export const OPEN_MENU_EVENT = 'tn:open-menu';

export function openSearch() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}

export function openMenu() {
  window.dispatchEvent(new Event(OPEN_MENU_EVENT));
}
