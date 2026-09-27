import { describe, expect, it } from 'vitest';
import { formatTime } from './format';
import { INTL_ZONE_FALLBACKS, resolveIntlZone, runtimeZone } from './zone';

// Simulates a browser whose tz data lacks the listed zones.
const lacking = (...missing: string[]) => (zone: string) => !missing.includes(zone);

describe('runtime time zone fallback', () => {
  it('keeps every zone the runtime supports', () => {
    expect(resolveIntlZone('America/Coyhaique', () => true)).toBe('America/Coyhaique');
    expect(resolveIntlZone('Asia/Kolkata', lacking('America/Coyhaique'))).toBe('Asia/Kolkata');
    expect(resolveIntlZone('UTC', () => false)).toBe('UTC');
    expect(resolveIntlZone('UTC+05:30', () => false)).toBe('UTC+05:30');
  });

  it('maps a zone missing from the browser to its listed equivalent', () => {
    expect(resolveIntlZone('America/Coyhaique', lacking('America/Coyhaique'))).toBe('America/Punta_Arenas');
    for (const [zone, equivalent] of Object.entries(INTL_ZONE_FALLBACKS)) {
      expect(zone, zone).not.toBe(equivalent);
      // The equivalent must describe the same current offset (checked at a recent instant).
      const at = Date.UTC(2026, 8, 23, 12);
      expect(formatTime(at, equivalent, { hourCycle: '24h', seconds: false }), zone).toBe(formatTime(at, zone, { hourCycle: '24h', seconds: false }));
    }
  });

  it('falls back to the generated fixed offset, then UTC, when there is no listed equivalent', () => {
    // No-DST zone from the generated table: exact fixed offset.
    expect(resolveIntlZone('Asia/Kolkata', lacking('Asia/Kolkata'))).toBe('UTC+05:30');
    // Listed equivalent also unsupported: generated table (Coyhaique is UTC-3 all year).
    expect(resolveIntlZone('America/Coyhaique', lacking('America/Coyhaique', 'America/Punta_Arenas'))).toBe('UTC-03:00');
    // Unknown everywhere: never throw.
    expect(resolveIntlZone('Mars/Olympus_Mons', () => false)).toBe('UTC');
  });

  it('resolves to the zone itself on Node, whose tz data is current', () => {
    expect(runtimeZone('America/Coyhaique')).toBe('America/Coyhaique');
    expect(runtimeZone('Europe/London')).toBe('Europe/London');
  });
});
