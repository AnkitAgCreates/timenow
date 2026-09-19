# whattimein.world

Formerly TimeNow: the brand was renamed to match the domain on 2026-09-19. Internal identifiers (npm package name, `TIMENOW_DIST_DIR`, `timenow:*` localStorage keys, launch config names, the GitHub repository) keep the old name on purpose.

SEO-first time utility platform: current time, city clocks, time zone abbreviation pages, a DST-aware converter and online timers.

- **Design source of truth:** `references/visual-prd.png` (layout and visual language only).
- **Time source of truth:** IANA time zone data via `Intl.DateTimeFormat`, through the time engine in `lib/time/`. Never copy times, offsets or DST states from the PRD mockups.

Status: **Sprint 6 complete** (SEO optimisation: static page-quality audit in CI, Search Console opportunity analysis, metadata tightened across every template) — all six sprints in `CLAUDE.md` delivered. See `CLAUDE.md` for the roadmap and `seo/SEARCH_CONSOLE_WORKFLOW.md` for the SEO workflow.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16.3 (App Router, Turbopack), React 19.3 |
| Language | TypeScript 6.0 (strict, `noUncheckedIndexedAccess`) |
| Styling | Tailwind CSS 4.3 with tokens in `app/globals.css` |
| Tests | Vitest 5 (Node environment, runs under `TZ=Pacific/Chatham`) |
| Lint | ESLint 9 + `eslint-config-next` (core-web-vitals + TypeScript) |
| Runtime deps | `next`, `react`, `react-dom` only |
| Data | GeoNames (CC BY 4.0) via `scripts/generate-geo-data.mjs`; time facts from IANA tzdata through `Intl` |

TypeScript is pinned to 6.0 and ESLint to 9 because `typescript-eslint` does not yet support TypeScript 7 and the Next ESLint plugins do not yet support ESLint 10.

## Local setup

Requires Node.js ≥ 22.12.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for canonicals, sitemaps, robots and Open Graph. No trailing slash. **Required in production.** |
| `NEXT_PUBLIC_ALLOW_INDEXING` | Must be exactly `true` on production. Any other value forces `noindex` everywhere and `Disallow: /` in robots.txt. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional GA4 ID. When empty, no analytics script loads and `track()` is a no-op. |

`NEXT_PUBLIC_*` values are inlined at build time, so rebuild after changing them.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (static generation + ISR) |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over the repo |
| `npm test` | Vitest unit tests (time engine, DST classification, USNO sun fixtures, data integrity, search, bootstrap parity) |
| `npm run test:e2e` | Playwright smoke tests against two production builds (indexing on and off), desktop + mobile |
| `npm run verify` | typecheck → lint → test → build |
| `npm run verify:full` | `verify` + end-to-end tests |

## Regenerating the city and country data

City and country records are generated from GeoNames (Creative Commons Attribution 4.0; the footer carries the required credit). The raw files are git-ignored; the generated TypeScript is committed.

```bash
mkdir -p data/sources/geonames && cd data/sources/geonames && curl -O https://download.geonames.org/export/dump/cities15000.zip && curl -O https://download.geonames.org/export/dump/countryInfo.txt && curl -O https://download.geonames.org/export/dump/admin1CodesASCII.txt && curl -O https://download.geonames.org/export/dump/timeZones.txt && unzip -o cities15000.zip && cd -
```

```bash
node scripts/generate-geo-data.mjs
```

`node scripts/fetch-city-images.mjs` downloads and crops the curated city photos (needs network access; see `DATA_MODEL.md`). `node scripts/generate-geo-data.mjs --check` exits non-zero when the committed output is stale. Selection rules, quotas and curated overrides live in the script and are described in `DATA_MODEL.md`.

## SEO audit and Search Console workflow

```bash
npm run seo:audit -- --site-url https://timenow.example      # audits the build in .next → seo/reports/site-audit.md (+ site-inventory.json)
npm run seo:gsc -- --queries Queries.csv --pages Pages.csv    # Search Console exports → seo/reports/gsc-opportunities.md
npm run seo:indexnow -- --urls /time/london/                  # IndexNow (Bing, Yandex, …); no --urls = every sitemap URL
```

The audit checks every prerendered page (title/description length and duplicates, one H1, canonical, robots vs sitemap, JSON-LD, broken internal links, orphans, thin pages) and fails CI on errors; the analysis turns Search Console exports into a reviewed list of opportunities (low CTR, positions 5–20, missing pages by intent, cannibalisation, internal-link and metadata suggestions). Nothing is published automatically. Details in `seo/SEARCH_CONSOLE_WORKFLOW.md`; synthetic samples in `seo/samples/`.

## Deploying to Vercel

The site is a standard Next.js build: static pages with hourly ISR, no custom server, no database. Vercel auto-detects the framework; no `vercel.json` is needed.

1. The Vercel project is `whattimein` (created 2026-09-19 with `vercel link --project whattimein`, GitHub repository `AnkitAgCreates/timenow` connected, production alias https://whattimein.vercel.app). To deploy from a machine that is signed in: `npx vercel deploy --prod --archive=tgz` — `.vercelignore` keeps local builds, test output and raw datasets out of the upload. Pushes to `main` deploy through the GitHub connection.
2. Set the environment variables (Project → Settings → Environment Variables). They are read at build time, so set them before the first production build and redeploy after changing them.

   | Variable | Production | Preview |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | `https://whattimein.world` once the domain is attached; the `*.vercel.app` URL until then | leave unset |
   | `NEXT_PUBLIC_ALLOW_INDEXING` | `true` only when the real domain is live | leave unset (previews stay noindex and blocked in robots.txt) |
   | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | optional GA4 id | leave unset |

3. Add the domain (Settings → Domains). `www.whattimein.world` and `whattimein.world` are attached; Vercel redirects `www` to the apex, and the app's proxy redirects every other host (the `*.vercel.app` aliases) to `NEXT_PUBLIC_SITE_URL` once indexing is on. DNS at the registrar: `A @ 76.76.21.21` (or Vercel's current A record) and `CNAME www cname.vercel-dns.com`.
4. After the first production deploy, open `/robots.txt`, `/sitemap.xml` and a city page and confirm the canonical shows the real domain; then verify the domain in Search Console and submit the sitemap (`seo/SEARCH_CONSOLE_WORKFLOW.md`).

Until the domain is attached, keep `NEXT_PUBLIC_ALLOW_INDEXING` unset so the `*.vercel.app` deployment is never indexed as a duplicate.

## Supported browsers

`browserslist` in `package.json` declares the support policy: browsers released from 2023 onward (Chrome/Edge 109+, Firefox 115+, Safari/iOS 16+). Older browsers are not tested. Widen the list if analytics show a meaningful share of them. Note that Next.js ships its own small polyfill set (`Array.prototype.at`, `Object.hasOwn`, …) inside its runtime chunk regardless of this list; Lighthouse reports it as about 14 KB of legacy JavaScript, and it cannot be removed from app configuration.

## Continuous integration

`.github/workflows/ci.yml` runs on every push to `main` and every pull request: one job for typecheck, lint, unit tests and the production build, and one for the Playwright suite against the two production builds (desktop, mobile and kill-switch projects; the HTML report is uploaded on failure). A third job, "SEO audit", builds the indexed variant and runs `npm run seo:audit`, uploading `seo/reports/` as an artifact. `.github/workflows/geonames-drift.yml` is manual (Actions → "GeoNames drift check"): it downloads today's GeoNames export and runs `node scripts/generate-geo-data.mjs --check`, so a failure there means upstream data moved, not that the code is broken.

## Project structure

```text
app/                    Routes (Server Components by default)
  page.tsx              Homepage
  time/[city]/          City template
  countries/[country]/  Country template (+ indexable hub)
  utc/, gmt/            UTC and GMT hubs (canonical for the UTC/GMT abbreviations)
  utc/[offset]/         UTC offset template (curated: offsets in real use)
  timezones/[timezone]/ Abbreviation template (+ hub)
  timer/[duration]/     Timer template (+ hub)
  convert/[pair]/       Conversion template: time zone pairs and city pairs (corridor allowlist)
  converter/            Converter hub (indexable; city/zone/offset picker)
  world-clock/          World Clock (add/remove places, saved locally)
  meeting-planner/      Meeting Planner (2–4 places, hour grid, suggested slots, share link)
  alarm/ stopwatch/     Alarm clock and stopwatch
  tools/                Tools hub + date-difference, hours-calculator, military-time-converter, unix-timestamp
  sitemap.xml/ sitemaps/[file]/    Sitemap index + chunked child sitemaps
  robots.ts  not-found.tsx  api/search-index/
components/             Reusable UI (clock, city, timezone, timer, converter, search, layout, seo, ui)
data/                   Structured records: cities + countries (generated), timezones (+ timezones-world), timers, converters, tools
scripts/                generate-geo-data.mjs (GeoNames → generated data); fetch-city-images.mjs (Commons photos → public/cities + manifest); seo/audit-site.mts, seo/analyze-gsc.mts, seo/indexnow.mts
lib/
  time/                 Time engine (pure, tested): zone, dst, zone-metadata, zone-names, transitions, sun, meeting
  tools/                Pure calculator logic (date difference, hours, military time, Unix timestamps, stopwatch, alarm)
  clock/                Live clock store, persisted stores (localStorage via useSyncExternalStore), beep
  clock/                Live-clock runtime: inline bootstrap, stores, formatting
  content/              Data-driven page copy and FAQs
  data/                 Accessors over data/
  seo/                  Metadata, JSON-LD, sitemap registry, site config
  search/               Search index builder + matcher
  timezones/            CST/CDT-style status logic
types/                  Data model types
proxy.ts                Lowercase URL enforcement
references/             Visual PRD
seo/keyword-map.md      Keyword → canonical URL map
```

## Routes (after Sprint 2)

| Route | Pages | Indexable |
| --- | --- | --- |
| `/` | 1 | yes |
| `/time/[city]/` | ~470 generated cities (all 25 Sprint 1 seeds kept) | yes |
| `/countries/` and `/countries/[country]/` | hub + 96 countries | yes |
| `/utc/`, `/gmt/` | UTC and GMT hubs with an offsets directory | yes |
| `/utc/[offset]/` | ~40 curated offsets (only those used somewhere in the dataset) | yes |
| `/timezones/[timezone]/` | 50 abbreviations (11 core + 39 world; UTC/GMT live at their hubs) | yes |
| `/timer/` and `/timer/[duration]/` | hub + 30 curated presets (30 s – 24 h) | yes |
| `/converter/` | hub with the searchable converter | yes |
| `/convert/[from]-to-[to]/` | curated corridors, both directions: ~110 time zone pairs (IST, EST, PST, CST, MST, GMT, UTC, BST, CET, EET, AEST, NZST, JST, SGT, HKT, GST, PHT) and ~50 city pairs (London, New York, Los Angeles, Chicago, Paris, Berlin, Dubai, New Delhi, Singapore, Hong Kong, Tokyo, Sydney, Toronto) | yes |
| `/world-clock/`, `/meeting-planner/`, `/alarm/`, `/stopwatch/` | tools (Sprint 5) | yes |
| `/about/`, `/privacy/`, `/contact/` | site pages (`components/site/InfoPage.tsx`) | yes |
| `/tools/date-difference/`, `/tools/hours-calculator/`, `/tools/military-time-converter/`, `/tools/unix-timestamp/` | calculators (Sprint 5) | yes |
| `/timezones/`, `/tools/` | hubs (indexable since Sprint 5) | yes |

Unknown slugs return 404 (`dynamicParams = false`). Mixed-case URLs 308-redirect to lowercase; timer spelling variants (`/timer/60-minutes/`) 308-redirect to the canonical preset; `/timezones/utc/` → `/utc/`, `/timezones/gmt/` → `/gmt/`, and `/gmt/gmt-minus-5/` → `/utc/utc-minus-5/`.

## Common tasks

Details and field definitions are in `DATA_MODEL.md` and `SEO_ARCHITECTURE.md`.

- **Add a city:** add its GeoNames id to `MUST_INCLUDE` (or raise the country quota) in `scripts/generate-geo-data.mjs`, regenerate, and if the zone is new add it to `ZONE_METADATA` in `lib/time/zone-metadata.ts` (dated eras if its rules changed). Run `npm test`.
- **Add a city photo:** add the slug (and alt text, optionally a specific Commons `file`) to `data/sources/city-images.json`, run `node scripts/fetch-city-images.mjs --contact review.jpg`, check the review sheet, and commit the two WebP files under `public/cities/` plus `data/city-images.generated.ts`. Only free Commons licences are accepted; credits render on the page. See `DATA_MODEL.md`.
- **Add a country:** give it a quota in the script (its capital is included automatically) and regenerate; the country page appears with the first city.
- **Add a time zone page:** append a `TimeZoneEntry` to `data/timezones-world.ts`. The data-integrity tests verify every listed zone really switches or stays fixed as described.
- **UTC offset pages:** derived automatically from the zones in use (`lib/data/offsets.ts`); nothing to add by hand.
- **Add a timer page:** append a `TimerPreset` to `data/timers.ts` with a canonical slug (`timerSlugForSeconds`), a unique tagline, three or more use cases and at least one length-specific FAQ (tests enforce all of these). Alias redirects are generated automatically.
- **Add a converter page:** add a corridor to `ZONE_CORRIDORS` (two abbreviation slugs) or `CITY_CORRIDORS` (two city slugs) in `data/converters.ts`; both directions are generated. Tests reject same-zone pairs, EST↔EDT-style pairs, UTC↔GMT and city slugs that shadow abbreviations.
- **Control indexation:** per record with `indexable`, globally with `NEXT_PUBLIC_ALLOW_INDEXING`.
- **Sitemaps:** generated from indexable records by `lib/seo/sitemap.ts`, chunked at 10,000 URLs per file. When indexing is disabled, every sitemap URL returns 404.

### End-to-end tests

`npm run test:e2e` runs `e2e/serve-builds.mjs`, which builds the site twice (sequentially) into `.next-e2e/indexed` and `.next-e2e/noindex`, serves them on ports 3310 and 3311, and runs Playwright:

- **desktop** and **mobile** (Pixel 7) projects: reference pages, hydration/console errors, horizontal overflow, DST-correct clocks at frozen instants, search, timer, mobile menu, redirects and 404s, SEO tags and sitemaps.
- **kill-switch** project: robots.txt, sitemap 404s and `noindex` on a build with indexing off.

Locally the installed Google Chrome is used. In CI, run `npx playwright install chromium` first. Set `PW_REUSE_SERVER=1` to reuse already-running servers.

The production server logs `Error: Internal: NoFallbackError` when an unknown slug hits a route with `dynamicParams = false`. That is Next.js's internal 404 signal; the response is a correct 404.

## Verification checklist

`npm run verify`, then with a production build:

- `/sitemap.xml` and `/sitemaps/*.xml` list only indexable URLs with the production origin
- `/robots.txt` references the sitemap (and disallows everything when indexing is off)
- Each reference page has a unique title, description, canonical and one H1
- Unknown slugs and unapproved converter pairs return 404
