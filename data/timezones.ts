import type { RegionUsage, TimeZoneEntry } from '@/types/data';
import { WORLD_TIMEZONES } from './timezones-world';

/**
 * Time zone abbreviation pages.
 *
 * Abbreviations are ambiguous and are NOT IANA zones. Each entry records the
 * offset the abbreviation denotes, the IANA zone that best answers
 * "what time is it in X" searches (`referenceZone`), and which places switch
 * seasonally vs. stay on the offset all year. Every region lists the IANA
 * zones behind its wording; lib/data/data-integrity.test.ts verifies each one
 * against the tz database. Pages must show the reference zone's real current
 * abbreviation (e.g. CDT in July on /timezones/cst/).
 *
 * Geography facts reflect tzdata 2026a: Mexico ended DST nationally on
 * 2022-10-30 except areas along the US border; Chihuahua state (outside the
 * border strip) moved to CST in 2022; Yukon has kept UTC-7 all year since
 * 2020; most of Saskatchewan has not changed clocks for decades.
 */

const US_EASTERN: RegionUsage[] = [
  { label: 'New York, Washington, D.C., Atlanta, Miami and most of the eastern United States', zones: ['America/New_York'] },
  { label: 'Most of Ontario and Quebec, Canada (Toronto, Ottawa, Montreal)', zones: ['America/Toronto'] },
];

const US_CENTRAL: RegionUsage[] = [
  { label: 'Chicago, Houston, Dallas, New Orleans and most of the central United States', zones: ['America/Chicago'] },
  { label: 'Manitoba, Canada (Winnipeg)', zones: ['America/Winnipeg'] },
  {
    label: 'Mexican border areas in Coahuila, Nuevo León and Tamaulipas (such as Piedras Negras, Nuevo Laredo and Matamoros), and Ojinaga, Chihuahua',
    note: 'These border areas follow US daylight saving dates, unlike the rest of Mexico.',
    zones: ['America/Matamoros', 'America/Ojinaga'],
  },
];

const US_MOUNTAIN: RegionUsage[] = [
  { label: 'Denver, Salt Lake City, Albuquerque, Boise and most of the Mountain West, United States', zones: ['America/Denver', 'America/Boise'] },
  {
    label: 'Alberta, the Northwest Territories and southeastern British Columbia, Canada (Calgary, Edmonton, Yellowknife)',
    note: 'Lloydminster, which straddles the Alberta–Saskatchewan border, also follows this time.',
    zones: ['America/Edmonton'],
  },
  { label: 'Ciudad Juárez, Chihuahua, Mexico', note: 'Follows US daylight saving dates.', zones: ['America/Ciudad_Juarez'] },
];

const US_PACIFIC: RegionUsage[] = [
  { label: 'California, Washington, most of Oregon and most of Nevada, United States', zones: ['America/Los_Angeles'] },
  { label: 'Most of British Columbia, Canada (Vancouver, Victoria)', zones: ['America/Vancouver'] },
  { label: 'Baja California, Mexico (Tijuana, Mexicali)', note: 'Follows US daylight saving dates.', zones: ['America/Tijuana'] },
];

const CORE_TIMEZONES: TimeZoneEntry[] = [
  {
    slug: 'utc',
    abbreviation: 'UTC',
    name: 'Coordinated Universal Time',
    kind: 'universal',
    offsetMinutes: 0,
    referenceZone: 'UTC',
    referenceLabel: 'Coordinated Universal Time',
    region: 'Global',
    summary:
      'Coordinated Universal Time (UTC) is the primary time standard used to regulate clocks worldwide and the reference for aviation, weather forecasting, computing and science. It never changes for daylight saving time, and every time zone is defined as an offset from it — for example, India Standard Time is UTC+5:30.',
    seasonalRegions: [],
    yearRoundRegions: [
      {
        label: 'Countries that keep Greenwich Mean Time all year, such as Iceland, Ghana and Senegal',
        zones: ['Atlantic/Reykjavik', 'Africa/Accra', 'Africa/Dakar'],
      },
    ],
    related: ['gmt', 'est', 'cst', 'pst', 'ist'],
    priority: 1,
    indexable: true,
  },
  {
    slug: 'gmt',
    abbreviation: 'GMT',
    name: 'Greenwich Mean Time',
    kind: 'universal',
    offsetMinutes: 0,
    referenceZone: 'UTC',
    referenceLabel: 'Greenwich Mean Time (UTC+0)',
    region: 'Europe & Africa',
    summary:
      'Greenwich Mean Time (GMT) is the time at UTC+0. GMT and UTC show the same clock time; UTC is the scientific standard, while GMT is a time zone name. The United Kingdom and Ireland use GMT only in winter: in summer the UK switches to British Summer Time (BST, UTC+1) and Ireland to Irish Standard Time (IST, UTC+1).',
    seasonalRegions: [
      { label: 'United Kingdom — GMT in winter, British Summer Time (UTC+1) in summer', zones: ['Europe/London'] },
      { label: 'Ireland — GMT in winter, Irish Standard Time (UTC+1) in summer', zones: ['Europe/Dublin'] },
    ],
    yearRoundRegions: [
      { label: 'Iceland', zones: ['Atlantic/Reykjavik'] },
      { label: 'Ghana, Senegal, Côte d’Ivoire and several other West African countries', zones: ['Africa/Accra', 'Africa/Dakar', 'Africa/Abidjan'] },
    ],
    related: ['utc', 'ist', 'est', 'cst', 'pst'],
    priority: 2,
    indexable: true,
  },
  {
    slug: 'est',
    abbreviation: 'EST',
    name: 'Eastern Standard Time',
    kind: 'standard',
    offsetMinutes: -300,
    referenceZone: 'America/New_York',
    referenceLabel: 'Eastern Time (US & Canada)',
    counterpart: 'edt',
    region: 'North America',
    summary:
      'Eastern Standard Time (EST) is UTC-5. Most places on Eastern Time use EST only in winter; from the second Sunday in March to the first Sunday in November they observe Eastern Daylight Time (EDT, UTC-4). People often write “EST” all year when they mean Eastern Time, so check which one is in effect.',
    seasonalRegions: US_EASTERN,
    yearRoundRegions: [
      { label: 'Panama', zones: ['America/Panama'] },
      { label: 'Jamaica', zones: ['America/Jamaica'] },
      { label: 'Quintana Roo, Mexico (Cancún, Playa del Carmen)', zones: ['America/Cancun'] },
    ],
    alsoMeans: [{ name: 'Australian Eastern Standard Time (usually written AEST)', offsetMinutes: 600 }],
    related: ['cst', 'pst', 'mst', 'ist', 'gmt', 'utc'],
    priority: 1,
    indexable: true,
  },
  {
    slug: 'edt',
    abbreviation: 'EDT',
    name: 'Eastern Daylight Time',
    kind: 'daylight',
    offsetMinutes: -240,
    referenceZone: 'America/New_York',
    referenceLabel: 'Eastern Time (US & Canada)',
    counterpart: 'est',
    region: 'North America',
    summary:
      'Eastern Daylight Time (EDT) is UTC-4. It is the daylight saving time used on Eastern Time from the second Sunday in March to the first Sunday in November. The rest of the year the same places use Eastern Standard Time (EST, UTC-5).',
    seasonalRegions: US_EASTERN,
    yearRoundRegions: [],
    related: ['est', 'cdt', 'pdt', 'ist', 'utc'],
    priority: 3,
    indexable: true,
  },
  {
    slug: 'cst',
    abbreviation: 'CST',
    name: 'Central Standard Time',
    kind: 'standard',
    offsetMinutes: -360,
    referenceZone: 'America/Chicago',
    referenceLabel: 'Central Time (US & Canada)',
    counterpart: 'cdt',
    region: 'North America',
    summary:
      'Central Standard Time (CST) is UTC-6. Most of the central United States and Manitoba use CST only in winter and switch to Central Daylight Time (CDT, UTC-5) from the second Sunday in March to the first Sunday in November. Most of Saskatchewan, most of Mexico and much of Central America stay on CST all year.',
    seasonalRegions: US_CENTRAL,
    yearRoundRegions: [
      {
        label: 'Most of Saskatchewan, Canada (Regina, Saskatoon)',
        note: 'Exceptions: Lloydminster follows Alberta’s Mountain Time with daylight saving time, and a few communities near the Manitoba border, such as Creighton, also change their clocks.',
        zones: ['America/Regina', 'America/Swift_Current'],
      },
      {
        label: 'Most of Mexico, including Mexico City, Guadalajara, Monterrey, Mérida and most of Chihuahua state',
        note: 'Mexico ended daylight saving time in October 2022. Areas along the US border kept it, and Quintana Roo, Sonora, Baja California and the Pacific states use other offsets.',
        zones: ['America/Mexico_City', 'America/Monterrey', 'America/Merida', 'America/Chihuahua', 'America/Bahia_Banderas'],
      },
      {
        label: 'Guatemala, Belize, Honduras, El Salvador, Nicaragua and Costa Rica',
        zones: ['America/Guatemala', 'America/Belize', 'America/Tegucigalpa', 'America/El_Salvador', 'America/Managua', 'America/Costa_Rica'],
      },
    ],
    alsoMeans: [
      { name: 'China Standard Time', offsetMinutes: 480 },
      { name: 'Cuba Standard Time', offsetMinutes: -300 },
    ],
    related: ['est', 'pst', 'mst', 'ist', 'gmt', 'utc'],
    priority: 1,
    indexable: true,
  },
  {
    slug: 'cdt',
    abbreviation: 'CDT',
    name: 'Central Daylight Time',
    kind: 'daylight',
    offsetMinutes: -300,
    referenceZone: 'America/Chicago',
    referenceLabel: 'Central Time (US & Canada)',
    counterpart: 'cst',
    region: 'North America',
    summary:
      'Central Daylight Time (CDT) is UTC-5. It is the daylight saving time used on Central Time from the second Sunday in March to the first Sunday in November. Most of Saskatchewan and most of Mexico do not use CDT and stay on CST (UTC-6) all year.',
    seasonalRegions: US_CENTRAL,
    yearRoundRegions: [],
    alsoMeans: [{ name: 'Cuba Daylight Time', offsetMinutes: -240 }],
    related: ['cst', 'edt', 'pdt', 'ist', 'utc'],
    priority: 3,
    indexable: true,
  },
  {
    slug: 'mst',
    abbreviation: 'MST',
    name: 'Mountain Standard Time',
    kind: 'standard',
    offsetMinutes: -420,
    referenceZone: 'America/Denver',
    referenceLabel: 'Mountain Time (US & Canada)',
    counterpart: 'mdt',
    region: 'North America',
    summary:
      'Mountain Standard Time (MST) is UTC-7. Denver, Salt Lake City, Alberta and most of the Mountain region use MST in winter and Mountain Daylight Time (MDT, UTC-6) in summer. Arizona (except the Navajo Nation), Sonora, several other Mexican states, Yukon and parts of British Columbia use UTC-7 all year, so in summer they match Pacific Daylight Time.',
    seasonalRegions: US_MOUNTAIN,
    yearRoundRegions: [
      { label: 'Arizona, United States, except the Navajo Nation', zones: ['America/Phoenix'] },
      { label: 'Sonora, Mexico', zones: ['America/Hermosillo'] },
      {
        label: 'Sinaloa, Baja California Sur and most of Nayarit, Mexico',
        note: 'These states stopped changing clocks when Mexico ended daylight saving time in 2022.',
        zones: ['America/Mazatlan'],
      },
      {
        label: 'Yukon, Canada (Whitehorse, Dawson City)',
        note: 'Yukon was on Pacific Time until 2020. It stopped changing clocks that year and now stays on UTC-7, often shown as “Yukon Time”.',
        zones: ['America/Whitehorse', 'America/Dawson'],
      },
      {
        label: 'Northeastern British Columbia (Dawson Creek, Fort St. John, Fort Nelson) and Creston, Canada',
        zones: ['America/Dawson_Creek', 'America/Fort_Nelson', 'America/Creston'],
      },
    ],
    related: ['pst', 'cst', 'est', 'ist', 'utc'],
    priority: 2,
    indexable: true,
  },
  {
    slug: 'mdt',
    abbreviation: 'MDT',
    name: 'Mountain Daylight Time',
    kind: 'daylight',
    offsetMinutes: -360,
    referenceZone: 'America/Denver',
    referenceLabel: 'Mountain Time (US & Canada)',
    counterpart: 'mst',
    region: 'North America',
    summary:
      'Mountain Daylight Time (MDT) is UTC-6. It is used on Mountain Time from the second Sunday in March to the first Sunday in November. Arizona (except the Navajo Nation), Yukon, Sonora and several other Mexican states do not use MDT and stay on UTC-7 all year.',
    seasonalRegions: US_MOUNTAIN,
    yearRoundRegions: [],
    related: ['mst', 'pdt', 'cdt', 'edt', 'utc'],
    priority: 3,
    indexable: true,
  },
  {
    slug: 'pst',
    abbreviation: 'PST',
    name: 'Pacific Standard Time',
    kind: 'standard',
    offsetMinutes: -480,
    referenceZone: 'America/Los_Angeles',
    referenceLabel: 'Pacific Time (US & Canada)',
    counterpart: 'pdt',
    region: 'North America',
    summary:
      'Pacific Standard Time (PST) is UTC-8. California, Washington, most of Oregon and Nevada, most of British Columbia and Baja California use PST in winter and Pacific Daylight Time (PDT, UTC-7) from the second Sunday in March to the first Sunday in November. Yukon left Pacific Time in 2020 and now stays on UTC-7 all year.',
    seasonalRegions: US_PACIFIC,
    yearRoundRegions: [],
    alsoMeans: [{ name: 'Philippine Standard Time', offsetMinutes: 480 }],
    related: ['est', 'cst', 'mst', 'ist', 'gmt', 'utc'],
    priority: 1,
    indexable: true,
  },
  {
    slug: 'pdt',
    abbreviation: 'PDT',
    name: 'Pacific Daylight Time',
    kind: 'daylight',
    offsetMinutes: -420,
    referenceZone: 'America/Los_Angeles',
    referenceLabel: 'Pacific Time (US & Canada)',
    counterpart: 'pst',
    region: 'North America',
    summary:
      'Pacific Daylight Time (PDT) is UTC-7. It is used on Pacific Time from the second Sunday in March to the first Sunday in November; the rest of the year the same places use Pacific Standard Time (PST, UTC-8).',
    seasonalRegions: US_PACIFIC,
    yearRoundRegions: [],
    related: ['pst', 'edt', 'cdt', 'ist', 'utc'],
    priority: 3,
    indexable: true,
  },
  {
    slug: 'ist',
    abbreviation: 'IST',
    name: 'India Standard Time',
    kind: 'standard',
    offsetMinutes: 330,
    referenceZone: 'Asia/Kolkata',
    referenceLabel: 'India Standard Time',
    region: 'Asia',
    summary:
      'India Standard Time (IST) is UTC+5:30 and is used across all of India as a single time zone. India does not observe daylight saving time, so IST never changes — but its difference from places that do (like US Eastern Time) changes twice a year.',
    seasonalRegions: [],
    yearRoundRegions: [
      { label: 'All of India', zones: ['Asia/Kolkata'] },
      { label: 'Sri Lanka also uses UTC+5:30 (Sri Lanka Standard Time)', zones: ['Asia/Colombo'] },
    ],
    alsoMeans: [
      { name: 'Irish Standard Time (summer time in Ireland)', offsetMinutes: 60 },
      { name: 'Israel Standard Time', offsetMinutes: 120 },
    ],
    related: ['est', 'pst', 'cst', 'gmt', 'utc'],
    priority: 1,
    indexable: true,
  },
];

/** Sprint 1 core entries first, then the Sprint 2 world entries. */
export const TIMEZONES: TimeZoneEntry[] = [...CORE_TIMEZONES, ...WORLD_TIMEZONES];

/** Homepage "Popular Time Zones", in display order. */
export const POPULAR_TIMEZONE_SLUGS = ['utc', 'est', 'cst', 'pst', 'ist', 'gmt'];
