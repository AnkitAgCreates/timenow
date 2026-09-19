# TimeNow — Sprint 3 Completion Report (Timer SEO)

- **Project:** TimeNow (SEO-first time utility platform)
- **Report date:** 2026-09-18
- **Prepared by:** Claude Code (implementation agent)
- **Purpose:** independent verification by a second reviewer
- **Governing spec:** `CLAUDE.md` — "Sprint 3 — Timer SEO: build timer hub and curated programmatic timer pages", plus the Timer section (features, presets, canonical URLs, "actual use cases and FAQs rather than repetitive filler")
- **Previous reports:** `SPRINT_0_1_REPORT.md`, `SPRINT_2_REPORT.md`
- **Repository:** https://github.com/AnkitAgCreates/timenow (`main`; CI runs typecheck, lint, unit tests, build and Playwright on every push)

---

## How to use this report (for the reviewer)

1. Every **evidence** block is copied from real command output run on 2026-09-18 after the last change. Anything **not** verified is listed in §15.
2. §5 lists the 30 curated lengths with the reason each exists; §6 explains what is unique per page and what is shared, so thin-content risk can be judged directly.
3. §8 lists every change to pages that existed before this sprint, including the approved `/timer/1-hour/` reference page.
4. §17 is a checklist of independent checks. Suggested review order in the source: `data/timers.ts`, `lib/data/timers.ts`, `lib/content/timer.ts`, `lib/data/timers.test.ts`, `app/timer/page.tsx`, `app/timer/[duration]/page.tsx`, `components/timer/TimerDirectory.tsx`, `e2e/sprint3.spec.ts`.

---

## 1. Summary

| Area | Status |
| --- | --- |
| Timer hub `/timer/` | **Indexable** with unique content: custom timer, grouped directory of every preset with taglines, how-to, timer/stopwatch/alarm comparison, hub FAQs; WebApplication + FAQPage + BreadcrumbList; listed in the sitemap |
| Curated programmatic timer pages | 12 → **30** (`/timer/[duration]/`): 2 in seconds, 18 in minutes, 10 in hours (30 s – 24 h); every preset has a unique tagline, 3–4 concrete use cases and at least one length-specific FAQ, enforced by tests |
| Canonical URLs and redirects | Canonical slug rule unchanged; alias spellings extended to second forms (`30-sec`, `30-secs`, `30-second`, `N-seconds`); unapproved lengths still 404 |
| Titles | "{N} {Unit} Timer" with the unit as an adjective ("25 Minute Timer", "30 Second Timer"); `/timer/1-hour/` keeps "1 Hour Timer" |
| Typecheck / Lint / Unit tests / Build | Pass / Pass / **375 of 375 (13 files)** / Pass — **708 static pages** (690 + 18 new timer pages) |
| End-to-end (Playwright, two production builds, desktop + mobile + kill switch) | **86 passed, 4 intentionally skipped, 0 failed** (Sprint 2: 79 / 3) |
| HTTP verification (indexed build) | Pass (§11): hub and preset metadata, JSON-LD, six alias redirects, 404s, timers sitemap 31 URLs, 691 total |
| Sprint 1 reference page `/timer/1-hour/` | Hero, subtitle, chips and title unchanged; content sections added below (§8) |
| Lighthouse / Core Web Vitals | **Not measured** (§15) |
| Sprint 4 (converter) | **Not started** (awaiting approval) |

---

## 2. Scope and decisions

Sprint 3 was started on the instruction "proceed to sprint 3". No decision blocked implementation; the engineering choices below are documented for review rather than pre-approved.

1. **Which lengths get pages.** 18 additions, each chosen because it has a recognisable real-world use (Tabata 4 min, 7-minute workout, Pomodoro 25 min, 50/10 focus cycle, 90-minute sleep cycle, 8-hour work day/sleep, 12/24-hour fasting, slow cooking 4–10 h, 30/90-second rest intervals). Lengths with no such use (11 min, 13 min, 100 h …) are not pages: they 404, and Custom covers them.
2. **Pomodoro maps to `/timer/25-minutes/`**, not to a keyword URL (`/timer/pomodoro/` → 404), per CLAUDE.md "never create one URL for every keyword wording variation".
3. **Title grammar.** Titles/H1s now read "25 Minute Timer" / "30 Second Timer" / "2 Hour Timer" (unit as an adjective, matching how people search) instead of the Sprint 1 "25 Minutes Timer" pattern. The approved reference `/timer/1-hour/` is unaffected ("1 Hour Timer"); the 11 other Sprint 1 pages change title only (§8).
4. **Hero subtitle unchanged.** The per-page uniqueness lives in the tagline (meta description, "About" paragraph, hub card) and the preset's own FAQ; the hero keeps the Sprint 1/PRD copy "A simple, reliable {length} timer. Set it and stay productive."
5. **Stopwatch and alarm** remain Sprint 5. The hub explains the difference between a timer, a stopwatch and an alarm clock in prose and says the latter two are planned; no links to non-existent routes.
6. **Hub content over hub keywords.** `/timer/` becomes indexable because it now has content a searcher for "online timer" needs (custom timer + directory + how-to + FAQs), not because indexation was scheduled.

---

## 3. Environment

Unchanged from Sprint 2: Node v24.15.0, Next.js 16.3.5, React 19.3, TypeScript 6.0.3, Tailwind 4.3.3, Vitest 5, Playwright 1.63 (Chrome locally, Chromium in CI), Windows 11 + Git Bash. No new dependencies.

---

## 4. Sprint 3 checklist (from `CLAUDE.md`) — status

| Requirement | Status | Where |
| --- | --- | --- |
| Timer hub `/timer/` | Indexable, with content (§7) | `app/timer/page.tsx` |
| Curated programmatic timer pages | 30 presets, allowlist-driven, others 404 | `data/timers.ts`, `app/timer/[duration]/page.tsx` |
| Timer features: hours/minutes/seconds, Start, Pause, Resume, Reset, sound, accessible controls | Unchanged from Sprint 1 (`components/timer/Timer.tsx`); re-verified by e2e on 25-minute and 30-second pages | — |
| `/timer/1-hour/` matches the PRD (H1, circular 01:00:00, Start, Reset, sound, quick presets) | Unchanged | smoke e2e |
| Initial indexable presets (1, 2, 3, 5, 10, 15, 20, 30, 45 min; 1, 2, 3 h) | All kept; test "keep the Sprint 1 presets" | `lib/data/timers.test.ts` |
| Canonical URLs; `/timer/60-minutes/` → `/timer/1-hour/` | Kept and extended (§9.2) | `lib/data/timers.ts`, `next.config.ts` |
| Timer SEO content: actual use cases and FAQs rather than repetitive filler | Per-preset tagline, 3–4 use cases, own FAQ(s) first; shared FAQs reduced to four | §6 |
| Internal linking: timer → hub, related durations, stopwatch, alarm | Hub, related durations (nearest + curated pairs), grouped directory; stopwatch/alarm when they exist (Sprint 5) | §9.4 |
| Sitemaps: timers section | Hub + 30 presets = 31 URLs | `lib/seo/sitemap.ts` |

---

## 5. The curated set (30)

Existing 12 (kept, now with tagline + own FAQ): 1, 2, 3, 5, 10, 15, 20, 30, 45 minutes; 1, 2, 3 hours.

| New page | Why it exists (tagline) | Own FAQ |
| --- | --- | --- |
| `/timer/30-seconds/` | Quick rests, plank holds, rapid-fire rounds | Is 30 seconds long enough to rest between sets? |
| `/timer/90-seconds/` | Classic rest interval; microwave-length countdown | Why rest 90 seconds between sets? |
| `/timer/4-minutes/` | One Tabata round; steeped tea; one-room tidy | How do I run Tabata with a 4-minute timer? |
| `/timer/6-minutes/` | Six-minute walk test; jammy eggs; read-aloud | What is the six-minute walk test? |
| `/timer/7-minutes/` | The 7-minute workout; short meditation | What is the 7-minute workout? |
| `/timer/8-minutes/` | Al dente pasta; core routine; unedited writing | Is 8 minutes right for pasta? |
| `/timer/12-minutes/` | Cooper run test; HIIT; rice simmer | What is the Cooper test? |
| `/timer/25-minutes/` | Pomodoro session | Is a 25-minute timer the same as a Pomodoro timer? / How many Pomodoros fit in a working day? |
| `/timer/40-minutes/` | Lesson-length block; tray bake; longer yoga | Should I use 40 or 45 minutes for a study block? |
| `/timer/50-minutes/` | 50/10 focus rhythm; therapy hour | What is the 50/10 method? |
| `/timer/90-minutes/` | One sleep cycle; football match; ultradian deep work | Is 90 minutes a good nap length? |
| `/timer/4-hours/` | Half-day deadline; braise; parking/laundry | Will a 4-hour timer keep running if I close the laptop? |
| `/timer/5-hours/` | Pulled pork; long gaming cap; study half-day | How do I make a 5-hour alarm reliable? |
| `/timer/6-hours/` | Low-and-slow roast; fasting checkpoints | Is a 6-hour timer accurate over that long? |
| `/timer/8-hours/` | Working day; night's sleep; overnight slow cooker | Can I use the 8-hour timer as a sleep timer? |
| `/timer/10-hours/` | Long shift; sous-vide; travel day | Does the 10-hour timer show hours as well as minutes? |
| `/timer/12-hours/` | Fasting window; overnight soak; 12-hour shift | Can I use this for a 16:8 fast? |
| `/timer/24-hours/` | Full-day deadline; 24-hour fast; sleep-on-it | Can a browser timer run for 24 hours? |

Rules enforced by `lib/data/timers.test.ts`: 20–40 presets (curated, never open-ended); unique durations; slug = `timerSlugForSeconds(seconds)`; unique taglines ending in punctuation; ≥ 3 unique use cases; ≥ 1 own FAQ, with no question repeated across pages; `related` slugs exist and never self-reference; quick-preset chips ≤ 8 and include 5 minutes and 1 hour; descriptions unique and ≤ 165 characters; hub copy derived from the data.

---

## 6. What is unique per page, what is shared

| Element | Unique per preset | Shared |
| --- | --- | --- |
| Title, H1, canonical | ✔ | — |
| Meta description | ✔ (tagline-based, 134–146 chars) | — |
| "About the {length} timer" paragraph | ✔ (tagline + exact equivalents: "1 hour 30 minutes or 5,400 seconds") | — |
| "Ideas for a {length} timer" | ✔ (3–4 use cases) | — |
| FAQs | ✔ own question(s) first | 4 shared: how to use, how long is {length} (answer unique), background tab, alarm sound |
| Related timers | ✔ nearest shorter/longer + curated pairs (25 ↔ 5/15/50 min; 20 ↔ 90 min naps; 12 ↔ 4/24 h fasting) | — |
| "Why use a timer?" benefits | — | 4 tiles (Sprint 1) |
| All timers directory | current page marked, not linked | grouped chips |
| Hero subtitle, quick-preset chips, timer UI | — | Sprint 1 / PRD |

Honest assessment: the shared FAQ block means four of five to six FAQ items repeat their wording across pages (the "how long" answer differs). The FAQPage schema therefore carries mostly shared Q&A plus one or two unique ones per page. If Search Console later suggests this is treated as duplication, the shared block can be trimmed to two questions or moved out of the schema without changing the page.

---

## 7. Timer hub content

`/timer/` — H1 "Online Timer"; subtitle derived from data ("pick one of 30 ready-made timers from 30 seconds to 24 hours"); the custom timer (5-minute default, quick chips, Custom hours/minutes/seconds); **Ready-made timers** (cards grouped Seconds / Minutes / Hours with each preset's tagline); **How to use the online timer** (4 steps); **Timer, stopwatch or alarm?** (definitions, with the note that stopwatch and alarm are planned); **Online timer FAQs** (5, hub-specific, counts derived from data). JSON-LD: WebApplication + FAQPage + BreadcrumbList. Meta description 143 characters.

---

## 8. Changes to pages that existed before Sprint 3

1. **`/timer/1-hour/` (approved reference page):** hero, subtitle, ring, controls, quick chips, title and H1 unchanged. Below the fold: new "About the 1 hour timer" paragraph and "Related timers" section; "Ideas" now precedes "Why use a timer?"; the FAQ list gains one 1-hour-specific question at the top; "More timers" became the grouped "All timers" directory. Smoke e2e for this page passes unchanged.
2. **Other 11 Sprint 1 timer pages:** title/H1 grammar ("5 Minutes Timer" → "5 Minute Timer"); same section changes as above; each gained a tagline and its own FAQ.
3. **`/timer/` hub:** from noindex functional page to indexable content page (§7); added to the sitemap. `e2e/seo.spec.ts` updated accordingly (it previously asserted the hub was absent from sitemaps).
4. No change to city, country, time zone, UTC or converter pages.

---

## 9. SEO implementation

### 9.1 Metadata
- Title pattern `{N} {Unit} Timer – Free Online Countdown with Alarm | TimeNow`; hub `Online Timer – Free Countdown Timer with Alarm | TimeNow`.
- Descriptions: `Free {length} timer. {tagline} Start, pause and reset, with an alarm at zero.` (unique, ≤ 165 chars by test).

### 9.2 Canonicals and redirects
- Canonical = own trailing-slash URL. Slug rule `timerSlugForSeconds`: `30-seconds`, `25-minutes`, `90-minutes` (not "1-5-hours"), `1-hour`, `24-hours`.
- Generated 308 redirects per preset: `N-seconds`, `N-second`, `N-sec`, `N-secs`, and for whole minutes `N-minutes/-minute/-min/-mins`, for whole hours `N-hours/-hour/-hr/-hrs` (e.g. `/timer/1440-minutes/` → `/timer/24-hours/`). Tests: no alias equals a canonical slug; sources unique.

### 9.3 Sitemap and indexation
- `timers` section = hub + 30 presets = 31 URLs; site total 691 (1 + 469 + 97 + 50 + 35 + 31 + 8). The kill switch still hides everything when indexing is off.

### 9.4 Internal linking
- Preset page → hub (breadcrumb), quick chips, Related timers (2–6), All timers (grouped, current marked), converter/tools via the global nav.
- Hub → every preset (30 cards). Homepage "Time Tools" tile → hub (unchanged).
- Stopwatch/alarm: text only until Sprint 5 ships the routes.

### 9.5 Search
- Timer pages are not in the site search index (search groups remain Cities / Countries / Time Zones per CLAUDE.md).

---

## 10. Test results

### 10.1 Unit tests

**Evidence (`npx vitest run`, after the last change):** `Test Files 13 passed (13) · Tests 375 passed (375)` (Sprint 2: 12 files, 363 tests).

New `lib/data/timers.test.ts` (12 tests):
- stay a curated set: between 20 and 40 presets, each duration once, sorted by length
- keep the Sprint 1 presets and add the curated Sprint 3 lengths
- give every preset a unique tagline, at least three unique use cases and a preset-specific FAQ
- only reference existing presets in related lists, never themselves
- group presets by unit and keep quick presets to a short chip row
- relate each page to its nearest lengths plus curated picks, without itself or duplicates
- redirect second, minute and hour spellings to the canonical slug
- writes unique, length-appropriate descriptions and intros
- spells out equivalents for seconds, minutes and hours
- puts preset-specific questions before the shared ones and never repeats a question on a page
- titles pages with the unit as an adjective, keeping the Sprint 1 reference title
- describes the hub from the dataset (and keeps the description ≤ 160 characters)

Existing Sprint 1 timer rules in `lib/data/data-integrity.test.ts` (canonical slugs; aliases never collide) still pass unchanged.

### 10.2 End-to-end

**Evidence (`npx playwright test`, after the last change):** `86 passed, 4 skipped (4.7m)`, 0 failed. Skips are intentional: the bottom-navigation test is mobile-only, and the three request-level checks (Sprint 1 HTTP, Sprint 2 routing, Sprint 3 routing) run once on desktop.

New `e2e/sprint3.spec.ts` (desktop + mobile, routing once):
- timer hub is indexable, structured (WebApplication, FAQPage, BreadcrumbList) and lists every curated timer (30 links; Seconds/Hours headings; Pomodoro card; no overflow; no console errors)
- a new curated preset works end to end (25 minutes): H1, indexable, About intro, own FAQ first, related links to 5/20/30 minutes, current page marked in the directory, Start → tab title `00:24:5x · 25 Minute Timer`
- a seconds preset counts down in seconds (30 seconds): `00:00:30` in the timer's accessible label, "How long is 30 seconds?", Start → `00:00:2x`
- second/minute/hour spellings redirect (`30-sec`, `90-min`, `1440-minutes`, `60-minutes` → 308 canonical); `/timer/7-minutes/` → 200 (it was a 404 example in the Sprint 1 report); `/timer/11-minutes/`, `/timer/pomodoro/`, `/timer/100-hours/` → 404

Updated: `e2e/seo.spec.ts` (hub now expected in the sitemap along with `/timer/25-minutes/`, `/timer/30-seconds/`, `/timer/24-hours/`). Unchanged and passing: `smoke.spec.ts` (including the 1-hour reference checks and timer start/pause/resume), `sprint2.spec.ts`, `kill-switch.spec.ts`.

---

## 11. Build, lint, typecheck and HTTP verification

```text
$ npm run typecheck   → PASS
$ npm run lint        → PASS (0 errors, 0 warnings)
$ npx vitest run      → Test Files 13 passed (13) · Tests 375 passed (375)
$ next build          → ✓ Generating static pages (708/708)   (indexing on: 690 + 18 new timer pages)
```

HTTP checks against the indexed build (`NEXT_PUBLIC_SITE_URL=http://localhost:3200`, urllib, redirects not followed), 2026-09-18:

```text
/timer/               200  title "Online Timer – Free Countdown Timer with Alarm | TimeNow"  robots index, follow
                           description 143 chars  H1 "Online Timer"  JSON-LD WebApplication, FAQPage, BreadcrumbList
                           5 FAQs; 30 distinct /timer/* links in the directory
/timer/25-minutes/    200  "25 Minute Timer – Free Online Countdown with Alarm"  description 143 chars
                           FAQs (6): Is a 25-minute timer the same as a Pomodoro timer? | How many Pomodoros fit in a working day? | How do I use the 25 minutes timer? | …
/timer/30-seconds/    200  "30 Second Timer – …"  description 145 chars  FAQs (5), own question first
/timer/24-hours/      200  "24 Hour Timer – …"    description 146 chars
/timer/1-hour/        200  "1 Hour Timer – Free Online Countdown with Alarm"  description 134 chars  (title unchanged)

Redirects: /timer/30-sec/ → 308 /timer/30-seconds/ · /timer/90-min/ → 308 /timer/90-minutes/ · /timer/1440-minutes/ → 308 /timer/24-hours/
           /timer/60-minutes/ → 308 /timer/1-hour/ · /timer/1-hr/ → 308 /timer/1-hour/ · /timer/25-min/ → 308 /timer/25-minutes/
Status:    /timer/7-minutes/ 200 · /timer/11-minutes/ 404 · /timer/pomodoro/ 404 · /timer/100-hours/ 404 · /timer/0-seconds/ 404
Sitemaps:  /sitemaps/timers-1.xml → 31 urls, hub listed · total across 7 child sitemaps: 691
```

---

## 12. Desktop and mobile verification

- Playwright runs the Sprint 3 page tests on desktop Chrome and the Pixel 7 profile (one H1, no console errors, no horizontal overflow on the hub, timer start on both).
- In-app browser (production build): `/timer/` and `/timer/25-minutes/` at 375 px — hero card, ring, Start/Reset/sound, 4×2 quick-preset chips, breadcrumb "Home › Timers › 25 Minute Timer", bottom navigation; layout identical to the Sprint 1 timer page.
- The 7-width sweep from Sprint 2 was not repeated for timer pages; the template's layout is the Sprint 1 one, which was swept then.

---

## 13. Known issues

1. Shared FAQ wording repeats across timer pages (§6); monitor in Search Console.
2. Clicking a quick-preset chip while a timer is running navigates and resets the countdown (Sprint 1 issue, unchanged).
3. `/timer/60-minutes` without a trailing slash takes two redirect hops (trailing-slash redirect, then alias), as in Sprint 1.
4. The "Seconds" group has only two pages (30 s, 90 s); shorter lengths (10, 15, 20 s) were judged too thin for their own pages and are served by Custom.
5. Alarm reliability for multi-hour timers depends on the tab staying open and the device awake; every long-timer page says so in its FAQ.
6. `next start` still logs `NoFallbackError` for unknown slugs (expected 404 behaviour).

---

## 14. Technical debt

- `components/timer/Timer.tsx` (306 lines) is unchanged; a running-timer guard on preset navigation would be the first improvement.
- The keyword map's timer table is maintained by hand; it could be generated from `data/timers.ts` like the sitemap.
- If timer pages should appear in site search, the search index needs a fourth group (CLAUDE.md lists three).
- The width sweep and HTTP check scripts still live outside the repo (Sprint 2 debt).

---

## 15. Not verified (explicit)

- Search demand for the chosen lengths: the additions were chosen from well-known uses (Pomodoro, Tabata, 7-minute workout, sleep cycles, fasting, cooking), not from keyword-volume data. Search Console data after launch should confirm or prune them.
- Lighthouse / Core Web Vitals for the hub and preset pages.
- Audible alarm on real phones (locked screen behaviour), long-running accuracy over hours on a real device.
- Rich Results Test for the FAQPage/WebApplication JSON-LD (parsed locally only).
- Factual claims inside use cases and FAQs (e.g. boxing round length, six-minute walk test, Cooper test, ACSM 2013 article) were written from general knowledge and not cited; a reviewer may want to spot-check them.

---

## 16. Recommendations before Sprint 4

1. After deployment, review Search Console for the timer pages after 4–6 weeks: prune lengths with no impressions, and check whether the shared FAQ block is treated as duplication.
2. Add the running-timer guard on preset chips (small UX fix in `Timer.tsx`).
3. Sprint 4 (converter expansion) can reuse the pattern from this sprint: allowlist + per-record uniqueness rules enforced by tests.

---

## 17. Reviewer checklist

1. Confirm the arithmetic 1 + 469 + 97 + 50 + 35 + 31 + 8 = 691 sitemap URLs and that `/timer/` is now listed.
2. Open `/timer/25-minutes/` and `/timer/5-minutes/` and confirm they cross-link (curated pair) and read as different pages, not one template with the number swapped.
3. Confirm `/timer/pomodoro/` and `/timer/11-minutes/` are 404 and `/timer/30-sec/` redirects.
4. Compare `/timer/1-hour/` with the Sprint 1 report's description of the reference page: hero and controls unchanged, sections added below.
5. Spot-check three factual claims in §5's FAQs against a reference of your choice.
6. Judge §6's honesty on shared FAQ content against CLAUDE.md's "no repetitive filler" rule.
7. If source is attached: confirm `data/timers.ts` is the only allowlist and that `generateStaticParams` derives from it, with `dynamicParams = false`.

---

## Appendix A — Documentation updated

`README.md` (status, routes, adding a timer), `DATA_MODEL.md` (TimerPreset fields, curation rules, test row), `SEO_ARCHITECTURE.md` (hub template row, indexation table, timers scale control, linking, hub decisions), `seo/keyword-map.md` (30 presets, hub, aliases, Pomodoro mapping). `DESIGN_SYSTEM.md` and `CLAUDE.md` unchanged.

## Appendix B — Files created or modified in Sprint 3 (16)

```text
Data & model:   data/timers.ts (30 presets), types/data.ts (tagline, faqs, related), lib/data/timers.ts (second aliases, groups, related)
Content:        lib/content/timer.ts (titles, descriptions, intro, per-preset FAQs, hub copy)
Pages:          app/timer/page.tsx (indexable hub), app/timer/[duration]/page.tsx
Components:     components/timer/TimerDirectory.tsx (new)
SEO:            lib/seo/sitemap.ts (hub in timers section)
Tests:          lib/data/timers.test.ts (new), e2e/sprint3.spec.ts (new), e2e/seo.spec.ts, playwright.config.ts
Docs:           README.md, DATA_MODEL.md, SEO_ARCHITECTURE.md, seo/keyword-map.md, SPRINT_3_REPORT.md (this file)
```
