/**
 * Display names for zones that have no hand-written metadata, taken from
 * CLDR/ICU at generation time (lib/time/zone-names.generated.ts) so server
 * and client never disagree on wording.
 *
 * Server-side only by convention: the generated table is not needed in the
 * browser. Client components receive precomputed names as props.
 */
import { getZoneLabel, type ZoneLabel } from './abbreviations';
import { canonicalZone } from './aliases';
import { getDSTState } from './dst';
import { GENERATED_ZONE_NAMES } from './zone-names.generated';
import { getZoneGenericName } from './zone-metadata';
import { toEpochMs, utcMs, type Instant } from './zone';

const byZone = new Map(GENERATED_ZONE_NAMES.map((row) => [row[0], row]));

/** CLDR name for the zone while it is at `offsetMinutes`, or null when unknown. */
export function getGeneratedZoneName(timeZone: string, offsetMinutes: number): string | null {
  const row = byZone.get(canonicalZone(timeZone)) ?? byZone.get(timeZone);
  if (!row) return null;
  const [, janOffset, janName, julOffset, julName] = row;
  if (janOffset === offsetMinutes && janName) return janName;
  if (julOffset === offsetMinutes && julName) return julName;
  return null;
}

export type ZoneDisplayNames = { standard: string | null; daylight: string | null };

/** Standard and daylight names for a zone in the year containing `instant`, metadata first, CLDR second. */
export function getZoneDisplayNames(timeZone: string, instant: Instant = Date.now()): ZoneDisplayNames {
  const year = new Date(toEpochMs(instant)).getUTCFullYear();
  const names: ZoneDisplayNames = { standard: null, daylight: null };
  for (const sample of [utcMs(year, 1, 15, 12), utcMs(year, 7, 15, 12)]) {
    const state = getDSTState(timeZone, sample);
    const name = state.label?.name ?? getGeneratedZoneName(timeZone, state.offsetMinutes);
    if (!name) continue;
    if (state.isDST) names.daylight ??= name;
    else names.standard ??= name;
  }
  return names;
}

/** Like getZoneLabel, but fills `name` and `generic` from CLDR when metadata has none. */
export function getZoneLabelWithNames(timeZone: string, instant: Instant = Date.now()): ZoneLabel {
  const label = getZoneLabel(timeZone, instant);
  const name = label.name ?? getGeneratedZoneName(timeZone, label.offsetMinutes);
  return { ...label, name, generic: label.generic ?? genericFromNames(getZoneDisplayNames(timeZone, instant)) };
}

/** "Central European Time" from "Central European Standard Time" when a daylight name exists. */
export function genericFromNames(names: ZoneDisplayNames): string | null {
  if (!names.standard) return null;
  return names.daylight ? names.standard.replace(/ Standard Time$/, ' Time') : names.standard;
}

/** DST-agnostic region name: metadata generic, else derived from CLDR names. */
export function getZoneRegionName(timeZone: string, instant: Instant = Date.now()): string | null {
  return getZoneGenericName(timeZone) ?? genericFromNames(getZoneDisplayNames(timeZone, instant));
}
