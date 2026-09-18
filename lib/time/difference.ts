import { formatDuration } from './format';
import { getUTCOffset, getZonedParts, resolveWallTime, type Disambiguation, type Instant, type WallTime, type ZonedParts } from './zone';

/**
 * Minutes that `toZone` is ahead of `fromZone` at the instant (negative when
 * behind). Always computed from both zones' real offsets at that instant.
 */
export function getTimeDifference(fromZone: string, toZone: string, instant: Instant = Date.now()): number {
  return getUTCOffset(toZone, instant) - getUTCOffset(fromZone, instant);
}

/** "+3 hours", "-2 hours", "+13 hours 30 minutes", "Same time". */
export function formatSignedDifference(minutes: number): string {
  if (minutes === 0) return 'Same time';
  return `${minutes > 0 ? '+' : '-'}${formatDuration(minutes)}`;
}

/** "IST is 10 hours 30 minutes ahead of EST" style sentence fragments. */
export function describeDifference(subject: string, reference: string, subjectAheadMinutes: number): string {
  if (subjectAheadMinutes === 0) return `${subject} and ${reference} are on the same time`;
  const direction = subjectAheadMinutes > 0 ? 'ahead of' : 'behind';
  return `${subject} is ${formatDuration(subjectAheadMinutes)} ${direction} ${reference}`;
}

export type Conversion = {
  instant: number;
  from: ZonedParts;
  to: ZonedParts;
  fromOffset: number;
  toOffset: number;
  /** Signed calendar-day shift of the target relative to the source (-1, 0, +1). */
  dayShift: number;
  /** How the source wall time was resolved (DST gaps and overlaps). */
  status: 'exact' | 'gap' | 'overlap';
};

/**
 * Convert a wall-clock time in `fromZone` to the wall-clock time in `toZone`.
 * Both offsets are evaluated at the resolved instant, so DST on the selected
 * date is always respected.
 */
export function convertTime(
  fromZone: string,
  toZone: string,
  wall: WallTime,
  disambiguation: Disambiguation = 'compatible',
): Conversion {
  const { instant, status } = resolveWallTime(wall, fromZone, disambiguation);
  const from = getZonedParts(instant, fromZone);
  const to = getZonedParts(instant, toZone);
  const fromDay = Date.UTC(from.year, from.month - 1, from.day);
  const toDay = Date.UTC(to.year, to.month - 1, to.day);
  return {
    instant,
    from,
    to,
    fromOffset: getUTCOffset(fromZone, instant),
    toOffset: getUTCOffset(toZone, instant),
    dayShift: Math.round((toDay - fromDay) / 86_400_000),
    status,
  };
}

/** Relative day label for a converted time: "", "next day", "previous day". */
export function dayShiftLabel(dayShift: number): string {
  if (dayShift === 1) return 'next day';
  if (dayShift === -1) return 'previous day';
  if (dayShift > 1) return `+${dayShift} days`;
  if (dayShift < -1) return `${dayShift} days`;
  return '';
}
