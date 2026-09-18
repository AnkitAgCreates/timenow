# CLAUDE.md — TimeNow

## Project Mission

Build a production-ready, SEO-first time utility platform based on the supplied 3:4 Visual PRD.

The working product name is **TimeNow**. The product should help users instantly check, compare, convert, and calculate time while acquiring the majority of traffic through organic search.

The Visual PRD is the design source of truth. Do not reinterpret the product as a generic SaaS/AI landing page.

## Product Principles

1. Utility first — show the answer immediately.
2. SEO is part of the product architecture, not an afterthought.
3. Accuracy beats keyword targeting, especially around DST and timezone abbreviations.
4. Server-render useful/indexable content; hydrate only interactive/live components.
5. Programmatic SEO must add genuine user value and must not create unlimited thin pages.
6. Mobile is a first-class experience, not a scaled-down desktop layout.
7. Keep the interface restrained, fast, information-dense, and professional.
8. Prefer reusable templates and structured data over manually created pages.

## Visual Source of Truth

Use the supplied Visual PRD image in `references/visual-prd.png` if present.

Preserve:
- white/light background
- dark navy typography
- restrained blue primary accent
- subtle light-blue surfaces
- compact header
- prominent search
- large live clocks
- compact information cards
- thin borders
- restrained shadows
- roughly 8–12px radii
- clear information hierarchy
- desktop information density
- simplified mobile layouts
- mobile bottom navigation

Avoid:
- purple AI gradients
- glassmorphism
- giant marketing hero sections
- excessive animation
- oversized rounded cards
- decorative illustrations that do not improve utility
- unnecessary city photography that hurts performance

Suggested design tokens:
- primary: #2563EB
- primary-dark: #0F3F8C
- heading: #0F2344
- body: #334155
- muted: #64748B
- border: #E2E8F0
- surface: #F8FAFC
- blue-surface: #EFF6FF
- white: #FFFFFF
- success: #16A34A
- warning: #F59E0B

Use centralized CSS variables/Tailwind tokens. Use Inter or a similarly efficient sans-serif. Use tabular numerals for clocks.

## Technology

Preferred stack:
- Next.js latest stable
- App Router
- React
- TypeScript
- Tailwind CSS
- Server Components by default
- static generation / ISR where appropriate
- `Intl.DateTimeFormat`
- IANA timezone identifiers

Avoid paid APIs for basic clock/timezone functionality.

Do not introduce dependencies unless they materially simplify a requirement.

## Performance Targets

Target:
- Lighthouse Performance 95+
- SEO 100
- Accessibility 95+
- Best Practices 95+
- LCP < 2.0s
- CLS < 0.05
- INP < 200ms

The live clock must not force the whole page to be client-rendered.

Avoid hydration mismatch for second-sensitive clocks. Render a stable shell/snapshot and initialize live values safely client-side.

## Primary Information Architecture

Routes should support:

/
 /world-clock/
 /time/[city]/
 /countries/[country]/
 /timezones/[timezone]/
 /utc/
 /utc/[offset]/
 /gmt/
 /gmt/[offset]/
 /timer/
 /timer/[duration]/
 /converter/
 /convert/[from]-to-[to]/
 /meeting-planner/
 /alarm/
 /stopwatch/
 /tools/
 /tools/date-difference/
 /tools/hours-calculator/
 /tools/time-duration/
 /tools/military-time-converter/
 /tools/unix-timestamp/
 /guides/

URLs must be lowercase, stable, readable, and hyphenated.

## Reference Screens

Before scaling the site, implement and stabilize these five reference experiences from the Visual PRD:

1. Homepage
2. `/time/san-diego/`
3. `/timezones/cst/`
4. `/timer/1-hour/`
5. `/convert/ist-to-est/`

These establish the reusable UI and SEO templates for later expansion.

---

# Homepage

Header:
- TimeNow logo
- World Clock
- Time Zones
- Converter
- Timers
- Tools
- search
- mobile hamburger

Primary utility:
- H1: `Current Time Now`
- short supporting text
- large live local time
- date
- detected browser timezone
- UTC offset
- 12/24-hour toggle
- fullscreen control

Do not automatically request precise browser geolocation. Use browser timezone inference first.

Global search placeholder:
`Search a city, country or timezone...`

Search must support autocomplete, keyboard navigation, and grouped results:
- Cities
- Countries
- Time Zones

Homepage sections:
- Popular Cities
- Popular Time Zones
- Time Tools

Initial popular timezones:
UTC, EST, CST, PST, IST, GMT.

Initial tools:
- Time Zone Converter
- Meeting Planner
- Countdown Timer
- Alarm Clock
- Stopwatch
- Date Calculator

---

# City Page Template

Example:
`/time/san-diego/`

Breadcrumb:
Home > United States > San Diego

H1:
`Current Time in San Diego, United States`

Above the fold:
- large live time
- current date
- current timezone abbreviation
- UTC offset
- 12/24-hour controls
- fullscreen

Sections/tabs:
- Overview
- Time Difference
- Weather (optional/later if external service is required)
- About

Data:
- timezone
- current abbreviation
- UTC offset
- DST status
- next DST transition where relevant
- sunrise
- sunset
- day length
- coordinates where useful

Time differences should be calculated dynamically, never hardcoded.

Example related comparisons:
- San Diego → New York
- San Diego → London
- San Diego → Dubai
- San Diego → India
- San Diego → Tokyo

Nearby city links should come from structured data.

SEO content below the utility should answer useful questions such as:
- What time is it in San Diego?
- What timezone is San Diego in?
- Does San Diego observe daylight saving time?
- Time difference from major cities
- Sunrise and sunset
- FAQs

Avoid keyword-stuffed boilerplate.

---

# City Data Model

Use a typed structured dataset, not individual hand-built React pages.

Example fields:

```ts
type City = {
  slug: string;
  name: string;
  country: string;
  countryCode: string;
  state?: string;
  timezone: string;
  latitude: number;
  longitude: number;
  population?: number;
  priority?: number;
  indexable: boolean;
};
```

Architecture must eventually support 10,000+ cities, but do not seed everything before templates are stable.

Initial validation set: ~25 cities.
After template QA: expand to ~300–500 high-priority cities.

Prioritize major US cities plus global cities in the UK, India, Canada, Australia, Europe, Middle East, Japan and Singapore.

---

# Country Pages

Example:
`/countries/india/`

Include:
- current country time
- date
- timezone(s)
- UTC offset(s)
- DST status
- major cities with live times
- relevant time differences
- related countries/timezones
- FAQs

Country pages must work correctly for countries with multiple timezones.

---

# Timezone Pages

Example:
`/timezones/cst/`

H1:
`Central Standard Time (CST)`

Display:
- large current/relevant time
- full name
- abbreviation
- UTC offset
- DST explanation
- major associated cities
- comparisons with related timezones

Priority pages:
- EST / EDT
- CST / CDT
- MST / MDT
- PST / PDT
- IST
- GMT
- UTC

## Timezone Accuracy Rule

Abbreviations can be ambiguous.

Do not model CST as one universal IANA timezone. Maintain explicit timezone metadata.

For North American Central Time, clearly explain when locations observe CST vs CDT.

Factual correctness takes priority over SEO wording.

---

# UTC / GMT Pages

Create hubs:
- `/utc/`
- `/gmt/`

Support curated offset pages such as:
- `/utc/utc-minus-5/`
- `/utc/utc-plus-1/`
- `/utc/utc-plus-530/`
- `/gmt/gmt-minus-5/`

Useful content:
- live time
- offset
- conversion to user's timezone
- locations associated with offset
- conversion table
- related offsets/timezones

Only index meaningful curated pages.

---

# Timer

Hub:
`/timer/`

Features:
- hours/minutes/seconds
- Start
- Pause
- Resume
- Reset
- sound notification
- accessible controls

Reference SEO page:
`/timer/1-hour/`

Match the PRD:
- H1 `1 Hour Timer`
- large circular `01:00:00`
- Start
- Reset
- sound
- quick presets

Initial indexable presets:
1, 2, 3, 5, 10, 15, 20, 30, 45 minutes; 1, 2, 3 hours.

Use canonical URLs. For example, `/timer/60-minutes/` should redirect/canonicalize to `/timer/1-hour/`.

Timer SEO content should provide actual use cases and FAQs rather than repetitive filler.

---

# Timezone Converter

Hub:
`/converter/`

Inputs:
- from timezone/city
- date
- time
- to timezone/city
- swap

Update results immediately.

Reference SEO page:
`/convert/ist-to-est/`

Include:
- live comparison
- specific-time converter
- current difference
- conversion table
- meeting-hour suggestions
- timezone explanations
- FAQs
- related conversions

Conversion results must be calculated dynamically for the selected date so DST is correct.

Programmatic converter routes must use a curated allowlist. Never index every possible pair automatically.

Initial examples:
- IST → EST
- EST → IST
- CST → IST
- PST → IST
- GMT → IST
- UTC → IST
- CST → EST
- EST → PST

---

# Meeting Planner

Route:
`/meeting-planner/`

Support 2–4 locations/timezones.

Show:
- horizontal time comparison
- configurable working hours
- overlapping business hours
- suggested convenient slots
- copy/share meeting time

No login required for MVP.

---

# World Clock

Route:
`/world-clock/`

Users can search/add cities and see:
- city
- country
- current time
- date
- timezone

Persist selections locally with localStorage.

---

# Alarm and Stopwatch

`/stopwatch/`
- start
- pause
- resume
- reset
- lap

`/alarm/`
- alarm time
- label
- sound

Be transparent about browser/background limitations. Never promise an alarm will fire when browser/platform restrictions cannot guarantee it.

---

# Time Engine

Create reusable, tested functions conceptually equivalent to:

```ts
getCurrentTime(timezone)
formatTime(timezone, format)
getUTCOffset(timezone, date)
getTimeDifference(zone1, zone2, date)
convertTime(fromZone, toZone, datetime)
isDST(timezone, date)
```

Use IANA zones.

Never use fixed offsets for DST-sensitive city conversions.

Sunrise/sunset may use a lightweight local astronomy library/calculation based on latitude/longitude rather than a paid API.

---

# Programmatic SEO Architecture

SEO is a first-class feature.

Every indexable template requires:
- unique H1
- unique title
- useful meta description
- canonical
- breadcrumb
- meaningful indexable body content
- relevant internal links
- appropriate structured data
- `indexable` control

Never create one URL for every keyword wording variation.

Map multiple keywords to one canonical page.

Examples:

`what is time in san diego`
`san diego time now`
`what time is it in san diego`

→ `/time/san-diego/`

`1 hour timer`
`timer for 1 hour`
`60 minute timer`

→ `/timer/1-hour/`

---

# SEO Priority

P0:
1. City pages
2. Timezone pages
3. UTC/GMT pages
4. Timer pages
5. Country pages
6. Converter

P1:
7. Meeting Planner
8. World Clock
9. Additional time tools

P2:
10. Guides/blog
11. API
12. widgets

Do not prioritize the generic keyword `time` during initial SEO execution.

---

# Internal Linking

City pages should link to:
- country
- timezone
- UTC offset
- nearby cities
- popular comparisons
- converter
- meeting planner

Timezone pages:
- associated cities
- related timezone pages
- UTC offset
- relevant converters

Timer pages:
- timer hub
- related durations
- stopwatch
- alarm

Country pages:
- major cities
- timezone pages
- relevant countries

Converter pages:
- both source/target timezone pages
- related converters
- meeting planner

Build this from structured data rather than manually maintained prose links wherever practical.

---

# Sitemaps and Indexation

Generate sitemap index with scalable child sitemaps, for example:
- cities
- countries
- timezones
- timers
- converters
- tools

Chunk city sitemaps when needed.

Generate valid robots.txt and reference sitemap.

Noindex or prevent crawl/indexation for:
- search results
- internal query states
- duplicate parameter URLs
- unapproved converter combinations
- non-public development routes
- thin/unapproved generated pages

Programmatic SEO must be allowlist-driven where necessary.

---

# Metadata and Structured Data

Create reusable metadata helpers.

Use appropriate structured data only when valid/useful:
- WebSite
- WebPage
- BreadcrumbList
- FAQPage where eligible
- WebApplication/SoftwareApplication where appropriate

Validate JSON-LD.

Do not add schema merely as decoration.

---

# Mobile

The PRD mobile designs are intentional.

Do not simply scale desktop down.

Mobile:
- compact logo/header
- hamburger
- prominent search
- clock above fold
- vertically stacked cards
- minimum 44px touch targets
- no horizontal overflow
- sticky bottom navigation:
  - Home
  - Search
  - Tools
  - More

Test at 375, 390, 430, 768, 1024, 1280 and 1440 widths.

---

# Accessibility

Use:
- semantic HTML
- keyboard navigation
- visible focus states
- sufficient contrast
- accessible form labels
- accessible timer controls
- screen-reader-friendly live time treatment

Prefer native semantics over unnecessary ARIA.

---

# Analytics Readiness

Prepare GA4 integration through environment variables.

Useful events:
- search_used
- city_selected
- timezone_selected
- timer_started
- timer_completed
- converter_used
- meeting_planner_used
- tool_selected

Do not hardcode production analytics IDs.

---

# SEO Agent Readiness

Future Search Console analysis should be able to work with:
- query
- page
- clicks
- impressions
- CTR
- average position

Future SEO workflows may identify:
- high-impression low-CTR pages
- positions 5–20
- missing city/timezone/timer/converter pages
- internal linking opportunities
- cannibalization
- thin pages
- metadata improvements

Do not build automated publishing in the MVP.

---

# Project Structure

Prefer reusable modules. A possible structure:

```text
app/
components/
  layout/
  clock/
  search/
  city/
  timezone/
  timer/
  converter/
  seo/
data/
lib/
  time/
  seo/
  search/
types/
seo/
public/
references/
```

Avoid huge monolithic page components.

Potential reusable components:
- Header
- Footer
- MobileNavigation
- GlobalSearch
- LiveClock
- ClockControls
- CityCard
- TimezoneCard
- ToolCard
- InfoCard
- InfoGrid
- Breadcrumbs
- TimeDifferenceTable
- TimezoneComparison
- ConversionTable
- Timer
- TimerControls
- TimezoneSelector
- MeetingPlanner
- FAQ
- RelatedLinks
- SEOContent

---

# Documentation Required

Maintain:
- `README.md`
- `CLAUDE.md`
- `DESIGN_SYSTEM.md`
- `SEO_ARCHITECTURE.md`
- `DATA_MODEL.md`
- `seo/keyword-map.md`

Document:
- local setup
- build
- tests
- adding a city
- adding a country
- adding a timezone
- adding a timer preset/page
- adding an approved converter page
- controlling indexation
- sitemap generation

---

# Testing

Add tests for critical time logic, especially:
- IST UTC+5:30
- America/New_York DST
- America/Chicago DST
- America/Los_Angeles DST
- UTC
- DST transition boundaries
- cross-date conversion
- year boundaries
- leap years where relevant

Accuracy is more important than decorative polish.

Before calling work complete:
- build succeeds
- lint succeeds
- typecheck succeeds
- relevant tests succeed
- no console errors
- desktop/mobile verified
- metadata verified
- canonical verified
- sitemap verified
- 404 verified
- timezone calculations verified

---

# Sprint Plan

## Sprint 0 — Foundation

Build:
- project setup
- TypeScript
- Tailwind
- design tokens
- component foundation
- time utilities
- data types/models
- global layout
- responsive shell
- SEO metadata helpers
- sitemap framework

Create/update:
- DESIGN_SYSTEM.md
- DATA_MODEL.md
- SEO_ARCHITECTURE.md

## Sprint 1 — Reference Product Experience

Implement:
- homepage
- live local clock
- 12/24-hour toggle
- search
- popular cities/timezones/tools
- `/time/san-diego/`
- `/timezones/cst/`
- `/timer/1-hour/`
- `/convert/ist-to-est/`

Seed only enough data to properly validate templates (~25 cities).

Do not proceed to mass page generation until these screens are stable.

## Sprint 2 — Programmatic SEO

After approval:
- expand cities to ~300–500
- countries
- timezone pages
- UTC/GMT pages
- metadata
- canonicals
- structured data
- breadcrumbs
- internal linking
- sitemaps

## Sprint 3 — Timer SEO

Build timer hub and curated programmatic timer pages.

## Sprint 4 — Converter

Expand converter and curated SEO conversion pages.

## Sprint 5 — Product Expansion

World Clock, Meeting Planner, Alarm, Stopwatch, Date Difference, Hours Calculator, Military Time Converter, Unix Timestamp Converter.

## Sprint 6 — SEO Optimization

Search Console workflow, opportunity analysis, internal-link suggestions and page-quality checks.

---

# Working Rules for Claude Code

1. Inspect the repository before modifying anything.
2. Preserve existing working code unless replacement is justified.
3. State a concise implementation plan before a major sprint.
4. Work in small, testable increments.
5. Do not claim a feature is complete without verifying it.
6. Do not fabricate API keys, analytics IDs, data or test results.
7. Do not hardcode current times or DST-sensitive offsets.
8. Do not mass-generate pages before the underlying template is validated.
9. Do not introduce a database unless the MVP genuinely needs one.
10. Prefer deterministic structured data and typed utilities.
11. Do not redesign the Visual PRD.
12. If the reference image conflicts with these requirements, preserve its visual language while following factual, accessibility, performance and SEO requirements.
13. Ask only when a missing decision truly blocks implementation; otherwise make a sensible engineering choice and document it.
14. Keep a short list of technical debt/outstanding items after each sprint.

---

# Definition of Done for Sprint 0 + Sprint 1

The first milestone is complete only when all five reference experiences work:

- `/`
- `/time/san-diego/`
- `/timezones/cst/`
- `/timer/1-hour/`
- `/convert/ist-to-est/`

They must:
- visually align with the supplied PRD
- work on desktop/mobile
- have useful server-rendered content
- have correct time calculations
- have metadata/canonical/breadcrumbs where appropriate
- pass build/type/lint/tests
- contain no obvious hydration or console errors

At milestone completion, report:
1. files created/modified
2. routes implemented
3. architecture decisions
4. desktop/mobile verification
5. test results
6. build/lint/typecheck results
7. SEO implementation completed
8. known issues
9. recommendations before Sprint 2

STOP after Sprint 0 + Sprint 1 unless explicitly instructed to continue.
