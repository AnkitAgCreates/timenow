/**
 * Public time engine API. Import from "@/lib/time".
 *
 *   getCurrentTime(timeZone)                → zoned parts + label for "now"
 *   formatTime(instant, timeZone, options)  → "10:24:38 AM"
 *   getUTCOffset(timeZone, instant)         → minutes (IST → 330)
 *   getTimeDifference(zoneA, zoneB, instant)→ minutes zoneB is ahead of zoneA
 *   convertTime(fromZone, toZone, wallTime) → DST-correct conversion
 *   isDST(timeZone, instant)                → boolean (metadata first, then transition structure)
 *   getDSTState(timeZone, instant)          → offset, standard offset, seasonal shift, source
 */
import { getZoneLabel, type ZoneLabel } from './abbreviations';
import { getZonedParts, toEpochMs, type Instant, type ZonedParts } from './zone';

export * from './zone';
export * from './format';
export * from './abbreviations';
export * from './difference';
export * from './sun';
export * from './meeting';
export * from './aliases';
export * from './dst';
export * from './zone-metadata';

export type CurrentTime = { instant: number; parts: ZonedParts; label: ZoneLabel };

export function getCurrentTime(timeZone: string, now: Instant = Date.now()): CurrentTime {
  const instant = toEpochMs(now);
  return { instant, parts: getZonedParts(instant, timeZone), label: getZoneLabel(timeZone, instant) };
}
