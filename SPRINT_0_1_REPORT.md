# TimeNow — Sprint 0 + Sprint 1 Completion Report

- **Project:** TimeNow (SEO-first time utility platform)
- **Report date:** 2026-09-17 (Revision 2 — see §0)
- **Prepared by:** Claude Code (implementation agent)
- **Purpose:** independent verification by a second reviewer
- **Governing spec:** `CLAUDE.md` (project instructions) + user decisions listed in §2
- **Design reference:** `references/visual-prd.png`

---

## How to use this report (for the reviewer)

1. Every **evidence** block below is copied from real command output run on 2026-09-17, after all fixes. Anything that was **not** verified is listed explicitly in §16.
2. §7 lists every time calculation that differs from the Visual PRD, with the arithmetic, so it can be checked by hand or against an independent source (e.g. timeanddate.com).
3. §18 is a checklist of specific things worth verifying independently.
4. If the source bundle (`timenow-sprint-0-1-source.zip`) is attached, the files named here can be inspected directly. Suggested review order: `lib/time/dst.ts`, `lib/time/zone-metadata.ts`, `lib/time/zone.ts`, `lib/time/abbreviations.ts`, `lib/timezones/status.ts`, `data/timezones.ts`, `lib/clock/bootstrap.ts`, `components/clock/LiveTime.tsx`, `app/timezones/[timezone]/page.tsx`, `lib/seo/*`.

---

## 0. Revision 2 — changes after first review

The review requested the changes below. All are implemented and verified; sections below have been updated where the earlier text no longer applied.

| Request | What changed | Evidence |
| --- | --- | --- |
| DST detection must not be based universally on the minimum annual offset | New `lib/time/dst.ts`: **zone metadata with dated eras first** (`lib/time/zone-metadata.ts`), **transition-structure inference second**. Permanent offset changes are standard time; backward seasonal shifts (Morocco) are not DST; abbreviation offsets are stored per zone (IST India UTC+5:30 vs IST Ireland UTC+1). The yearly-minimum rule was removed | `lib/time/dst.test.ts` (11 tests): Yukon 2020, Mexico City 2022, Morocco 2026, Ireland, Turkey 2015/2016, Chihuahua 2022, Arizona 1967, fixed zones |
| Clean geography copy (Saskatchewan, Yukon, Mexico) | Region copy restructured into `{ label, note, zones }`. Every sentence names its IANA zones, and tests verify each zone against raw monthly tzdata offsets. Saskatchewan → "Most of Saskatchewan" with Lloydminster/Creighton exceptions; Yukon → UTC-7 all year since 2020 (“Yukon Time”), formerly Pacific Time; Mexico → DST ended Oct 2022 except US-border areas (Matamoros/Ojinaga on CST/CDT, Ciudad Juárez on MST/MDT, Baja California on PST/PDT); Chihuahua state on CST; Sinaloa/Baja California Sur/most of Nayarit on UTC-7 | `lib/data/data-integrity.test.ts` (18 tests) |
| Sitemaps must respect the global indexing kill switch | With `NEXT_PUBLIC_ALLOW_INDEXING` ≠ `"true"`: `/sitemap.xml` → 404 and no child sitemaps are generated (all `/sitemaps/*.xml` → 404) | Unit tests + Playwright `kill-switch` project against a real noindex build |
| Playwright smoke tests | `playwright.config.ts`, `e2e/*.spec.ts`. Two production builds (indexing on/off), desktop + Pixel 7 mobile projects | **46 passed, 2 skipped (intentional: mobile-only test on desktop; HTTP checks run once), 0 failed** |
| Independently sourced sunrise/sunset fixtures | `lib/time/__fixtures__/sun-usno.json`: 17 cases fetched from the **U.S. Naval Observatory API** (source URL and retrieval time per case). Replaces the earlier recalled values; tolerance tightened from ±3 to ±1 min | **Max deviation 0.51 min** across all 15 rise/set cases; polar day/night cases match |

**Evidence (re-run after all changes):**

```text
$ npx tsc --noEmit          → PASS
$ npx eslint .              → PASS (0 errors, 0 warnings)
$ npx vitest run            → Test Files 8 passed (8) · Tests 112 passed (112)
$ next build                → ✓ Compiled · ✓ Generating static pages (68/68)
                              (68 = indexing off: the 5 child sitemaps are no longer generated)
$ npx playwright test       → 46 passed, 2 skipped (3.1m)
```

**Sunrise/sunset deviation from USNO (minutes, engine − USNO):**

```text
New York, June solstice: sunrise 0.07, sunset -0.19
New York, December solstice: sunrise -0.29, sunset -0.06
New York, DST start day: sunrise -0.12, sunset 0.21
Chicago, DST end day: sunrise 0.04, sunset -0.49
San Diego, PRD date: sunrise 0.46, sunset 0.31
San Diego, September equinox: sunrise -0.04, sunset 0.08
London, June solstice: sunrise 0.13, sunset -0.37
London, December solstice: sunrise -0.12, sunset -0.46
Helsinki, June solstice (high latitude): sunrise 0.01, sunset 0.10
Sydney, December solstice: sunrise -0.24, sunset -0.45
Sydney, June solstice: sunrise -0.04, sunset -0.17
Tokyo, June solstice: sunrise -0.14, sunset 0.51
Mumbai, January: sunrise -0.32, sunset 0.10
Singapore, March equinox: sunrise 0.00, sunset 0.49
Quito, September equinox (equator): sunrise 0.29, sunset -0.22
Longyearbyen, June solstice: polar day (matches USNO)
Longyearbyen, December solstice: polar night (matches USNO)
MAX ABS DEVIATION: 0.51 min
```

**Playwright coverage (all against `next start` production builds):**
- Every reference page on desktop and mobile: HTTP 200, exactly one H1 with the expected text, no console errors or uncaught exceptions (hydration mismatches surface here), no horizontal overflow.
- The live clock is filled before hydration and keeps ticking.
- **DST-correct clocks at frozen instants** (`page.clock.setFixedTime`, browser zone Asia/Kolkata):
  - Homepage shows `Kolkata`, `IST · UTC+5:30`, 12:00:00 PM.
  - `/timezones/cst/` in January: `CST · UTC-6` and "Central Time is on CST right now".
  - `/timezones/cst/` in July: `CDT · UTC-5` and "…on CDT right now, not CST"; the Chicago card shows CDT, the Mexico City card CST at 11:00 AM.
  - `/time/san-diego/` at the Visual PRD moment: 7:54:38 PM, `PST · UTC-8`, DST "Not in effect".
  - `/convert/ist-to-est/` at the PRD moment: 10:24 PM IST = 11:54 AM (EST), "10 hours 30 minutes ahead".
- The 12/24-hour preference persists across reloads.
- Search keyboard flow (type → ArrowDown → Enter → `/time/san-diego/`); timer start/pause/resume; a 2-second custom timer reaches "Time’s up!"; mobile bottom nav → menu → navigation.
- `/timer/60-minutes/` → 308 `/timer/1-hour/`; `/TIME/SAN-DIEGO/` → 308 lowercase; unknown converter pair and city → 404.
- **Indexed build:** canonical = `https://timenow.example{path}`, robots `index, follow`, JSON-LD parses, BreadcrumbList present, robots.txt `Allow: /` + Sitemap line, sitemap index lists exactly the 5 child sitemaps, all 5 reference pages present, no hub URLs.
- **Kill-switch build:** robots.txt `Disallow: /` with no Sitemap line; `/sitemap.xml` and all five `/sitemaps/*.xml` → 404; all reference pages `noindex`.

**Other notes from this revision:**
- Running the two `next build`s in parallel caused a file-system race (`ENOENT` during prerender), so `e2e/serve-builds.mjs` builds sequentially.
- `next start` logs `Error: Internal: NoFallbackError` for unknown slugs on routes with `dynamicParams = false` (reproduced for `/time/atlantis/`, `/convert/ist-to-jst/`, `/timer/7-minutes/`, `/timezones/xyz/`). It is Next.js's internal 404 signal; the responses are correct 404s. `dynamicParams = false` is kept deliberately so arbitrary slugs can't trigger on-demand renders and fill the cache.
- The Playwright suite uses the locally installed Google Chrome (`channel: 'chrome'`); CI must run `npx playwright install chromium`.

---

## 1. Summary

| Area | Status |
| --- | --- |
| Sprint 0 — Foundation (Next.js, TypeScript, Tailwind, tokens, layout, time engine, data models, SEO helpers, sitemap framework, docs) | Complete |
| Sprint 1 — Five reference experiences (`/`, `/time/san-diego/`, `/timezones/cst/`, `/timer/1-hour/`, `/convert/ist-to-est/`) | Complete |
| Typecheck / Lint / Unit tests / Production build | Pass / Pass / 112 of 112 pass / Pass (68 static pages with indexing off; 73 with indexing on) |
| End-to-end (Playwright, production builds, desktop + mobile + kill switch) | 46 passed, 2 intentionally skipped, 0 failed |
| Horizontal overflow, H1 count, mobile touch targets (10 pages × 7 widths = 70 checks) | 0 issues |
| Hydration / console errors on reference pages | None observed (dev and production) |
| Lighthouse / Core Web Vitals | **Not measured** (see §16) |
| Sprint 2 | **Not started** (awaiting approval) |

---

## 2. Scope and sources of truth

From `CLAUDE.md` plus explicit user decisions given before implementation:

1. The Visual PRD was moved to `references/visual-prd.png`.
2. **Visual PRD = design source of truth only. IANA time zone calculations = source of truth** for current times, offsets, DST status, differences, converter results, meeting times, sunrise/sunset and abbreviations. Factual errors in the PRD had to be corrected.
3. City images: preserve the compact card structure, no large remote images (lightweight or image-free treatment).
4. Desktop navigation: `World Clock | Time Zones | Converter | Timers | Tools`.
5. Do not hardcode mockup dates; live pages show real current values; tests use explicit dates.
6. CST handling: never label a location on CDT as CST just because the page targets "CST time now"; explain the distinction.
7. Seed ~25 cities; no mass page generation; stop after Sprint 1.

---

## 3. Environment

| Item | Version |
| --- | --- |
| OS | Windows 11 |
| Node.js | 24.15.0 (ICU 78.2, tzdata 2026a) |
| Next.js | 16.3.5 (App Router, Turbopack) |
| React | 19.3.0 |
| TypeScript | 6.0.3 (strict, `noUncheckedIndexedAccess`) |
| Tailwind CSS | 4.3.3 |
| ESLint | 9.39.5 + eslint-config-next 16.3.5 (core-web-vitals + typescript) |
| Vitest | 5.0.1 |
| Runtime dependencies | `next`, `react`, `react-dom` only (no date/time or icon libraries) |

Version notes: TypeScript is pinned to 6.0 because `typescript-eslint` supports TypeScript < 6.1. ESLint is pinned to 9 because the Next ESLint plugins declare peer support up to ESLint 9.

---

## 4. Definition of Done (from CLAUDE.md) — status

| Requirement | Status | Evidence |
| --- | --- | --- |
| All five reference experiences work | Yes | §5, §11, §12 |
| Visually align with the PRD | Yes, with documented differences | §12, §13 |
| Work on desktop/mobile | Yes | §12 (70 automated layout checks + screenshots) |
| Useful server-rendered content | Yes | FAQs, tables, zone facts, offsets and dates are in raw HTML (§11) |
| Correct time calculations | Yes | §7, §9 (82 tests) |
| Metadata / canonical / breadcrumbs | Yes | §11 |
| Build / typecheck / lint / tests pass | Yes | §10 |
| No obvious hydration or console errors | Yes | §12 |
| Sitemap verified | Yes | §11 |
| 404 verified | Yes | §11 |
| Timezone calculations verified | Yes | §7, §9 |
| Docs: README, CLAUDE.md, DESIGN_SYSTEM, SEO_ARCHITECTURE, DATA_MODEL, seo/keyword-map | Yes (CLAUDE.md left unchanged) | Repository root |

---

## 5. Routes implemented

| Route | Pages generated | Indexable | Rendering |
| --- | --- | --- | --- |
| `/` | 1 | yes | static, revalidate 1h |
| `/time/[city]/` | 25 | yes | SSG, revalidate 1h |
| `/timezones/[timezone]/` | 11: utc, gmt, est, edt, cst, cdt, mst, mdt, pst, pdt, ist | yes | SSG, revalidate 1h |
| `/timer/[duration]/` | 12: 1, 2, 3, 5, 10, 15, 20, 30, 45 minutes; 1, 2, 3 hours | yes | SSG (static) |
| `/convert/[from]-to-[to]/` | 8: ist-to-est, est-to-ist, cst-to-ist, pst-to-ist, gmt-to-ist, utc-to-ist, cst-to-est, est-to-pst | yes | SSG, revalidate 1h |
| `/timezones/`, `/timer/`, `/converter/`, `/world-clock/`, `/tools/` | 5 hubs | **no** (noindex, follow) | static / revalidate 1h |
| `/sitemap.xml`, `/sitemaps/{section}-{n}.xml` | index + 5 | — | static route handlers |
| `/robots.txt`, `/api/search-index/` | — | — | static |

- Unknown slugs and non-allowlisted converter pairs return **404** (`dynamicParams = false`).
- `proxy.ts` 308-redirects mixed-case URLs to lowercase.
- Timer spelling variants 308-redirect to the canonical preset (generated from data).
- The hub pages exist so that header navigation never links to a 404. They are functional but minimal, and stay noindex until their own sprints.
- Planned tools (meeting planner, alarm, stopwatch, date tools), country pages and UTC/GMT offset hubs have **no routes and are not linked anywhere**.

---

## 6. Architecture

### 6.1 Structure

```text
app/          routes (Server Components by default) + robots, sitemap route handlers, proxy
components/   layout, search, clock, city, timezone, timer, converter, tools, seo, ui
data/         typed seed records: cities, countries, timezones, timers, converters, converter-zones, tools
lib/time/     time engine (pure functions, no host-zone dependence)
lib/clock/    live clock runtime (inline bootstrap, stores, formatting)
lib/content/  data-driven page copy and FAQs
lib/data/     accessors over data/
lib/seo/      metadata, JSON-LD, sitemap registry, site config
lib/search/   search index builder + matcher
lib/timezones/status.ts   "is CST or CDT in effect" logic
types/data.ts data model types
```

### 6.2 Time engine (`lib/time`)

All functions take explicit instants and IANA zones. No function reads the host machine's zone.

| Function | Behaviour |
| --- | --- |
| `getUTCOffset(zone, instant)` | Formats the instant (floored to the second) in the zone with `Intl.DateTimeFormat` parts (`hourCycle: 'h23'`), reinterprets those parts as UTC, and returns the difference in minutes |
| `getDSTState(zone, instant)` / `isDST` | **Revision 2.** (1) Zone metadata eras: offset matches the era's standard, daylight or backward-shift label. (2) Otherwise the previous/next offset transitions within ±400 days: none → fixed; only one side → open-ended regime (permanent change) → standard; both sides → seasonal regime, higher alternating offset = DST. No yearly minimum is used |
| `observesDST(zone, year)` | Classifies every offset period overlapping the year with `getDSTState`; true if any is DST |
| `resolveWallTime(wall, zone, disambiguation)` | Computes `wallMs` as if UTC. Candidate offsets are the offsets at `wallMs ± 24h`; a candidate is valid if `offset(wallMs − off) === off`. One valid → exact. Two valid (DST overlap) → earlier by default, `later` optional. None (DST gap) → `compatible` uses the pre-transition offset (moves forward by the gap), `earlier` uses the post-transition offset. `reject` throws. Mirrors Temporal disambiguation |
| `convertTime(fromZone, toZone, wall)` | Resolves the wall time, then evaluates both offsets at that instant; returns day shift and exact/gap/overlap status |
| `getTimeDifference(a, b, instant)` | `offset(b) − offset(a)` at the instant |
| `getNextTransition(zone, from, horizonDays=400)` | Steps 6 hours at a time, then binary-searches to minute precision |
| `getNextTransitionInfo`, `getDstTransitionsInYear` | Local wording: "Clocks go back 1 hour at 2:00 AM on Sunday, November 1, 2026 (CDT → CST)" |
| `getDifferencePeriods(a, b, start, days)` | Splits a window at both zones' transitions; merges equal adjacent periods |
| `getZoneLabel(zone, instant)` | Uses the metadata label matched by `getDSTState` (offsets stored per zone, so IST India and IST Ireland differ); otherwise returns `UTC±H[:MM]` |
| `getSunTimes(lat, lon, localDate, zone)` | NOAA solar equations, 90.833° zenith (refraction), 2 refinement iterations, local-date alignment, polar day/night detection |
| `suggestMeetingSlots` | Steps whole hours of an anchor zone across its local date; 60-minute slots; core hours 09:00–17:00, extended 07:00–22:00; quality 2 = all zones in core; quality 1 = at least one zone in core and all zones in extended; returns only the best quality found, chronologically, max 4 |
| Formatting | Strings are assembled from numeric `Intl` parts (not `Intl`'s localized output), so Node and browser ICU differences can't cause hydration mismatches |

### 6.3 Abbreviation model and CST handling

- `data/timezones.ts` stores, per abbreviation:
  - the offset it **denotes** (CST = UTC-6)
  - a `referenceZone` answering "what time is it in CST" (America/Chicago)
  - `seasonalRegions` (switch CST↔CDT) and `yearRoundRegions` (stay on UTC-6), each a `{ label, note?, zones }` record whose zones are verified against tzdata (Revision 2)
  - `alsoMeans` (other meanings) and related abbreviations
- The `/timezones/cst/` hero clock shows **Central Time with its real current abbreviation** (CDT on 2026-09-17).
- `computeAbbreviationStatus` generates the explanation. Observed on the live page: *"Central Time is on CDT right now, not CST. CDT is UTC-5, 1 hour ahead of CST (UTC-6). Central Time returns to CST on Sunday, November 1, 2026 at 2:00 AM. Places that stay on CST all year, such as Mexico City and Regina, are on UTC-6 now."*
- A separate **"Exact CST (UTC-6) time now"** clock uses IANA `Etc/GMT+6` (POSIX sign inversion is deliberate and tested).
- City cards on the page show each city's own current abbreviation: Chicago/Dallas/Houston/New Orleans/Winnipeg = CDT; Mexico City/Regina = CST.
- The comparison table has two columns: **"By definition"** (fixed abbreviation offsets, e.g. CST→IST +11h 30m) and **"Right now"** (real regional clocks, e.g. +10h 30m during CDT).

**Finding during implementation:** Node's ICU accepts abbreviation ids as zones with inconsistent meanings. `"CST"` resolves to America/Chicago (observes CDT) while `"EST"` resolves to America/Panama (never observes DST). `isValidTimeZone` therefore rejects non-IANA ids, and a test documents the hazard.

### 6.4 Live clocks without hydration mismatch or flash

Follows the pattern in the bundled Next.js 16.3 guide "Preventing flash before hydration":

1. **Server render:**
   - Clock digits: placeholder `--:--:--`, so a cached page never shows a stale time.
   - UTC offset and date: real text from the render instant, so crawlers see them.
2. **Before first paint:** a small bootstrap in `<head>` (`window.__tn`) plus a per-element inline call fill the element during HTML parsing. `suppressHydrationWarning` makes React keep the DOM text.
3. **After hydration:** one shared once-per-second store (`useSyncExternalStore`, server snapshot `null`) keeps all clocks updated. Other live facts (abbreviation, DST status, differences, CST/CDT notice) are passed `renderedAt` so server and hydration output match, then switch to live values. A DST switch therefore updates immediately even from a cached page.
4. `lib/clock/bootstrap.test.ts` proves the inline script's output is **byte-identical** to the React formatter: 9 zones × 6 instants (including a DST boundary and a leap day) × 7 formats × 2 hour cycles.

### 6.5 Rendering and caching

Pages are static/SSG with `revalidate = 3600` where content is time-sensitive (timer pages are fully static). Server-rendered time facts are labelled with the date they apply to. Page components are Server Components; only small islands hydrate (clocks, controls, search, timer, converter).

### 6.6 Seed data

- **Cities (25):** New York, Los Angeles, Chicago, Houston, Dallas, Phoenix, San Diego, San Francisco, Denver, New Orleans (US); Toronto, Winnipeg, Regina (Canada); Mexico City, Tijuana (Mexico); London, Paris, Berlin; Dubai; New Delhi, Mumbai, Bengaluru; Singapore; Tokyo; Sydney.
  - Chosen to exercise edge cases: no-DST Phoenix, CST-all-year Regina and Mexico City, cross-border Tijuana, the half-hour India offset, southern-hemisphere Sydney.
- **Countries:** 11, all `published: false` (country pages are Sprint 2), so breadcrumbs show the country as text only.
- **Timer presets:** 12. **Converter pairs:** 8 (allowlist).

---

## 7. Timezone accuracy

### 7.1 Visual PRD values that were wrong, and the corrected values

All PRD mockup values are for **December 1–2, 2024**. US DST ended on **Sunday, November 3, 2024** and restarted on **Sunday, March 9, 2025**, so US zones were on standard time (EST UTC-5, CST UTC-6, PST UTC-8). IST is always UTC+5:30.

| # | PRD screen | PRD value | Correct value | Arithmetic |
| --- | --- | --- | --- | --- |
| 1 | Converter live clocks | 10:24 PM IST (Mon, Dec 2) = **12:54 PM EST** | **11:54 AM EST** | 22:24 − 5:30 = 16:54 UTC; 16:54 − 5:00 = 11:54 |
| 2 | Convert a specific time | 10:00 PM IST, Dec 2, 2024 = **12:30 PM EST** | **11:30 AM EST** | 22:00 − 5:30 = 16:30 UTC; − 5:00 = 11:30 |
| 3 | Time difference | "IST is **9 hours 30 minutes** ahead of EST" | **10 hours 30 minutes** | +5:30 − (−5:00) = 10:30. 9h30m is the gap to EDT (UTC-4), not EST |
| 4 | Best time to call | 6:30 PM IST = 9:00 AM EST; 7:30 PM = 10:00 AM; 8:30 PM = 11:00 AM | 6:30 PM IST = **8:00 AM** EST; 7:30 PM = **9:00 AM**; 8:30 PM = **10:00 AM** | 18:30 − 5:30 = 13:00 UTC = 08:00 EST. The PRD rows are only correct during EDT |
| 5 | San Diego — Daylight Saving Time | "**In effect (PST)**" | **Not in effect** (PST is standard time) | DST not active between Nov 3, 2024 and Mar 9, 2025 |
| 6 | San Diego → New Delhi | **+16 hours 30 minutes** | **+13 hours 30 minutes** (winter); +12h 30m during PDT | +5:30 − (−8:00) = 13:30 |
| 7 | CST page — Mexico City | **8:54 PM** while Chicago is 9:54 PM CST | **9:54 PM** (same as Chicago in winter) | Mexico ended DST (last change Oct 30, 2022); Mexico City is UTC-6 all year, as is Chicago in winter. In summer Mexico City is 1 hour **behind** Chicago |

The implementation calculates all of these for the actual date shown. Items 1–4, 6 and 7 are locked in by unit tests using the PRD's own explicit dates (§9).

**PRD values checked and found correct** (kept as a sanity reference):
- Homepage cities at 10:24 AM IST, Dec 2, 2024: New York 11:54 PM EST (Dec 1), London 4:54 AM GMT, Dubai 8:54 AM GST, Singapore 12:54 PM SGT, Tokyo 1:54 PM JST, Sydney 3:54 PM AEDT.
- CST → EST +1h, → PST −2h, → IST +11h 30m, → GMT/UTC +6h (winter).
- San Diego → New York +3h, → London +8h, → Dubai +12h, → Tokyo +17h (winter).
- Phoenix 8:54 PM / Tijuana 7:54 PM when San Diego is 7:54 PM PST.
- "DST starts Mar 9, 2025" / "Changes to CDT on Mar 9, 2025".

### 7.2 DST dates asserted by tests

| Zone | Year | Start (local) | End (local) | UTC instants tested |
| --- | --- | --- | --- | --- |
| America/New_York | 2026 | Sun Mar 8, 02:00 EST → 03:00 EDT | Sun Nov 1, 02:00 EDT → 01:00 EST | 2026-03-08T07:00Z, 2026-11-01T06:00Z |
| America/Chicago | 2026 | Mar 8 | Nov 1 | 08:00Z, 07:00Z |
| America/Los_Angeles | 2026 | Mar 8 | Nov 1 | 10:00Z, 09:00Z |
| Europe/London | 2026 | Sun Mar 29 (GMT→BST) | Sun Oct 25 (BST→GMT) | 01:00Z both |
| Australia/Sydney | 2026 | DST ends Sun Apr 5, 03:00 AEDT | — | — |
| America/New_York | 2027 | DST resumes Sun Mar 14 | — | 2027-03-14T07:00Z |

### 7.3 Values rendered by the live pages (captured 2026-09-17 ~14:37 UTC) — for spot-checking

| Page | Rendered value |
| --- | --- |
| `/time/san-diego/` | Pacific Daylight Time (PDT), UTC-7, DST in effect, ends Nov 1, 2026. Sunrise 6:33 AM, sunset 6:51 PM (12h 18m daylight) for Sep 17, 2026 |
| `/time/san-diego/` differences | New York +3h, London +8h, Dubai +11h, New Delhi +12h 30m, Tokyo +16h |
| `/time/san-diego/` FAQ | "In 2026, daylight saving time starts on Sunday, March 8, 2026, when clocks go forward 1 hour at 2:00 AM, and ends on Sunday, November 1, 2026, when clocks go back 1 hour at 2:00 AM." |
| `/timezones/cst/` | CDT · UTC-5 now; CST→IST by definition +11h 30m, right now +10h 30m; CST→GMT/UTC by definition +6h, right now +5h |
| `/convert/ist-to-est/` periods | Now until Nov 1, 2026: IST 9h 30m ahead (IST→EDT); Nov 1, 2026 – Mar 14, 2027: 10h 30m (IST→EST); from Mar 14, 2027: 9h 30m |
| `/convert/ist-to-est/` best time to call (Sep 17, 2026) | 6:30 PM IST = 9:00 AM EDT; 7:30 PM = 10:00 AM; 8:30 PM = 11:00 AM |
| `/convert/ist-to-est/` table (Sep 17, 2026 IST) | 12:00 AM → 2:30 PM (previous day); 9:00 AM → 11:30 PM (previous day); 6:00 PM → 8:30 AM; 10:00 PM → 12:30 PM |

### 7.4 Factual statements in data that deserve review

`data/timezones.ts` asserts, for example:

- **CST all year:** most of Saskatchewan (exceptions: Lloydminster follows Alberta’s Mountain Time with DST; a few communities near the Manitoba border, such as Creighton, change clocks); most of Mexico, including Mexico City, Guadalajara, Monterrey, Mérida and most of Chihuahua state (DST ended Oct 2022); Guatemala, Belize, Honduras, El Salvador, Nicaragua, Costa Rica.
- **CST/CDT seasonal (Mexico):** US-border areas of Coahuila, Nuevo León and Tamaulipas (Piedras Negras, Nuevo Laredo, Matamoros) and Ojinaga, Chihuahua.
- **EST all year:** Panama, Jamaica, Quintana Roo (Cancún).
- **MST all year (UTC-7):** Arizona (except the Navajo Nation); Sonora; Sinaloa, Baja California Sur and most of Nayarit (since 2022); Yukon (Pacific Time until 2020, UTC-7 all year since, shown as “Yukon Time”); northeastern British Columbia and Creston.
- **MST/MDT seasonal:** also Alberta, the Northwest Territories, southeastern British Columbia, Lloydminster and Ciudad Juárez.
- **Other meanings:** CST also China Standard Time (UTC+8) and Cuba Standard Time (UTC-5); IST also Irish Standard Time (UTC+1) and Israel Standard Time (UTC+2); PST also Philippine Standard Time (UTC+8); EST also Australian Eastern Standard Time (AEST, UTC+10).

**Revision 2:** every region sentence now carries its IANA zones, and the tests check each zone's raw monthly offsets for 2026: seasonal regions alternate between exactly the standard and daylight offsets, and year-round regions stay on one offset. The earlier text was: the **IANA zone** behaviour behind each listed zone is verified by tests against tzdata 2026a (e.g. America/Regina, America/Mexico_City, America/Guatemala, America/Costa_Rica, America/Panama, America/Jamaica, America/Cancun, America/Phoenix, America/Hermosillo, America/Whitehorse all stay on the stated offset in 2026). The **human-readable region descriptions** (e.g. the Lloydminster and Creighton exceptions, which have no separate IANA zone) are written from general knowledge; the zones they cite are machine-verified.

---

## 8. SEO implementation

- **Metadata helper** (`lib/seo/metadata.ts`): title, description, absolute canonical, robots, Open Graph, Twitter on every page.
- **Indexation control** — two layers, both required to index:
  1. Global `NEXT_PUBLIC_ALLOW_INDEXING === 'true'`. Otherwise every page is noindex and robots.txt is `Disallow: /`.
  2. Per-record `indexable` flag.
- **Sitemaps:** index at `/sitemap.xml` → child sitemaps per section, chunked at 10,000 URLs. Only indexable records. `<lastmod>` intentionally omitted (a build timestamp is not a content change date). **Revision 2:** with the global kill switch off, the index and every child sitemap return 404.
- **robots.txt:** `Allow: /`, `Disallow: /api/`, `Sitemap:` line (production mode); `Disallow: /` and no Sitemap line when indexing is off.
- **Structured data:**
  - WebSite + WebPage (home).
  - WebPage + BreadcrumbList + FAQPage (city, timezone).
  - WebApplication + BreadcrumbList + FAQPage (timer, converter).
  - FAQPage is only emitted for FAQs visible on the page. Google limits FAQ rich results to authoritative government/health sites, so no rich result is expected.
  - BreadcrumbList omits unlinked crumbs (unpublished country), because Google requires `item` on non-final elements.
  - No SearchAction (there is no search results page to index).
- **URL policy:** lowercase, hyphenated, trailing slash; 308 lowercase redirect; timer alias redirects; converter allowlist (unapproved pairs 404).
- **Internal linking from data:**
  - City → comparison cities, nearby cities (great-circle distance), its timezone pages, approved converters.
  - Timezone → associated cities, related abbreviations, approved converters.
  - Timer → other presets.
  - Converter → both timezone pages, reverse pair, related converters.
- **Keyword map:** `seo/keyword-map.md`, one canonical URL per intent.
- **Analytics readiness:** `track()` wired for `search_used`, `city_selected`, `timezone_selected`, `timer_started`, `timer_completed`, `converter_used`. GA4 loads only if `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set; no ID is hardcoded.

---

## 9. Test results

**Evidence (`npx vitest run --reporter=verbose`, Revision 2):** 8 test files, **112 passed, 0 failed** — zone 22, conversion 20, sun & meeting 23, transitions 12, DST 11, data integrity 18, search 5, bootstrap 1. (The first report had 7 files and 82 tests; the lists below show the original tests plus Revision 2 additions.) The test runner forces `TZ=Pacific/Chatham` (UTC+12:45/+13:45) so any accidental use of the machine's local zone would fail; the first test asserts this.

`lib/time/zone.test.ts` (21)
- runs under a non-UTC host zone so local-time leaks would be caught
- IST is UTC+5:30 all year with no DST
- UTC is always 0
- America/New_York: EST (UTC-5) in winter, EDT (UTC-4) in summer
- America/Chicago: CST (UTC-6) in winter, CDT (UTC-5) in summer
- America/Los_Angeles: PST (UTC-8) in winter, PDT (UTC-7) in summer
- southern hemisphere DST: Sydney is on AEDT in January
- Mexico City abolished DST in 2022 and stays on UTC-6
- Phoenix and Regina do not observe DST
- New York springs forward at 2:00 EST on March 8 (07:00 UTC)
- New York falls back at 2:00 EDT on November 1 (06:00 UTC)
- Chicago and Los Angeles transition at 2:00 local time
- London switches at 01:00 UTC on the last Sundays of March and October
- zones without DST have no transitions
- resolves ordinary wall times exactly
- moves nonexistent spring-forward times forward (compatible)
- resolves repeated fall-back times to the earlier instant by default
- handles leap years and year boundaries
- computes zoned parts including weekday
- validates zone ids and rejects abbreviation ids
- documents why abbreviations must never be passed to Intl

`lib/time/conversion.test.ts` (18)
- IST → Eastern in December uses EST (IST is 10h30m ahead) — PRD corrections #1–#3
- IST → Eastern in September uses EDT (IST is 9h30m ahead)
- handles cross-date conversions
- handles year boundaries
- handles leap days (2028-02-29)
- flags DST gaps in the source zone
- San Diego comparisons in winter — PRD correction #6
- CST comparisons in winter
- Mexico City matches Chicago in winter but is an hour behind during CDT — PRD correction #7
- EST → PST is usually 3 hours but briefly 4 or 2 hours on transition days
- US and UK switch on different dates, so New York–London varies
- describes differences in words
- uses verified abbreviations that match the actual offset
- **Revision 2:** uses dated metadata eras (Mexico City 2022 → CDT; Yukon 2020 → PDT, 2026 → MST “Yukon Time”)
- **Revision 2:** keeps ambiguous abbreviations per zone (IST India UTC+5:30 vs IST Ireland UTC+1)
- never shows an abbreviation whose offset does not match (Arizona 1967 → "UTC-6"; Kathmandu → "UTC+5:45")
- formats offsets / 12- and 24-hour times / durations / dates deterministically

`lib/time/sun-meeting.test.ts` (11)
- **Revision 2:** sunrise/sunset within ±1 minute of **U.S. Naval Observatory** values for 15 cases (New York solstices and DST-start day, Chicago DST-end day, San Diego PRD date and equinox, London solstices, Helsinki, Sydney solstices, Tokyo, Mumbai, Singapore, Quito), plus polar day and polar night at Longyearbyen
- returns events on the requested local date for far-east zones
- reports polar day and polar night (Longyearbyen)
- India ↔ US East during EDT: New York mornings map to IST evenings (9/10/11 AM EDT = 6:30/7:30/8:30 PM IST)
- India ↔ US East during EST: one fewer workable slot (9/10 AM EST = 7:30/8:30 PM IST) — PRD correction #4
- prefers true business-hour overlap when it exists (London–New York)

`lib/time/transitions.test.ts` (12)
- US spring-forward described in local terms ("Clocks go forward 1 hour at 2:00 AM on Sunday, March 8, 2026 (PST → PDT).")
- fall-back described (CDT → CST, Nov 1, 2026)
- southern hemisphere (Sydney DST ends April 5, 2026)
- null for zones without DST
- IST → Eastern periods: 9h30m / 10h30m / 9h30m with exact boundaries
- New York → London: 5 periods in 2026 (US and UK switch on different dates)
- merges periods when both zones switch together (New York / Toronto)
- CST page in September: "Central Time is on CDT right now, not CST" (full text asserted)
- CST page in January: CST in effect; switches to CDT Mar 14, 2027
- CDT page in January: not in effect
- IST never changes
- GMT page in summer explains the UK is on BST

`lib/data/data-integrity.test.ts` (14)
- city slugs unique and URL-safe; valid IANA zones, known countries, sane coordinates; country names consistent
- nearby cities for San Diego = Tijuana, Los Angeles, Phoenix (computed from coordinates)
- timezone slugs match abbreviations; references valid
- **Revision 2:** every geography sentence names at least one backing zone
- **every seasonal region's zones alternate between exactly the standard and daylight offsets (raw monthly tzdata offsets, 2026)**
- **every year-round region's zones stay on the abbreviation's offset every month of 2026**
- **Revision 2:** Saskatchewan, Yukon and Mexico zones are listed under the right behaviour
- Etc/GMT sign inversion
- timer slugs canonical; alias redirects never collide
- converter allowlist valid; unlisted pair (ist-to-jst) rejected
- sitemaps list each indexable URL exactly once; unknown sitemap files rejected
- **Revision 2:** sitemaps publish nothing when the kill switch is off, and default to the environment switch

`lib/time/dst.test.ts` (11, Revision 2): metadata classification of ordinary zones; Yukon 2020 DST then permanent UTC-7; Mexico City DST until Oct 2022; Morocco UTC+1 standard with a backward Ramadan shift (not DST, transition kind `offset-change`); Ireland GMT/IST; Turkey 2015 seasonal DST; Turkey 2016 permanent change = standard; Chihuahua 2022 permanent change = standard; Arizona 1967 fallback to transitions; fixed zones; cache consistency.

`lib/search/match.test.ts` (5): normalisation, prefix/alias/country matching ("bombay" → Mumbai, "nyc" → New York, "india" → Indian cities), grouping ("cst" → CST timezone), offsets ("utc+5:30" → IST), empty queries.

`lib/clock/bootstrap.test.ts` (1): inline bootstrap output identical to the React formatter across 756 combinations.

---

## 10. Build, lint, typecheck

**Evidence:**

```text
$ npx tsc --noEmit        → PASS (0 errors)
$ npx eslint .            → PASS (0 errors, 0 warnings)
$ npx vitest run          → Test Files 7 passed (7) · Tests 82 passed (82)
$ next build              → ✓ Compiled successfully · ✓ Generating static pages (73/73)
```

Build route summary (abridged):

```text
┌ ○ /                                    1h
├ ● /convert/[pair]      (8 paths)       1h
├ ○ /converter                           1h
├ ○ /robots.txt   ○ /sitemap.xml   ● /sitemaps/[file] (5 paths)
├ ● /time/[city]         (25 paths)      1h
├ ○ /timer   ● /timer/[duration] (12 paths)
├ ○ /timezones                           1h
├ ● /timezones/[timezone] (11 paths)     1h
├ ○ /tools   ○ /world-clock              1h
ƒ Proxy (Middleware)
```

A lint rule (`react-hooks/purity`) rejects `Date.now()` during render. Server Component pages obtain their render instant via `lib/server/render-instant.ts` (`import 'server-only'`), documented as intentional because Server Components render once per request/revalidation.

---

## 11. HTTP verification (production build, `NEXT_PUBLIC_SITE_URL=https://timenow.example`, `NEXT_PUBLIC_ALLOW_INDEXING=true`)

**Status codes**

```text
/                        200
/time/san-diego/         200
/timezones/cst/          200
/timer/1-hour/           200
/convert/ist-to-est/     200
/time/atlantis/          404
/convert/ist-to-jst/     404
/timer/7-minutes/        404
/timezones/xyz/          404
/sitemap.xml             200
/robots.txt              200
```

**Redirects**

```text
/time/San-Diego/       308 -> /time/san-diego/
/TIMEZONES/CST/        308 -> /timezones/cst/
/timer/60-minutes/     308 -> /timer/1-hour/
/timer/1-hours/        308 -> /timer/1-hour/
/time/san-diego        308 -> /time/san-diego/
```

**robots.txt**

```text
User-Agent: *
Allow: /
Disallow: /api/

Sitemap: https://timenow.example/sitemap.xml
```

**Sitemap index** → `pages-1.xml`, `cities-1.xml`, `timezones-1.xml`, `timers-1.xml`, `converters-1.xml`. URL counts: pages 1, cities 25, timezones 11, timers 12, converters 8. No hub URLs are included.

**404 page:** single `<meta name="robots" content="noindex">`.

**Metadata (from raw HTML)**

| Path | Title | Canonical | Robots | H1 (count 1) |
| --- | --- | --- | --- | --- |
| `/` | Current Time Now – Exact Local Time, World Clocks & Time Zones | https://timenow.example/ | index, follow | Current Time Now |
| `/time/san-diego/` | Current Time in San Diego, California – Time Zone & DST \| TimeNow | …/time/san-diego/ | index, follow | Current Time in San Diego, United States |
| `/timezones/cst/` | Central Standard Time (CST) – Current Time, UTC-6 & DST \| TimeNow | …/timezones/cst/ | index, follow | Central Standard Time (CST) |
| `/timer/1-hour/` | 1 Hour Timer – Free Online Countdown with Alarm \| TimeNow | …/timer/1-hour/ | index, follow | 1 Hour Timer |
| `/convert/ist-to-est/` | IST to EST Converter – India Standard Time to Eastern Time \| TimeNow | …/convert/ist-to-est/ | index, follow | IST to EST Converter |
| `/timezones/` | Time Zones – Abbreviations, UTC Offsets & Current Time \| TimeNow | …/timezones/ | noindex, follow | Time Zones |
| `/world-clock/` | World Clock – Current Time in Major Cities \| TimeNow | …/world-clock/ | noindex, follow | World Clock |

Descriptions (examples):
- San Diego: "What time is it in San Diego? See the live local time and date, its time zone — Pacific Time (PST, UTC-8 / PDT, UTC-7) — daylight saving dates, sunrise and sunset, and time differences with major cities."
- CST: "Central Standard Time (CST) is UTC-6. See the current Central Time (US & Canada) time, whether CST or CDT is in effect today, where CST is used and how it compares with other time zones."

**JSON-LD** (every block parsed with `JSON.parse`; breadcrumb structure checked)

```text
/:                    WebSite, WebPage (all parse)
/time/san-diego/:     WebPage, FAQPage, BreadcrumbList (all parse)
/timezones/cst/:      WebPage, FAQPage, BreadcrumbList (all parse)
/timer/1-hour/:       WebApplication, FAQPage, BreadcrumbList (all parse)
/convert/ist-to-est/: WebApplication, FAQPage, BreadcrumbList (all parse)
```

**Server-rendered live facts (raw HTML, before JavaScript)**

```text
/time/san-diego/  date: "Thursday, September 17, 2026"  offset: "UTC-7"  clock digits: "--:--:--" (filled before paint)
/timezones/cst/   date: "Thursday, September 17, 2026"  offset: "UTC-5"
```

---

## 12. Desktop and mobile verification

**Automated layout checks** (production build; each page loaded in a same-origin iframe at each width):
- Pages: `/`, `/time/san-diego/`, `/timezones/cst/`, `/timer/1-hour/`, `/convert/ist-to-est/`, `/timezones/`, `/timer/`, `/converter/`, `/world-clock/`, `/tools/`
- Widths: 375, 390, 430, 768, 1024, 1280, 1440
- Checks: horizontal overflow (`scrollWidth − clientWidth`), exactly one H1, and on widths < 768 every link/button/input/select/summary at least 44px tall (excluding breadcrumb links and links inside running text)
- **Result: 70 checks, 0 issues.**

**Visual review against the PRD** (manual, screenshots in the in-app browser):
- Mobile 375px: all five reference pages. Compared with the PRD mobile row: compact header + hamburger, prominent search, clock above the fold, 12H/24H + fullscreen, stacked cards, tabs, bottom navigation Home/Search/Tools/More.
- Desktop: all five reference pages at the default desktop pane width, plus the homepage at 1280px. Compared with the PRD desktop row: layout order, clock hierarchy, info cards, tables, timer ring and presets, converter structure.

**Interactions exercised**
- Timer: Start → countdown and tab title update → Pause shown. A 2-second custom timer reaches "Time's up!" with a green ring and title "Time's up! · 1 Hour Timer".
- Search: typing "cen" shows a grouped "Time Zones" list (CST, CDT); ArrowDown highlights; Enter navigates to `/timezones/cdt/`. Alias "bomb" finds Mumbai.
- 12/24-hour toggle: switching to 24-hour persists across a full reload and is applied before first paint.
- Mobile menu: opens as a side sheet; links navigate and close it; its Search item opens the search dialog with the input focused.

**Console and hydration**
- Production server: no console messages on the homepage.
- Dev server (which reports hydration mismatches), with the 24-hour preference set to exercise the hardest hydration path: no errors or warnings on all five reference pages.
- After the final change (server-rendered offset/date), `/time/san-diego/`, `/convert/ist-to-est/`, `/world-clock/` and `/timezones/cst/` were rechecked: no hydration messages, and the Next.js dev tools reported no issues.

**Fixes made during the final verification pass** (these are included in all evidence above):
1. At 375px `/convert/ist-to-est/` overflowed by 8px. Cause: responsive grids had no base column definition, so the implicit track grew to fit unbreakable content (a `<select>`'s longest option, truncated link text). Fix: `grid-cols-1` (`minmax(0,1fr)`) on all such grids.
2. UTC offset and date were placeholders in raw HTML; now server-rendered.
3. The city H1 text lacked a space ("Current Time inSan Diego") in raw text; fixed.
4. The 404 page had two robots meta tags; fixed.
5. Mobile touch targets raised to 44px (clock controls, logo, swap button, table links); mobile shows "12H/24H" like the PRD.

---

## 13. Differences from the Visual PRD

| Difference | Reason |
| --- | --- |
| All values in §7.1 corrected | Accuracy rule: IANA is the time source of truth |
| City photographs replaced by a ~1 KB inline SVG skyline on a light-blue surface | Performance (no remote images); user decision #3 |
| Desktop nav has 5 items (World Clock, Time Zones, Converter, Timers, Tools) | User decision #4 |
| Desktop pages use denser two-column layouts at ≥1024px | PRD desktop screens are narrow columns; full-width desktop needs information density |
| City tabs: Overview / Time Difference / Nearby Cities / About (no Weather) | No weather service in scope (CLAUDE.md marks weather optional/later) |
| CST page clock labelled "Central Time (US & Canada) now" showing CDT when applicable, plus status notice and exact UTC-6 clock | User decision #6: never label CDT as CST |
| Converter shows "Eastern Time (EDT)" when EDT is in effect; adds a difference-periods list and a strict EST vs EDT notice | Accuracy |
| "Find the best meeting time" CTA → "Convert another time zone" | Meeting planner is Sprint 5; no links to routes that don't exist |
| Planned tools show a "Soon" badge and are not links | Same |
| Footer links only to live pages (no API/About/Contact/Countries) | Same |
| Homepage location line shows the browser time zone's city ("Kolkata · your time zone"), not a geolocated city | CLAUDE.md: no automatic geolocation; the time zone is inferred from the browser |
| Timer adds Pause/Resume, Custom input, tab-title countdown, wake lock | CLAUDE.md timer requirements |
| Homepage adds a short "How the time on this page is calculated" section | Transparency; small, useful server-rendered content |

---

## 14. Known issues

1. `/timer/60-minutes` (no trailing slash) takes two redirect hops (trailing-slash redirect, then alias redirect). With the slash it is one hop.
2. ~~Sunrise/sunset test values were recalled, not sourced.~~ **Resolved in Revision 2:** fixtures from the U.S. Naval Observatory API; max deviation 0.51 min.
3. Timer alarms can be delayed or silent if the browser suspends a background tab or the device sleeps. The timer FAQ discloses this; remaining time stays accurate because it is computed from an end timestamp.
4. Clicking a timer preset while a timer is running navigates to that preset page and resets the running timer.
5. Converter `<select>` labels truncate on narrow phones.
6. For visitors who chose 24-hour format, the toggle's pressed state updates just after hydration (the clock text itself is correct before paint).
7. ~~Yearly-minimum DST rule.~~ **Resolved in Revision 2.** Remaining limitation for zones *without* metadata: the last DST period before a permanent change is classified as standard time (e.g. Turkey, summer 2016), and a backward seasonal shift would be misread. Seeded zones and all zones used in copy have metadata or verified behaviour.
8. Search requires JavaScript (no server-rendered search fallback).
9. Server-rendered date/offset and FAQ answers on cached (ISR) pages can be up to 1 hour old at midnight or DST boundaries. They are labelled with their date and corrected before paint for JavaScript users.
10. Development only: running `next build` while `next dev` is running broke the dev server's hot-reload WebSocket; restarting `next dev` resolves it.
11. `next start` logs `Error: Internal: NoFallbackError` for unknown slugs on routes with `dynamicParams = false`. Responses are correct 404s (see §0).

---

## 15. Technical debt

- Search downloads the full index client-side; at 10,000+ cities it needs a server route with prefix queries.
- `ZONE_METADATA` (labels and dated rule eras per IANA zone) is maintained by hand and must grow with the city dataset; add a test that every seeded city's zone has metadata.
- The converter re-renders every second (it follows the shared clock); could use minute granularity.
- ~~No end-to-end tests.~~ Playwright smoke suite added in Revision 2. Still no component-level tests; visual regression (screenshot) testing is not set up.
- The five hub pages are interim versions.
- `lib/data/timers.ts` must use relative imports because `next.config.ts` imports it (the `@/` alias doesn't resolve there).

---

## 16. Not verified (explicit)

- **Lighthouse scores and Core Web Vitals** (LCP, CLS, INP) — not measured.
- Real devices and other browsers (iOS Safari, Android Chrome, Firefox, Edge) — only Chromium was used (in-app browser, and Google Chrome with desktop and Pixel 7 emulation in Playwright).
- Screen reader testing (NVDA/VoiceOver).
- Google Rich Results Test / Schema Markup Validator (JSON-LD was only parsed locally).
- Audible alarm playback; fullscreen mode; long-running timer accuracy in a background tab.
- Converter form interactions by clicking (changing selects/dates, swap). The live comparison is verified end-to-end at a frozen instant, and the conversion logic is unit-tested.
- ISR revalidation behaviour over time on a real host; deployment; Search Console.
- GA4 event delivery (no measurement ID configured).
- Correctness of human-readable region descriptions in `data/timezones.ts` (IANA behaviour is tested; the prose is not).

---

## 17. Recommendations before Sprint 2

1. **Decision needed:** make `/utc/` and `/gmt/` the canonical UTC/GMT pages and 308-redirect `/timezones/utc/` and `/timezones/gmt/` to them, to avoid keyword cannibalisation (recommended).
2. Deploy a preview on the real domain; run Lighthouse (mobile and desktop), Rich Results Test and Schema Markup Validator; set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_ALLOW_INDEXING` only on production.
3. ~~Replace recalled sunrise/sunset values with sourced ones.~~ Done (USNO, Revision 2).
4. Build the country template before expanding cities (breadcrumb links and schema turn on automatically when `published` is set).
5. Source the 300–500 city dataset with verified licensing (e.g. GeoNames, CC BY 4.0) and extend `ZONE_METADATA`.
6. ~~Add Playwright smoke tests.~~ Done (Revision 2). Next: run them in CI with `npx playwright install chromium`, and add converter form interaction and visual regression tests.
7. Decide whether EDT/CDT/MDT/PDT pages stay indexable once Search Console data is available.

---

## 18. Reviewer checklist (suggested independent checks)

1. Recompute each row of §7.1 and confirm the corrected values.
2. Confirm the DST dates in §7.2 (US 2026: Mar 8 / Nov 1; US 2027 start: Mar 14; UK 2026: Mar 29 / Oct 25; Sydney 2026 DST end: Apr 5).
3. Confirm the Revision 2 geography: Mexico City UTC-6 all year since late 2022 while US-border areas (Matamoros, Ojinaga, Ciudad Juárez, Baja California) keep US DST; most of Saskatchewan on CST all year with Lloydminster and Creighton exceptions; Yukon on UTC-7 all year since 2020; Arizona (except the Navajo Nation), Sonora, Sinaloa/Baja California Sur/most of Nayarit, Panama, Jamaica and Quintana Roo without DST.
4. Spot-check the live values in §7.3 against timeanddate.com for 2026-09-17 (sunrise/sunset within ~2 minutes is expected for city-centre coordinates).
5. Review the `resolveWallTime` algorithm in §6.2 against Temporal's `disambiguation: 'compatible'` semantics.
6. Assess the SEO choices: noindex hubs in Sprint 1, indexable daylight abbreviation pages, FAQPage usage, omitted `<lastmod>`, two-layer indexation control.
7. Assess whether a 1-hour ISR window plus client-side live correction meets CLAUDE.md's accuracy principle.
8. Compare §4 and §5 against the Definition of Done in `CLAUDE.md`.
9. If source is attached: confirm no function in `lib/time/` depends on the host time zone, and no page hardcodes a time, offset or DST state.
10. Review `lib/time/dst.ts`: confirm no calendar-year minimum is used, and that the metadata-first / transition-fallback classification handles the cases in `lib/time/dst.test.ts`.
11. Spot-check `lib/time/__fixtures__/sun-usno.json` against the USNO URLs recorded in it.

---

## Appendix A — Documentation delivered

| File | Contents |
| --- | --- |
| `README.md` | Setup, environment variables, scripts, structure, routes, how-to tasks, verification checklist |
| `DESIGN_SYSTEM.md` | Tokens, typography, components, image-free artwork, live-value strategy, mobile, accessibility |
| `DATA_MODEL.md` | Accuracy rules, time engine API, record types, adding a city/country/timezone/timer/converter, test inventory |
| `SEO_ARCHITECTURE.md` | URL rules, templates, rendering, metadata, indexation, sitemaps, robots, structured data, internal linking, pending decisions |
| `seo/keyword-map.md` | Keyword → canonical URL map (live and planned) |
| `SPRINT_0_1_REPORT.md` | This report |

## Appendix B — Source inventory (126 files, excluding `node_modules`, build output, lockfile)

```text
Config:  package.json, tsconfig.json, next.config.ts, eslint.config.mjs, postcss.config.mjs,
         vitest.config.mts, playwright.config.ts, proxy.ts, .env.example, .gitignore, .claude/launch.json
e2e/:    fixtures.ts, smoke.spec.ts, seo.spec.ts, kill-switch.spec.ts, serve-builds.mjs  (Revision 2)
app/:    layout.tsx, globals.css, page.tsx, not-found.tsx, robots.ts, icon.svg,
         sitemap.xml/route.ts, sitemaps/[file]/route.ts, api/search-index/route.ts,
         time/[city]/page.tsx, timezones/page.tsx, timezones/[timezone]/page.tsx,
         timer/page.tsx, timer/[duration]/page.tsx, converter/page.tsx,
         convert/[pair]/page.tsx, world-clock/page.tsx, tools/page.tsx
components/: analytics/Analytics; city/CityCard; clock/{ClockControls, ClockPanel, InlineScript,
         LiveDifference, LiveTime, LiveZoneInfo}; converter/TimeConverter;
         layout/{Footer, Header, HeaderNav, Logo, MobileBottomNav, MobileMenu, events, navigation};
         search/{GlobalSearch, SearchDialog}; seo/JsonLd; timer/Timer;
         timezone/AbbreviationStatus; tools/ToolCard;
         ui/{Breadcrumbs, Callout, FAQ, Icon, InfoRow, LinkList, Section, SectionTabs}
data/:   cities, converter-zones, converters, countries, timers, timezones, tools
lib/:    analytics, routes, text, server/render-instant,
         time/{zone, zone-metadata, dst, format, abbreviations, aliases, difference, transitions, sun, meeting, index}
              + 5 test files + __fixtures__/sun-usno.json,
         clock/{bootstrap, constants, format-kind, stores} + bootstrap.test,
         content/{city, converter, timer, timezone},
         data/{cities, converters, countries, timers, timezones, tools} + data-integrity.test,
         search/{build-index, match} + match.test,
         seo/{jsonld, metadata, site, sitemap},
         timezones/status
types/:  data.ts
references/: visual-prd.png
```
