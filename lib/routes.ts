/**
 * Canonical URL builders. Every internal link goes through these so URLs stay
 * lowercase, hyphenated and trailing-slashed.
 */
export const routes = {
  home: () => '/',
  worldClock: () => '/world-clock/',
  city: (slug: string) => `/time/${slug}/`,
  country: (slug: string) => `/countries/${slug}/`,
  countriesHub: () => '/countries/',
  timezonesHub: () => '/timezones/',
  /** UTC and GMT have their own hubs; every other abbreviation lives under /timezones/. */
  timezone: (slug: string) => (slug === 'utc' ? '/utc/' : slug === 'gmt' ? '/gmt/' : `/timezones/${slug}/`),
  utcHub: () => '/utc/',
  gmtHub: () => '/gmt/',
  utcOffset: (slug: string) => `/utc/${slug}/`,
  timerHub: () => '/timer/',
  timer: (slug: string) => `/timer/${slug}/`,
  converterHub: () => '/converter/',
  convert: (from: string, to: string) => `/convert/${from}-to-${to}/`,
  tools: () => '/tools/',
  tool: (slug: string) => `/tools/${slug}/`,
  meetingPlanner: () => '/meeting-planner/',
  alarm: () => '/alarm/',
  stopwatch: () => '/stopwatch/',
  about: () => '/about/',
  privacy: () => '/privacy/',
  contact: () => '/contact/',
} as const;

/** Abbreviation entries served by a dedicated hub instead of /timezones/[slug]/. */
export const TIMEZONE_HUB_SLUGS = ['utc', 'gmt'] as const;

export function isTimezoneHubSlug(slug: string): boolean {
  return (TIMEZONE_HUB_SLUGS as readonly string[]).includes(slug);
}
