/**
 * GA4-ready event tracking with a consent gate.
 *
 * - Nothing loads unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set (never hardcode it).
 * - Even then, the Google tag is only loaded after the visitor accepts the consent
 *   banner ("basic" consent mode: no request to Google, no cookie, before consent).
 * - `track()` is safe to call anywhere; it no-ops until gtag exists.
 */
import { ANALYTICS_CONFIGURED, GA_MEASUREMENT_ID } from '@/lib/analytics-config';
import { createPersistedStore } from '@/lib/clock/persisted';

export { ANALYTICS_CONFIGURED, GA_MEASUREMENT_ID };

export type AnalyticsConsent = 'granted' | 'denied';

/** Validates a stored consent value. */
export function parseConsent(raw: unknown): AnalyticsConsent | null {
  return raw === 'granted' || raw === 'denied' ? raw : null;
}

/** The visitor's choice, kept on the device only (null = not asked yet). */
export const analyticsConsentStore = createPersistedStore<AnalyticsConsent>('timenow:analytics-consent', parseConsent);

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
