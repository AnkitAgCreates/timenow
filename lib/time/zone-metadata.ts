/**
 * Explicit, per-zone time metadata: labels and the offset rules that apply in
 * each era. This is the primary source for DST classification and
 * abbreviations (see lib/time/dst.ts); zones without metadata fall back to
 * inference from their actual offset transitions, and to CLDR names from
 * lib/time/zone-names.ts.
 *
 * Offsets live on each label, not in a global abbreviation table, because
 * abbreviations are ambiguous: "IST" is UTC+5:30 in India and UTC+1 in Ireland,
 * "CST" is UTC-6 in Chicago, UTC+8 in Shanghai and UTC-5 in Havana.
 *
 * Eras record rule changes explicitly — e.g. Mexico City stopped observing DST
 * after 2022-10-30 and Yukon moved to permanent UTC-7 on 2020-11-01 — so
 * historical dates are classified correctly too.
 *
 * Every entry is verified against tzdata by lib/time/zone-metadata.test.ts:
 * the offsets a zone really uses in the test year must be exactly the offsets
 * its current era declares.
 */
import { canonicalZone } from './aliases';

export type ZoneTimeLabel = {
  offsetMinutes: number;
  /** Omitted when there is no widely used abbreviation (the UI shows "UTC±X"). */
  abbreviation?: string;
  name?: string;
};

export type ZoneEra = {
  /** ISO instant the era starts (inclusive). Omitted = since records began. */
  from?: string;
  /** ISO instant the era ends (exclusive). Omitted = still in force. */
  until?: string;
  /** Standard (base) time. */
  standard: ZoneTimeLabel;
  /** Daylight saving time: clocks move forward from standard. */
  daylight?: ZoneTimeLabel;
  /** Temporary backward shift from standard (e.g. Morocco during Ramadan). Not DST. */
  seasonalBackward?: ZoneTimeLabel;
};

export type ZoneMetadata = {
  /** DST-agnostic region name, e.g. "Central Time". */
  generic: string;
  eras: ZoneEra[];
};

const label = (abbreviation: string | undefined, name: string | undefined, offsetMinutes: number): ZoneTimeLabel => ({
  offsetMinutes,
  ...(abbreviation ? { abbreviation } : {}),
  ...(name ? { name } : {}),
});

export const LABELS = {
  // Americas
  HST: label('HST', 'Hawaii-Aleutian Standard Time', -600),
  HDT: label('HDT', 'Hawaii-Aleutian Daylight Time', -540),
  AKST: label('AKST', 'Alaska Standard Time', -540),
  AKDT: label('AKDT', 'Alaska Daylight Time', -480),
  PST: label('PST', 'Pacific Standard Time', -480),
  PDT: label('PDT', 'Pacific Daylight Time', -420),
  MST: label('MST', 'Mountain Standard Time', -420),
  MDT: label('MDT', 'Mountain Daylight Time', -360),
  CST: label('CST', 'Central Standard Time', -360),
  CDT: label('CDT', 'Central Daylight Time', -300),
  EST: label('EST', 'Eastern Standard Time', -300),
  EDT: label('EDT', 'Eastern Daylight Time', -240),
  AST: label('AST', 'Atlantic Standard Time', -240),
  ADT: label('ADT', 'Atlantic Daylight Time', -180),
  NST: label('NST', 'Newfoundland Standard Time', -210),
  NDT: label('NDT', 'Newfoundland Daylight Time', -150),
  CST_CUBA: label('CST', 'Cuba Standard Time', -300),
  CDT_CUBA: label('CDT', 'Cuba Daylight Time', -240),
  COT: label('COT', 'Colombia Time', -300),
  PET: label('PET', 'Peru Time', -300),
  ECT: label('ECT', 'Ecuador Time', -300),
  VET: label('VET', 'Venezuela Time', -240),
  BOT: label('BOT', 'Bolivia Time', -240),
  AMT: label('AMT', 'Amazon Time', -240),
  CLT: label('CLT', 'Chile Standard Time', -240),
  CLST: label('CLST', 'Chile Summer Time', -180),
  BRT: label('BRT', 'Brasília Time', -180),
  ART: label('ART', 'Argentina Time', -180),
  UYT: label('UYT', 'Uruguay Time', -180),
  PYT: label('PYT', 'Paraguay Time', -180),
  // Europe & Africa
  UTC: label('UTC', 'Coordinated Universal Time', 0),
  GMT: label('GMT', 'Greenwich Mean Time', 0),
  BST: label('BST', 'British Summer Time', 60),
  IST_IRELAND: label('IST', 'Irish Standard Time', 60),
  WET: label('WET', 'Western European Time', 0),
  WEST: label('WEST', 'Western European Summer Time', 60),
  CET: label('CET', 'Central European Time', 60),
  CEST: label('CEST', 'Central European Summer Time', 120),
  EET: label('EET', 'Eastern European Time', 120),
  EEST: label('EEST', 'Eastern European Summer Time', 180),
  MSK: label('MSK', 'Moscow Standard Time', 180),
  TRT: label('TRT', 'Türkiye Time', 180),
  WAT: label('WAT', 'West Africa Time', 60),
  CAT: label('CAT', 'Central Africa Time', 120),
  SAST: label('SAST', 'South Africa Standard Time', 120),
  EAT: label('EAT', 'East Africa Time', 180),
  // Middle East & Asia
  AST_ARABIA: label('AST', 'Arabia Standard Time', 180),
  IRST: label('IRST', 'Iran Standard Time', 210),
  IST_ISRAEL: label('IST', 'Israel Standard Time', 120),
  IDT: label('IDT', 'Israel Daylight Time', 180),
  GST: label('GST', 'Gulf Standard Time', 240),
  PKT: label('PKT', 'Pakistan Standard Time', 300),
  IST_INDIA: label('IST', 'India Standard Time', 330),
  SLST: label(undefined, 'Sri Lanka Standard Time', 330),
  NPT: label('NPT', 'Nepal Time', 345),
  BST_BANGLADESH: label('BST', 'Bangladesh Standard Time', 360),
  MMT: label('MMT', 'Myanmar Time', 390),
  ICT: label('ICT', 'Indochina Time', 420),
  WIB: label('WIB', 'Western Indonesia Time', 420),
  WITA: label('WITA', 'Central Indonesia Time', 480),
  WIT: label('WIT', 'Eastern Indonesia Time', 540),
  MYT: label('MYT', 'Malaysia Time', 480),
  SGT: label('SGT', 'Singapore Standard Time', 480),
  PHT: label('PHT', 'Philippine Standard Time', 480),
  HKT: label('HKT', 'Hong Kong Time', 480),
  CST_CHINA: label('CST', 'China Standard Time', 480),
  CST_TAIWAN: label('CST', 'Taiwan Standard Time', 480),
  KST: label('KST', 'Korea Standard Time', 540),
  JST: label('JST', 'Japan Standard Time', 540),
  // Oceania
  AWST: label('AWST', 'Australian Western Standard Time', 480),
  ACST: label('ACST', 'Australian Central Standard Time', 570),
  ACDT: label('ACDT', 'Australian Central Daylight Time', 630),
  AEST: label('AEST', 'Australian Eastern Standard Time', 600),
  AEDT: label('AEDT', 'Australian Eastern Daylight Time', 660),
  NZST: label('NZST', 'New Zealand Standard Time', 720),
  NZDT: label('NZDT', 'New Zealand Daylight Time', 780),
} as const;

const L = LABELS;

/** Current rules only (no recorded rule changes). */
const seasonal = (generic: string, standard: ZoneTimeLabel, daylight: ZoneTimeLabel): ZoneMetadata => ({
  generic,
  eras: [{ standard, daylight }],
});
const fixed = (generic: string, standard: ZoneTimeLabel): ZoneMetadata => ({ generic, eras: [{ standard }] });

/** Several zones sharing one definition. */
const each = (zones: string[], metadata: ZoneMetadata): Record<string, ZoneMetadata> =>
  Object.fromEntries(zones.map((zone) => [zone, metadata]));

/** Mexico's last daylight saving period ended at 02:00 CDT on 2022-10-30. */
const MEXICO_DST_END = '2022-10-30T07:00:00Z';

export const ZONE_METADATA: Record<string, ZoneMetadata> = {
  // ---------------------------------------------------------------- North America
  ...each(['Pacific/Honolulu'], fixed('Hawaii Time', L.HST)),
  'America/Adak': seasonal('Hawaii-Aleutian Time', L.HST, L.HDT),
  ...each(['America/Anchorage', 'America/Juneau'], seasonal('Alaska Time', L.AKST, L.AKDT)),
  ...each(['America/Los_Angeles', 'America/Tijuana', 'America/Vancouver'], seasonal('Pacific Time', L.PST, L.PDT)),
  ...each(['America/Denver', 'America/Edmonton', 'America/Boise', 'America/Ciudad_Juarez'], seasonal('Mountain Time', L.MST, L.MDT)),
  'America/Phoenix': fixed('Mountain Time (Arizona)', L.MST),
  'America/Hermosillo': fixed('Mountain Standard Time (Sonora)', L.MST),
  ...each(['America/Dawson_Creek', 'America/Fort_Nelson', 'America/Creston'], fixed('Mountain Standard Time (British Columbia)', L.MST)),
  ...each(['America/Chicago', 'America/Winnipeg', 'America/Matamoros', 'America/Ojinaga'], seasonal('Central Time', L.CST, L.CDT)),
  ...each(['America/Regina', 'America/Swift_Current'], fixed('Central Standard Time (Saskatchewan)', L.CST)),
  ...each(
    ['America/Guatemala', 'America/Belize', 'America/Tegucigalpa', 'America/El_Salvador', 'America/Managua', 'America/Costa_Rica'],
    fixed('Central Standard Time (Central America)', L.CST),
  ),
  ...each(
    ['America/New_York', 'America/Toronto', 'America/Detroit', 'America/Indiana/Indianapolis', 'America/Kentucky/Louisville', 'America/Nassau', 'America/Port-au-Prince'],
    seasonal('Eastern Time', L.EST, L.EDT),
  ),
  'America/Panama': fixed('Eastern Standard Time (Panama)', L.EST),
  'America/Jamaica': fixed('Eastern Standard Time (Jamaica)', L.EST),
  'America/Havana': seasonal('Cuba Time', L.CST_CUBA, L.CDT_CUBA),
  ...each(['America/Halifax', 'America/Moncton', 'Atlantic/Bermuda'], seasonal('Atlantic Time', L.AST, L.ADT)),
  ...each(
    ['America/Puerto_Rico', 'America/Santo_Domingo', 'America/Barbados', 'America/Port_of_Spain', 'America/Martinique'],
    fixed('Atlantic Standard Time (Caribbean)', L.AST),
  ),
  'America/St_Johns': seasonal('Newfoundland Time', L.NST, L.NDT),
  'America/Mexico_City': {
    generic: 'Central Standard Time (Mexico)',
    eras: [
      { until: MEXICO_DST_END, standard: L.CST, daylight: L.CDT },
      { from: MEXICO_DST_END, standard: L.CST },
    ],
  },
  ...each(['America/Monterrey', 'America/Merida', 'America/Bahia_Banderas'], {
    generic: 'Central Standard Time (Mexico)',
    eras: [
      { until: MEXICO_DST_END, standard: L.CST, daylight: L.CDT },
      { from: MEXICO_DST_END, standard: L.CST },
    ],
  }),
  'America/Chihuahua': {
    generic: 'Central Standard Time (Chihuahua)',
    eras: [
      // Chihuahua was on Mountain Time; it did not fall back in October 2022 and now keeps UTC-6 as Central Standard Time.
      { until: MEXICO_DST_END, standard: L.MST, daylight: L.MDT },
      { from: MEXICO_DST_END, standard: L.CST },
    ],
  },
  'America/Mazatlan': {
    generic: 'Mountain Standard Time (Sinaloa)',
    eras: [
      { until: MEXICO_DST_END, standard: L.MST, daylight: L.MDT },
      { from: MEXICO_DST_END, standard: L.MST },
    ],
  },
  'America/Cancun': {
    generic: 'Eastern Standard Time (Quintana Roo)',
    eras: [
      // Quintana Roo moved from Central Time to permanent UTC-5 on 2015-02-01.
      { until: '2015-02-01T08:00:00Z', standard: L.CST, daylight: L.CDT },
      { from: '2015-02-01T08:00:00Z', standard: L.EST },
    ],
  },
  ...each(['America/Whitehorse', 'America/Dawson'], {
    generic: 'Yukon Time',
    eras: [
      // Yukon sprang forward on 2020-03-08 and never fell back; UTC-7 became
      // its standard time on 2020-11-01 (tzdata).
      { until: '2020-11-01T07:00:00Z', standard: L.PST, daylight: L.PDT },
      { from: '2020-11-01T07:00:00Z', standard: label('MST', 'Yukon Time', -420) },
    ],
  }),

  // ---------------------------------------------------------------- South America
  'America/Bogota': fixed('Colombia Time', L.COT),
  'America/Lima': fixed('Peru Time', L.PET),
  'America/Guayaquil': fixed('Ecuador Time', L.ECT),
  'America/Caracas': fixed('Venezuela Time', L.VET),
  'America/La_Paz': fixed('Bolivia Time', L.BOT),
  'America/Manaus': fixed('Amazon Time', L.AMT),
  ...each(['America/Sao_Paulo', 'America/Bahia', 'America/Fortaleza', 'America/Recife', 'America/Belem', 'America/Maceio'], fixed('Brasília Time', L.BRT)),
  ...each(['America/Argentina/Buenos_Aires', 'America/Argentina/Cordoba'], fixed('Argentina Time', L.ART)),
  'America/Montevideo': fixed('Uruguay Time', L.UYT),
  'America/Asuncion': {
    generic: 'Paraguay Time',
    eras: [
      // Paraguay stayed on summer time permanently from October 2024.
      { until: '2024-10-15T00:00:00Z', standard: label('PYT', 'Paraguay Time', -240), daylight: label('PYST', 'Paraguay Summer Time', -180) },
      { from: '2024-10-15T00:00:00Z', standard: L.PYT },
    ],
  },
  'America/Santiago': seasonal('Chile Time', L.CLT, L.CLST),

  // ---------------------------------------------------------------- Europe
  UTC: fixed('Coordinated Universal Time', L.UTC),
  'Etc/GMT': fixed('Greenwich Mean Time', L.GMT),
  'Europe/London': seasonal('UK time', L.GMT, L.BST),
  // Conventional reading: GMT in winter, clocks forward to Irish Standard Time in summer.
  'Europe/Dublin': seasonal('Irish time', L.GMT, L.IST_IRELAND),
  ...each(['Europe/Lisbon', 'Atlantic/Madeira', 'Atlantic/Canary', 'Atlantic/Faroe'], seasonal('Western European Time', L.WET, L.WEST)),
  ...each(
    [
      'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome', 'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Zurich', 'Europe/Vienna',
      'Europe/Warsaw', 'Europe/Prague', 'Europe/Stockholm', 'Europe/Oslo', 'Europe/Copenhagen', 'Europe/Budapest', 'Europe/Belgrade',
      'Europe/Luxembourg', 'Europe/Malta', 'Europe/Zagreb', 'Europe/Ljubljana', 'Europe/Bratislava', 'Europe/Sarajevo', 'Europe/Skopje',
      'Europe/Tirane', 'Europe/Podgorica', 'Europe/Andorra', 'Europe/Gibraltar', 'Europe/Monaco', 'Europe/Busingen', 'Africa/Ceuta',
    ],
    seasonal('Central European Time', L.CET, L.CEST),
  ),
  ...each(['Africa/Algiers', 'Africa/Tunis'], fixed('Central European Time (North Africa)', L.CET)),
  ...each(
    [
      'Europe/Athens', 'Europe/Helsinki', 'Europe/Bucharest', 'Europe/Sofia', 'Europe/Kyiv', 'Europe/Riga', 'Europe/Tallinn', 'Europe/Vilnius',
      'Asia/Nicosia', 'Europe/Chisinau', 'Asia/Beirut', 'Africa/Cairo',
    ],
    seasonal('Eastern European Time', L.EET, L.EEST),
  ),
  ...each(['Africa/Tripoli', 'Europe/Kaliningrad'], fixed('Eastern European Time (no DST)', L.EET)),
  ...each(['Europe/Moscow', 'Europe/Minsk'], fixed('Moscow Time', L.MSK)),
  'Europe/Istanbul': {
    generic: 'Türkiye Time',
    eras: [
      // Türkiye kept summer time after 2016-03-27 and made UTC+3 permanent on 2016-09-07 (tzdata).
      { until: '2016-09-06T21:00:00Z', standard: L.EET, daylight: L.EEST },
      { from: '2016-09-06T21:00:00Z', standard: L.TRT },
    ],
  },

  // ---------------------------------------------------------------- Africa
  'Africa/Casablanca': {
    generic: 'Morocco time',
    eras: [
      // Before 2018-10-28 Morocco used UTC+0 as standard with summer time.
      { until: '2018-10-28T02:00:00Z', standard: label(undefined, undefined, 0), daylight: label(undefined, undefined, 60) },
      // Since then UTC+1 is standard, with clocks moved back to UTC+0 around Ramadan.
      { from: '2018-10-28T02:00:00Z', standard: label(undefined, undefined, 60), seasonalBackward: label(undefined, undefined, 0) },
    ],
  },
  ...each(
    [
      'Atlantic/Reykjavik', 'Africa/Accra', 'Africa/Abidjan', 'Africa/Dakar', 'Africa/Bamako', 'Africa/Conakry', 'Africa/Freetown',
      'Africa/Monrovia', 'Africa/Ouagadougou', 'Africa/Lome', 'Africa/Banjul', 'Africa/Bissau', 'Africa/Nouakchott',
    ],
    fixed('Greenwich Mean Time', L.GMT),
  ),
  ...each(
    [
      'Africa/Lagos', 'Africa/Luanda', 'Africa/Douala', 'Africa/Kinshasa', 'Africa/Porto-Novo', 'Africa/Libreville', 'Africa/Niamey',
      'Africa/Ndjamena', 'Africa/Brazzaville', 'Africa/Bangui', 'Africa/Malabo',
    ],
    fixed('West Africa Time', L.WAT),
  ),
  ...each(
    [
      'Africa/Lusaka', 'Africa/Harare', 'Africa/Maputo', 'Africa/Kigali', 'Africa/Gaborone', 'Africa/Blantyre', 'Africa/Lubumbashi',
      'Africa/Bujumbura', 'Africa/Windhoek', 'Africa/Juba', 'Africa/Khartoum',
    ],
    fixed('Central Africa Time', L.CAT),
  ),
  ...each(['Africa/Johannesburg', 'Africa/Maseru', 'Africa/Mbabane'], fixed('South Africa Standard Time', L.SAST)),
  ...each(
    ['Africa/Nairobi', 'Africa/Addis_Ababa', 'Africa/Dar_es_Salaam', 'Africa/Kampala', 'Africa/Mogadishu', 'Africa/Asmara', 'Africa/Djibouti'],
    fixed('East Africa Time', L.EAT),
  ),

  // ---------------------------------------------------------------- Middle East & Asia
  ...each(['Asia/Riyadh', 'Asia/Qatar', 'Asia/Kuwait', 'Asia/Bahrain', 'Asia/Baghdad', 'Asia/Aden'], fixed('Arabia Standard Time', L.AST_ARABIA)),
  'Asia/Amman': fixed('Jordan time', label(undefined, 'Jordan Time', 180)),
  'Asia/Tehran': fixed('Iran Standard Time', L.IRST),
  'Asia/Jerusalem': seasonal('Israel time', L.IST_ISRAEL, L.IDT),
  ...each(['Asia/Dubai', 'Asia/Muscat'], fixed('Gulf Standard Time', L.GST)),
  'Asia/Karachi': fixed('Pakistan Standard Time', L.PKT),
  'Asia/Kolkata': fixed('India Standard Time', L.IST_INDIA),
  'Asia/Colombo': fixed('Sri Lanka Standard Time', L.SLST),
  'Asia/Kathmandu': fixed('Nepal Time', L.NPT),
  'Asia/Dhaka': fixed('Bangladesh Standard Time', L.BST_BANGLADESH),
  'Asia/Yangon': fixed('Myanmar Time', L.MMT),
  ...each(['Asia/Bangkok', 'Asia/Ho_Chi_Minh', 'Asia/Phnom_Penh', 'Asia/Vientiane'], fixed('Indochina Time', L.ICT)),
  ...each(['Asia/Jakarta', 'Asia/Pontianak'], fixed('Western Indonesia Time', L.WIB)),
  'Asia/Makassar': fixed('Central Indonesia Time', L.WITA),
  'Asia/Jayapura': fixed('Eastern Indonesia Time', L.WIT),
  ...each(['Asia/Kuala_Lumpur', 'Asia/Kuching'], fixed('Malaysia Time', L.MYT)),
  'Asia/Singapore': fixed('Singapore Time', L.SGT),
  'Asia/Manila': fixed('Philippine Time', L.PHT),
  'Asia/Hong_Kong': fixed('Hong Kong Time', L.HKT),
  ...each(['Asia/Shanghai', 'Asia/Macau'], fixed('China Standard Time', L.CST_CHINA)),
  'Asia/Taipei': fixed('Taiwan Standard Time', L.CST_TAIWAN),
  ...each(['Asia/Seoul', 'Asia/Pyongyang'], fixed('Korea Standard Time', L.KST)),
  'Asia/Tokyo': fixed('Japan Standard Time', L.JST),

  // ---------------------------------------------------------------- Oceania
  'Australia/Perth': fixed('Australian Western Standard Time', L.AWST),
  ...each(['Australia/Adelaide', 'Australia/Broken_Hill'], seasonal('Australian Central Time', L.ACST, L.ACDT)),
  'Australia/Darwin': fixed('Australian Central Standard Time', L.ACST),
  ...each(['Australia/Sydney', 'Australia/Melbourne', 'Australia/Hobart'], seasonal('Australian Eastern Time', L.AEST, L.AEDT)),
  'Australia/Brisbane': fixed('Australian Eastern Standard Time', L.AEST),
  'Pacific/Auckland': seasonal('New Zealand Time', L.NZST, L.NZDT),
};

type ParsedEra = ZoneEra & { fromMs: number; untilMs: number };
const parsedCache = new Map<string, ParsedEra[] | null>();

function parsedEras(timeZone: string): ParsedEra[] | null {
  const zone = canonicalZone(timeZone);
  if (!parsedCache.has(zone)) {
    const meta = ZONE_METADATA[zone];
    parsedCache.set(
      zone,
      meta
        ? meta.eras.map((era) => ({
            ...era,
            fromMs: era.from ? Date.parse(era.from) : Number.NEGATIVE_INFINITY,
            untilMs: era.until ? Date.parse(era.until) : Number.POSITIVE_INFINITY,
          }))
        : null,
    );
  }
  return parsedCache.get(zone) ?? null;
}

export function getZoneMetadata(timeZone: string): ZoneMetadata | undefined {
  return ZONE_METADATA[canonicalZone(timeZone)];
}

/** The metadata era in force at an instant, or undefined when the zone has no metadata. */
export function getZoneEra(timeZone: string, instantMs: number): ZoneEra | undefined {
  return parsedEras(timeZone)?.find((era) => instantMs >= era.fromMs && instantMs < era.untilMs);
}

/** DST-agnostic name ("Central Time"), or null when the zone has no metadata. */
export function getZoneGenericName(timeZone: string): string | null {
  return getZoneMetadata(timeZone)?.generic ?? null;
}
