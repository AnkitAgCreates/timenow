/**
 * GA4-ready event tracking. No-ops unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set
 * and gtag has loaded. Never hardcode a measurement ID.
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';

export type AnalyticsEvent =
  | 'search_used'
  | 'city_selected'
  | 'timezone_selected'
  | 'timer_started'
  | 'timer_completed'
  | 'converter_used'
  | 'meeting_planner_used'
  | 'tool_selected';

type Gtag = (command: 'event', name: string, params?: Record<string, string | number | boolean>) => void;

export function track(event: AnalyticsEvent, params: Record<string, string | number | boolean> = {}) {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  gtag?.('event', event, params);
}
