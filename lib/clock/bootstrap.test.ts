import { describe, expect, it } from 'vitest';
import { CLOCK_BOOTSTRAP_SCRIPT } from './bootstrap';
import { formatKind, type LiveKind } from './format-kind';

type Bootstrap = { fmt: (ms: number, zone: string | undefined, kind: string, cycle: string) => string };

function loadBootstrap(): Bootstrap {
  const fakeWindow: { __tn?: Bootstrap } = {};
  new Function('window', 'localStorage', 'document', CLOCK_BOOTSTRAP_SCRIPT)(fakeWindow, { getItem: () => null }, {});
  return fakeWindow.__tn!;
}

describe('clock bootstrap script', () => {
  const bootstrap = loadBootstrap();
  const zones = ['Asia/Kolkata', 'Asia/Calcutta','America/Chicago', 'America/New_York', 'Europe/London', 'Australia/Sydney', 'UTC', 'Asia/Kathmandu', 'Etc/GMT+6', 'UTC+05:30', 'UTC-09:30', 'UTC+13:45', 'UTC-12:00'];
  const instants = [
    Date.parse('2026-01-01T00:00:00Z'),
    Date.parse('2026-03-08T07:59:59Z'),
    Date.parse('2026-03-08T08:00:00Z'),
    Date.parse('2026-09-16T16:54:38Z'),
    Date.parse('2026-12-31T23:30:05Z'),
    Date.parse('2028-02-29T12:00:00Z'),
  ];
  const kinds: LiveKind[] = ['time', 'time-short', 'weekday-time-short', 'date-full', 'date-medium', 'date-weekday-short', 'offset', 'zone-city'];

  it('produces output identical to the React formatter for every kind, zone and hour cycle', () => {
    for (const zone of zones) {
      for (const instant of instants) {
        for (const kind of kinds) {
          for (const cycle of ['12h', '24h'] as const) {
            expect(bootstrap.fmt(instant, zone, kind, cycle), `${zone} ${kind} ${cycle} ${instant}`).toBe(
              formatKind(instant, zone, kind, cycle),
            );
          }
        }
      }
    }
  });
});
