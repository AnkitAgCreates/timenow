/**
 * GA4-ready event tracking with a region-aware consent gate.
 *
 * - Nothing loads unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set (never hardcode it).
 * - A stored choice always wins: "granted" loads the tag, "denied" never does.
 * - Without a stored choice the region decides: EU/EEA/UK/Switzerland (or unknown)
 *   see the consent banner and nothing is requested from Google until they accept;
 *   everyone else gets the tag by default and can switch it off on the privacy page.
 * - `track()` is safe to call anywhere; it no-ops until gtag exists.
 */
import { ANALYTICS_CONFIGURED, GA_MEASUREMENT_ID } from '@/lib/analytics-config';
import { type ConsentRegion } from '@/lib/analytics-region';
import { createPersistedStore } from '@/lib/clock/persisted';

export { ANALYTICS_CONFIGURED, GA_MEASUREMENT_ID };
export { consentRegion, requiresConsent, type ConsentRegion } from '@/lib/analytics-region';

export type AnalyticsConsent = 'granted' | 'denied';

/** Validates a stored consent value. */
export function parseConsent(raw: unknown): AnalyticsConsent | null {
  return raw === 'granted' || raw === 'denied' ? raw : null;
}

/** The visitor's choice, kept on the device only (null = not asked yet). */
export const analyticsConsentStore = createPersistedStore<AnalyticsConsent>('timenow:analytics-consent', parseConsent);

/* ---------------------------------------------------------------------------
 * Region: fetched once per tab from /api/geo/ and cached in sessionStorage.
 * Exposed as an external store so components read it with useSyncExternalStore.
 * ------------------------------------------------------------------------- */

const REGION_KEY = 'timenow:region';
let region: ConsentRegion | null = null; // null = not resolved yet
let loading = false;
const regionListeners = new Set<() => void>();
const notifyRegion = () => regionListeners.forEach((listener) => listener());

function readCachedRegion(): ConsentRegion | null {
  try {
    const cached = window.sessionStorage.getItem(REGION_KEY);
    return cached === 'eu' || cached === 'other' ? cached : null;
  } catch {
    return null;
  }
}

export const regionStore = {
  subscribe(listener: () => void) {
    regionListeners.add(listener);
    return () => regionListeners.delete(listener);
  },
  get: (): ConsentRegion | null => region,
  getServer: (): ConsentRegion | null => null,
};

/** Starts resolving the region (idempotent). Safe to call from an effect. */
export function loadRegion() {
  if (typeof window === 'undefined' || region !== null || loading) return;
  const cached = readCachedRegion();
  if (cached) {
    region = cached;
    notifyRegion();
    return;
  }
  loading = true;
  fetch('/api/geo/', { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
    .then((json: { region?: unknown }) => {
      region = json.region === 'other' || json.region === 'eu' ? json.region : 'unknown';
      try {
        if (region !== 'unknown') window.sessionStorage.setItem(REGION_KEY, region);
      } catch {
        // Session storage unavailable: resolve per page load instead.
      }
    })
    .catch(() => {
      region = 'unknown';
    })
    .finally(() => {
      loading = false;
      notifyRegion();
    });
}

/** Test hook: forget the resolved region (unit tests only). */
export function resetRegionForTests() {
  region = null;
  loading = false;
}

export type AnalyticsEvent =
  | 'search_used'
  | 'city_selected'
  | 'timezone_selected'
  | 'timer_started'
  | 'timer_completed'
  | 'converter_used'
  | 'meeting_planner_used'
  | 'tool_selected';

type GtagParams = Record<string, string | number | boolean>;
type Gtag = {
  (command: 'event', name: string, params?: GtagParams): void;
  (command: 'consent', action: 'update', params: GtagParams): void;
};

function getGtag(): Gtag | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { gtag?: Gtag }).gtag;
}

export function track(event: AnalyticsEvent, params: GtagParams = {}) {
  if (!ANALYTICS_CONFIGURED) return;
  getGtag()?.('event', event, params);
}

/** Records the visitor's choice; a withdrawal also tells an already-loaded tag to stop. */
export function setAnalyticsConsent(consent: AnalyticsConsent | null) {
  if (consent === null) analyticsConsentStore.clear();
  else analyticsConsentStore.set(consent);
  if (consent !== 'granted') getGtag()?.('consent', 'update', { analytics_storage: 'denied' });
}
