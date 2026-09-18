import { MINUTE_MS, addDays, getZonedDate, getZonedParts, compareCalendarDates, wallTimeToInstant, type CalendarDate } from './zone';

export type WorkingHours = {
  /** Core business hours, minutes after midnight. */
  coreStart: number;
  coreEnd: number;
  /** Acceptable extended hours (early/late calls), minutes after midnight. */
  extendedStart: number;
  extendedEnd: number;
};

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  coreStart: 9 * 60,
  coreEnd: 17 * 60,
  extendedStart: 7 * 60,
  extendedEnd: 22 * 60,
};

export type MeetingSlot = {
  /** Slot start instant (epoch ms). */
  start: number;
  /**
   * 2 = inside core hours for every zone.
   * 1 = core hours for at least one zone and extended hours for all others.
   */
  quality: 1 | 2;
  /** Minutes after local midnight for each zone, in input order. */
  localStartMinutes: number[];
};

function within(startMin: number, durationMin: number, rangeStart: number, rangeEnd: number) {
  return startMin >= rangeStart && startMin + durationMin <= rangeEnd;
}

/**
 * Suggest meeting start times on `date` (a calendar date in `anchorZone`),
 * stepping through whole hours of the anchor zone. Returns only slots of the
 * best available quality, chronologically, up to `limit`.
 */
export function suggestMeetingSlots({
  zones,
  anchorZone,
  date,
  durationMinutes = 60,
  stepMinutes = 60,
  hours = DEFAULT_WORKING_HOURS,
  limit = 4,
}: {
  zones: string[];
  anchorZone: string;
  date: CalendarDate;
  durationMinutes?: number;
  stepMinutes?: number;
  hours?: WorkingHours;
  limit?: number;
}): MeetingSlot[] {
  const dayStart = wallTimeToInstant({ ...date, hour: 0, minute: 0 }, anchorZone);
  const nextDayStart = wallTimeToInstant({ ...addDays(date, 1), hour: 0, minute: 0 }, anchorZone);
  const slots: MeetingSlot[] = [];

  for (let start = dayStart; start < nextDayStart; start += stepMinutes * MINUTE_MS) {
    // Guard against DST days: only keep starts that are on the anchor date.
    if (compareCalendarDates(getZonedDate(start, anchorZone), date) !== 0) continue;

    const localStartMinutes = zones.map((zone) => {
      const p = getZonedParts(start, zone);
      return p.hour * 60 + p.minute;
    });
    const core = localStartMinutes.map((m) => within(m, durationMinutes, hours.coreStart, hours.coreEnd));
    const extended = localStartMinutes.map((m) => within(m, durationMinutes, hours.extendedStart, hours.extendedEnd));

    let quality: 0 | 1 | 2 = 0;
    if (core.every(Boolean)) quality = 2;
    else if (core.some(Boolean) && extended.every(Boolean)) quality = 1;
    if (quality > 0) slots.push({ start, quality: quality as 1 | 2, localStartMinutes });
  }

  const best = Math.max(0, ...slots.map((s) => s.quality));
  return slots.filter((s) => s.quality === best).slice(0, limit);
}

/** Number of hours per day during which all zones are inside core hours. */
export function countOverlappingCoreHours(zones: string[], anchorZone: string, date: CalendarDate, hours = DEFAULT_WORKING_HOURS): number {
  return suggestMeetingSlots({ zones, anchorZone, date, hours, limit: 24, stepMinutes: 60 }).filter((s) => s.quality === 2)
    .length;
}
