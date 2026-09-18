/**
 * Zones offered in the "Convert a specific time" selectors. Regional zones
 * follow DST; the fixed-offset options let people convert strict EST/CST/…
 * without daylight saving time. IANA "Etc/GMT+5" means UTC-5 (POSIX sign).
 */
export type ConverterZoneOption = { zone: string; label: string; group: 'Regions' | 'Fixed offsets (no DST)' };

export const CONVERTER_ZONE_OPTIONS: ConverterZoneOption[] = [
  { zone: 'Asia/Kolkata', label: 'India', group: 'Regions' },
  { zone: 'America/New_York', label: 'Eastern Time – New York', group: 'Regions' },
  { zone: 'America/Chicago', label: 'Central Time – Chicago', group: 'Regions' },
  { zone: 'America/Denver', label: 'Mountain Time – Denver', group: 'Regions' },
  { zone: 'America/Phoenix', label: 'Arizona – Phoenix', group: 'Regions' },
  { zone: 'America/Los_Angeles', label: 'Pacific Time – Los Angeles', group: 'Regions' },
  { zone: 'America/Mexico_City', label: 'Mexico City', group: 'Regions' },
  { zone: 'America/Regina', label: 'Saskatchewan – Regina', group: 'Regions' },
  { zone: 'UTC', label: 'UTC / GMT', group: 'Regions' },
  { zone: 'Europe/London', label: 'United Kingdom – London', group: 'Regions' },
  { zone: 'Europe/Paris', label: 'Central Europe – Paris, Berlin', group: 'Regions' },
  { zone: 'Asia/Dubai', label: 'Gulf – Dubai', group: 'Regions' },
  { zone: 'Asia/Singapore', label: 'Singapore', group: 'Regions' },
  { zone: 'Asia/Tokyo', label: 'Japan – Tokyo', group: 'Regions' },
  { zone: 'Australia/Sydney', label: 'Australia Eastern – Sydney', group: 'Regions' },
  { zone: 'Etc/GMT+5', label: 'EST (always UTC-5)', group: 'Fixed offsets (no DST)' },
  { zone: 'Etc/GMT+6', label: 'CST (always UTC-6)', group: 'Fixed offsets (no DST)' },
  { zone: 'Etc/GMT+7', label: 'MST (always UTC-7)', group: 'Fixed offsets (no DST)' },
  { zone: 'Etc/GMT+8', label: 'PST (always UTC-8)', group: 'Fixed offsets (no DST)' },
];
