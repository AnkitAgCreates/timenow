/**
 * Display labels for a zone at an instant.
 *
 * Intl's `timeZoneName: 'short'` output is locale- and ICU-dependent (en-US
 * renders Asia/Kolkata as "GMT+5:30", not "IST"), so abbreviations come from
 * explicit zone metadata (lib/time/zone-metadata.ts). A label is used only
 * when its offset equals the zone's real offset at that instant; otherwise the
 * UI shows "UTC±X" rather than a possibly wrong abbreviation.
 */
import { getDSTState } from './dst';
import { formatOffset } from './format';
import { getZoneGenericName } from './zone-metadata';
import { type Instant } from './zone';

export type ZoneLabel = {
  /** "CDT", or "UTC+4" when no verified abbreviation exists. */
  abbreviation: string;
  /** "Central Daylight Time", or null when unknown. */
  name: string | null;
  /** "Central Time" (DST-agnostic), or null when unknown. */
  generic: string | null;
  offsetMinutes: number;
  /** "UTC-5" */
  offsetLabel: string;
  isDST: boolean;
  /** True when the abbreviation came from zone metadata matching the real offset. */
  verified: boolean;
};

/** Abbreviation, names, offset and DST state for a zone at an instant. */
export function getZoneLabel(timeZone: string, instant: Instant = Date.now()): ZoneLabel {
  const state = getDSTState(timeZone, instant);
  const offsetLabel = formatOffset(state.offsetMinutes);
  const abbreviation = state.label?.abbreviation;
  return {
    abbreviation: abbreviation ?? offsetLabel,
    name: state.label?.name ?? null,
    generic: getZoneGenericName(timeZone),
    offsetMinutes: state.offsetMinutes,
    offsetLabel,
    isDST: state.isDST,
    verified: Boolean(abbreviation),
  };
}

export function getZoneAbbreviation(timeZone: string, instant: Instant = Date.now()): string {
  return getZoneLabel(timeZone, instant).abbreviation;
}
