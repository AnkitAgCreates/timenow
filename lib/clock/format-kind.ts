import { canonicalZone, formatDate, formatOffset, formatTime, getUTCOffset, getZonedParts, WEEKDAYS_SHORT, type HourCycle } from '@/lib/time';

/** Display variants supported by <LiveTime> and the inline bootstrap script. */
export type LiveKind = 'time' | 'time-short' | 'weekday-time-short' | 'date-full' | 'date-medium' | 'date-weekday-short' | 'offset' | 'zone-city';

/** Placeholder text rendered on the server before the bootstrap fills real values. */
export const LIVE_PLACEHOLDER: Record<LiveKind, string> = {
  time: '--:--:--',
  'time-short': '--:--',
  'weekday-time-short': '--- --:--',
  'date-full': ' ',
  'date-medium': ' ',
  'date-weekday-short': ' ',
  offset: 'UTC',
  'zone-city': ' ',
};

/** Exemplar city of an IANA id: "America/New_York" → "New York", "Asia/Calcutta" → "Kolkata". */
export function zoneCity(timeZone: string): string {
  const parts = canonicalZone(timeZone).split('/');
  return (parts[parts.length - 1] ?? timeZone).replace(/_/g, ' ');
}

export function formatKind(instant: number, timeZone: string, kind: LiveKind, hourCycle: HourCycle): string {
  switch (kind) {
    case 'time':
      return formatTime(instant, timeZone, { hourCycle, seconds: true });
    case 'time-short':
      return formatTime(instant, timeZone, { hourCycle, seconds: false });
    case 'weekday-time-short':
      return `${WEEKDAYS_SHORT[getZonedParts(instant, timeZone).weekday]} ${formatTime(instant, timeZone, { hourCycle, seconds: false })}`;
    case 'date-full':
      return formatDate(instant, timeZone, 'full');
    case 'date-medium':
      return formatDate(instant, timeZone, 'medium');
    case 'date-weekday-short':
      return formatDate(instant, timeZone, 'weekday-short');
    case 'offset':
      return formatOffset(getUTCOffset(timeZone, instant));
    case 'zone-city':
      return zoneCity(timeZone);
  }
}
