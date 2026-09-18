# TimeNow — Sprint 2 Completion Report (Programmatic SEO)

- **Project:** TimeNow (SEO-first time utility platform)
- **Report date:** 2026-09-18
- **Prepared by:** Claude Code (implementation agent)
- **Purpose:** independent verification by a second reviewer
- **Governing spec:** `CLAUDE.md` (Sprint 2 section) + the approvals and decisions in §2
- **Previous report:** `SPRINT_0_1_REPORT.md` (Sprint 0 + 1, approved before this sprint)
- **Design reference:** `references/visual-prd.png` (design only; never a source of time values)

---

## How to use this report (for the reviewer)

1. Every **evidence** block is copied from real command output run on 2026-09-18 after the last change. Anything **not** verified is listed explicitly in §16.
2. §6 documents how the 469 cities and 96 countries were selected from GeoNames, with every curation rule, so the dataset can be audited rather than trusted.
3. §7 lists the time zone facts the new templates assert (zone groups per country, which offsets get pages, rule-change eras) with the tests that enforce them.
4. §9 lists every change made to the approved Sprint 1 reference experiences and why Sprint 2 integration required it.
5. §18 is a checklist of independent checks. If the source bundle (`exports/timenow-sprint-2-source.zip`) is attached, suggested review order: `scripts/generate-geo-data.mjs`, `lib/data/dataset.test.ts`, `lib/time/zone-metadata.ts` + its test, `lib/content/country.ts`, `lib/data/offsets.ts`, `lib/content/offset.ts`, `app/countries/[country]/page.tsx`, `app/utc/[offset]/page.tsx`, `lib/seo/sitemap.ts`, `next.config.ts` (redirects), `e2e/sprint2.spec.ts`.

---

## 1. Summary

| Area | Status |
| --- | --- |
| Cities expanded to 300–500 | **469 cities in 96 countries**, generated from GeoNames by a deterministic, documented script (§6) |
| Country pages (`/countries/[country]/` + indexable `/countries/` hub) | Complete — 96 pages; multi-zone countries grouped by zone behaviour (§7.3) |
| Time zone abbreviation pages | 11 → **50** (`/timezones/[tz]/`); UTC and GMT moved to their hubs |
| UTC/GMT hubs and offset pages | `/utc/`, `/gmt/` + **33 curated offset pages** (only offsets in real use, §7.4); GMT variants redirect |
| Metadata, canonicals, structured data, breadcrumbs, internal linking, sitemaps | Complete for every template (§8); city breadcrumbs now link to the country page |
| Typecheck / Lint / Unit tests / Production build | Pass / Pass / **363 of 363 pass (12 files)** / Pass — **683 static pages** (indexing off; the indexed build also emits the 7 child sitemaps) |
| End-to-end (Playwright, two production builds, desktop + mobile + kill switch) | **79 passed, 3 intentionally skipped, 0 failed** |
| HTTP verification of the indexed build (canonicals, robots, JSON-LD, 308s, 404s, 7 sitemaps = 672 URLs) | Pass (§12) |
| Horizontal overflow / single H1 / console errors on new templates (12 pages × 7 widths) | 0 issues (§13) |
| Sprint 1 reference experiences | Preserved; the integration changes are listed in §9 |
| Lighthouse / Core Web Vitals | **Not measured** (§16) |
| Sprint 3 | **Not started** (awaiting approval) |

---

## 2. Scope, approvals and decisions

1. Sprint 0 + 1 were approved with the instruction: *do not modify or redesign the existing reference experiences unless Sprint 2 integration requires it; preserve all existing tests and add tests for every new programmatic SEO template and dataset rule.* Every existing test still exists; expectations that had to change because the dataset grew are listed in §10.3 with the reason.
2. **City/country data source (approved):** GeoNames (Creative Commons Attribution 4.0). Raw files are git-ignored (`data/sources/`); generated TypeScript is committed; the footer carries "City data © GeoNames, CC BY 4.0". GeoNames supplies names, ids, coordinates, populations, admin regions, country facts and each place's IANA zone id — **never** offsets, DST rules or abbreviations (§6.5).
3. **UTC/GMT canonical URLs (approved):** `/utc/` and `/gmt/` are canonical. `/timezones/utc/` and `/timezones/gmt/` 308-redirect to them; `/gmt/[offset]/` 308-redirects to `/utc/[offset]/` because it is the same offset. This resolves the cannibalisation risk flagged in the Sprint 1 report.
4. Standing rules from Sprint 0/1 remain in force: IANA/`Intl` is the only source of time facts; no hardcoded times, offsets or DST states; CDT is never labelled CST; no production analytics ids; abbreviations are never passed to `Intl`.
5. CLAUDE.md Sprint 2 list: expand cities, countries, timezone pages, UTC/GMT pages, metadata, canonicals, structured data, breadcrumbs, internal linking, sitemaps. Sprint 3+ features (timer hub SEO, converter expansion, tools) were not started.

---

## 3. Environment

| Item | Value |
| --- | --- |
| Node | v24.15.0 (ICU 78.2, tzdata 2026a — recorded in the generated zone-name file header) |
| Next.js / React / TypeScript / Tailwind | 16.3.5 / 19.3 / 6.0.3 / 4.3.3 (unchanged from Sprint 1) |
| Vitest / Playwright | 5 (`TZ=Pacific/Chatham`, `testTimeout` raised to 20 s for cold transition scans) / 1.63 (installed Google Chrome) |
| OS | Windows 11; Git Bash for scripts |
| GeoNames dump | `cities15000.txt`, `countryInfo.txt`, `admin1CodesASCII.txt`, `timeZones.txt` downloaded 2026-09-18 |
| New runtime dependencies | **None** (runtime remains `next`, `react`, `react-dom`) |

---

## 4. Sprint 2 checklist (from `CLAUDE.md`) — status

| Requirement | Status | Where |
| --- | --- | --- |
| Expand cities to ~300–500 | 469 | `scripts/generate-geo-data.mjs` → `data/cities.generated.ts`; `lib/data/dataset.test.ts` enforces 300–500 and that all 25 Sprint 1 seeds survive |
| Country pages: current time, date, zone(s), offset(s), DST, major cities with live times, differences, related countries/zones, FAQs; correct for multi-zone countries | Done | `app/countries/[country]/page.tsx`, `lib/content/country.ts` |
| Timezone pages (priority list + more) | 50 entries with tz-verified geography | `data/timezones.ts`, `data/timezones-world.ts`, `components/timezone/TimezonePageBody.tsx` |
| UTC/GMT hubs; curated offset pages (`/utc/utc-minus-5/`, `/utc/utc-plus-530/`, `/gmt/gmt-minus-5/`); live time, offset, conversion to the visitor's zone, locations, conversion table, related offsets; index only meaningful pages | Done — 33 offsets, GMT forms redirect | `app/utc/page.tsx`, `app/gmt/page.tsx`, `app/utc/[offset]/page.tsx`, `lib/data/offsets.ts`, `lib/content/offset.ts` |
| Unique H1/title/description, canonical, breadcrumb, indexable body, internal links, structured data, `indexable` control per template | Done | §8 |
| Sitemap index with child sitemaps (cities, countries, timezones, utc, timers, converters, pages), chunked | Done (7 sections, chunk size 10,000) | `lib/seo/sitemap.ts` |
| Internal linking from structured data (city → country/zone/offset/nearby/comparisons; country → cities/zones/countries; zone → cities/related/offset/converters) | Done | §8.5 |
| "Before calling work complete" list: build, lint, typecheck, tests, no console errors, desktop/mobile, metadata, canonical, sitemap, 404, time calculations | All verified (§10–§13) | — |

---

## 5. Routes and page counts

| Route | Pages | Indexable | New in Sprint 2 |
| --- | --- | --- | --- |
| `/` | 1 | yes | — |
| `/time/[city]/` | 469 | yes | +444 cities |
| `/countries/` | 1 | yes | new |
| `/countries/[country]/` | 96 | yes | new |
| `/utc/`, `/gmt/` | 2 | yes | new (canonical UTC/GMT pages) |
| `/utc/[offset]/` | 33 | yes | new |
| `/timezones/[timezone]/` | 50 | yes | +41 entries, −2 (UTC/GMT moved to hubs) |
| `/timer/[duration]/` | 12 | yes | — |
| `/convert/[from]-to-[to]/` | 8 | yes | — |
| `/timezones/`, `/timer/`, `/converter/`, `/world-clock/`, `/tools/` | 5 | no (interim hubs) | — |
| `/sitemap.xml`, `/sitemaps/{section}-{n}.xml` | 1 + 7 | n/a | +2 sections (countries, utc) |

**Evidence (`next build`, indexing off):**

```text
✓ Compiled successfully in 11.2s
✓ Generating static pages using 15 workers (683/683) in 22.4s
Route (app)                 Revalidate  Expire
┌ ○ /                               1h      1y
├   /convert/[pair]        ● 8 paths
├ ○ /countries                      1h      1y
├   /countries/[country]   ● 96 paths (algeria … vietnam)
├ ○ /gmt                            1h      1y
├   /time/[city]           ● 469 paths (abidjan …)
├   /timer/[duration]      ● 12 paths
├ ○ /timezones                      1h      1y
├   /timezones/[timezone]  ● 50 paths (cst, est, ist, +47)
├ ○ /utc                            1h      1y
├   /utc/[offset]          ● 33 paths (utc-minus-10, utc-minus-9, utc-minus-8, +30)
└ ○ /world-clock                    1h      1y
ƒ Proxy (Middleware)
```

Unknown slugs 404 (`dynamicParams = false`), including offsets no dataset zone uses (`/utc/utc-plus-14/`), `/utc/utc-plus-0/` (the hub is `/utc/`) and excluded districts such as `/time/brooklyn/` (§12).

---

## 6. Dataset: the GeoNames pipeline

### 6.1 Sources and licence

`scripts/generate-geo-data.mjs` reads four GeoNames files (CC BY 4.0) from `data/sources/geonames/` (git-ignored) and writes three committed files with a provenance header:

| Output | Content |
| --- | --- |
| `data/cities.generated.ts` | 469 `City` records (slug, name, country, state, IANA zone, coordinates, population, priority, aliases, `geonameId`) |
| `data/countries.generated.ts` | 96 `Country` records (code, slug, name, definite article, continent, population, capital slug, primary zone, all zones, neighbours, DST/multi-zone flags) |
| `lib/time/zone-names.generated.ts` | 243 zones × `[zone, January offset, January name, July offset, July name]` captured from CLDR/ICU at generation time; used only for display names of zones without hand-written metadata |

`node scripts/generate-geo-data.mjs --check` exits non-zero if the committed output is stale. The README documents the download and regeneration commands.

### 6.2 Selection rules (all enforced by `lib/data/dataset.test.ts`)

1. **Populated places only:** feature codes `PPLC`, `PPLG`, `PPLA`, `PPLA2`, `PPLA3`, `PPL` with population ≥ 50,000. City districts (`PPLX`) never become pages, so New York's boroughs are not cities.
2. **Per-country quotas ranked by population:** US 100, India 35, UK 28, Canada 22, Australia 14, Germany 14, France 10, Japan 10, China 10, Italy 9, Spain 9, Mexico 8, Brazil 8, Poland 7, Netherlands 6, Russia 6, Indonesia 5, Pakistan 5 … down to 1 for ~45 smaller countries (Singapore, Qatar, Iceland, Jamaica, Fiji …). The capital of every quota country is always included, as is every `MUST_INCLUDE` id (the 25 Sprint 1 seeds and cities needed by existing copy: Regina, Saskatoon, Halifax, St. John's, Québec City, Tijuana, Monterrey, Cancún, Mérida, La Paz …), which is why India ends at 42, Canada 23, Australia 15 and Mexico 11.
3. **Satellite suppression:** a place is dropped when an already-selected place in the same country is ≥ 2.5× more populous within 15 km, or ≥ 5× within 30 km (removes Jersey City-, Noida-, Ghaziabad-style suburbs while keeping Tijuana next to San Diego, which are different countries).
4. **Names:** GeoNames' English `name`, except in countries whose GeoNames names are diacritic transliterations (India, Pakistan, China, Japan, Russia, Greece, the Middle East …) where the ASCII form is the customary English spelling. Curated display names override both (Cologne, Zurich, Seville, Hanover, Frankfurt, Montreal, Québec City, Querétaro, León, Washington, D.C., New York).
5. **Slugs:** from the display name with diacritics stripped and stroke letters transliterated (Łódź → `lodz`, Malmö → `malmo`). On collision the most populous keeps the plain slug; others get a state suffix in the US/Canada/Australia or a country suffix elsewhere: `san-jose` (California) / `san-jose-costa-rica`, `london` / `london-ontario`, `columbus` / `columbus-georgia`.
6. **Priority:** override, else 1 for population ≥ 5 M or a capital ≥ 1 M, 2 for ≥ 1 M or any capital, else 3 (result: 97 / 153 / 219).
7. **Zones:** each place's GeoNames zone is validated with `Intl`, legacy ids mapped to canonical ones (`Asia/Calcutta` → `Asia/Kolkata`), and the test asserts every zone has hand-written metadata or a CLDR name so no hero can show a bare IANA id.
8. **Countries:** one record per country with at least one city; `zones` = GeoNames' zones for the country ∪ the cities' zones; `neighbours` = GeoNames neighbours that also have pages; `primaryZone` = the capital's zone (largest city if the capital is absent); `multipleTimeZones` = the zones form more than one behaviour group (§7.3), verified by test.

### 6.3 Curation (documented in the script, each with a reason)

| Kind | Entries |
| --- | --- |
| `EXCLUDE` (15) | NYC boroughs (Brooklyn, Queens, Manhattan, The Bronx, Staten Island); GeoNames' separate "New Delhi" PPLC (317 k) replaced by "Delhi" renamed *New Delhi* and flagged as the capital; Meads KY and Lexington-Fayette (census artefacts/duplicates); Rasapūdipalem, Kallakurichi, Nowrangapur (district populations recorded as towns), Pimpri and Virār (duplicates/suburbs); Central Coast NSW and Sunshine Coast QLD (regions, not cities) |
| `OVERRIDES` | Display names, aliases for search (NYC, New York City, Bombay, Bangalore, Saigon …), seed-city priorities |
| `COUNTRY_OVERRIDES` | Netherlands (name); **China: single official zone `Asia/Shanghai`** (tzdata's `Asia/Urumqi` records unofficial Xinjiang time); **Vietnam: tzdata's `Asia/Bangkok` link for the north remapped to `Asia/Ho_Chi_Minh`** (identical rules since 1970); Côte d'Ivoire / Turkey / Czechia naming |
| Overseas flags | France and the Netherlands are marked `overseasTimeZones`, so their pages say the mainland uses one zone while overseas regions differ |

### 6.4 Output statistics

- 469 cities; largest shares: US 100, India 42, UK 28, Canada 23, Australia 15, Germany 14, Mexico 11, Japan 10, France 10, China 10, Italy 9, Spain 9, Brazil 8, Poland 7 (`grep -oE "countryCode: '[A-Z]{2}'" data/cities.generated.ts | sort | uniq -c`).
- 96 countries across 6 continents; 243 distinct IANA zones known to the generator.
- All 25 Sprint 1 seed cities are present with their original slugs, priorities and aliases (test: "keep every Sprint 1 seed city").

### 6.5 What GeoNames is **not** used for

Offsets, DST status, transition dates, abbreviations and differences all come from `lib/time/*` via `Intl` at render time. The only GeoNames time fact used is each place's IANA zone **id**, which is validated and whose behaviour is then computed, never copied. The Vietnam remap above is the one place where a GeoNames zone assignment was corrected.

### 6.6 Regeneration

```text
node scripts/generate-geo-data.mjs          # rewrites the three generated files deterministically
node scripts/generate-geo-data.mjs --check  # CI guard: fails if the committed output is stale
```

---

## 7. Time zone accuracy

### 7.1 Zone metadata expanded and machine-checked

`lib/time/zone-metadata.ts` grew from the Sprint 1 seed zones to 220 zones, each with per-zone abbreviation labels **with their offsets** (so IST is 330 min in India, 60 in Ireland, 120 in Israel; CST is −360 in North America, +480 in China/Taiwan, −300 in Cuba; BST is 60 in the UK and 360 in Bangladesh) and dated eras where rules changed. `lib/time/zone-metadata.test.ts` (223 tests) checks, **for every zone**, that the current era declares exactly the set of offsets tzdata produces month by month in 2026, that era ranges are contiguous, and that the ambiguous abbreviations resolve to the expected offset sets (`IST → {60, 120, 330}`, `CST → {−360, −300, 480}`, `BST → {60, 360}`).

### 7.2 Fixed-offset pseudo-zones

Offset pages need a clock at exactly UTC−5 regardless of DST anywhere. `lib/time/zone.ts` now accepts `UTC±HH:MM` ids (`fixedOffsetZoneId`, `parseFixedOffsetZone`) in every engine function; they never have transitions or DST; the inline clock bootstrap handles them before hydration and the byte-parity test covers `UTC+05:30`, `UTC-09:30`, `UTC+13:45`, `UTC-12:00` (`lib/time/fixed-offset.test.ts`, 5 tests).

### 7.3 Country zone groups (multi-zone correctness)

`getCountryZoneGroups` groups a country's zones by **behaviour** (`standard offset / daylight offset`) rather than by tzdata id, then names each group from metadata. Verified by `lib/content/country-offset.test.ts` and rendered on the live pages:

| Country | Groups |
| --- | --- |
| United States | Hawaii Time (HST, UTC−10, no DST) · Hawaii-Aleutian Time (Adak, HST/HDT) · Alaska Time · Pacific Time · Mountain Time (Arizona) (MST all year) · Mountain Time · Central Time · Eastern Time — 8 groups from 29 tzdata ids |
| India | India Standard Time, one group, no DST |
| Australia | AWST · ACST (Darwin, no DST) · ACST/ACDT (Adelaide) · AEST (Brisbane, no DST) · AEST/AEDT (Sydney …) · Lord Howe · Eucla |
| France | Central European Time (mainland), with the overseas note |
| China | China Standard Time only (override, §6.3) |
| Mexico | Central Standard Time (Mexico, no DST since 2022) · US-border Central Time with DST · Mountain Standard Time (Sonora/Sinaloa) · Pacific Time (Baja California) · Eastern Standard Time (Quintana Roo) |

The country FAQ answers "Does {country} observe daylight saving time?" with *Yes / No / Partly* computed from the groups (United States → partly, Arizona and Hawaii excepted).

### 7.4 Which offsets get pages (curation is computed, not listed)

`getOffsetsInUse(year)` collects every offset that any dataset zone uses during the year; UTC+0 is the hub. Result: **33 pages** — UTC−10, −9, −8, −7, −6, −5, −4, −3:30, −3, −2:30, −2, −1, +1, +2, +3, +3:30, +4, +5, +5:30, +5:45, +6, +7, +8, +8:45, +9, +9:30, +10, +10:30, +11, +12, +12:45, +13, +13:45. Not generated (no dataset zone uses them): UTC−12, −11, +14. Each page classifies every zone on the offset as *all year*, *standard time*, *daylight saving time* or *seasonal shift* (Morocco's Ramadan move to UTC+0 is not DST) and lists which dataset cities are on the offset right now.

### 7.5 Values rendered by the production build (captured 2026-09-18, for spot-checking)

- `/countries/united-states/` zone table: Hawaii Time HST UTC−10 *Not observed* (Honolulu) · Hawaii-Aleutian HDT UTC−9 *In effect* (Adak) · Alaska AKDT UTC−8 · Pacific PDT UTC−7 (Los Angeles, San Diego, San Francisco) · Mountain (Arizona) MST UTC−7 *Not observed* (Phoenix, Tucson, Mesa) · Mountain MDT UTC−6 (Denver, El Paso, Albuquerque) · Central CDT UTC−5 (Chicago, Houston, San Antonio) · Eastern EDT UTC−4 (New York, Philadelphia, Jacksonville).
- `/countries/india/` subtitle: "India uses India Standard Time all year." Description names IST, UTC+5:30, no daylight saving time.
- `/countries/france/`: "France uses Central European Time, with daylight saving time." `/countries/china/`: "China uses China Standard Time all year."
- `/utc/utc-minus-5/` sections: *UTC−5 all year* (Colombia, Peru, Ecuador, Jamaica, Panama …), *UTC−5 as standard time* (Eastern Time), *UTC−5 as daylight saving time* (Central Time). Description: "Used in Chicago, Dallas, Winnipeg and Bogotá and more" (September: Central Time is on CDT = UTC−5).
- `/utc/utc-plus-530/`: single section *UTC+5:30 all year* (India, Sri Lanka).

### 7.6 Rule-change eras added to metadata this sprint

Mexico (DST abolished 2022-10-30: Mexico City/Monterrey/Mérida/Bahía de Banderas CST/CDT → CST; Chihuahua MST/MDT → CST; Mazatlán MST/MDT → MST), Cancún (CST/CDT → EST from 2015-02-01), Yukon (PST/PDT → "Yukon Time" MST from 2020-11-01), Asunción (PYT/PYST → PYT from 2024-10-15), Casablanca (backward Ramadan shift, not DST), Istanbul (EET/EEST until 2016-09-06, TRT since). All are covered by `lib/time/dst.test.ts` (12 tests, including the two zones that moved from transition inference to metadata: Istanbul and Chihuahua) and by the per-zone metadata test.

---

## 8. SEO implementation

### 8.1 Templates

| Template | Title pattern | H1 | JSON-LD | Robots |
| --- | --- | --- | --- | --- |
| Country | Current Time in {Country} – Time Zones, DST & Major Cities | Current Time in {Country} | WebPage, BreadcrumbList, FAQPage | index |
| Countries hub | Current Time by Country – World Time Zones Directory | Current Time by Country | WebPage, BreadcrumbList | index |
| UTC hub / GMT hub | UTC Time Now – Coordinated Universal Time (UTC+0) & All UTC Offsets / GMT Time Now – Greenwich Mean Time (UTC+0) & GMT Offsets | Coordinated Universal Time (UTC) / Greenwich Mean Time (GMT) | WebPage, BreadcrumbList, FAQPage | index |
| UTC offset | {UTC±X} Time Now – Current Time at {UTC±X} (GMT±X) | {UTC±X} Time Now | WebPage, BreadcrumbList, FAQPage | index |
| Abbreviation (41 new entries) | {Full name} ({ABBR}) – Current Time, UTC±X & DST | {Full name} ({ABBR}) | WebPage, BreadcrumbList, FAQPage | index |
| City (unchanged template, 469 pages) | Current Time in {City}, {State or Country} – Time Zone & DST | Current Time in {City}, {Country} | WebPage, BreadcrumbList (now includes the country), FAQPage | index |

Descriptions and FAQs are generated from facts per page (zone groups, DST answer, capital, differences, cities on the offset), not from shared boilerplate; `lib/content/country-offset.test.ts` asserts the wording for India, the United States, Australia, France, UTC−5 and UTC+1.

### 8.2 Canonicals and redirects

- Every page's canonical is its own trailing-slash URL on `NEXT_PUBLIC_SITE_URL`; `routes.timezone('utc' | 'gmt')` resolves to the hubs so every internal link agrees with the canonical.
- 308 redirects (`next.config.ts`): `/timezones/utc/` → `/utc/`, `/timezones/gmt/` → `/gmt/`, `/gmt/gmt-:rest/` → `/utc/utc-:rest/`; the lowercase proxy and timer aliases from Sprint 1 are unchanged.

### 8.3 Robots and sitemaps

- `robots.txt` unchanged (allow all, disallow `/api/`, sitemap reference); the global kill switch still hides every sitemap and sets `noindex` on every page when `NEXT_PUBLIC_ALLOW_INDEXING` ≠ `"true"` (Playwright kill-switch project: all 7 child sitemaps → 404).
- Sitemap index → 7 child sitemaps: pages 1, cities 469, countries 97 (hub + 96), timezones 50 (UTC/GMT excluded here), utc 35 (2 hubs + 33 offsets), timers 12, converters 8 = **672 URLs**, every indexable page exactly once (unit test + e2e).

### 8.4 Structured data

`BreadcrumbList` now includes the country item for city pages (it was plain text while countries were unpublished). Country, hub and offset pages emit `WebPage` + `BreadcrumbList` (+ `FAQPage` where FAQs render). All blocks parse as JSON and were type-checked in e2e; no schema was added for decoration.

### 8.5 Internal linking (all from structured data)

| Page | Links to |
| --- | --- |
| City | country page (breadcrumb + About), abbreviation page, UTC offset page, nearby cities by distance, popular comparisons, converters, countries hub |
| Country | its cities (zone table + city cards), one abbreviation page per zone group, neighbouring countries, converter hub, countries hub |
| Abbreviation | up to 12 cities (seasonal and year-round, §9 item 3), related abbreviations, counterpart (EST↔EDT), UTC offset page, approved converters |
| UTC offset | cities on the offset now, abbreviations that denote it and their converters, neighbouring offsets, UTC and GMT hubs |
| UTC / GMT hubs | offsets directory (every offset page with a live time), the visitor's-zone comparison, related abbreviations |
| Global | Footer: Countries, UTC; mobile menu: "Current time by country", "UTC time now"; homepage Popular Time Zones tiles for UTC and GMT point to the hubs |

### 8.6 Search

The search index now contains 469 cities (aliases included), 96 countries and the 33 offset pages (queries like `utc-5`, `gmt+5:30`). Grouped results remain Cities → Countries → Time Zones. Index size: 107 KB uncompressed (§15).

---

## 9. Changes to the approved Sprint 1 reference experiences

All were required by Sprint 2 integration; none redesigns a page. The Sprint 1 Playwright smoke suite still passes.

1. **City breadcrumb** (`/time/san-diego/` and all city pages): "United States" is now a link to `/countries/united-states/` and appears in `BreadcrumbList` — the behaviour Sprint 1 designed for the moment countries became published.
2. **Hero abbreviation names** on city pages come from the metadata/CLDR display-name helper (`getZoneDisplayNames`) instead of a small hand-written map, so all 469 pages get full names. San Diego still shows Pacific Standard/Daylight Time.
3. **`/timezones/cst/` city list:** the abbreviation template used "seasonal cities first, then year-round, first 12". With 100 US cities the year-round examples (Mexico City, Regina) fell off the list, which broke the Sprint 1 test *"Mexico City stays on CST"*. The list now reserves up to 4 of the 12 slots for year-round cities so both behaviours stay visible. Same section, same design.
4. **UTC/GMT links** on the CST page, the homepage tiles and the timezone hub now point to `/utc/` and `/gmt/` (the approved canonical decision).
5. **Footer and mobile menu** gained Countries/UTC links and the GeoNames attribution line (a licence requirement).
6. **Abbreviation template refactor:** `app/timezones/[timezone]/page.tsx` was split into `components/timezone/TimezonePageBody.tsx` so the UTC/GMT hubs reuse it; no visual change intended (checked visually; e2e unchanged).
7. **ClockPanel** gained a branch for fixed-offset zones ("Fixed offset UTC−5" instead of "UTC−5 · UTC−5"); city and zone pages are unaffected.
8. **City description wording:** zone names that carry a regional qualifier now read "Central Standard Time (Central America; CST, UTC−6)" instead of "… (Central America) (CST, UTC−6)". San Diego's description is unchanged.

---

## 10. Test results

### 10.1 Unit tests

**Evidence (`npx vitest run`, after the last change):** `Test Files 12 passed (12) · Tests 363 passed (363)` (Sprint 1: 8 files, 112 tests).

| File | Tests | Covers |
| --- | --- | --- |
| `lib/time/zone-metadata.test.ts` (new) | 223 | every metadata zone vs tzdata monthly offsets for 2026; contiguous eras; ambiguous abbreviations |
| `lib/time/sun-meeting.test.ts` | 23 | unchanged (USNO fixtures) |
| `lib/time/zone.test.ts` | 22 | unchanged |
| `lib/time/conversion.test.ts` | 20 | +2: dated eras; ambiguous IST; Kabul/Colombo labels |
| `lib/data/data-integrity.test.ts` | 18 | unchanged count; San Diego nearby-cities expectation updated (§10.3) |
| `lib/data/dataset.test.ts` (new) | 15 | size target and seed cities kept; unique slugs + provenance; districts/data errors excluded; collision suffixes; curated names/aliases; canonical zones with labels; country consistency (zones, capitals, neighbours both ways); `multipleTimeZones` vs behaviour groups; US group naming; offset pages exist only for offsets in use (excluding UTC+0); slug/label/pseudo-zone round-trips; generated headers match contents |
| `lib/time/dst.test.ts` | 12 | +1; Istanbul and Chihuahua moved to the metadata group, Chatham/Almaty/Kabul cover transition inference |
| `lib/time/transitions.test.ts` | 12 | unchanged (transition search was re-implemented with a coarse 7-day pre-scan; same assertions pass) |
| `lib/content/country-offset.test.ts` (new) | 7 | India, United States, Australia, France content; UTC−5 and UTC+1 usage classes (Morocco = seasonal shift); descriptions and FAQs |
| `lib/time/fixed-offset.test.ts` (new) | 5 | pseudo-zone ids, arithmetic, no DST, labels, wall-time resolution |
| `lib/search/match.test.ts` | 5 | India country + cities; `utc+5:30` offers the offset page first |
| `lib/clock/bootstrap.test.ts` | 1 | byte parity extended with fixed-offset ids |

### 10.2 End-to-end (Playwright, two production builds: indexing on / off; desktop Chrome + Pixel 7)

**Evidence (`npx playwright test`, after the last change):** `79 passed, 3 skipped (5.9m)`, 0 failed. Skips are intentional: the bottom-navigation test is mobile-only, and the two request-level checks (Sprint 1 HTTP checks, Sprint 2 routing) run once on desktop.

New `e2e/sprint2.spec.ts` (desktop + mobile):
- 10 new pages (`/countries/`, `/countries/united-states/`, `/countries/india/`, `/utc/`, `/gmt/`, `/utc/utc-minus-5/`, `/utc/utc-plus-530/`, `/timezones/cet/`, `/timezones/aest/`, `/time/lagos/`): exactly one H1 with the expected text, no console/page errors, no horizontal overflow.
- United States in January (frozen instant): Eastern on EST, Arizona MST "Not observed"; in July: EDT.
- City breadcrumb links to the country page.
- UTC−5 page: fixed-offset clock at the frozen instant, "UTC now" reference, both usage sections.
- UTC hub lists every offset with a live time.
- Search "germ" → the Germany country result → `/countries/germany/`.
- Routing (once): `/timezones/utc/` → 308 `/utc/`, `/timezones/gmt/` → 308 `/gmt/`, `/gmt/gmt-minus-5/` → 308 `/utc/utc-minus-5/`; unused offsets and unknown countries → 404.

Updated: `e2e/seo.spec.ts` (7 child sitemaps; new indexable paths present; old `/timezones/utc|gmt/` absent; > 600 URLs), `e2e/kill-switch.spec.ts` (7 files → 404). Unchanged: `e2e/smoke.spec.ts` (passes after §9 item 3).

### 10.3 Sprint 1 test expectations that changed, and why

| Test | Change | Reason |
| --- | --- | --- |
| data-integrity: nearby cities for San Diego | `['los-angeles', 'tijuana', …]` → `['tijuana', 'irvine', 'santa-ana', 'riverside']` | with 100 US cities, Irvine and Santa Ana are nearer than Los Angeles. Still computed from coordinates |
| search: offset query | `utc+5:30` now expects the **UTC+5:30 offset page** first and IST next | a new, more specific result exists; the old assertion (IST first) was replaced deliberately |
| conversion: labels | added Kabul (`UTC+4:30`, no verified abbreviation) and Colombo (`UTC+5:30` with name) | metadata coverage grew; asserts the engine never invents an abbreviation |
| dst: Istanbul, Chihuahua | moved from the "transition layer" to the "metadata layer" group | both zones gained dated eras; the transition-layer group now uses Chatham, Almaty, Kabul |
| smoke: CST page in July | assertion unchanged; page fixed (§9 item 3) | dataset growth pushed year-round cities out of the list |

No test was deleted.

---

## 11. Build, lint, typecheck

```text
$ npm run typecheck   → tsc --noEmit: PASS
$ npm run lint        → eslint .: PASS (0 errors, 0 warnings)
$ npx vitest run      → Test Files 12 passed (12) · Tests 363 passed (363)
$ next build          → ✓ Compiled successfully · ✓ Generating static pages (683/683)
```

The route table above is from the main build; the Playwright run that followed the last code change rebuilt both e2e variants (`.next-e2e/indexed`, `.next-e2e/noindex`) from the final code, and the HTTP checks in §12 ran against that indexed build.

One transient failure is worth recording: the first `next build` after stopping the dev server failed with `UNKNOWN: unknown error, open '.next/server/app/timezones/hkt.segments/…'` (a Windows file lock on the stale `.next`); `rm -rf .next` and rebuilding succeeded with no code change.

---

## 12. HTTP verification (indexed production build, `NEXT_PUBLIC_SITE_URL=https://timenow.example`, `NEXT_PUBLIC_ALLOW_INDEXING=true`)

Captured with a urllib script (redirects not followed) on 2026-09-18 after the last change.

```text
/countries/                → 200  canonical https://timenow.example/countries/  robots "index, follow"  JSON-LD WebPage, BreadcrumbList
/countries/india/          → 200  canonical …/countries/india/          JSON-LD WebPage, FAQPage, BreadcrumbList
/countries/united-states/  → 200  8 zone-group rows (Hawaii → Eastern), Hawaii and Arizona "Not observed"
/countries/france/         → 200  "France uses Central European Time, with daylight saving time."
/countries/china/          → 200  "China uses China Standard Time all year."
/utc/                      → 200  H1 "Coordinated Universal Time (UTC)"   /gmt/ → 200  H1 "Greenwich Mean Time (GMT)"
/utc/utc-minus-5/          → 200  H1 "UTC-5 Time Now"; sections: all year / standard time / daylight saving time
/utc/utc-plus-530/         → 200  H1 "UTC+5:30 Time Now"; section: all year
/timezones/cet/            → 200  /timezones/cst/ → 200 (unchanged title, canonical, JSON-LD)
/time/new-delhi/           → 200  breadcrumb links: Home→/, India→/countries/india/
/time/san-diego/           → 200  breadcrumb links: Home→/, United States→/countries/united-states/
/time/san-jose-costa-rica/ → 200  H1 "Current Time in San José, Costa Rica"

Redirects: /timezones/utc/ → 308 /utc/ · /timezones/gmt/ → 308 /gmt/ · /gmt/gmt-minus-5/ → 308 /utc/utc-minus-5/
           /gmt/gmt-plus-530/ → 308 /utc/utc-plus-530/ · /Countries/India/ → 308 /countries/india/ · /timer/60-minutes/ → 308 /timer/1-hour/
404s:      /utc/utc-plus-14/ /utc/utc-minus-11/ /utc/utc-plus-0/ /countries/atlantis/ /time/brooklyn/ /time/manhattan/ /timezones/xyz/
           (/gmt/gmt-plus-14/ → 308 → /utc/utc-plus-14/ → 404: the pattern redirect fires first; see §14)
robots.txt: Allow: / · Disallow: /api/ · Sitemap: https://timenow.example/sitemap.xml
sitemap.xml → 200, 7 children: pages 1 · cities 469 · countries 97 · timezones 50 · utc 35 · timers 12 · converters 8 = 672 URLs
```

---

## 13. Desktop and mobile verification

- Playwright runs every Sprint 2 page check on desktop Chrome and a Pixel 7 profile (touch, mobile UA): one H1, no console errors, no horizontal overflow, plus the frozen-instant DST checks.
- **Width sweep** (ad-hoc script against the indexed production build, real Chrome): 12 pages (`/countries/`, India, United States, France, `/utc/`, `/gmt/`, UTC−5, UTC+5:30, CET, AEDT, Mumbai, San José CR) × 7 widths (375, 390, 430, 768, 1024, 1280, 1440) = **84 checks, 0 issues** (overflow, H1 count, console errors).
- In-app browser (dev server): `/countries/united-states/`, `/countries/`, `/utc/`, `/utc/utc-minus-5/` inspected visually at desktop and phone widths — layout follows the Sprint 1 card/table language; no console errors.
- Touch targets: new tables and lists reuse the Sprint 1 `min-h-11` row treatment. On phones (below 640 px) the country page renders one card per zone group instead of the five-column table, and the UTC/GMT offsets directory fits the 375 px width (no minimum width; offset and time cells never wrap; "Used by" wraps) — both added after a mobile preview review.

---

## 14. Known issues

1. `/gmt/gmt-plus-14/` (an offset with no page) 308-redirects to `/utc/utc-plus-14/`, which then 404s. Harmless, but a redirect-then-404 rather than a direct 404.
2. Zone groups with no dataset city (Aleutian Islands, Lord Howe, Eucla) show the IANA location ("Adak", "Lord Howe", "Eucla") in the country table instead of a city link.
3. The countries hub shows one time per country (capital or largest city), stated on the page; multi-zone countries need their own page for the rest.
4. GeoNames data quality: 15 known errors were excluded (§6.3) after reviewing the top lists for the US, India, UK, Canada, Australia, Germany, Mexico and the 25 seed cities. The remaining cities were spot-checked, not individually reviewed (§16).
5. The search index is 107 KB uncompressed and downloaded on first use; acceptable at 469 cities, not at 10,000 (§15).
6. Region prose in `data/timezones-world.ts` (41 entries) is hand-written; each sentence's IANA zones are tested against tzdata, the prose itself is not machine-verified.
7. Sprint 1 items still open: timer alias redirects take two hops without a trailing slash; converter `<select>` labels truncate on narrow phones; the 24-hour toggle's pressed state updates after hydration; search requires JavaScript; ISR pages can be up to 1 h old at DST/midnight boundaries (corrected before paint for JS users).
8. Development only: building immediately after stopping `next dev` can fail with a Windows file-lock error (`UNKNOWN … .segment.rsc`); clearing `.next` fixes it.

---

## 15. Technical debt

- **Search at scale:** move to a server route with prefix queries before the city count grows past ~1,000; consider shipping country/offset items separately from cities.
- **GeoNames source files** are not in the repo; regeneration needs the download step in the README. The generated header records the ICU/tz version but not the dump date.
- **Zone metadata** is hand-maintained (220 zones); the per-zone tzdata test catches offset drift but not label typos. Cities in zones without metadata fall back to CLDR names (test-enforced), which are generic for a few zones.
- **Country group naming** relies on `getZoneRegionName`; the two US Hawaii groups are correct (different DST behaviour) but could be named more distinctly.
- **`e2e/serve-builds.mjs`** rebuilds both variants on every run (~2.5 min of the 4.2 min suite); cache by input hash in CI.
- The ad-hoc scripts used for evidence (HTTP checks, width sweep) live outside the repo; promote them to `scripts/` if wanted in CI.

---

## 16. Not verified (explicit)

- Lighthouse scores and Core Web Vitals (LCP, CLS, INP) on the new templates (the hubs' offsets directory renders 35 live clocks from the single shared clock store; not measured).
- Real devices and non-Chromium browsers; screen readers.
- Google Rich Results Test / Schema Markup Validator for the new JSON-LD (parsed and type-checked locally only).
- Individual review of every one of the 469 city records (name, spelling, zone) — see §14 item 4; every zone id is machine-validated, but the geographic correctness of GeoNames' zone assignment beyond the Vietnam case is not.
- Transliteration choices for non-Latin names beyond the curated overrides (GeoNames' ASCII forms for Chinese, Arabic and Russian cities).
- Deployment, ISR behaviour over time on a real host, Search Console, GA4 delivery.
- The live values in §7.5 against an external reference (they follow tzdata 2026a via ICU; the reviewer can compare with timeanddate.com).

---

## 17. Recommendations before Sprint 3

1. Deploy a preview and run Lighthouse on `/countries/united-states/`, `/utc/` and a city page; measure the offsets directory's INP.
2. Have a human skim the generated city list per country (`data/cities.generated.ts` is grouped by country) and add any exclusions/overrides to the script — never edit the generated file.
3. Add `node scripts/generate-geo-data.mjs --check` and the Playwright suite to CI; cache e2e builds.
4. Decide whether the "daylight" abbreviation pages (EDT, CDT, CEST, AEDT …) should be canonicalised to their standard pages once Search Console shows impressions.
5. Consider a short "how many time zones does X have" section on the countries hub, since the hub is currently a directory.
6. Sprint 3 (timer SEO) can start on the current templates without further data work.

---

## 18. Reviewer checklist (suggested independent checks)

1. Confirm the arithmetic 1 + 469 + 97 + 50 + 35 + 12 + 8 = 672 sitemap URLs, and that `/timezones/utc/` and `/timezones/gmt/` are absent while `/utc/` and `/gmt/` are present.
2. Confirm the 33 offsets in §7.4 are exactly the offsets used by some dataset zone in 2026 (e.g. UTC−2:30 = Newfoundland daylight time; UTC+8:45 = Eucla; UTC+13:45 = Chatham daylight time) and that UTC−11/−12/+14 have no page.
3. Confirm the United States groups in §7.5, in particular Hawaii and Arizona "Not observed" and Adak on HDT in September.
4. Check the Mexico groups against the 2022 law change and the border exceptions.
5. Check the exclusions in §6.3 (e.g. `/time/brooklyn/` and `/time/manhattan/` 404 while `/time/new-york/` exists; `/time/new-delhi/` is GeoNames' Delhi).
6. Verify the Vietnam and China zone decisions (§6.3) are acceptable editorially.
7. Open `/countries/india/`, `/utc/utc-plus-530/` and `/timezones/ist/` and confirm they target distinct intents (country / offset / abbreviation) rather than duplicating each other.
8. Review §9: confirm each change to the reference experiences was required by integration and none is a redesign.
9. Confirm §10.3: every changed expectation has a data-driven reason and no test was removed.
10. If source is attached: confirm `scripts/generate-geo-data.mjs` reads offsets/DST from nowhere (it only validates zone ids), and that `data/*.generated.ts` are never edited by hand.

---

## Appendix A — Documentation updated

`README.md` (status, routes, GeoNames regeneration, adding a city/country/zone), `DATA_MODEL.md` (generation rules, new City/Country fields, offset curation, zone names, new test files), `SEO_ARCHITECTURE.md` (new templates, canonical UTC/GMT decision, scale controls, sitemap sections, linking, decisions), `DESIGN_SYSTEM.md` (new components), `seo/keyword-map.md` (41 abbreviation rows, offsets, countries). `CLAUDE.md` unchanged.

## Appendix B — Files created or modified in Sprint 2 (59)

```text
Data & generation:   scripts/generate-geo-data.mjs (new), data/cities.generated.ts (new), data/countries.generated.ts (new),
                     lib/time/zone-names.generated.ts (new), data/cities.ts, data/countries.ts, data/timezones.ts,
                     data/timezones-world.ts (new), types/data.ts, .gitignore
Time engine:         lib/time/zone.ts (fixed-offset zones, coarse transition scan), lib/time/dst.ts, lib/time/zone-metadata.ts,
                     lib/time/zone-names.ts (new), lib/clock/bootstrap.ts
Data access/content: lib/data/cities.ts, lib/data/countries.ts, lib/data/offsets.ts (new), lib/content/city.ts,
                     lib/content/country.ts (new), lib/content/offset.ts (new), lib/routes.ts, lib/seo/sitemap.ts, lib/search/build-index.ts
Pages:               app/countries/page.tsx (new), app/countries/[country]/page.tsx (new), app/utc/page.tsx (new), app/utc/[offset]/page.tsx (new),
                     app/gmt/page.tsx (new), app/timezones/[timezone]/page.tsx, app/time/[city]/page.tsx
Components:          components/timezone/TimezonePageBody.tsx (new), components/timezone/OffsetsDirectory.tsx (new),
                     components/converter/OffsetToLocal.tsx (new), components/clock/ClockPanel.tsx, components/clock/LiveZoneInfo.tsx,
                     components/layout/Footer.tsx, components/layout/MobileMenu.tsx
Config:              next.config.ts (redirects, distDir), playwright.config.ts, vitest.config.mts
Tests:               lib/data/dataset.test.ts (new), lib/content/country-offset.test.ts (new), lib/time/zone-metadata.test.ts (new),
                     lib/time/fixed-offset.test.ts (new), lib/time/dst.test.ts, lib/time/conversion.test.ts, lib/data/data-integrity.test.ts,
                     lib/search/match.test.ts, lib/clock/bootstrap.test.ts, e2e/sprint2.spec.ts (new), e2e/seo.spec.ts, e2e/kill-switch.spec.ts
Docs:                README.md, DATA_MODEL.md, SEO_ARCHITECTURE.md, DESIGN_SYSTEM.md, seo/keyword-map.md, SPRINT_2_REPORT.md (this file)
```
