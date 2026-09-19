/** Stopwatch formatting and lap statistics. Pure. */

const pad2 = (n: number) => String(n).padStart(2, '0');

/** 83_450 → "01:23.45"; 3_723_450 → "1:02:03.45". Centiseconds, hours only when needed. */
export function formatStopwatch(ms: number): string {
  const total = Math.max(0, Math.floor(ms));
  const centis = Math.floor((total % 1000) / 10);
  const seconds = Math.floor(total / 1000) % 60;
  const minutes = Math.floor(total / 60_000) % 60;
  const hours = Math.floor(total / 3_600_000);
  const base = `${pad2(minutes)}:${pad2(seconds)}.${pad2(centis)}`;
  return hours ? `${hours}:${base}` : base;
}

export type LapRow = { index: number; lapMs: number; totalMs: number; fastest: boolean; slowest: boolean };

/** Turn cumulative lap timestamps (ms since start) into per-lap rows, newest first. */
export function lapRows(cumulative: number[]): LapRow[] {
  const laps = cumulative.map((total, i) => ({ index: i + 1, lapMs: total - (cumulative[i - 1] ?? 0), totalMs: total }));
  const times = laps.map((l) => l.lapMs);
  const fastest = laps.length > 1 ? Math.min(...times) : NaN;
  const slowest = laps.length > 1 ? Math.max(...times) : NaN;
  return laps.map((l) => ({ ...l, fastest: l.lapMs === fastest, slowest: l.lapMs === slowest && slowest !== fastest })).reverse();
}
