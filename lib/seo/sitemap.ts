/**
 * Sitemap registry. Each section lists only indexable URLs from structured
 * data. Large sections are chunked so the index scales to 10,000+ cities.
 *
 * Respects the global indexing kill switch: when NEXT_PUBLIC_ALLOW_INDEXING is
 * not "true", there are no sitemap files and every sitemap URL returns 404, so
 * previews and staging never publish a URL list.
 */
import { getAllCities } from '@/lib/data/cities';
import { getAllConverterPairs } from '@/lib/data/converters';
import { getPublishedCountries } from '@/lib/data/countries';
import { getAllOffsetPages } from '@/lib/data/offsets';
import { getAllTimerPresets } from '@/lib/data/timers';
import { getLiveTools } from '@/lib/data/tools';
import { getAllTimezones } from '@/lib/data/timezones';
import { isTimezoneHubSlug, routes } from '@/lib/routes';
import { INDEXING_ENABLED, absoluteUrl } from './site';

export const SITEMAP_CHUNK_SIZE = 10_000;

export type SitemapEntry = { path: string; priority?: number; changeFrequency?: 'hourly' | 'daily' | 'weekly' | 'monthly' };

type Section = { name: string; entries: () => SitemapEntry[] };

const SECTIONS: Section[] = [
  {
    name: 'pages',
    entries: () => [
      { path: routes.home(), priority: 1, changeFrequency: 'daily' },
      { path: routes.worldClock(), priority: 0.8, changeFrequency: 'weekly' },
      { path: routes.timezonesHub(), priority: 0.7, changeFrequency: 'weekly' },
      { path: routes.tools(), priority: 0.7, changeFrequency: 'weekly' },
      { path: routes.about(), priority: 0.3, changeFrequency: 'monthly' },
      { path: routes.privacy(), priority: 0.2, changeFrequency: 'monthly' },
      { path: routes.contact(), priority: 0.3, changeFrequency: 'monthly' },
      // Tool pages that don't have their own sitemap section (the converter and timer hubs do).
      ...getLiveTools()
        .filter((tool) => tool.href !== routes.converterHub() && tool.href !== routes.timerHub())
        .map((tool) => ({ path: tool.href, priority: 0.7, changeFrequency: 'weekly' as const })),
    ],
  },
  {
    name: 'cities',
    entries: () =>
      getAllCities()
        .filter((city) => city.indexable)
        .map((city) => ({ path: routes.city(city.slug), priority: city.priority === 1 ? 0.9 : 0.7, changeFrequency: 'daily' })),
  },
  {
    name: 'countries',
    entries: () => [
      { path: routes.countriesHub(), priority: 0.6, changeFrequency: 'weekly' },
      ...getPublishedCountries()
        .filter((country) => country.indexable)
        .map((country) => ({ path: routes.country(country.slug), priority: 0.8, changeFrequency: 'daily' as const })),
    ],
  },
  {
    // UTC and GMT abbreviation entries are canonical at /utc/ and /gmt/ (listed under "utc").
    name: 'timezones',
    entries: () =>
      getAllTimezones()
        .filter((tz) => tz.indexable && !isTimezoneHubSlug(tz.slug))
        .map((tz) => ({ path: routes.timezone(tz.slug), priority: 0.8, changeFrequency: 'weekly' })),
  },
  {
    name: 'utc',
    entries: () => [
      { path: routes.utcHub(), priority: 0.9, changeFrequency: 'weekly' },
      { path: routes.gmtHub(), priority: 0.8, changeFrequency: 'weekly' },
      ...getAllOffsetPages().map((page) => ({ path: routes.utcOffset(page.slug), priority: 0.6, changeFrequency: 'weekly' as const })),
    ],
  },
  {
    name: 'timers',
    entries: () => [
      { path: routes.timerHub(), priority: 0.8, changeFrequency: 'monthly' },
      ...getAllTimerPresets()
        .filter((preset) => preset.indexable)
        .map((preset) => ({ path: routes.timer(preset.slug), priority: 0.7, changeFrequency: 'monthly' as const })),
    ],
  },
  {
    name: 'converters',
    entries: () => [
      { path: routes.converterHub(), priority: 0.9, changeFrequency: 'weekly' },
      ...getAllConverterPairs()
        .filter((pair) => pair.indexable)
        .map((pair) => ({ path: routes.convert(pair.from, pair.to), priority: pair.priority === 1 ? 0.8 : 0.7, changeFrequency: 'weekly' as const })),
    ],
  },
];

type IndexingOptions = {
  /** Defaults to the global NEXT_PUBLIC_ALLOW_INDEXING switch; overridable for tests. */
  indexingEnabled?: boolean;
};

/** Child sitemap file names, e.g. "cities-1.xml". Empty sections are skipped; none when indexing is disabled. */
export function getSitemapFiles({ indexingEnabled = INDEXING_ENABLED }: IndexingOptions = {}): string[] {
  if (!indexingEnabled) return [];
  const files: string[] = [];
  for (const section of SECTIONS) {
    const count = section.entries().length;
    const chunks = Math.ceil(count / SITEMAP_CHUNK_SIZE);
    for (let i = 1; i <= chunks; i++) files.push(`${section.name}-${i}.xml`);
  }
  return files;
}

/** Entries for one child sitemap, or null when the file doesn't exist or indexing is disabled. */
export function getSitemapEntries(file: string, { indexingEnabled = INDEXING_ENABLED }: IndexingOptions = {}): SitemapEntry[] | null {
  if (!indexingEnabled) return null;
  const match = /^([a-z]+)-(\d+)\.xml$/.exec(file);
  if (!match) return null;
  const section = SECTIONS.find((s) => s.name === match[1]);
  if (!section) return null;
  const chunk = Number(match[2]);
  const entries = section.entries();
  const slice = entries.slice((chunk - 1) * SITEMAP_CHUNK_SIZE, chunk * SITEMAP_CHUNK_SIZE);
  return chunk >= 1 && slice.length > 0 ? slice : null;
}

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// <lastmod> is intentionally omitted: a build timestamp is not a real content
// modification date, and inaccurate lastmod values teach crawlers to ignore it.
export function renderSitemapIndex(files: string[]): string {
  const body = files.map((file) => `  <sitemap>\n    <loc>${escapeXml(absoluteUrl(`/sitemaps/${file}`))}</loc>\n  </sitemap>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

export function renderUrlSet(entries: SitemapEntry[]): string {
  const body = entries
    .map((entry) =>
      [
        '  <url>',
        `    <loc>${escapeXml(absoluteUrl(entry.path))}</loc>`,
        entry.changeFrequency ? `    <changefreq>${entry.changeFrequency}</changefreq>` : null,
        entry.priority !== undefined ? `    <priority>${entry.priority.toFixed(1)}</priority>` : null,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}
