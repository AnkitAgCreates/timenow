# whattimein.world SEO Architecture

SEO is part of the product architecture: every indexable page is a data record rendered by a validated template, with server-rendered useful content, unique metadata, a canonical URL, breadcrumbs, structured data and internal links.

## URL rules

- Lowercase, hyphenated, trailing slash: `/time/san-diego/`. Builders live in `lib/routes.ts`; never hand-write internal URLs.
- `trailingSlash: true` redirects `/time/san-diego` → `/time/san-diego/` (308).
- `proxy.ts` redirects any mixed-case path to lowercase (308).
- One URL per intent. Wording variants map to one canonical page (`seo/keyword-map.md`); spelling variants of durations redirect (`/timer/60-minutes/` → `/timer/1-hour/`).
- Dynamic templates use `dynamicParams = false`: unknown slugs, unapproved converter pairs and unused UTC offsets return **404**, not thin pages.
- **UTC and GMT are canonical at `/utc/` and `/gmt/`** (Sprint 2 decision). `/timezones/utc/` and `/timezones/gmt/` 308-redirect there, and `routes.timezone('utc')` resolves to the hub so every internal link agrees. GMT-style offset URLs (`/gmt/gmt-minus-5/`) 308-redirect to `/utc/utc-minus-5/` because they denote the same offset.

## Templates

| Template | Route | Title pattern | H1 | Structured data | Revalidate |
| --- | --- | --- | --- | --- | --- |
| Home | `/` | Current Time Now – Exact Local Time, World Clocks & Time Zones | Current Time Now | WebSite, WebPage | 1h |
| City | `/time/[city]/` | Current Time in {City}, {State/Country} – Time Zone & DST | Current Time in {City}, {Country} | WebPage, BreadcrumbList, FAQPage | 1h |
| Time zone | `/timezones/[tz]/` | {Name} ({ABBR}) – Current Time, UTC±X & DST | {Name} ({ABBR}) | WebPage, BreadcrumbList, FAQPage | 1h |
| Timer | `/timer/[duration]/` | {N Unit} Timer – Free Online Countdown with Alarm (unit singular: 25 Minute Timer, 1 Hour Timer) | {N Unit} Timer | WebApplication, BreadcrumbList, FAQPage | static |
| Timer hub (Sprint 3) | `/timer/` | Online Timer – Free Countdown Timer with Alarm | Online Timer | WebApplication, BreadcrumbList, FAQPage | static |
| Converter hub (Sprint 4) | `/converter/` | Time Zone Converter – Convert Time Between Cities and Time Zones | Time Zone Converter | WebApplication, BreadcrumbList, FAQPage | 1h |
| City converter (Sprint 4) | `/convert/[city]-to-[city]/` | {City} to {City} Time Converter – Time Difference & Best Time to Call | {City} to {City} Time Converter | WebApplication, BreadcrumbList, FAQPage | 1h |
| World Clock (Sprint 5) | `/world-clock/` | World Clock – Current Time in Cities Worldwide | World Clock | WebApplication, BreadcrumbList, FAQPage | 1h |
| Meeting Planner (Sprint 5) | `/meeting-planner/` | Meeting Planner – Find a Time Across Time Zones | Meeting Planner | WebApplication, BreadcrumbList, FAQPage | 1h |
| Site pages | `/about/`, `/privacy/`, `/contact/` | fixed titles (About This Site…, Privacy Policy…, Contact…) | About whattimein.world / Privacy Policy / Contact | WebPage, BreadcrumbList | static |
| Alarm / Stopwatch (Sprint 5) | `/alarm/`, `/stopwatch/` | Online Alarm Clock – …, Online Stopwatch – … | Online Alarm Clock / Online Stopwatch | WebApplication, BreadcrumbList, FAQPage | static |
| Calculators (Sprint 5) | `/tools/[tool]/` | {Tool} – {benefit} | {Tool} | WebApplication, BreadcrumbList, FAQPage | static / 1h |
| Tools hub, Time zones hub (Sprint 5) | `/tools/`, `/timezones/` | Time Tools – …, Time Zone Abbreviations – … | Time Tools / Time Zone Abbreviations | WebPage, BreadcrumbList, FAQPage | static / 1h |
| Converter | `/convert/[a]-to-[b]/` | {A} to {B} Converter – {A name} to {B region} | {A} to {B} Converter | WebApplication, BreadcrumbList, FAQPage | 1h |
| Country (Sprint 2) | `/countries/[country]/` | Current Time in {Country} – Time Zones, DST & Major Cities | Current Time in {Country} | WebPage, BreadcrumbList, FAQPage | 1h |
| Countries hub (Sprint 2) | `/countries/` | Current Time by Country – Time Zones Directory | Current Time by Country | WebPage, BreadcrumbList | 1h |
| UTC / GMT hubs (Sprint 2) | `/utc/`, `/gmt/` | UTC Time Now – Coordinated Universal Time (UTC+0) & All UTC Offsets | Coordinated Universal Time (UTC) | WebPage, BreadcrumbList, FAQPage | 1h |
| UTC offset (Sprint 2) | `/utc/[offset]/` | {UTC±X} Time Now – Current Time at {UTC±X} (GMT±X) | {UTC±X} Time Now | WebPage, BreadcrumbList, FAQPage | 1h |

The `| whattimein.world` suffix is appended by the layout's title template.

### Rendering strategy

- Pages are **static + ISR (1 hour)**. Indexable content (time zone facts, DST dates, differences, conversion tables, sunrise/sunset, FAQs) is server-rendered for the render instant and labelled with its date, so it is truthful even when cached.
- Live values (clock digits, current abbreviation, DST status, differences) are client islands that switch to live computation after hydration, so a DST change is reflected immediately even from a cached page.
- The live clock does not make the page client-rendered: page components are Server Components; only small islands hydrate.

## Metadata

`buildMetadata()` in `lib/seo/metadata.ts` produces title, description, absolute canonical (`alternates.canonical` + `metadataBase` from `NEXT_PUBLIC_SITE_URL`), robots, Open Graph and Twitter tags for every page. Descriptions are generated from data (zone summary, DST behaviour, durations), not boilerplate.

## Indexation control

Two layers, both required for a page to be indexed:

1. **Global switch:** `NEXT_PUBLIC_ALLOW_INDEXING === 'true'`. Otherwise every page is `noindex` and robots.txt is `Disallow: /`, so previews and staging can't leak into the index.
2. **Per record:** `indexable` on cities, countries, time zones, timer presets and converter pairs. Non-indexable records get `noindex, follow` and are left out of sitemaps.

With the global switch off, every page is `noindex`, robots.txt is `Disallow: /` with no `Sitemap:` line, and all sitemap URLs return 404.

Indexation after Sprint 2:

| Indexed | Not indexed (noindex, follow) |
| --- | --- |
| `/`, ~470 city pages, `/countries/` + 96 country pages, `/utc/`, `/gmt/`, ~40 UTC offset pages, `/timezones/` + 50 time zone pages, `/timer/` + 30 timer pages, `/converter/` + 108 zone-pair and 48 city-pair conversion pages, `/world-clock/`, `/meeting-planner/`, `/alarm/`, `/stopwatch/`, `/tools/` + 4 calculators | 404 page, `/api/*`, meeting-planner share links (query strings canonicalise to `/meeting-planner/`) |

Planned features (meeting planner, alarm, stopwatch, date tools) have **no routes and are not linked**, so crawlers never find placeholder pages.

### Programmatic scale controls (Sprint 2)

- **Cities** come from a generator with per-country quotas, a population floor and satellite suppression, so the set is ~470 real cities, not every GeoNames row (DATA_MODEL.md). Each page has unique facts: coordinates-driven sunrise/sunset and nearby cities, zone-specific DST dates, dynamic differences.
- **Countries** exist only for countries that have cities; their content (zone groups, DST behaviour per zone, capital, neighbours) is unique per country.
- **UTC offsets** exist only for offsets that dataset zones actually use in the current year (~40), never all 24×4 possible values.
- **Abbreviations** are hand-curated entries (50) with tz-verified geography.
- **Converters** (Sprint 4) are a curated corridor list (`data/converters.ts`), not a product of all zones or cities: 54 zone corridors and 24 city corridors, each in both directions because tables, "9 AM" answers and call slots differ by direction. Every page's facts (live clocks, hourly table, difference periods across DST changes, call slots, FAQs) are computed for the two sides, so no page is a template with only the names swapped. Unapproved pairs 404.
- **Timers** (Sprint 3) are a curated allowlist of 30 lengths. Each preset must carry a unique tagline, three or more concrete use cases and at least one question specific to that length (enforced by `lib/data/timers.test.ts`), so pages differ in substance and not only in the number. Other lengths 404; spelling variants (`-min`, `-mins`, `-sec`, `-hr`, `N-seconds`) 308-redirect. "Pomodoro" maps to `/timer/25-minutes/` rather than a keyword URL.

## Sitemaps

- **Kill switch:** when `NEXT_PUBLIC_ALLOW_INDEXING` is not `"true"`, `/sitemap.xml` and every `/sitemaps/*.xml` return **404** (no child sitemaps are generated at all), so preview and staging deployments never publish a URL list. Verified by unit tests and by a Playwright project that runs against a build with indexing off.
- `/sitemap.xml`: a sitemap index built by `app/sitemap.xml/route.ts`.
- `/sitemaps/{section}-{n}.xml`: child sitemaps per section (`pages`, `cities`, `countries`, `timezones`, `utc`, `timers`, `converters`), chunked at 10,000 URLs (`SITEMAP_CHUNK_SIZE`), statically generated. The `timezones` section excludes the UTC/GMT entries, which are listed under `utc` at their hub URLs.
- Sections are registered in `lib/seo/sitemap.ts` and read only `indexable` records. To add a section (e.g. countries), add one entry to `SECTIONS`.
- `<lastmod>` is deliberately omitted: a build timestamp isn't a real content change date.
- Tests assert every indexable reference URL appears exactly once and paths are well-formed.

## robots.txt

`app/robots.ts`: with indexing on, `Allow: /`, `Disallow: /api/`, `Sitemap: {SITE_URL}/sitemap.xml`. With indexing off, `Disallow: /`. Query-string variants are handled by canonicals, not robots rules, so crawlers can still fetch versioned assets.

## Structured data

Builders in `lib/seo/jsonld.ts`, rendered by `components/seo/JsonLd.tsx` (with `<` escaped).

- **WebSite / WebPage** on the homepage and content pages.
- **BreadcrumbList** from the visible breadcrumb. Unpublished crumbs (countries) are omitted, because Google requires `item` on all but the last element.
- **FAQPage** only where the same Q&A is visible on the page. Google currently shows FAQ rich results only for authoritative government/health sites, so this is for accurate machine-readable content, not expected rich results.
- **WebApplication** for the timer and converter (free, any OS).
- No `SearchAction`: there is no search results URL (and search result pages must never be indexed).

All five reference pages' JSON-LD was parsed and validated during Sprint 1 verification.

- **City photos:** when a city has a curated photo, the WebPage carries `primaryImageOfPage` / `image` as an `ImageObject` with `contentUrl`, `width`/`height`, `caption`, `creditText`, `creator`, `license` and `acquireLicensePage` (the Commons file page) — the fields Google reads for image credits — and the page metadata adds `og:image` / `twitter:card=summary_large_image` with the same file (`buildMetadata({ image })`). Cities without a photo emit neither.

## Internal linking (from data)

| Page | Links to |
| --- | --- |
| City | Comparison cities (difference table), nearby cities (by distance), its time zone pages (`getTimezonesForZone`), related approved converters, converter hub. Country page once `published` |
| Time zone | Associated cities (seasonal + year-round zones), related abbreviations (comparison table), approved converters involving it, hub |
| Timer | Quick-preset chips, related timers (nearest lengths + curated pairs such as 25 ↔ 5 minutes), the grouped directory of all timers, timer hub, stopwatch and alarm (Sprint 5) |
| Tool pages (Sprint 5) | Every other live tool ("More time tools"), the tools hub; the world clock links countries, abbreviations, UTC, converter and planner; converter pairs and city pages link the meeting planner pre-filled with their zones |
| Converter | Both sides' pages (abbreviation pages or city pages), the reverse pair, related approved converters of the same kind, converter hub. City pages link their city-to-city converters; abbreviation and offset pages link their zone converters |
| Country (Sprint 2) | Its cities (table + cards), the abbreviation pages for each zone group, neighbouring countries, converter hub, countries hub. City pages link back through the breadcrumb (now a real link) |
| UTC offset (Sprint 2) | Cities on the offset, abbreviation pages that denote it, their converters, neighbouring offsets, the UTC and GMT hubs; the hubs' offsets directory links every offset page |
| Global | Header nav, mobile menu "Popular" links, footer |

Stopwatch, alarm and meeting-planner links will be added automatically when those tools are `status: 'live'` in `data/tools.ts`.

## Search

Global search is client-side over a static JSON index (`/api/search-index/`, `X-Robots-Tag: noindex`, disallowed in robots) fetched on first interaction, so it adds nothing to page weight. There is no search results page to index. At 10,000+ cities the index should move to a server route with prefix queries (see technical debt).

## Analytics readiness

`lib/analytics.ts` `track()` is wired for `search_used`, `city_selected`, `timezone_selected`, `timer_started`, `timer_completed`, `converter_used`. GA4 loads only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.

## Homepage internal links

The homepage directory (`components/home/WorldTimeDirectory.tsx`) links thirty high-value pages — ten cities, ten countries, ten abbreviation pages — with their names as anchor text, plus the three hubs. The lists are curated in data, not generated, so the homepage stays focused; it is the strongest internal-link source on the site and should keep pointing at the pages that matter most.

## One host, one case (`proxy.ts`)

The proxy permanently redirects (308) two kinds of duplicates before any page renders: mixed-case paths to their lowercase form, and — only when indexing is on — requests that arrive on a non-canonical host (the `*.vercel.app` aliases and per-deployment URLs) to the same path on `NEXT_PUBLIC_SITE_URL`. Local hosts (`localhost`, `127.0.0.1`) are never redirected, so the dev server, the e2e servers and CI keep working; previews have indexing off and are left alone. Logic and tests: `lib/seo/canonical-host.ts`. `www.whattimein.world` is redirected to the apex by Vercel itself (domain-level redirect).

## IndexNow

`npm run seo:indexnow` (`scripts/seo/indexnow.mts`, helpers in `lib/seo/indexnow.ts`) submits URLs to the shared IndexNow endpoint, which forwards them to Bing, Yandex, Naver, Seznam and the other participating engines. With no arguments it reads the live sitemap index and submits every URL (one request holds up to 10,000); `--urls /a/,/b/` submits specific paths; `--dry-run` prints the payload. The key is public by design and lives in `lib/seo/indexnow.ts` and `public/<key>.txt`; the engines verify it by fetching that file, and the script refuses to run if the live file does not match. The manual workflow `.github/workflows/indexnow.yml` runs the same script from GitHub. Google does not use IndexNow; it relies on the sitemaps.

## Page-quality audit and Search Console workflow (Sprint 6)

- `scripts/seo/audit-site.mts` (rules in `lib/seo/audit-rules.ts`) reads the prerendered HTML and sitemaps of a build. **Errors** fail CI: missing/mismatched canonical, missing title or description on an indexable page, H1 count ≠ 1, invalid JSON-LD, indexable page absent from sitemaps, noindex page in a sitemap, sitemap URL without a page, internal link to a non-page. **Warnings**: title outside 15–70 characters (site suffix included), description outside 50–170, duplicate titles/descriptions, no inbound internal links, `<main>` under 200 words, missing BreadcrumbList/WebPage schema.
- `scripts/seo/analyze-gsc.mts` (logic in `lib/seo/gsc-analysis.ts`) takes Search Console exports and the audit's inventory and reports high-impression/low-CTR pages, positions 5–20, missing pages by intent (city/country, abbreviation, timer length, converter corridor — each mapped to the candidate path but never created automatically), cannibalisation, internal-link suggestions from the link graph, and titles that lack their top query's wording. See `seo/SEARCH_CONSOLE_WORKFLOW.md`.
- **Title budget:** 51 characters before the " | whattimein.world" suffix — derived in `lib/seo/title.ts` as 70 minus the suffix length, so the audit's 70-character limit holds including the brand (`fitTitle` picks a compact pattern when the descriptive one does not fit). **Description budget:** 160 characters (`fitDescription`, same idea: city, country and abbreviation templates fall back to an abbreviation-only form when the zone's long name would not fit). Every template was tightened in Sprint 6 after the first audit (city, country, abbreviation, UTC offset and zone-converter descriptions; converter, city, country, abbreviation, UTC/GMT and converter-hub titles).
- **Orphans:** country pages list every city in the country (not only the 12 major ones), so every city page has at least one inbound link besides nearby-city links.
- **Ambiguous city names** (Columbus, Ohio vs Columbus, Georgia) are qualified in descriptions so no two pages share one.

## Decisions

1. **`/utc/` and `/gmt/` are canonical** (decided before Sprint 2, implemented in Sprint 2): the `/timezones/` variants redirect, and the hubs add the offsets directory.
2. **Daylight abbreviation pages (EDT/CDT/MDT/PDT, and now CEST/EEST/WEST/ACDT/AEDT/NZDT/ADT/NDT/AKDT).** Indexable. If Search Console shows them cannibalising the standard pages, canonicalise them to the standard page instead.
3. **Hub indexation.** Every hub is indexable since Sprint 5: `/countries/`, `/timer/`, `/converter/`, `/timezones/` (abbreviations grouped by region with live times and FAQs), `/world-clock/` (the tool itself plus popular cities and FAQs) and `/tools/` (all ten tools with a which-tool guide and FAQs). No route is noindex except the 404 page and `/api/*`.
4. **Country vs city intent.** "india time now" targets `/countries/india/`; "delhi time" targets `/time/new-delhi/`. Both pages link to each other.
