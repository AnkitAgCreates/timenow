# TimeNow — Sprint 6 Completion Report (SEO Optimisation)

- **Project:** TimeNow (SEO-first time utility platform)
- **Report date:** 2026-09-19
- **Prepared by:** Claude Code (implementation agent)
- **Purpose:** independent verification by a second reviewer
- **Governing spec:** `CLAUDE.md` — "Sprint 6 — SEO Optimization: Search Console workflow, opportunity analysis, internal-link suggestions and page-quality checks", plus "SEO Agent Readiness" (query, page, clicks, impressions, CTR, average position; high-impression low-CTR pages, positions 5–20, missing pages, internal linking, cannibalization, thin pages, metadata improvements; **no automated publishing in the MVP**)
- **Previous reports:** `SPRINT_0_1_REPORT.md`, `SPRINT_2_REPORT.md`, `SPRINT_3_REPORT.md`, `SPRINT_4_REPORT.md`, `SPRINT_5_REPORT.md`
- **Repository:** https://github.com/AnkitAgCreates/timenow (`main`)

---

## How to use this report (for the reviewer)

1. Every **evidence** block is copied from real command output run on 2026-09-19 after the last change. Anything **not** verified is listed in §12.
2. §5 shows the audit's findings on the Sprint 5 build and what remained after the fixes — the sprint's concrete effect on the site.
3. §6 documents the Search Console workflow with the synthetic sample run, since the site is not deployed and has no real Search Console data yet.
4. §8 lists every metadata change to pages that existed before this sprint, including the Sprint 1 reference pages.
5. Suggested review order in the source: `lib/seo/audit-rules.ts`, `lib/seo/gsc-analysis.ts`, `lib/seo/seo-tools.test.ts`, `scripts/seo/audit-site.mts`, `scripts/seo/analyze-gsc.mts`, `seo/SEARCH_CONSOLE_WORKFLOW.md`, `.github/workflows/ci.yml` (job `seo-audit`).

---

## 1. Summary

| Area | Status |
| --- | --- |
| Page-quality audit | `npm run seo:audit`: every prerendered page checked for title/description length and duplicates, one H1, canonical, robots vs sitemap membership, JSON-LD validity, broken internal links, orphans, thin content; Markdown + JSON reports; **runs in CI on every push** (job "SEO audit") and fails on errors |
| Search Console workflow | `npm run seo:gsc`: Search Console CSV exports (UI or API) → opportunities report: high-impression/low-CTR pages, positions 5–20, missing pages by intent, cannibalisation, internal-link suggestions from the real link graph, metadata suggestions; documented in `seo/SEARCH_CONSOLE_WORKFLOW.md`; synthetic samples included |
| Findings acted on | First audit of the Sprint 5 build: **0 errors, 872 warnings** → after two rounds of template fixes: **0 errors, 0 warnings** on 850 pages (§5) |
| Metadata improvements | Title budget of 60 and description budget of 160 characters, each with an automatic compact form (`fitTitle`, `fitDescription`); every description template rewritten; ambiguous city names qualified; hubs' titles shortened |
| Internal linking | Country pages now list every city in the country (7 city pages had no inbound links) |
| Thin content | Homepage gained a three-question FAQ (with FAQPage schema); it was the only page under 200 words |
| Typecheck / Lint / Unit tests / Build | Pass / Pass / **409 of 409 (16 files)** / Pass — 863 static pages |
| End-to-end (Playwright) | **130 passed, 6 skipped (intentional), 0 failed** in 4.3 min, desktop + mobile + kill-switch projects, run after the last change |
| CI (run 35437745673) | All three jobs green, including the new SEO audit job: 0 errors, 0 warnings in CI |
| Automated publishing | None — every suggestion is a human decision that goes through data/template edits, tests and CI |
| Roadmap | All six sprints in `CLAUDE.md` delivered |

---

## 2. Scope and decisions

Sprint 6 was started on the instruction "proceed to sprint 6". No decision blocked implementation; engineering choices:

1. **Audit the build, not the live site.** The audit reads the prerendered HTML and sitemap bodies under `.next/server/app`, so it runs in CI without a server and checks exactly what will be served. It needs the indexed variant (sitemaps exist only with indexing on), so the CI job builds into `.next-audit` with `NEXT_PUBLIC_ALLOW_INDEXING=true` and the example site URL.
2. **Pure logic, thin scripts, no dependencies.** Rules and analysis live in `lib/seo/*.ts` with unit tests; the CLIs are `.mts` files Node 24 runs directly (type stripping), using relative `.ts` imports (`allowImportingTsExtensions` enabled in `tsconfig.json`).
3. **Search Console inputs are files, not an API integration.** The scripts accept the UI's CSV exports (Queries/Pages) and a combined query+page export; no credentials or OAuth are involved. When the site is deployed, an API export can be dropped into the same command.
4. **Missing-page suggestions map to candidate paths but respect curation.** "what time is it in lisbon" → `/time/lisbon/ or /countries/lisbon/`, "7 minute timer" → `/timer/7-minutes/`, "new york to london time" → `/convert/new-york-to-london/`; the report says explicitly that a candidate must pass the existing curation rules before it becomes a page.
5. **Title budget.** Search results truncate titles around 60 characters; `fitTitle(preferred, compact)` uses the descriptive pattern when it fits and a compact one otherwise, so "IST to EST Converter – India Standard Time to Eastern Time" (58) stays and "AEST to CET Converter – Australian Eastern Standard Time to Central European Time" (81) becomes "AEST to CET Converter – Time Difference & Table". **Description budget** works the same way: `fitDescription(preferred, compact)` with a 160-character budget; city, country and abbreviation descriptions keep the zone's full name ("India Standard Time (IST, UTC+5:30)") when it fits and fall back to abbreviations only ("ACST (UTC+9:30) / ACDT (UTC+10:30)") when it does not. Both forms are generated from the same zone facts, so nothing is hand-written per page.
6. **Orphan = zero inbound links.** The first draft flagged pages with one inbound link; a single deliberate link (a country page listing its city) is a legitimate path for crawlers, so the rule counts only pages nothing links to.

---

## 3. Environment

Unchanged: Node v24.15.0 (used for direct `.mts` execution), Next.js 16.3.5, React 19.3, TypeScript 6.0.3, Vitest 5, Playwright 1.63. No new dependencies; `tsconfig.json` gains `allowImportingTsExtensions`; `package.json` gains `seo:audit` and `seo:gsc`; `.gitignore` and `eslint.config.mjs` exclude `seo/reports/`, `seo/exports/` and the audit build folder `.next-audit/` (without the ESLint entry, a local audit build made `npm run lint` fail on generated files).

---

## 4. Sprint 6 checklist (from `CLAUDE.md`) — status

| Requirement | Status | Where |
| --- | --- | --- |
| Search Console workflow working with query, page, clicks, impressions, CTR, position | Done — CSV parsing normalises "1,234", "12.5%", absolute or relative page URLs | `lib/seo/gsc-analysis.ts` `parseGscCsv`, `seo/SEARCH_CONSOLE_WORKFLOW.md` |
| High-impression low-CTR pages | Done — CTR under half the typical CTR for the position band | `findPageOpportunities` |
| Positions 5–20 | Done | `findPageOpportunities` |
| Missing city/timezone/timer/converter pages | Done — intent patterns + inventory of built pages | `findMissingPages`, `knownNames` |
| Internal linking opportunities | Done — for striking-distance pages, related pages not yet linking to them, from the audited link graph | `suggestInternalLinks` |
| Cannibalization | Done — queries with ≥ 2 of our pages receiving impressions | `findCannibalisation` |
| Thin pages, metadata improvements | Done — audit rules; metadata suggestions from top queries | `auditPage`, `suggestMetadata` |
| Page-quality checks | Done — audit in CI | `scripts/seo/audit-site.mts`, `.github/workflows/ci.yml` |
| No automated publishing | Respected — reports only | — |

---

## 5. The audit on the real site

### 5.1 First run (Sprint 5 build, 850 pages, 0 errors, 872 warnings)

| Rule | Count | Cause |
| --- | ---: | --- |
| description-length | 689 | city (469), country (78), zone-converter (80), UTC offset (32), abbreviation (29), `/gmt/` templates all 170–215 characters |
| title-length | 174 | zone-converter titles with two long zone names (up to 91 characters incl. suffix), long city/country names, abbreviation pages, `/utc/`, `/converter/`, `/tools/` |
| orphan | 7 | city pages listed neither among their country's 12 major cities nor in any nearby list (Kingston upon Hull, Pittsburgh, New Orleans, Oxnard, Reno, St. Louis, Visakhapatnam) |
| thin-content | 1 | homepage (131 words in `<main>`) |
| description-duplicate | 1 | Columbus (Ohio) and Columbus (Georgia) shared "What time is it in Columbus? …" |

### 5.2 Fixes (all in templates, no page edited by hand)

- Descriptions rewritten in `lib/content/city.ts`, `country.ts`, `timezone.ts`, `offset.ts`, `converter.ts` and the `/utc/`, `/gmt/` hubs (e.g. city: "What time is it in San Diego? Live local time, Pacific Time (PST, UTC-8 / PDT, UTC-7), daylight saving dates, sunrise, sunset and time differences with major cities.").
- Titles: `fitTitle` on city, country, abbreviation and zone-converter pages; shorter fixed titles for `/utc/`, `/gmt/`, `/converter/`, `/tools/`.
- Country pages: "All N cities in {country}" link list after the major-cities grid.
- Homepage: "Current time FAQs" (3 questions) with FAQPage JSON-LD.
- `cityQualifiedName()`: "Columbus, Georgia" in descriptions when another dataset city shares the name.

### 5.3 Second run (after the fixes)

```text
Audited 850 pages (850 indexable): 0 errors, 185 warnings → seo/reports/site-audit.md
  warning:description-length: 184
  warning:title-length: 1
```

Orphans, the thin page and the duplicate were gone. What remained: 184 descriptions of 171–196 characters (170 city pages whose zone has a long generic name such as "Central Standard Time (Central America; CST, UTC-6)" or a long city name, 7 abbreviation pages with a seasonal counterpart, 6 country pages, `/utc/utc-plus-530/`) and one title, `/countries/democratic-republic-of-the-congo/` at 77 characters even in its compact form.

### 5.4 Second round of fixes

- `fitDescription` (`lib/seo/title.ts`, budget 160) with compact forms: city descriptions drop the zone's long name and "with major cities" ("What time is it in Adelaide? Live local time, ACST (UTC+9:30) / ACDT (UTC+10:30), daylight saving dates, sunrise, sunset and time differences." — 142 characters); abbreviation pages with a counterpart drop the reference label ("CST (Central Standard Time) is UTC-6. Current time, whether CST or CDT applies today, where it is used, and comparisons with other zones."); single-zone country pages drop the zone name ("What time is it in the Dominican Republic? Live local time, AST (UTC-4), no daylight saving time, major cities and time differences.").
- UTC offset descriptions name two example locations instead of three; the `/countries/` hub description shortened; country titles get a third fallback (the bare "Current Time in {Country}") for the Democratic Republic of the Congo.
- Measured over every generated description (617: 469 cities, 96 countries, 50 abbreviations, plus the two hubs): longest 170 (the two-zone DRC country page), shortest 117, one above 160.

### 5.5 Third run (final state of this sprint)

```text
Audited 850 pages (850 indexable): 0 errors, 0 warnings → seo/reports/site-audit.md
```

---

## 6. Search Console workflow (synthetic sample run)

Evidence (`npm run seo:gsc -- --queries seo/samples/sample-queries.csv --query-page seo/samples/sample-query-page.csv`):

```text
Low CTR: 4 · striking distance: 4 · missing pages: 2 · cannibalisation: 2 · link suggestions: 6 · metadata: 1 → seo/reports/gsc-opportunities.md
```

From the report: missing pages suggested `/time/lisbon/ or /countries/lisbon/` (what time is it in lisbon; lisbon time now) and `/time/reykjavik/ or /countries/reykjavik/`; cannibalisation for "uk time now" (`/time/london/` vs `/countries/united-kingdom/`) and "est to pst" (`/convert/est-to-pst/` vs `/timezones/est/`); a metadata suggestion that `/timer/25-minutes/` lacks "pomodoro" from its top query; internal-link suggestions for the striking-distance pages from the real link graph. The samples are synthetic and exist only to exercise the tooling; no conclusion about real demand is drawn from them.

---

## 7. Tests

**Evidence (`npx vitest run`, after the last change):** `Test Files 16 passed (16) · Tests 409 passed (409)` (Sprint 5: 15 files, 399 tests). New: `lib/seo/seo-tools.test.ts` (10 tests) — the title and description budgets (`fitTitle`, `fitDescription`); audit rules on well-formed, broken and noindex pages; site-level broken links, duplicates, orphans and sitemap orphans; CSV parsing (UI and combined exports); known-name derivation; missing-page detection by intent with negative cases; low-CTR and striking-distance selection; cannibalisation; link suggestions (same family, already-linked excluded); metadata suggestions; report rendering.

Updated expectations (wording changes made on purpose): the India country description, the UTC-5 offset description, and the compact city-pair converter title.

**End-to-end (`npx playwright test`, after the last change):** `130 passed (4.3m) · 6 skipped` — 0 failed, 0 flaky; the six skips are the intentional per-project skips from earlier sprints. The only server log lines are the known `[WebServer] Error: Internal: NoFallbackError` entries that Next prints when the 404 tests request unknown slugs on `dynamicParams = false` routes (the pages return 404 as asserted).

---

## 8. Changes to pages that existed before Sprint 6

All are metadata or additive content, driven by the audit; no layout changed.

1. **Every city page** (incl. `/time/san-diego/`): shorter description template with an abbreviation-only compact form when the full one exceeds 160 characters (San Diego, whose full form is 165 characters, now reads "What time is it in San Diego? Live local time, PST (UTC-8) / PDT (UTC-7), daylight saving dates, sunrise, sunset and time differences." — 134); title falls back to "Current Time in {City} – Time Zone & DST" when the "{City}, {Region}" form exceeds 60 characters (23 pages); descriptions qualified for the two Columbuses and the two Londons.
2. **Every country page**: shorter single-zone description with an abbreviation-only compact form; compact title for 10 long country names (a bare "Current Time in {Country}" for the DRC); new "All N cities" list.
3. **Every abbreviation page** (incl. `/timezones/cst/`): description rewritten; CST now reads "CST (Central Standard Time) is UTC-6. Current time, whether CST or CDT applies today, where it is used, and comparisons with other zones."; compact title for 14 long names.
4. **Every UTC offset page**: shorter description naming two locations instead of three.
5. **Zone-converter pages** (incl. `/convert/ist-to-est/`): description shortened ("…a converter for any date, a DST-aware hourly table and the best hours to call"); `/convert/ist-to-est/` keeps its descriptive title (58 characters); 124 pairs with long zone names get the compact title.
6. **City-pair converters**: compact title "London to New York Time Converter – Time Difference" (the previous form was 71 characters).
7. **Hubs**: `/utc/`, `/gmt/`, `/converter/`, `/tools/` titles shortened; `/utc/` and `/gmt/` descriptions shortened.
8. **Homepage**: FAQ section and FAQPage schema added below the existing sections.

---

## 9. CI

`.github/workflows/ci.yml` gains job **SEO audit (indexed build)**: `npm ci` → `npm run build` with `NEXT_PUBLIC_ALLOW_INDEXING=true`, `NEXT_PUBLIC_SITE_URL=https://timenow.example`, `TIMENOW_DIST_DIR=.next-audit` → `node scripts/seo/audit-site.mts --dist .next-audit --site-url https://timenow.example` → `seo/reports/` uploaded as an artifact (30 days). Errors fail the job; warnings are reported.

**Evidence (GitHub Actions run 35437745673 on commit `e931b20`, https://github.com/AnkitAgCreates/timenow/actions/runs/35437745673):** all three jobs succeeded.

| Job | Result | Duration | Key log line |
| --- | --- | ---: | --- |
| Typecheck, lint, unit tests, build | success | 56 s | — |
| Playwright (two production builds, desktop + mobile + kill switch) | success | 2 min 3 s | `130 passed (1.5m)` |
| SEO audit (indexed build) | success | 48 s | `Audited 850 pages (850 indexable): 0 errors, 0 warnings → seo/reports/site-audit.md` |

The audit report is attached to the run as the `seo-audit` artifact.

---

## 10. Known issues

1. The audit's word count is a regex text extraction of `<main>`; it is a coarse thin-page signal, not a content-quality judgement.
2. Title/description budgets are heuristics (60/160 characters, audit warns above 70/170); Google truncates by pixel width, so some 60-character titles still get cut, and the compact description forms trade the zone's full name for fitting.
3. The Search Console analysis needs a query+page export for cannibalisation and metadata suggestions; the UI's separate Queries/Pages exports only feed the page- and intent-level sections.
4. Missing-page intent matching is English-only and pattern-based; unusual phrasings are ignored rather than mis-suggested.
5. Link suggestions score by shared slug words and page family; they are a shortlist to review, not a ranking of value.

---

## 11. Technical debt

- The audit's redirect allowlist (`/timezones/utc/`, `/timezones/gmt/`) is a constant in the script; generating it from `next.config.ts` would keep them in sync.
- `seo/reports/` is git-ignored; a committed baseline (warning counts) would let CI flag regressions, not only errors.
- The keyword map (`seo/keyword-map.md`) is still hand-maintained; the inventory the audit produces could generate the "live" rows.

---

## 12. Not verified (explicit)

- The workflow against real Search Console data (the site is not deployed). The CSV formats follow the current Search Console export layout; the parser is header-name based to tolerate changes.
- Google's actual title/description rendering (pixel truncation), Rich Results for the new homepage FAQPage.
- Lighthouse / Core Web Vitals.

---

## 13. Recommendations after the roadmap

1. Deploy, verify the domain in Search Console, submit `sitemap.xml`, and run `seo:gsc` monthly with a query+page export.
2. Commit a warning-count baseline for the audit and fail CI on regressions.
3. Consider the Sprint 5 phone layout for the meeting-planner grid and the Sprint 2 recommendation on Lighthouse measurement, both still open.

---

## Appendix A — Files created or modified in Sprint 6

```text
SEO tooling:    lib/seo/audit-rules.ts, lib/seo/gsc-analysis.ts, lib/seo/title.ts, lib/seo/seo-tools.test.ts (new),
                scripts/seo/audit-site.mts, scripts/seo/analyze-gsc.mts (new), seo/SEARCH_CONSOLE_WORKFLOW.md, seo/samples/*.csv (new)
Config:         tsconfig.json (allowImportingTsExtensions), package.json (seo:audit, seo:gsc), .gitignore, eslint.config.mjs (.next-audit ignored), .github/workflows/ci.yml (seo-audit job)
Metadata:       lib/seo/title.ts (fitTitle, fitDescription); lib/content/city.ts, country.ts, timezone.ts, offset.ts, converter.ts; app/time/[city]/page.tsx, app/countries/[country]/page.tsx, app/countries/page.tsx,
                app/timezones/[timezone]/page.tsx, app/utc/[offset]/page.tsx, app/utc/page.tsx, app/gmt/page.tsx, app/converter/page.tsx, app/tools/page.tsx
Content/links:  app/page.tsx (FAQ), app/countries/[country]/page.tsx (all cities)
Tests:          lib/content/country-offset.test.ts, lib/data/converters.test.ts (expectations)
Docs:           README.md, SEO_ARCHITECTURE.md, DATA_MODEL.md, SPRINT_6_REPORT.md (this file)
```
