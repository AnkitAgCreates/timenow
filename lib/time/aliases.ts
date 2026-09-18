/**
 * Legacy/backward-compatible IANA ids that browsers may still report
 * (Chrome reports "Asia/Calcutta"), mapped to their canonical ids.
 */
export const ZONE_ALIASES: Record<string, string> = {
  'Asia/Calcutta': 'Asia/Kolkata',
  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Asia/Katmandu': 'Asia/Kathmandu',
  'Asia/Rangoon': 'Asia/Yangon',
  'Europe/Kiev': 'Europe/Kyiv',
  'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
  'Etc/UTC': 'UTC',
  'Etc/Universal': 'UTC',
  'Etc/Zulu': 'UTC',
  'US/Eastern': 'America/New_York',
  'US/Central': 'America/Chicago',
  'US/Mountain': 'America/Denver',
  'US/Pacific': 'America/Los_Angeles',
  'US/Arizona': 'America/Phoenix',
};

export function canonicalZone(timeZone: string): string {
  return ZONE_ALIASES[timeZone] ?? timeZone;
}
