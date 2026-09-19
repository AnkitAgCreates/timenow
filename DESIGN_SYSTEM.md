# whattimein.world Design System

The Visual PRD (`references/visual-prd.png`) defines the visual language: white/light surfaces, dark navy type, a restrained blue accent, thin borders, light shadows, 8–12px radii, large tabular clocks and dense information cards. This document records how that is implemented. The PRD is **never** a source for time values.

## Tokens

All tokens live in `app/globals.css` under `@theme` and are available as Tailwind utilities (`bg-blue-surface`, `text-heading`, `border-border`, …). Do not hardcode colours in components.

### Colour

| Token | Value | Use |
| --- | --- | --- |
| `primary` | `#2563EB` | Links, active tab/toggle, focus ring |
| `primary-hover` | `#1D4ED8` | Hover for primary buttons |
| `primary-dark` | `#0F3F8C` | Strong CTA background |
| `heading` | `#0F2344` | Headings, clock digits, key values |
| `body` | `#334155` | Body copy |
| `muted` | `#64748B` | Labels, captions (≥ 4.5:1 on white) |
| `border` / `border-strong` | `#E2E8F0` / `#CBD5E1` | Card and divider lines |
| `surface` | `#F8FAFC` | Table headers, subtle panels |
| `blue-surface` / `blue-border` | `#EFF6FF` / `#BFDBFE` | Hero gradient, chips, timer ring, info callouts |
| `success` / `success-dark` | `#16A34A` / `#15803D` | Timer Start, completed state |
| `warning` / `warning-surface` / `warning-text` | `#F59E0B` / `#FFFBEB` / `#92400E` | Sun icons; "abbreviation not in effect" notices |

Tool tiles use light Tailwind tints (blue, indigo, amber, violet, green, rose) for their icon squares, matching the coloured tool icons in the PRD.

### Typography

- Family: **Inter** via `next/font` (self-hosted, `display: swap`), falling back to the system UI stack.
- Clocks and all numeric columns use the `tabular` utility (tabular numerals) so digits don't shift width.
- Clock sizes: `text-clock-xl` = `clamp(2.75rem, 11vw, 4.75rem)`, `text-clock-lg` = `clamp(2.5rem, 9vw, 3.5rem)`.
- Headings: H1 `text-2xl` → `md:text-3xl`, bold, tight tracking. Section H2 `text-lg` → `md:text-xl`.
- Minimum body size 14px; captions 12px in `muted`.

### Shape and depth

| Token | Value |
| --- | --- |
| `radius-sm` / `md` / `lg` / `xl` | 6 / 8 / 10 / 12px |
| `shadow-card` | 1–3px, 4–5% navy — default for cards |
| `shadow-raised` | 4–12px, 8% navy — hover, dropdowns, dialogs |

The `card` utility = white background + `border` + `radius-lg` + `shadow-card`.

### Layout

- `container-page`: max width 72rem, 16px side padding (24px from `md`).
- Breakpoints (Tailwind defaults): `sm` 640, `md` 768, `lg` 1024.
- Desktop pages use 12-column grids from `lg` so the narrow PRD columns become information-dense two-column layouts; mobile stacks vertically.

## Components

| Component | Location | Notes |
| --- | --- | --- |
| `Header`, `HeaderNav`, `Logo` | `components/layout` | 56px (64px desktop), sticky. Nav: World Clock · Time Zones · Converter · Timers · Tools; search icon on desktop, hamburger on mobile |
| `MobileBottomNav` | `components/layout` | Fixed below `md`: Home · Search · Tools · More. Safe-area padding |
| `MobileMenu` | `components/layout` | Native `<dialog>` side sheet |
| `Footer` | `components/layout` | Brand, tagline, live links only, "Fast · Accurate · Global · Free" |
| `GlobalSearch`, `SearchDialog` | `components/search` | WAI-ARIA combobox with grouped results |
| `ClockPanel` | `components/clock` | Time, date, "ABBR · UTC±X", `ClockControls` |
| `LiveTime`, `LiveZoneInfo`, `LiveDifference` | `components/clock` | Live values (see "Live values" below) |
| `ClockControls` | `components/clock` | 12/24-hour segmented toggle (persisted) + fullscreen |
| `CityCard` | `components/city` | Row on mobile, stacked card from `sm`; skyline artwork |
| `AbbreviationStatus` | `components/timezone` | "Central Time is on CDT right now, not CST" callout |
| `TimezonePageBody` | `components/timezone` | The abbreviation template, shared by `/timezones/[tz]/` and the `/utc/`, `/gmt/` hubs (Sprint 2) |
| `OffsetsDirectory` | `components/timezone` | Table of every UTC offset with a live time (Sprint 2) |
| `OffsetToLocal` | `components/converter` | Client island comparing a fixed offset with the visitor’s zone (Sprint 2) |
| `Timer` | `components/timer` | Ring, Start/Pause/Resume, Reset, sound toggle, presets, custom |
| `WorldClock` | `components/world-clock` | Add via `ZonePicker`, reorder, remove, reset; list persisted with `lib/clock/persisted` (Sprint 5) |
| `MeetingPlanner` | `components/meeting` | 2–4 pickers, date/length/working hours, 24-column hour grid with per-participant local times and day shifts, suggested slots, copy summary / share link (Sprint 5) |
| `Stopwatch`, `AlarmClock` | `components/stopwatch`, `components/alarm` | Stopwatch with laps and keyboard shortcuts; alarms list with on/off switches, ringing banner, snooze, limitation callout (Sprint 5) |
| `ToolPageShell`, `DateDifference`, `HoursCalculator`, `MilitaryTime`, `UnixTimestamp` | `components/tools` | Shared tool-page layout (H1, tool, how-to, FAQs, more tools) and the four calculators (Sprint 5) |
| `TimeConverter`, `ZonePicker` | `components/converter` | Specific-time converter with swap; each side is a searchable combobox over cities, abbreviations and UTC offsets (common zones listed when empty; the site search index is fetched on first use) — Sprint 4 |
| `ToolCard` | `components/tools` | Live tools link; planned tools show "Soon" and are not links |
| `Breadcrumbs`, `Section`, `SectionTabs`, `FAQ`, `InfoRow`, `InfoTile`, `Callout`, `LinkList`, `Icon` | `components/ui` | Shared primitives |

Icons are hand-drawn 24×24 stroke SVGs in `components/ui/Icon.tsx`, with no icon dependency.

## City photos and the skyline fallback

Priority cities (homepage, comparison and seed cities — the `data/sources/city-images.json` list) show a curated Wikimedia Commons photo: a 1600×400 WebP hero on the city page (`h-28`, `md:h-40`, `object-cover`, rendered with `next/image`, `priority` and `fetchPriority="high"` because it is the page's largest element and sits above the clock) and a 640×256 card crop on `CityCard` (lazy, decorative `alt=""` because the card text names the city). A small white credit chip in the hero's bottom-right corner links the author and licence to the Commons file page. Files are local and pre-sized (heroes 20–215 KB, cards under 55 KB; the unit test caps each at 260 KB), so there are no third-party requests and no layout shift (explicit width/height); `next/image` still serves the responsive variants.

Every other city keeps `.skyline` / `.skyline-alt`: a ~1 KB inline SVG skyline silhouette on a light-blue gradient, defined once in CSS, which preserves the PRD's card rhythm with no network requests.

## Live values (no flash, no hydration mismatch)

Clock text is filled **before first paint** by an inline bootstrap (`lib/clock/bootstrap.ts`, following the Next.js "Preventing flash before hydration" guide), then kept current by a single shared once-per-second store (`lib/clock/stores.ts`).

- Clock digits are server-rendered as a placeholder (`--:--:--`) so a cached page never shows a stale time. Slow-changing values (UTC offset, date) are server-rendered as real text from the render instant, so crawlers see them. A tiny inline call replaces both with live values during HTML parsing, and `suppressHydrationWarning` keeps the result.
- Other live facts (abbreviation, DST status, differences) receive `renderedAt` from the server and use it until hydration, then recompute live, so DST switches show immediately.
- The bootstrap's formatting is proven byte-identical to the React formatter by `lib/clock/bootstrap.test.ts`.
- Strings are assembled from numeric `Intl` parts, never `Intl`'s localized output, because ICU differs between Node and browsers.

## Mobile

- Touch targets ≥ 44px on mobile (buttons, chips, nav items, table links via extended hit areas).
- Clock above the fold on every clock page; search is prominent on the homepage.
- `SectionTabs` scroll horizontally with a hidden scrollbar; no page-level horizontal overflow (verified at 375, 390, 430, 768, 1024, 1280 and 1440px).
- The clock toggle shows "12H / 24H" below `sm` and "12 Hour / 24 Hour" above, as in the PRD.
- Multi-column data tables (country zone groups) become stacked cards below `sm`; long directories (UTC offsets) keep a table but drop their minimum width so they fit 375px, with `whitespace-nowrap` on numeric cells and wrapping allowed only in the descriptive column; wide reference tables (time differences) scroll inside their own `overflow-x-auto` container.

## Accessibility

- Semantic landmarks, one H1 per page, skip link, visible `:focus-visible` ring.
- Live clocks are **not** `aria-live`, so screen readers aren't interrupted every second; timer state changes and search result counts are announced politely/assertively where useful.
- Native `<dialog>`, `<details>`, `<select>`, date/time inputs; buttons use `aria-pressed` for toggles.
- `prefers-reduced-motion` disables transitions.

## Things to avoid

Purple/AI gradients, glassmorphism, oversized radii, marketing heroes, decorative animation, remote city photography, and any hardcoded time value.
