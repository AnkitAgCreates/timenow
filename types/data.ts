/**
 * Structured data models. See DATA_MODEL.md for field semantics and how to
 * add entries. Pages are generated from these records — never hand-built.
 */

export type City = {
  /** URL slug, lowercase and hyphenated: /time/[slug]/ */
  slug: string;
  name: string;
  /** Display name of the country, e.g. "United States". */
  country: string;
  /** ISO 3166-1 alpha-2, e.g. "US". Must exist in data/countries.ts. */
  countryCode: string;
  /** State, province or region, when it helps disambiguate. */
  state?: string;
  /** Canonical IANA zone id. Never an abbreviation. */
  timezone: string;
  latitude: number;
  longitude: number;
  population?: number;
  /** 1 = most important. Drives ordering in lists, search and sitemaps. */
  priority: number;
  /** Include in sitemap and allow indexing. */
  indexable: boolean;
  /** Alternate names used by search ("NYC", "Bombay"). */
  aliases?: string[];
  /** GeoNames id the record was generated from (provenance). */
  geonameId?: number;
};

export type Country = {
  /** ISO 3166-1 alpha-2 */
  code: string;
  slug: string;
  name: string;
  /** Name takes "the" mid-sentence ("the United States"). */
  definiteArticle?: boolean;
  /** True when the country's main territory spans more than one UTC offset. */
  multipleTimeZones: boolean;
  /** True when overseas regions use other offsets than the main territory (e.g. France). */
  overseasTimeZones?: boolean;
  /** Whether /countries/[slug]/ has been built. Links are only rendered when true. */
  published: boolean;
  indexable: boolean;
  /** GeoNames continent code: AF, AS, EU, NA, OC, SA, AN. */
  continent: string;
  /** Country population (GeoNames), for ordering only. */
  population: number;
  /** Slug of the capital city when it is in the city dataset. */
  capitalSlug?: string;
  /** IANA zone whose time is shown as "the" country time (the capital's zone, else the largest city's). */
  primaryZone: string;
  /** Every IANA zone in the country (GeoNames + city zones), canonical ids, sorted. */
  zones: string[];
  /** ISO codes of neighbouring countries that also have pages. */
  neighbours: string[];
};

/**
 * A sentence of geography copy plus the IANA zones that back it. Tests verify
 * every listed zone actually behaves as the list it's in claims (seasonal or
 * year-round), so copy can't drift from the time zone data.
 */
export type RegionUsage = {
  /** Reader-facing description, e.g. "Most of Saskatchewan, Canada (Regina, Saskatoon)". */
  label: string;
  /** Exceptions or context shown under the label. */
  note?: string;
  /** IANA zones covering the places in the label. */
  zones: string[];
};

/** A time zone *abbreviation* page, e.g. /timezones/cst/. */
export type TimeZoneEntry = {
  slug: string;
  abbreviation: string;
  name: string;
  /**
   * standard  – a standard-time abbreviation that has a daylight counterpart or regional use (EST, CST, IST)
   * daylight  – a daylight-saving abbreviation (EDT, CDT)
   * universal – a global reference with no DST (UTC, GMT)
   */
  kind: 'standard' | 'daylight' | 'universal';
  /** The UTC offset this abbreviation denotes by definition, in minutes. */
  offsetMinutes: number;
  /**
   * IANA zone whose local time best answers "what time is it in X" searches.
   * For CST this is America/Chicago, which observes CDT in summer — pages
   * must display the zone's real current abbreviation, not the page's.
   */
  referenceZone: string;
  /** Human label for referenceZone, e.g. "Central Time (US & Canada)". */
  referenceLabel: string;
  /** Slug of the standard/daylight counterpart (cst ↔ cdt). */
  counterpart?: string;
  region: string;
  /** One-paragraph factual summary rendered on the page. */
  summary: string;
  /** Places that switch between this abbreviation and its counterpart (standard in winter, daylight in summer). */
  seasonalRegions: RegionUsage[];
  /** Places on this offset all year without daylight saving time. */
  yearRoundRegions: RegionUsage[];
  /** Other meanings of the same abbreviation, for disambiguation. */
  alsoMeans?: Array<{ name: string; offsetMinutes: number }>;
  /** Related timezone slugs for comparison tables and links. */
  related: string[];
  priority: number;
  indexable: boolean;
};

export type TimerPreset = {
  /** Canonical slug: "5-minutes", "1-hour". */
  slug: string;
  seconds: number;
  /** "1 Hour" */
  label: string;
  /** "1 hour" (used mid-sentence) */
  phrase: string;
  /** Short chip label: "1 min", "1 hour". */
  chip: string;
  /** One unique sentence about this length (meta description, intro, hub card). */
  tagline: string;
  /** Concrete, duration-specific uses. */
  useCases: string[];
  /** Questions specific to this length; shown before the shared timer FAQs. */
  faqs?: Array<{ question: string; answer: string }>;
  /** Curated related presets (slugs) shown next to the nearest shorter/longer ones. */
  related?: string[];
  /** Show as a quick preset chip on timer pages. */
  quickPreset: boolean;
  priority: number;
  indexable: boolean;
};

/** An approved converter page: /convert/[from]-to-[to]/ */
export type ConverterPair = {
  /** Timezone entry slugs. */
  from: string;
  to: string;
  priority: number;
  indexable: boolean;
};

export type ToolIconName =
  | 'converter'
  | 'meeting'
  | 'timer'
  | 'alarm'
  | 'stopwatch'
  | 'calendar'
  | 'clock'
  | 'hash'
  | 'hourglass';

export type Tool = {
  key: string;
  name: string;
  shortName: string;
  description: string;
  href: string;
  icon: ToolIconName;
  /** Only live tools are linked; planned tools render as "coming soon". */
  status: 'live' | 'planned';
};
