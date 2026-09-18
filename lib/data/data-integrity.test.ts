import { describe, expect, it } from 'vitest';
import { CITIES } from '@/data/cities';
import { CONVERTER_PAIRS } from '@/data/converters';
import { COUNTRIES } from '@/data/countries';
import { TIMER_PRESETS } from '@/data/timers';
import { TIMEZONES } from '@/data/timezones';
import { getNearbyCities, getCity } from '@/lib/data/cities';
import { getConverterPair } from '@/lib/data/converters';
import { getTimerAliases, timerSlugForSeconds } from '@/lib/data/timers';
import { fixedOffsetZone, getSeasonalZones, getYearRoundZones } from '@/lib/data/timezones';
import { getSitemapEntries, getSitemapFiles } from '@/lib/seo/sitemap';
import { getUTCOffset, isValidTimeZone, utcMs } from '@/lib/time';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Validate against an explicit year so the test is deterministic.
const YEAR = 2026;

const unique = (values: string[]) => new Set(values).size === values.length;

describe('cities', () => {
  it('have unique, URL-safe slugs', () => {
    expect(unique(CITIES.map((c) => c.slug))).toBe(true);
    for (const city of CITIES) expect(city.slug).toMatch(SLUG);
  });

  it('use valid IANA zones, known countries and sane coordinates', () => {
    const codes = new Set(COUNTRIES.map((c) => c.code));
    for (const city of CITIES) {
      expect(isValidTimeZone(city.timezone), city.slug).toBe(true);
      expect(codes.has(city.countryCode), city.slug).toBe(true);
      expect(Math.abs(city.latitude)).toBeLessThanOrEqual(90);
      expect(Math.abs(city.longitude)).toBeLessThanOrEqual(180);
    }
  });

  it('country display names match the country table', () => {
    for (const city of CITIES) {
      expect(COUNTRIES.find((c) => c.code === city.countryCode)?.name).toBe(city.country);
    }
  });

  it('nearby cities for San Diego come from coordinates', () => {
    const nearby = getNearbyCities(getCity('san-diego')!, 4);
    // Tijuana is 20 km away; then the Orange County cities; Los Angeles is ~180 km.
    expect(nearby.map((n) => n.city.slug)).toEqual(['tijuana', 'irvine', 'santa-ana', 'riverside']);
    for (let i = 1; i < nearby.length; i++) expect(nearby[i]!.km).toBeGreaterThanOrEqual(nearby[i - 1]!.km);
    expect(nearby[0]!.km).toBeLessThan(30);
  });
});

describe('timezone entries', () => {
  it('have unique slugs matching their abbreviation', () => {
    expect(unique(TIMEZONES.map((t) => t.slug))).toBe(true);
    for (const tz of TIMEZONES) expect(tz.slug).toBe(tz.abbreviation.toLowerCase());
  });

  it('reference only valid IANA zones and known slugs', () => {
    const slugs = new Set(TIMEZONES.map((t) => t.slug));
    for (const tz of TIMEZONES) {
      for (const zone of [tz.referenceZone, ...getSeasonalZones(tz), ...getYearRoundZones(tz)]) {
        expect(isValidTimeZone(zone), `${tz.slug}: ${zone}`).toBe(true);
      }
      for (const related of tz.related) expect(slugs.has(related), `${tz.slug} → ${related}`).toBe(true);
      if (tz.counterpart) expect(slugs.has(tz.counterpart)).toBe(true);
    }
  });

  it('every geography sentence names at least one backing zone', () => {
    for (const tz of TIMEZONES) {
      for (const region of [...tz.seasonalRegions, ...tz.yearRoundRegions]) {
        expect(region.label.trim().length, `${tz.slug}: empty label`).toBeGreaterThan(0);
        expect(region.zones.length, `${tz.slug}: "${region.label}" has no zones`).toBeGreaterThan(0);
      }
    }
  });

  /** Raw monthly offsets from tzdata — deliberately independent of the DST classifier. */
  const monthlyOffsets = (zone: string) => new Set(Array.from({ length: 12 }, (_, m) => getUTCOffset(zone, utcMs(YEAR, m + 1, 15, 12))));

  it('seasonal regions really alternate between the standard and daylight offsets', () => {
    for (const tz of TIMEZONES) {
      const standard = tz.kind === 'daylight' ? tz.offsetMinutes - 60 : tz.offsetMinutes;
      for (const region of tz.seasonalRegions) {
        for (const zone of region.zones) {
          expect([...monthlyOffsets(zone)].sort((a, b) => a - b), `${tz.slug}: ${zone} ("${region.label}")`).toEqual([standard, standard + 60]);
        }
      }
    }
  });

  it('year-round regions stay on the abbreviation’s offset every month', () => {
    for (const tz of TIMEZONES) {
      for (const region of tz.yearRoundRegions) {
        for (const zone of region.zones) {
          expect([...monthlyOffsets(zone)], `${tz.slug}: ${zone} ("${region.label}")`).toEqual([tz.offsetMinutes]);
        }
      }
    }
  });

  it('Saskatchewan, Yukon and Mexico are listed under the right behaviour', () => {
    const cst = TIMEZONES.find((t) => t.slug === 'cst')!;
    const mst = TIMEZONES.find((t) => t.slug === 'mst')!;
    expect(getYearRoundZones(cst)).toEqual(expect.arrayContaining(['America/Regina', 'America/Swift_Current', 'America/Mexico_City', 'America/Chihuahua']));
    expect(getSeasonalZones(cst)).toEqual(expect.arrayContaining(['America/Matamoros', 'America/Ojinaga']));
    expect(getYearRoundZones(mst)).toEqual(expect.arrayContaining(['America/Whitehorse', 'America/Dawson', 'America/Hermosillo', 'America/Mazatlan']));
    expect(getSeasonalZones(mst)).toEqual(expect.arrayContaining(['America/Edmonton', 'America/Ciudad_Juarez']));
    const saskatchewan = cst.yearRoundRegions.find((r) => r.zones.includes('America/Regina'))!;
    expect(saskatchewan.label.startsWith('Most of Saskatchewan')).toBe(true);
    expect(saskatchewan.note).toContain('Lloydminster');
  });

  it('builds Etc/GMT zones with the inverted POSIX sign', () => {
    expect(fixedOffsetZone(-360)).toBe('Etc/GMT+6');
    expect(fixedOffsetZone(330)).toBeNull();
    expect(getUTCOffset(fixedOffsetZone(-360)!, utcMs(YEAR, 7, 1))).toBe(-360);
    expect(getUTCOffset(fixedOffsetZone(540)!, utcMs(YEAR, 7, 1))).toBe(540);
  });
});

describe('timer presets', () => {
  it('use canonical slugs derived from their duration', () => {
    for (const preset of TIMER_PRESETS) expect(preset.slug).toBe(timerSlugForSeconds(preset.seconds));
    expect(unique(TIMER_PRESETS.map((p) => p.slug))).toBe(true);
  });

  it('redirect aliases never collide with canonical slugs', () => {
    const canonical = new Set(TIMER_PRESETS.map((p) => p.slug));
    const aliases = getTimerAliases();
    expect(unique(aliases.map((a) => a.source))).toBe(true);
    for (const alias of aliases) expect(canonical.has(alias.source)).toBe(false);
    expect(aliases).toContainEqual({ source: '60-minutes', destination: '1-hour' });
  });
});

describe('converter allowlist', () => {
  it('references known timezones, has no duplicates and rejects unlisted pairs', () => {
    const slugs = new Set(TIMEZONES.map((t) => t.slug));
    for (const pair of CONVERTER_PAIRS) {
      expect(slugs.has(pair.from)).toBe(true);
      expect(slugs.has(pair.to)).toBe(true);
      expect(pair.from).not.toBe(pair.to);
    }
    expect(unique(CONVERTER_PAIRS.map((p) => `${p.from}-to-${p.to}`))).toBe(true);
    expect(getConverterPair('ist-to-est')).toBeDefined();
    expect(getConverterPair('ist-to-jst')).toBeUndefined();
  });
});

describe('sitemaps', () => {
  const on = { indexingEnabled: true };

  it('list every indexable page exactly once', () => {
    const paths = getSitemapFiles(on).flatMap((file) => getSitemapEntries(file, on)!.map((e) => e.path));
    expect(unique(paths)).toBe(true);
    expect(paths).toContain('/time/san-diego/');
    expect(paths).toContain('/timezones/cst/');
    expect(paths).toContain('/timer/1-hour/');
    expect(paths).toContain('/convert/ist-to-est/');
    for (const path of paths) expect(path).toMatch(/^\/([a-z0-9-]+\/)*$/);
  });

  it('rejects unknown sitemap files', () => {
    expect(getSitemapEntries('cities-99.xml', on)).toBeNull();
    expect(getSitemapEntries('nope-1.xml', on)).toBeNull();
  });

  it('publish nothing when the global indexing kill switch is off', () => {
    const off = { indexingEnabled: false };
    expect(getSitemapFiles(off)).toEqual([]);
    expect(getSitemapEntries('cities-1.xml', off)).toBeNull();
    expect(getSitemapEntries('pages-1.xml', off)).toBeNull();
  });

  it('default to the environment switch, which is off unless explicitly "true"', () => {
    // The test environment does not set NEXT_PUBLIC_ALLOW_INDEXING.
    expect(process.env.NEXT_PUBLIC_ALLOW_INDEXING).not.toBe('true');
    expect(getSitemapFiles()).toEqual([]);
  });
});
