#!/usr/bin/env node
/**
 * Generates the city, country and zone-name datasets from GeoNames.
 *
 *   node scripts/generate-geo-data.mjs          # writes the generated files
 *   node scripts/generate-geo-data.mjs --check  # exits 1 if they are stale
 *
 * Inputs (git-ignored, CC BY 4.0 — https://www.geonames.org/):
 *   data/sources/geonames/cities15000.txt
 *   data/sources/geonames/countryInfo.txt
 *   data/sources/geonames/admin1CodesASCII.txt
 *   data/sources/geonames/timeZones.txt
 *
 * Outputs (committed, never hand-edited):
 *   data/cities.generated.ts
 *   data/countries.generated.ts
 *   lib/time/zone-names.generated.ts
 *
 * Selection rules are deliberate and documented in DATA_MODEL.md:
 *   1. Only populated places (PPLC, PPLG, PPLA, PPLA2, PPLA3, PPL) — no city
 *      districts (PPLX), so New York's boroughs never become pages.
 *   2. Per-country quotas ranked by population; the capital of every quota
 *      country is always included as well (so Sri Lanka gets Colombo *and*
 *      Sri Jayewardenepura Kotte, Bolivia gets La Paz *and* Sucre).
 *   3. Satellite suppression: a place is skipped when an already-selected
 *      place in the same country is ≥2.5× more populous within 15 km, or
 *      ≥5× within 30 km (Jersey City vs New York, Noida vs Delhi).
 *   4. Slugs come from the display name with diacritics stripped (Zürich →
 *      zurich, Łódź → lodz); on collision the most populous place keeps the
 *      plain slug and the others get a state (US/CA/AU) or country suffix:
 *      san-jose (California) vs san-jose-costa-rica, london vs london-ontario.
 *   5. Time-zone ids are validated with Intl; deprecated aliases are mapped
 *      to their canonical ids.
 *
 * Time facts (offsets, DST) are never taken from GeoNames — only ids,
 * names, coordinates and populations.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(ROOT, 'data/sources/geonames');
const CHECK = process.argv.includes('--check');

const OUTPUTS = {
  cities: resolve(ROOT, 'data/cities.generated.ts'),
  countries: resolve(ROOT, 'data/countries.generated.ts'),
  zoneNames: resolve(ROOT, 'lib/time/zone-names.generated.ts'),
};

/* ------------------------------------------------------------------ rules */

/** Cities per country. Ranked capital-first, then by population. */
const QUOTAS = {
  US: 100, IN: 35, GB: 28, CA: 22, AU: 14,
  DE: 14, FR: 10, IT: 9, ES: 9, NL: 6, BE: 3, CH: 4, AT: 2, PL: 7, SE: 3, NO: 2, DK: 1, FI: 1, IE: 2, PT: 3, GR: 2, CZ: 1, HU: 1, RO: 2, UA: 3, TR: 4, RU: 6,
  AE: 3, SA: 4, QA: 1, KW: 1, BH: 1, OM: 1, IL: 3, JO: 1, LB: 1, IR: 3, IQ: 2, EG: 3,
  JP: 10, SG: 1, CN: 10, HK: 1, TW: 2, KR: 4, PH: 4, ID: 5, MY: 3, TH: 2, VN: 3, PK: 5, BD: 2, LK: 1, NP: 1,
  MX: 8, BR: 8, AR: 3, CL: 2, CO: 3, PE: 2, VE: 2,
  NG: 3, ZA: 4, KE: 2, ET: 1, GH: 1, MA: 3, DZ: 1, TN: 1, TZ: 1, UG: 1, CD: 1, SN: 1, CI: 1,
  NZ: 3, IS: 1, KZ: 1, UZ: 1, GE: 1, AZ: 1, AM: 1, CU: 1, DO: 1, JM: 1, PA: 1, CR: 1, GT: 1, EC: 1, UY: 1, PY: 1, BO: 1, PR: 1, TT: 1, BS: 1, FJ: 1, PG: 1,
};

// PPLG = seat of government (La Paz, Cotonou).
const FEATURE_CODES = new Set(['PPLC', 'PPLG', 'PPLA', 'PPLA2', 'PPLA3', 'PPL']);
const MIN_POPULATION = 50_000;

/** Places always included regardless of quota (GeoNames ids). */
const MUST_INCLUDE = new Set([
  6119109, // Regina
  6141256, // Saskatoon
  6324729, // Halifax
  6324733, // St. John's
  6325494, // Québec City
  6183235, // Winnipeg
  5856195, // Honolulu
  5879400, // Anchorage
  5391811, // San Diego (reference page)
  3981609, // Tijuana
  5308655, // Phoenix
  5419384, // Denver
  4335045, // New Orleans
  2172517, // Canberra
  2660646, // Geneva
  3369157, // Cape Town
  2179537, // Wellington
  2193733, // Auckland
  2618425, // Copenhagen
  3413829, // Reykjavík
  5809844, // Seattle
  4930956, // Boston
  4990729, // Detroit
  4684888, // Dallas
  4699066, // Houston
  4887398, // Chicago
  4671654, // Austin
  4160021, // Jacksonville
  5391959, // San Francisco
  4164138, // Miami
  4180439, // Atlanta
  5746545, // Portland, OR
  5780993, // Salt Lake City
  5506956, // Las Vegas
  6167865, // Toronto
  6077243, // Montreal
  6173331, // Vancouver
  5913490, // Calgary
  5946768, // Edmonton
  6094817, // Ottawa
  6058560, // London, Ontario (collision example)
  2643743, // London
  2655603, // Birmingham UB
  2643123, // Manchester
  3128760, // Barcelona
  2964574, // Dublin
  1273294, // Delhi (renamed New Delhi below)
  1275339, // Mumbai
  1277333, // Bengaluru
  1264527, // Chennai
  1275004, // Kolkata
  1269843, // Hyderabad
  1253102, // Visakhapatnam
  1254163, // Thiruvananthapuram
  1273874, // Kochi
  1274746, // Chandigarh
  1271476, // Guwahati
  1262321, // Mysuru
  1275817, // Bhubaneswar
  1278710, // Amritsar
  1253405, // Varanasi
  1258526, // Ranchi
  3995465, // Monterrey
  3531673, // Cancún
  3523349, // Mérida
  1174872, // Karachi
  1172451, // Lahore
  1176615, // Islamabad
  1185241, // Dhaka
  1850147, // Tokyo
  1853909, // Osaka
  1856057, // Nagoya
  1863967, // Fukuoka
  2147714, // Sydney
  2158177, // Melbourne
  2174003, // Brisbane
  2063523, // Perth
  2078025, // Adelaide
  2073124, // Darwin
  2163355, // Hobart
  292223, // Dubai
  292968, // Abu Dhabi
  1880252, // Singapore
  1819729, // Hong Kong
  1835848, // Seoul
  1816670, // Beijing
  1796236, // Shanghai
  1701668, // Manila
  1642911, // Jakarta
  1735161, // Kuala Lumpur
  1609350, // Bangkok
  1566083, // Ho Chi Minh City
  1581130, // Hanoi
  3448439, // São Paulo
  3451190, // Rio de Janeiro
  3435910, // Buenos Aires
  3871336, // Santiago
  3688689, // Bogotá
  3936456, // Lima
  3530597, // Mexico City
  3703443, // Panama City
  360630, // Cairo
  2332459, // Lagos
  993800, // Johannesburg
  184745, // Nairobi
  2553604, // Casablanca
  2538475, // Rabat
  2253354, // Dakar
  2293538, // Abidjan
  2306104, // Accra
  524901, // Moscow
  498817, // Saint Petersburg
  745044, // Istanbul
  323786, // Ankara
  703448, // Kyiv
  756135, // Warsaw
  3067696, // Prague
  2761369, // Vienna
  3054643, // Budapest
  2643743, // London
  2988507, // Paris
  2950159, // Berlin
  2867714, // Munich
  2925533, // Frankfurt am Main
  2911298, // Hamburg
  3173435, // Milan
  3169070, // Rome
  3117735, // Madrid
  2759794, // Amsterdam
  2800866, // Brussels
  2657896, // Zürich
  2673730, // Stockholm
  3143244, // Oslo
  658225, // Helsinki
  2267057, // Lisbon
  264371, // Athens
  281184, // Jerusalem
  293397, // Tel Aviv
  112931, // Tehran
  108410, // Riyadh
  105343, // Jeddah
  290030, // Doha
  285787, // Kuwait City
  290340, // Manama
  287286, // Muscat
  250441, // Amman
  276781, // Beirut
  98182, // Baghdad
  2179537, // Wellington
  3369157, // Cape Town
  3413829, // Reykjavík
]);

/** Places excluded even if they rank (districts, duplicates of curated entries). */
const EXCLUDE = new Set([
  5110302, // Brooklyn
  5133273, // Queens
  5125771, // Manhattan
  5110266, // The Bronx
  5139568, // Staten Island
  1261481, // New Delhi (PPLC, 317k) — replaced by Delhi renamed "New Delhi"
  4300488, // Meads, KY (census place with an inflated population)
  4297999, // Lexington-Fayette (duplicate of Lexington, KY)
  1258393, // Rasapūdipalem (data error)
  12165956, // Kallakurichi (district population recorded as a town)
  1259652, // Pimpri (duplicate of Pimpri-Chinchwad)
  1253133, // Virār (Mumbai suburb)
  1261162, // Nowrangapur (district population recorded as a town)
  8310663, // Central Coast, NSW (region, not a city)
  10630449, // Sunshine Coast, QLD (region, not a city)
]);

/**
 * Curated overrides keyed by GeoNames id. `population` overrides ranking only;
 * `aliases` feed search; `priority` fixes homepage/ordering for seed cities.
 */
const OVERRIDES = {
  5128581: { name: 'New York', slug: 'new-york', aliases: ['NYC', 'New York City', 'Manhattan'], priority: 1 },
  5368361: { aliases: ['LA'], priority: 1 },
  4887398: { priority: 1 },
  4699066: { priority: 2 },
  4684888: { priority: 2 },
  5308655: { priority: 2 },
  5391811: { priority: 2 },
  5391959: { aliases: ['SF'], priority: 2 },
  5419384: { priority: 2 },
  4335045: { priority: 3 },
  4140963: { name: 'Washington, D.C.', slug: 'washington-dc', aliases: ['Washington DC', 'DC', 'District of Columbia'], state: 'District of Columbia' },
  6167865: { priority: 1 },
  6077243: { name: 'Montreal', aliases: ['Montréal'] },
  6325494: { name: 'Quebec City', slug: 'quebec-city', aliases: ['Québec'] },
  6324733: { name: "St. John's", slug: 'st-johns' },
  3991164: { name: 'Querétaro', aliases: ['Santiago de Querétaro'] },
  3998655: { name: 'León', aliases: ['León de los Aldama'] },
  1262321: { aliases: ['Mysore'] },
  1253102: { aliases: ['Vizag'] },
  1254163: { aliases: ['Trivandrum'] },
  1273874: { aliases: ['Cochin'] },
  6183235: { priority: 3 },
  6119109: { priority: 3 },
  3530597: { aliases: ['CDMX', 'Ciudad de México'], priority: 1 },
  3981609: { priority: 3 },
  2643743: { priority: 1 },
  2988507: { priority: 1 },
  2950159: { priority: 2 },
  292223: { aliases: ['UAE'], priority: 1 },
  1273294: { name: 'New Delhi', slug: 'new-delhi', aliases: ['Delhi'], priority: 1, capital: true },
  1275339: { aliases: ['Bombay'], priority: 1 },
  1277333: { aliases: ['Bangalore'], priority: 2 },
  1264527: { aliases: ['Madras'] },
  1275004: { aliases: ['Calcutta'] },
  1880252: { priority: 1 },
  1850147: { priority: 1 },
  2147714: { priority: 1 },
  2886242: { name: 'Cologne', aliases: ['Köln'] },
  2657896: { name: 'Zurich', aliases: ['Zürich'] },
  2510911: { name: 'Seville', aliases: ['Sevilla'] },
  2910831: { name: 'Hanover', aliases: ['Hannover'] },
  2925533: { name: 'Frankfurt', aliases: ['Frankfurt am Main'] },
  1566083: { aliases: ['Saigon'] },
  703448: { aliases: ['Kiev'] },
  1701668: { priority: 2 },
  3448439: { priority: 1 },
  524901: { priority: 1 },
  1816670: { priority: 1 },
  1796236: { priority: 1 },
  1835848: { priority: 1 },
  1819729: { priority: 1 },
  360630: { priority: 1 },
  993800: { priority: 1 },
  2332459: { priority: 1 },
  745044: { priority: 1 },
  3117735: { priority: 1 },
  3169070: { priority: 1 },
  2759794: { priority: 1 },
  3435910: { priority: 1 },
  1642911: { priority: 1 },
  1609350: { priority: 1 },
  1174872: { priority: 1 },
  1185241: { priority: 1 },
  112931: { priority: 1 },
  108410: { priority: 1 },
};

/**
 * Countries whose place names GeoNames stores in a transliteration with
 * diacritics (Rājkot, Thessaloníki). The plain ASCII form is the usual English
 * spelling there, so it is used as the display name.
 */
const ASCII_NAME_COUNTRIES = new Set([
  'IN', 'PK', 'BD', 'LK', 'NP', 'CN', 'HK', 'TW', 'JP', 'KR', 'TH', 'VN', 'MM', 'KH', 'LA', 'MN',
  'IR', 'IQ', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'IL', 'SY', 'EG', 'MA', 'DZ', 'TN', 'LY', 'SD', 'AF',
  'RU', 'UA', 'BY', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'KG', 'TJ', 'TM', 'ET', 'GR', 'BG', 'RS', 'MK',
]);

/** Country names that take "the" in running text. */
const DEFINITE_ARTICLE = new Set(['US', 'GB', 'AE', 'NL', 'PH', 'BS', 'GM', 'DO', 'CD', 'CG', 'CF', 'MV', 'MH', 'SB', 'KM', 'VG', 'VI', 'KY', 'TC', 'FK', 'IM']);
/** Countries whose overseas regions use other offsets (main territory has one zone). */
const OVERSEAS_TIME_ZONES = new Set(['FR', 'NL']);
const COUNTRY_OVERRIDES = {
  NL: { name: 'Netherlands', slug: 'netherlands' },
  // China officially uses a single time zone; tzdata's Asia/Urumqi records the unofficial Xinjiang time.
  CN: { zones: ['Asia/Shanghai'] },
  // tzdata links northern Vietnam to Asia/Bangkok (identical since 1970); show the country's own zone.
  VN: { zoneRemap: { 'Asia/Bangkok': 'Asia/Ho_Chi_Minh' } },
  CI: { name: 'Côte d’Ivoire', slug: 'cote-divoire' },
  TR: { name: 'Turkey', slug: 'turkey' },
  CZ: { name: 'Czechia', slug: 'czechia' },
};

/** Legacy ids that browsers or datasets may report, mapped to canonical ids (mirrors lib/time/aliases.ts). */
const ZONE_ALIASES = {
  'Asia/Calcutta': 'Asia/Kolkata',
  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Asia/Katmandu': 'Asia/Kathmandu',
  'Asia/Rangoon': 'Asia/Yangon',
  'Europe/Kiev': 'Europe/Kyiv',
  'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
  'America/Godthab': 'America/Nuuk',
  'Atlantic/Faeroe': 'Atlantic/Faroe',
};

/* ---------------------------------------------------------------- helpers */

function readTsv(file) {
  const path = resolve(SRC, file);
  if (!existsSync(path)) throw new Error(`Missing ${path}. Download it from https://download.geonames.org/export/dump/`);
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split('\t'));
}

/** Letters NFD can't decompose to ASCII. */
const TRANSLITERATE = { Ł: 'L', ł: 'l', Ø: 'O', ø: 'o', Đ: 'D', đ: 'd', ß: 'ss', Æ: 'AE', æ: 'ae', Œ: 'OE', œ: 'oe', Þ: 'Th', þ: 'th', İ: 'I', ı: 'i', ð: 'd', Ð: 'D' };

const slugify = (text) =>
  text
    .replace(/[ŁłØøĐđßÆæŒœÞþİıðÐ]/g, (ch) => TRANSLITERATE[ch])
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function isValidZone(id) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: id });
    return id.includes('/');
  } catch {
    return false;
  }
}

function distanceKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function longName(zone, instant) {
  const text = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'long' }).format(instant);
  const name = text.slice(text.indexOf(', ') + 2);
  return /^GMT[+-]/.test(name) ? null : name;
}

function offsetAt(zone, instant) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
      .formatToParts(instant)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, Number(p.value)]),
  );
  return Math.round((Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour % 24, parts.minute) - instant) / 60000);
}

const q = (s) => JSON.stringify(s);

/* ------------------------------------------------------------------- read */

const admin1 = new Map(readTsv('admin1CodesASCII.txt').map(([code, name]) => [code, name]));

const countryInfo = new Map(
  readTsv('countryInfo.txt').map((c) => [
    c[0],
    { code: c[0], name: c[4], capital: c[5], population: Number(c[7]) || 0, continent: c[8], neighbours: (c[17] || '').split(',').filter(Boolean) },
  ]),
);

const countryZones = new Map();
for (const [code, id] of readTsv('timeZones.txt')) {
  if (code === 'CountryCode') continue; // header row
  const zone = ZONE_ALIASES[id] ?? id;
  if (!isValidZone(zone)) {
    console.warn(`skipping unsupported zone ${id} (${code})`);
    continue;
  }
  if (!countryZones.has(code)) countryZones.set(code, []);
  countryZones.get(code).push(zone);
}

const remapZone = (cc, zone) => COUNTRY_OVERRIDES[cc]?.zoneRemap?.[zone] ?? zone;

const places = readTsv('cities15000.txt').map((p) => ({
  id: Number(p[0]),
  name: p[1],
  ascii: p[2],
  lat: Number(p[4]),
  lon: Number(p[5]),
  fcode: p[7],
  cc: p[8],
  admin1: admin1.get(`${p[8]}.${p[10]}`) ?? '',
  population: Number(p[14]) || 0,
  zone: remapZone(p[8], ZONE_ALIASES[p[17]] ?? p[17]),
}));

/* ----------------------------------------------------------------- select */

const byCountry = new Map();
for (const place of places) {
  if (EXCLUDE.has(place.id)) continue;
  const must = MUST_INCLUDE.has(place.id);
  if (!must && !FEATURE_CODES.has(place.fcode)) continue;
  if (!must && place.population < MIN_POPULATION && place.fcode !== 'PPLC') continue;
  if (!isValidZone(place.zone)) {
    console.warn(`skipping ${place.name}: unsupported zone ${place.zone}`);
    continue;
  }
  if (!byCountry.has(place.cc)) byCountry.set(place.cc, []);
  byCountry.get(place.cc).push(place);
}

const rankPop = (p) => OVERRIDES[p.id]?.population ?? p.population;
const isCapital = (p) => p.fcode === 'PPLC' || OVERRIDES[p.id]?.capital === true;

const selected = [];
for (const [cc, quota] of Object.entries(QUOTAS)) {
  const candidates = (byCountry.get(cc) ?? []).sort((a, b) => rankPop(b) - rankPop(a));
  const chosen = [];
  for (const place of candidates) {
    const must = MUST_INCLUDE.has(place.id) || isCapital(place);
    if (!must && chosen.length >= quota) continue;
    const satellite = chosen.some((other) => {
      const km = distanceKm(place, other);
      const ratio = rankPop(other) / Math.max(rankPop(place), 1);
      return (km <= 15 && ratio >= 2.5) || (km <= 30 && ratio >= 5);
    });
    if (satellite && !must) continue;
    chosen.push(place);
  }
  selected.push(...chosen);
}
for (const id of MUST_INCLUDE) {
  if (!selected.some((p) => p.id === id)) {
    const place = places.find((p) => p.id === id);
    if (!place) console.warn(`MUST_INCLUDE id ${id} not found in cities15000`);
    else if (!QUOTAS[place.cc]) console.warn(`MUST_INCLUDE ${place.name} (${place.cc}) has no country quota; skipped`);
  }
}

/* ------------------------------------------------------------------ slugs */

const STATE_SUFFIX_COUNTRIES = new Set(['US', 'CA', 'AU']);
const countryRecordFor = (cc) => {
  const info = countryInfo.get(cc);
  const override = COUNTRY_OVERRIDES[cc] ?? {};
  const name = override.name ?? info.name;
  return { ...info, name, slug: override.slug ?? slugify(name) };
};

// Collisions are settled by population: "san jose time" means California, not Costa Rica.
const rankKey = (p) => rankPop(p) * 10 + (isCapital(p) ? 1 : 0);
const groups = new Map();
for (const place of selected) {
  const override = OVERRIDES[place.id] ?? {};
  const displayName = override.name ?? (ASCII_NAME_COUNTRIES.has(place.cc) ? place.ascii : place.name);
  const base = override.slug ?? (slugify(displayName) || slugify(place.ascii));
  if (!groups.has(base)) groups.set(base, []);
  groups.get(base).push(place);
}
const slugs = new Map();
for (const [base, members] of groups) {
  members.sort((a, b) => rankKey(b) - rankKey(a));
  members.forEach((place, index) => {
    if (index === 0) {
      slugs.set(place.id, base);
      return;
    }
    const suffix = STATE_SUFFIX_COUNTRIES.has(place.cc) && place.admin1 ? slugify(place.admin1) : countryRecordFor(place.cc).slug;
    let slug = `${base}-${suffix}`;
    if ([...slugs.values()].includes(slug)) slug = `${slug}-${place.id}`;
    slugs.set(place.id, slug);
  });
}

/* ------------------------------------------------------------------ build */

const POPULAR = new Set(['new-york', 'london', 'dubai', 'singapore', 'tokyo', 'sydney']);

function priorityFor(place, slug) {
  const override = OVERRIDES[place.id]?.priority;
  if (override) return override;
  const pop = rankPop(place);
  if (POPULAR.has(slug) || pop >= 5_000_000 || (isCapital(place) && pop >= 1_000_000)) return 1;
  if (pop >= 1_000_000 || isCapital(place)) return 2;
  return 3;
}

const cities = selected
  .map((place) => {
    const override = OVERRIDES[place.id] ?? {};
    const country = countryRecordFor(place.cc);
    const name = override.name ?? (ASCII_NAME_COUNTRIES.has(place.cc) ? place.ascii : place.name);
    const state = override.state ?? (place.admin1 && place.admin1 !== name ? place.admin1 : undefined);
    const slug = slugs.get(place.id);
    return {
      slug,
      name,
      country: country.name,
      countryCode: place.cc,
      state,
      timezone: place.zone,
      latitude: Number(place.lat.toFixed(4)),
      longitude: Number(place.lon.toFixed(4)),
      population: place.population,
      priority: priorityFor(place, slug),
      indexable: true,
      aliases: override.aliases,
      geonameId: place.id,
    };
  })
  .sort((a, b) => a.priority - b.priority || b.population - a.population || a.slug.localeCompare(b.slug));

const countryCodes = [...new Set(cities.map((c) => c.countryCode))].sort();
const countries = countryCodes.map((cc) => {
  const record = countryRecordFor(cc);
  const own = cities.filter((c) => c.countryCode === cc);
  const capitalPlace = selected.find((p) => p.cc === cc && isCapital(p));
  const capital = capitalPlace ? cities.find((c) => c.geonameId === capitalPlace.id) : undefined;
  const zones = (COUNTRY_OVERRIDES[cc]?.zones ?? [...new Set([...(countryZones.get(cc) ?? []), ...own.map((c) => c.timezone)])]).sort();
  const sample = Date.UTC(2026, 0, 15, 12);
  const sampleJul = Date.UTC(2026, 6, 15, 12);
  const distinctBehaviours = new Set(zones.map((z) => `${offsetAt(z, sample)}/${offsetAt(z, sampleJul)}`));
  return {
    code: cc,
    slug: record.slug,
    name: record.name,
    definiteArticle: DEFINITE_ARTICLE.has(cc) || undefined,
    multipleTimeZones: distinctBehaviours.size > 1,
    overseasTimeZones: OVERSEAS_TIME_ZONES.has(cc) || undefined,
    published: true,
    indexable: true,
    continent: record.continent,
    population: record.population,
    capitalSlug: capital?.slug,
    primaryZone: capital?.timezone ?? own[0].timezone,
    zones,
    neighbours: record.neighbours.filter((n) => countryCodes.includes(n)),
  };
});

// Zone names from CLDR for every zone the datasets reference.
const allZones = [...new Set([...cities.map((c) => c.timezone), ...countries.flatMap((c) => c.zones)])].sort();
const zoneNames = allZones.map((zone) => {
  const jan = Date.UTC(2026, 0, 15, 12);
  const jul = Date.UTC(2026, 6, 15, 12);
  return [zone, offsetAt(zone, jan), longName(zone, jan), offsetAt(zone, jul), longName(zone, jul)];
});

/* ------------------------------------------------------------------ write */

const header = (what) => `// Generated by scripts/generate-geo-data.mjs from GeoNames (CC BY 4.0). Do not edit by hand.\n// ${what}\n`;

const cityLines = cities.map((c) => {
  const fields = [
    `slug: ${q(c.slug)}`,
    `name: ${q(c.name)}`,
    `country: ${q(c.country)}`,
    `countryCode: ${q(c.countryCode)}`,
    c.state ? `state: ${q(c.state)}` : null,
    `timezone: ${q(c.timezone)}`,
    `latitude: ${c.latitude}`,
    `longitude: ${c.longitude}`,
    `population: ${c.population}`,
    `priority: ${c.priority}`,
    `indexable: true`,
    c.aliases ? `aliases: ${q(c.aliases)}` : null,
    `geonameId: ${c.geonameId}`,
  ].filter(Boolean);
  return `  { ${fields.join(', ')} },`;
});
const citiesTs = `${header(`${cities.length} cities`)}import type { City } from '@/types/data';

export const GENERATED_CITIES: City[] = [
${cityLines.join('\n')}
];
`;

const countryLines = countries.map((c) => {
  const fields = [
    `code: ${q(c.code)}`,
    `slug: ${q(c.slug)}`,
    `name: ${q(c.name)}`,
    c.definiteArticle ? 'definiteArticle: true' : null,
    `multipleTimeZones: ${c.multipleTimeZones}`,
    c.overseasTimeZones ? 'overseasTimeZones: true' : null,
    'published: true',
    'indexable: true',
    `continent: ${q(c.continent)}`,
    `population: ${c.population}`,
    c.capitalSlug ? `capitalSlug: ${q(c.capitalSlug)}` : null,
    `primaryZone: ${q(c.primaryZone)}`,
    `zones: ${q(c.zones)}`,
    `neighbours: ${q(c.neighbours)}`,
  ].filter(Boolean);
  return `  { ${fields.join(', ')} },`;
});
const countriesTs = `${header(`${countries.length} countries`)}import type { Country } from '@/types/data';

export const GENERATED_COUNTRIES: Country[] = [
${countryLines.join('\n')}
];
`;

const zoneNamesTs = `${header(`${zoneNames.length} zones: [zone, January offset, January name, July offset, July name] from CLDR/ICU ${process.versions.icu ?? ''} tz ${process.versions.tz ?? ''}`)}export type GeneratedZoneName = readonly [zone: string, janOffset: number, janName: string | null, julOffset: number, julName: string | null];

export const GENERATED_ZONE_NAMES: readonly GeneratedZoneName[] = [
${zoneNames.map((row) => `  ${q(row)},`).join('\n')}
];
`;

const outputs = [
  [OUTPUTS.cities, citiesTs],
  [OUTPUTS.countries, countriesTs],
  [OUTPUTS.zoneNames, zoneNamesTs],
];

let stale = 0;
for (const [path, content] of outputs) {
  const current = existsSync(path) ? readFileSync(path, 'utf8') : null;
  if (CHECK) {
    if (current !== content) {
      console.error(`stale: ${path}`);
      stale++;
    }
  } else if (current !== content) {
    writeFileSync(path, content);
    console.log(`wrote ${path}`);
  } else {
    console.log(`unchanged ${path}`);
  }
}
console.log(`${cities.length} cities, ${countries.length} countries, ${zoneNames.length} zones`);
if (CHECK && stale) process.exit(1);
