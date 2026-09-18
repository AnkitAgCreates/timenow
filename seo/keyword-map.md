# Keyword → Canonical URL Map

One canonical URL per search intent. Variations in wording map to the same page; they never get their own URLs. Status: **live** = built and indexable in Sprint 1; **planned** = mapped for a later sprint (no route yet).

## Homepage

| Keywords | Canonical | Status |
| --- | --- | --- |
| current time now, time now, what time is it now, my local time, exact time now | `/` | live (the generic keyword "time" is not a target) |

## City pages — `/time/[city]/`

Pattern for every city: `what time is it in {city}`, `{city} time now`, `current time in {city}`, `time in {city}`, `{city} time zone`, `{city} local time` → `/time/{slug}/`.

| Keywords | Canonical | Status |
| --- | --- | --- |
| what is time in san diego, san diego time now, what time is it in san diego, san diego time zone | `/time/san-diego/` | live |
| new york time now, time in nyc, what time is it in new york | `/time/new-york/` | live |
| london time now, uk time now | `/time/london/` | live (UK-wide intent may move to a country page in Sprint 2) |
| india time now, time in delhi, new delhi time | `/time/new-delhi/` | live (country intent → `/countries/india/` in Sprint 2) |
| mumbai time, bombay time now | `/time/mumbai/` | live |
| bangalore time, bengaluru time now | `/time/bengaluru/` | live |
| mexico city time, cdmx time now | `/time/mexico-city/` | live |

Remaining seeded cities follow the same pattern: los-angeles, chicago, houston, dallas, phoenix, san-francisco, denver, new-orleans, toronto, winnipeg, regina, tijuana, paris, berlin, dubai, singapore, tokyo, sydney.

## Time zone abbreviation pages — `/timezones/[tz]/`

| Keywords | Canonical | Status |
| --- | --- | --- |
| cst, cst time, cst time now, central standard time, what is cst, central time zone | `/timezones/cst/` | live |
| cdt, cdt time, central daylight time | `/timezones/cdt/` | live |
| est, est time now, eastern standard time, eastern time zone | `/timezones/est/` | live |
| edt, eastern daylight time | `/timezones/edt/` | live |
| mst, mountain standard time, mountain time now, arizona time zone | `/timezones/mst/` | live |
| mdt, mountain daylight time | `/timezones/mdt/` | live |
| pst, pst time now, pacific standard time, pacific time zone | `/timezones/pst/` | live |
| pdt, pacific daylight time | `/timezones/pdt/` | live |
| ist, ist time now, india standard time, indian time zone | `/timezones/ist/` | live |
| utc, utc time now, coordinated universal time, utc clock | `/utc/` | live (Sprint 2). `/timezones/utc/` 308-redirects here |
| gmt, gmt time now, greenwich mean time, is the uk on gmt or bst | `/gmt/` | live (Sprint 2). `/timezones/gmt/` 308-redirects here |
| akst, alaska time now | `/timezones/akst/` | live (Sprint 2) |
| hst, hawaii time now, hawaii time zone | `/timezones/hst/` | live |
| ast, atlantic time, atlantic standard time | `/timezones/ast/` | live |
| nst, newfoundland time | `/timezones/nst/` | live |
| bst, british summer time, bst time now | `/timezones/bst/` | live |
| cet, central european time, cet time now | `/timezones/cet/` | live |
| cest, central european summer time | `/timezones/cest/` | live |
| eet, eastern european time | `/timezones/eet/` | live |
| wet, western european time | `/timezones/wet/` | live |
| msk, moscow time now | `/timezones/msk/` | live |
| trt, turkey time now | `/timezones/trt/` | live |
| gst, gulf standard time, dubai time zone | `/timezones/gst/` | live |
| sast, south africa time | `/timezones/sast/` | live |
| wat / cat / eat, west/central/east africa time | `/timezones/wat/`, `/timezones/cat/`, `/timezones/eat/` | live |
| pkt, pakistan standard time | `/timezones/pkt/` | live |
| irst, iran time | `/timezones/irst/` | live |
| sgt, singapore time | `/timezones/sgt/` | live |
| hkt, hong kong time | `/timezones/hkt/` | live |
| pht, philippine time, philippines time zone | `/timezones/pht/` | live |
| myt, malaysia time | `/timezones/myt/` | live |
| ict, indochina time, thailand time zone | `/timezones/ict/` | live |
| wib, jakarta time zone | `/timezones/wib/` | live |
| kst, korea time now | `/timezones/kst/` | live |
| jst, japan time now, japan standard time | `/timezones/jst/` | live |
| awst / acst / acdt / aest / aedt, australian time zones | `/timezones/awst/`, `/timezones/acst/`, `/timezones/acdt/`, `/timezones/aest/`, `/timezones/aedt/` | live |
| nzst / nzdt, new zealand time | `/timezones/nzst/`, `/timezones/nzdt/` | live |
| brt, brazil time now, sao paulo time zone | `/timezones/brt/` | live |
| art, argentina time | `/timezones/art/` | live |
| cot, colombia time | `/timezones/cot/` | live |

Accuracy note: queries like "cst time now" are satisfied by showing current Central Time **with its real abbreviation** (CDT in summer), plus the exact UTC-6 time and an explanation. The page never labels CDT as CST.

## UTC/GMT offsets — `/utc/[offset]/`

Pattern: `utc-5`, `utc minus 5`, `utc−05:00`, `gmt-5`, `gmt-5 time now` → `/utc/utc-minus-5/`. GMT-style URLs (`/gmt/gmt-minus-5/`) 308-redirect to the UTC page because they are the same offset. Pages exist only for offsets used somewhere in the dataset this year (~40 pages, `lib/data/offsets.ts`); `utc+0` is the `/utc/` hub.

| Keywords | Canonical | Status |
| --- | --- | --- |
| utc-5, utc minus 5, gmt-5 time | `/utc/utc-minus-5/` | live (Sprint 2) |
| utc+5:30, utc plus 5:30, gmt+5:30 | `/utc/utc-plus-530/` | live |
| utc+1, gmt+1 time now | `/utc/utc-plus-1/` | live |
| utc+5:45 (nepal), utc-3:30 (newfoundland), utc+12:45 (chatham) | `/utc/utc-plus-545/`, `/utc/utc-minus-330/`, `/utc/utc-plus-1245/` | live |

## Countries — `/countries/[country]/`

Pattern for every country: `time in {country}`, `{country} time now`, `what time is it in {country}`, `{country} time zone(s)`, `does {country} have daylight saving time` → `/countries/{slug}/`. Country intent is separate from city intent: “india time now” → `/countries/india/`, “delhi time” → `/time/new-delhi/`.

| Keywords | Canonical | Status |
| --- | --- | --- |
| time in india, india time now, indian time zone | `/countries/india/` | live (Sprint 2) |
| time in usa, us time zones, how many time zones in the united states | `/countries/united-states/` | live |
| uk time now, time in england | `/countries/united-kingdom/` | live |
| time in australia, australia time zones | `/countries/australia/` | live |
| time in canada, canada time zones | `/countries/canada/` | live |
| current time by country, world time zones by country | `/countries/` | live |

96 countries have pages; remaining seeded countries follow the same pattern.

## Timers — `/timer/[duration]/`

| Keywords | Canonical | Redirects |
| --- | --- | --- |
| 1 hour timer, timer for 1 hour, 60 minute timer, one hour timer | `/timer/1-hour/` | `/timer/60-minutes/`, `/timer/1-hours/`, `/timer/60-min/` |
| 2 hour timer, 120 minute timer | `/timer/2-hours/` | `/timer/120-minutes/` |
| 3 hour timer | `/timer/3-hours/` | `/timer/180-minutes/` |
| 1 minute timer, 60 second timer | `/timer/1-minute/` | `/timer/1-minutes/` |
| 2 / 3 / 5 / 10 / 15 / 20 / 30 / 45 minute timer | `/timer/{n}-minutes/` | `/timer/{n}-min/`, `/timer/{n}-mins/`, `/timer/{n}-minute/` |
| online timer, countdown timer | `/timer/` | hub, planned indexable in Sprint 3 |

## Converters — `/convert/[from]-to-[to]/` (allowlist)

| Keywords | Canonical | Status |
| --- | --- | --- |
| ist to est, india time to est, ist to eastern time, ist to edt | `/convert/ist-to-est/` | live |
| est to ist, eastern time to india time | `/convert/est-to-ist/` | live |
| cst to ist, central time to india time | `/convert/cst-to-ist/` | live |
| pst to ist, pacific time to india time | `/convert/pst-to-ist/` | live |
| gmt to ist, greenwich mean time to ist | `/convert/gmt-to-ist/` | live (fixed UTC+0; "uk time to india" is a different intent because the UK uses BST in summer, so it needs its own London-based page if pursued) |
| utc to ist | `/convert/utc-to-ist/` | live |
| cst to est, central to eastern time | `/convert/cst-to-est/` | live |
| est to pst, eastern to pacific time | `/convert/est-to-pst/` | live |
| time zone converter, convert time zones | `/converter/` | hub, planned indexable in Sprint 4 |

Daylight variants ("ist to edt") intentionally map to the standard-abbreviation page, which follows real local time and explains EST vs EDT, rather than creating near-duplicate `/convert/ist-to-edt/` pages.

## Tools (planned, Sprint 5)

| Keywords | Canonical |
| --- | --- |
| meeting planner, time zone meeting planner | `/meeting-planner/` |
| online alarm clock | `/alarm/` |
| online stopwatch | `/stopwatch/` |
| date calculator, days between dates | `/tools/date-difference/` |
| hours calculator | `/tools/hours-calculator/` |
| military time converter | `/tools/military-time-converter/` |
| unix timestamp converter | `/tools/unix-timestamp/` |
