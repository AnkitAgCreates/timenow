import { describe, expect, it } from 'vitest';
import { ZONE_METADATA, getZoneEra } from './zone-metadata';
import { getUTCOffset, isValidTimeZone, utcMs } from './zone';

/**
 * Dataset rule: every metadata era must describe exactly the offsets its zone
 * really uses. Offsets are read straight from tzdata (month by month), so the
 * check is independent of the DST classifier.
 */
const YEAR = 2026;

const monthlyOffsets = (zone: string) =>
  [...new Set(Array.from({ length: 12 }, (_, m) => getUTCOffset(zone, utcMs(YEAR, m + 1, 15, 12))))].sort((a, b) => a - b);

const eraOffsets = (zone: string) => {
  const era = getZoneEra(zone, utcMs(YEAR, 7, 1))!;
  return [era.standard, era.daylight, era.seasonalBackward]
    .filter((l): l is NonNullable<typeof l> => Boolean(l))
    .map((l) => l.offsetMinutes)
    .sort((a, b) => a - b);
};

describe('zone metadata vs tzdata', () => {
  const zones = Object.keys(ZONE_METADATA);

  it('covers a broad set of zones with valid IANA ids', () => {
    expect(zones.length).toBeGreaterThan(150);
    for (const zone of zones) expect(isValidTimeZone(zone), zone).toBe(true);
  });

  it.each(zones)('%s: the current era declares exactly the offsets the zone uses', (zone) => {
    expect(monthlyOffsets(zone)).toEqual(eraOffsets(zone));
  });

  it('every era has a contiguous, well-ordered date range', () => {
    for (const [zone, meta] of Object.entries(ZONE_METADATA)) {
      meta.eras.forEach((era, index) => {
        const next = meta.eras[index + 1];
        if (next) expect(era.until, `${zone} era ${index} must end where the next starts`).toBe(next.from);
        if (era.from && era.until) expect(Date.parse(era.from)).toBeLessThan(Date.parse(era.until));
      });
      expect(meta.eras[0]?.from, `${zone}: first era must be open-ended at the start`).toBeUndefined();
      expect(meta.eras[meta.eras.length - 1]?.until, `${zone}: last era must be open-ended`).toBeUndefined();
    }
  });

  it('labels carry the offset they name, so ambiguous abbreviations cannot collide', () => {
    const seen = new Map<string, Set<number>>();
    for (const meta of Object.values(ZONE_METADATA)) {
      for (const era of meta.eras) {
        for (const l of [era.standard, era.daylight, era.seasonalBackward]) {
          if (!l?.abbreviation) continue;
          if (!seen.has(l.abbreviation)) seen.set(l.abbreviation, new Set());
          seen.get(l.abbreviation)!.add(l.offsetMinutes);
        }
      }
    }
    // Per-zone labels make these legitimate: the same letters, different offsets.
    expect([...seen.get('IST')!].sort((a, b) => a - b)).toEqual([60, 120, 330]);
    expect([...seen.get('CST')!].sort((a, b) => a - b)).toEqual([-360, -300, 480]);
    expect([...seen.get('BST')!].sort((a, b) => a - b)).toEqual([60, 360]);
  });
});
