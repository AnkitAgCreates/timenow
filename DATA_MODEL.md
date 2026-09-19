# TimeNow Data Model

Pages are generated from typed records in `data/` (types in `types/data.ts`). Nothing is hand-built per city, country, time zone, timer or converter. All time facts come from the time engine in `lib/time/`, evaluated for an explicit instant.

Since Sprint 2 the city and country records are **generated from GeoNames** by `scripts/generate-geo-data.mjs` (see "GeoNames generation" below); only ids, names, coordinates and populations come from GeoNames — never offsets or DST rules.

## Accuracy rules

1. **IANA zones only.** Records store canonical IANA ids (`America/Chicago`). Abbreviations are never passed to `Intl`: ICU accepts `"CST"` as America/Chicago (which observes CDT) but `"EST"` as America/Panama (which never does). `isValidTimeZone` rejects abbreviation ids, and a test documents the hazard.
2. **No fixed offsets for places.** Offsets and DST state are always computed for the instant or date in question. The only fixed offsets stored are the *definitions* of abbreviations (CST = UTC-6).
3. **Verified abbreviations.** Labels come from per-zone metadata (`lib/time/zone-metadata.ts`), where each label carries its own offset, so an ambiguous abbreviation like IST can mean UTC+5:30 in India and UTC+1 in Ireland. A label is shown only if the zone's real offset equals that label's offset; otherwise the UI shows `UTC±X`. Example: Arizona in summer 1967 (UTC-6) shows `UTC-6`, not a wrong "MST".
4. **Explicit dates in tests.** Tests never depend on "now" or the host zone (Vitest runs under `TZ=Pacific/Chatham` to catch local-time leaks).

## Time engine (`lib/time`)

| Function | Purpose |
| --- | --- |
| `getCurrentTime(zone, now?)` | Zoned parts + label for an instant |
| `getUTCOffset(zone, instant)` | Offset in minutes (IST → 330) |
| `getZonedParts(instant, zone)` | Calendar fields in a zone |
| `resolveWallTime(wall, zone, disambiguation)` | Local wall time → instant, with Temporal-style handling of DST gaps (moves forward) and overlaps (earlier by default) |
| `convertTime(fromZone, toZone, wall)` | DST-correct conversion, day shift, gap/overlap status |
| `getTimeDifference(zoneA, zoneB, instant)` | Minutes zoneB is ahead of zoneA |
| `getDSTState(zone, instant)` | Offset, standard offset, `isDST`, seasonal shift (`none`/`forward`/`backward`) and classification source (`metadata`/`transitions`/`fixed`) — see “DST classification” below |
| `isDST`, `getStandardOffset(zone, instant)`, `observesDST(zone, year)` | Wrappers over `getDSTState`; `observesDST` classifies every offset period overlapping the year |
| `getNextTransition`, `getPreviousTransition`, `getTransitionsInYear` | Offset changes after / at-or-before an instant, and within a year, to minute precision |
| `getNextTransitionInfo`, `getDstTransitionsInYear` | Transitions with local wording ("2:00 AM on Sunday, November 1, 2026") |
| `getDifferencePeriods(zoneA, zoneB, start, days)` | Periods of constant difference (IST–Eastern: 9h30 / 10h30 / 9h30) |
| `getZoneLabel(zone, instant)` | Verified abbreviation, name, generic name, offset label, DST flag |
| `getSunTimes(lat, lon, date, zone)` | NOAA sunrise/sunset/solar noon, polar day/night |
| `suggestMeetingSlots({ zones, anchorZone, date })` | Business-hour overlap suggestions |
| `formatTime`, `formatDate`, `formatOffset`, `formatDuration`, `formatCountdown` | Deterministic formatting |
| `canonicalZone(zone)` | Legacy ids → canonical (`Asia/Calcutta` → `Asia/Kolkata`) |
| `fixedOffsetZoneId(minutes)` / `parseFixedOffsetZone(id)` | Fixed-offset pseudo-zones (`UTC-05:00`, `UTC+05:45`) accepted by every engine function; never DST (Sprint 2) |
| `getZoneDisplayNames(zone, instant)`, `getZoneRegionName(zone)` | Standard/daylight/generic names: metadata first, then CLDR names captured at generation time (`lib/time/zone-names.ts`, server-side) |

### DST classification

`Intl` exposes only a zone's total UTC offset, not whether part of it is daylight saving time. `lib/time/dst.ts` classifies in two layers; neither uses a calendar year's minimum offset.

1. **Zone metadata first.** `ZONE_METADATA` lists dated *eras* per zone, each with a `standard` label, an optional `daylight` label (clocks forward) and an optional `seasonalBackward` label (clocks back from standard, e.g. Morocco around Ramadan). If the real offset matches one of the era's labels, that decides the state. Eras record rule changes:
   - `America/Mexico_City`: CST/CDT until 2022-10-30, CST only since.
   - `America/Whitehorse`: PST/PDT until 2020-11-01, then permanent UTC-7 (“Yukon Time”).
   - `Africa/Casablanca`: UTC+0 standard with summer time until 2018-10-28; since then UTC+1 standard with a backward shift to UTC+0, which is **not** DST.
2. **Transition structure otherwise** (no metadata, or an offset the metadata doesn't describe). The period containing the instant is bounded by the previous and next offset changes within ±400 days:
   - no change on either side → fixed offset, standard time (`source: 'fixed'`);
   - a change on only one side → an open-ended regime such as a permanent change (Turkey 2016, Chihuahua 2022) → standard time, not DST;
   - changes on both sides → a seasonal regime; the higher alternating offset is DST (the convention of ICU's rearguard tz data).

Results for bounded periods are cached for exactly that period; open-ended results are reused for an hour.

**Remaining limitations.** Without metadata, (a) the last DST period before a permanent change looks open-ended and is classified as standard time (e.g. Turkey, summer 2016), and (b) a backward seasonal shift would be read as standard time with the rest of the year as DST. Zones where this matters need an era in `ZONE_METADATA`; `lib/time/dst.test.ts` documents the expected result for each case.

## Records

### GeoNames generation — `scripts/generate-geo-data.mjs`

Inputs (git-ignored, CC BY 4.0): `cities15000.txt`, `countryInfo.txt`, `admin1CodesASCII.txt`, `timeZones.txt`. Outputs (committed): `data/cities.generated.ts`, `data/countries.generated.ts`, `lib/time/zone-names.generated.ts`. Rules, all enforced by `lib/data/dataset.test.ts`:

1. **Feature codes:** only populated places (PPLC, PPLG, PPLA, PPLA2, PPLA3, PPL) with ≥ 50,000 people; city districts (PPLX) never become pages, so New York's boroughs are excluded.
2. **Quotas:** a per-country quota ranked by population (US 100, India 35, UK 28, Canada 22, Australia 14, …). The capital of every quota country and every `MUST_INCLUDE` id are added regardless of quota. ~470 cities, 96 countries.
3. **Satellite suppression:** a place is skipped when an already-selected place in the same country is ≥ 2.5× more populous within 15 km, or ≥ 5× within 30 km (Jersey City, Noida).
4. **Curation:** `EXCLUDE` (data errors such as a census place with an inflated population, duplicates), `OVERRIDES` (display names — Cologne, Zurich, Seville, Hanover, Querétaro; aliases — NYC, Bombay, Saigon; seed-city priorities; New Delhi is GeoNames' "Delhi" renamed and flagged as the capital), `COUNTRY_OVERRIDES` (China's official single zone; Vietnam's `Asia/Bangkok` link remapped to `Asia/Ho_Chi_Minh`).
5. **Names:** GeoNames' English `name`, except in countries whose names GeoNames stores as transliterations with diacritics (India, Pakistan, China, Russia, Greece, the Middle East …), where the ASCII form is the usual English spelling (Rajkot, Thessaloniki).
6. **Slugs:** from the display name with diacritics stripped and stroke letters transliterated (Łódź → `lodz`). On collision the most populous place keeps the plain slug and the others get a state (US/CA/AU) or country suffix: `san-jose` (California), `san-jose-costa-rica`, `london-ontario`, `columbus-georgia`.
7. **Priority:** curated override, else 1 for population ≥ 5 M or a capital ≥ 1 M, 2 for ≥ 1 M or a capital, else 3.
8. **Zones:** validated with `Intl`; deprecated aliases mapped to canonical ids. Every city zone has hand-written metadata or a CLDR name.

`node scripts/generate-geo-data.mjs --check` fails when the committed output is stale.

### City — `data/cities.ts`

```ts
type City = {
  slug: string;          // /time/[slug]/, lowercase-hyphenated, unique
  name: string;
  country: string;       // display name; must match data/countries.ts
  countryCode: string;   // ISO 3166-1 alpha-2
  state?: string;
  timezone: string;      // canonical IANA id
  latitude: number;      // + north
  longitude: number;     // + east
  population?: number;
  priority: number;      // 1 = most important (ordering, sitemap priority)
  indexable: boolean;
  aliases?: string[];    // search: "NYC", "Bombay"
  geonameId?: number;    // provenance
};
```

Derived, never stored: nearby cities (great-circle distance), comparison cities (`COMPARISON_CITY_SLUGS`, skipping same-zone cities), related time zone pages (`getTimezonesForZone`), related converters.

The 25 Sprint 1 seed cities (Phoenix, Regina, Mexico City, Tijuana, New Delhi, Sydney …) are all retained by the generator, with their original priorities and aliases as overrides.

**To add a city:** add its GeoNames id to `MUST_INCLUDE` (or raise the country quota) in the generator, regenerate, and if the zone is new add it to `ZONE_METADATA`. Run `npm test`.

### Country — `data/countries.ts`

```ts
type Country = {
  code: string; slug: string; name: string;
  definiteArticle?: boolean;    // "the United States"
  multipleTimeZones: boolean;   // zones behave differently (distinct standard/daylight offsets)
  overseasTimeZones?: boolean;  // France, Netherlands: overseas regions on other offsets
  published: boolean;           // /countries/[slug]/ exists; controls linking
  indexable: boolean;
  continent: string;            // GeoNames continent code (hub grouping)
  population: number;           // ordering only
  capitalSlug?: string;         // capital city when it is in the dataset
  primaryZone: string;          // shown as "the" country time: the capital's zone, else the largest city's
  zones: string[];              // every IANA zone in the country (GeoNames + city zones)
  neighbours: string[];         // ISO codes of neighbouring countries that also have pages
};
```

All 96 countries with cities are published. Country pages group `zones` by behaviour (standard offset + daylight offset) with `getCountryZoneGroups`, so the United States reads as Hawaii, Hawaii-Aleutian, Alaska, Pacific, Mountain, Mountain (Arizona), Central and Eastern Time rather than 29 tzdata ids. `multipleTimeZones` is verified against those groups by tests.

**To add a country:** give it a quota in the generator (its capital is included automatically) and regenerate.

### UTC offset pages — `lib/data/offsets.ts`

Not a hand-written table. An offset gets a page (`/utc/utc-minus-5/`, `/utc/utc-plus-530/`) only when at least one dataset zone uses it during the year — as standard time, daylight time or a seasonal shift. UTC+0 is the `/utc/` hub. `getOffsetUsage` classifies every zone on the offset as `all-year`, `standard`, `daylight` or `backward` (Morocco). GMT-style URLs redirect to the UTC page. Tests: `lib/data/dataset.test.ts`, `lib/content/country-offset.test.ts`.

### Time zone abbreviation — `data/timezones.ts` + `data/timezones-world.ts`

```ts
// One sentence of geography copy plus the IANA zones that back it.
type RegionUsage = {
  label: string;   // "Most of Saskatchewan, Canada (Regina, Saskatoon)"
  note?: string;   // exceptions, e.g. Lloydminster and Creighton
  zones: string[]; // ["America/Regina", "America/Swift_Current"]
};

type TimeZoneEntry = {
  slug: string;              // = abbreviation.toLowerCase()
  abbreviation: string;      // "CST"
  name: string;              // "Central Standard Time"
  kind: 'standard' | 'daylight' | 'universal';
  offsetMinutes: number;     // what the abbreviation denotes (-360)
  referenceZone: string;     // IANA zone answering "what time is it in CST" (America/Chicago)
  referenceLabel: string;    // "Central Time (US & Canada)"
  counterpart?: string;      // "cdt"
  region: string;
  summary: string;
  seasonalRegions: RegionUsage[]; // places that switch CST ↔ CDT
  yearRoundRegions: RegionUsage[];// places on UTC-6 all year
  alsoMeans?: { name: string; offsetMinutes: number }[]; // China Standard Time, …
  related: string[];         // comparison/link slugs
  priority: number;
  indexable: boolean;
};
```

**How CST vs CDT is handled.** The page clock shows the *reference zone's* real time and abbreviation (CDT in September). `computeAbbreviationStatus` (`lib/timezones/status.ts`) produces the explanation ("Central Time is on CDT right now, not CST…"), the next switch date, and year-round examples. A separate "Exact CST (UTC-6) time now" clock uses `Etc/GMT+6` (POSIX sign inversion). Universal entries (GMT) watch their seasonal region (UK: GMT/BST) but never change themselves.

**To add a time zone page:** append an entry, giving every region sentence the IANA zones it describes. The integrity tests read raw monthly offsets from tzdata (independently of the DST classifier) and verify that every seasonal region's zones alternate between exactly the standard and daylight offsets, and that every year-round region's zones stay on the abbreviation's offset every month. Geography copy therefore can't drift from the tz database.

### Timer preset — `data/timers.ts`

```ts
type TimerPreset = {
  slug: string;        // canonical: timerSlugForSeconds(seconds) → "30-seconds", "25-minutes", "1-hour"
  seconds: number;
  label: string;       // "25 Minutes"
  phrase: string;      // "25 minutes" (mid-sentence)
  chip: string;        // "25 min" (quick-preset chip)
  tagline: string;     // one unique sentence: meta description, intro paragraph, hub card
  useCases: string[];  // ≥ 3 concrete, duration-specific uses
  faqs?: { question: string; answer: string }[]; // ≥ 1 question specific to this length, shown before the shared FAQs
  related?: string[];  // curated related presets (25-minutes ↔ 5-minutes); nearest shorter/longer are added automatically
  quickPreset: boolean;// shown as a chip on timer pages (≤ 8)
  priority: number;
  indexable: boolean;
};
```

30 curated presets (Sprint 3): 2 in seconds, 18 in minutes, 10 in hours, from 30 seconds to 24 hours. `timerGroup()` derives the unit group from `seconds`; `getRelatedTimerPresets()` builds the "Related timers" list; the hub copy (`lib/content/timer.ts`) is derived from the dataset (counts, first and last length).

Alias redirects (`60-minutes`, `1-hours`, `60-min`, `1-hr`, `30-sec`, `30-secs`, `1500-seconds`, …) are generated by `getTimerAliases()` and registered in `next.config.ts`. Tests guarantee no alias collides with a canonical slug.

**To add a timer page:** append a preset whose slug equals `timerSlugForSeconds(seconds)`, with a unique tagline, at least three use cases and its own FAQ; `lib/data/timers.test.ts` rejects presets without them and keeps the set curated (20–40).

### Converter pair — `data/converters.ts`

```ts
type ConverterCorridor = { a: string; b: string; priority: 1 | 2 | 3 };
// ZONE_CORRIDORS: a/b are abbreviation slugs (ist, est, cet …); CITY_CORRIDORS: a/b are city slugs (london, new-york …).
// CONVERTER_PAIRS = both directions of every corridor → { from, to, priority, indexable }.
```

Sprint 4 resolves each side to a `ConverterSide` (`lib/data/converters.ts`): `{ kind: 'zone' | 'city', slug, zone (IANA), label ("IST" / "London"), name, href, entry?, city? }`. Abbreviation slugs win over city slugs (a test forbids collisions). Content (`lib/content/converter.ts`) never branches on raw slugs: titles ("IST to EST Converter", "London to New York Time Converter"), descriptions, subtitles, the hourly table, difference periods (boundaries dated in the zone that switches), best-time-to-call slots and FAQs are all derived from the two sides and an explicit instant. The hub groups zone pairs by source zone and lists city pairs.

Rules enforced by `lib/data/converters.test.ts`: every corridor yields exactly both directions; 40–140 zone pairs and 20–80 city pairs; both sides resolve and share a kind; the two IANA zones differ; no standard ↔ its own daylight counterpart (est-to-edt); no UTC ↔ GMT; related pages share a side and a kind; unique descriptions.

**To add an approved converter page:** add a corridor (both directions appear). Unlisted pairs 404 (`dynamicParams = false`).

### Tool logic — `lib/tools/`

Pure, unit-tested modules with no React or DOM: `date-difference.ts` (days/weeks/weekdays, calendar breakdown with month clamping, add days), `hours-calculator.ts` (shifts with overnight handling and breaks, decimal hours, pay), `military-time.ts` (flexible parsing, 12/24/military formats, spoken form, 24-row chart), `unix-timestamp.ts` (seconds vs milliseconds detection, DST-correct wall-time conversion through the time engine, relative time), `stopwatch.ts` (formatting, lap rows), `alarm.ts` (next occurrence, once-per-minute firing, display). The UI components in `components/tools/`, `components/stopwatch/`, `components/alarm/` and `components/meeting/` only call these.

Persisted client state (world clock list, alarms) uses `lib/clock/persisted.ts`: a localStorage-backed external store read with `useSyncExternalStore`, so the server and the first client render agree (null → defaults) and the saved value replaces it after hydration without a state-in-effect.

### Tools and converter zone options

- `data/tools.ts`: tool registry. `status: 'planned'` tools are never linked.
- `data/converter-zones.ts`: zones offered in converter selects, including fixed-offset options (`Etc/GMT+5` = always UTC-5).

## Tests

| File | Covers |
| --- | --- |
| `lib/time/zone.test.ts` | IST, UTC, New York/Chicago/Los Angeles DST, Sydney, Mexico City history, next and previous transitions to the second, gaps/overlaps, leap years, year boundary, abbreviation-id hazard |
| `lib/time/dst.test.ts` | DST classification: metadata eras (Yukon 2020, Mexico 2022, Morocco backward shift, Ireland), transition inference (Turkey 2015/2016, Chihuahua 2022, Arizona 1967), fixed zones, caching |
| `lib/time/conversion.test.ts` | Conversions (including the PRD corrections), differences on transition days, labels, formatting |
| `lib/time/sun-meeting.test.ts` | Sunrise/sunset vs **U.S. Naval Observatory** data (`lib/time/__fixtures__/sun-usno.json`: 17 cases incl. DST-change days, equator, high latitude, polar day/night; tolerance ±1 min, max observed deviation 0.51 min), meeting slots in EDT vs EST |
| `lib/time/transitions.test.ts` | Transition wording, difference periods, CST/CDT/IST/GMT status text |
| `lib/data/data-integrity.test.ts` | Every record and every geography region validated against raw tzdata offsets; allowlist; sitemap uniqueness and the indexing kill switch |
| `lib/data/dataset.test.ts` | Generated data rules: size, seed cities kept, districts excluded, slug collisions, curated names, zone validity, country consistency (capitals, neighbours, zone groups), offset-page curation, generated-file provenance |
| `lib/seo/seo-tools.test.ts` | Audit rules (metadata, H1, canonical, sitemap membership, JSON-LD, thin content, broken links, duplicates, orphans) and Search Console analysis (CSV parsing, known names, missing pages by intent, low CTR and striking distance, cannibalisation, link and metadata suggestions, report rendering) |
| `lib/tools/tools.test.ts` | Calculator logic: ISO/leap-day validation, day and weekday counts, calendar breakdown (31 Jan → 1 Mar = 1 month 1 day), overnight shifts and breaks, decimal hours and pay, military time parsing/formatting/spoken form, timestamp unit detection and DST-correct wall times, relative time, stopwatch formatting and lap statistics, alarm scheduling and once-per-minute firing |
| `lib/data/converters.test.ts` | Converter corridors and sides: both directions, bounds, kinds, no pointless pairs, slug shadowing, related pages, titles/descriptions per kind, DST-boundary correctness (London → New York in March), hub copy |
| `lib/data/timers.test.ts` | Timer curation rules: 20–40 presets, unique durations/taglines, ≥ 3 use cases, preset-specific FAQ first, related links valid, alias spellings, grouped directory, description length, hub copy from data |
| `lib/content/country-offset.test.ts` | Country zone groups, descriptions and FAQs (India, United States, Australia, France); offset usage classification and FAQs (UTC-5, UTC+1, Morocco) |
| `lib/time/zone-metadata.test.ts` | Every metadata era declares exactly the offsets its zone uses in the test year; era ranges are contiguous; ambiguous abbreviations carry per-zone offsets |
| `lib/time/fixed-offset.test.ts` | Fixed-offset pseudo-zones: ids, arithmetic, no DST, labels |
| `e2e/*.spec.ts` (Playwright) | Production-build smoke tests on desktop and mobile: reference pages, hydration/console errors, overflow, DST-correct clocks at frozen instants, search, timer, menu, redirects/404s, SEO tags and sitemaps, kill switch |
| `lib/search/match.test.ts` | Search normalisation, aliases, grouping, offsets |
| `lib/clock/bootstrap.test.ts` | Inline bootstrap output is identical to the React formatter |
