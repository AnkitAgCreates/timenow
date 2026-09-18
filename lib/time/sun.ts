/**
 * Sunrise, sunset and solar noon using the NOAA solar position equations
 * (https://gml.noaa.gov/grad/solcalc/calcdetails.html). Accurate to roughly a
 * minute for latitudes below the polar circles; no external service needed.
 */
import { DAY_MS, MINUTE_MS, getZonedDate, utcMs, type CalendarDate } from './zone';

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (radians: number) => (radians * 180) / Math.PI;

function julianCentury(epochMs: number): number {
  const julianDay = epochMs / DAY_MS + 2440587.5;
  return (julianDay - 2451545) / 36525;
}

function solarParams(t: number) {
  const meanLong = (((280.46646 + t * (36000.76983 + t * 0.0003032)) % 360) + 360) % 360;
  const meanAnomaly = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const eccentricity = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const m = rad(meanAnomaly);
  const center =
    Math.sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * m) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * m) * 0.000289;
  const trueLong = meanLong + center;
  const omega = rad(125.04 - 1934.136 * t);
  const apparentLong = trueLong - 0.00569 - 0.00478 * Math.sin(omega);
  const meanObliquity = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const obliquity = meanObliquity + 0.00256 * Math.cos(omega);
  const declination = deg(Math.asin(Math.sin(rad(obliquity)) * Math.sin(rad(apparentLong))));

  const y = Math.tan(rad(obliquity) / 2) ** 2;
  const l0 = rad(meanLong);
  const equationOfTime =
    4 *
    deg(
      y * Math.sin(2 * l0) -
        2 * eccentricity * Math.sin(m) +
        4 * eccentricity * y * Math.sin(m) * Math.cos(2 * l0) -
        0.5 * y * y * Math.sin(4 * l0) -
        1.25 * eccentricity * eccentricity * Math.sin(2 * m),
    );
  return { declination, equationOfTime };
}

/** cos(hour angle) for the sun's upper limb touching the horizon (with refraction). */
function sunriseHourAngleCosine(latitude: number, declination: number): number {
  const latRad = rad(latitude);
  const decRad = rad(declination);
  return Math.cos(rad(90.833)) / (Math.cos(latRad) * Math.cos(decRad)) - Math.tan(latRad) * Math.tan(decRad);
}

type EventKind = 'noon' | 'rise' | 'set';

/** Event time in minutes relative to 00:00 UTC of `dayStartMs`, or null if it doesn't occur. */
function eventMinutes(kind: EventKind, dayStartMs: number, latitude: number, longitude: number): number | null {
  // First pass at local solar noon, then refine at the estimated event time.
  let minutes = 720 - 4 * longitude;
  for (let i = 0; i < 2; i++) {
    const { declination, equationOfTime } = solarParams(julianCentury(dayStartMs + minutes * MINUTE_MS));
    if (kind === 'noon') {
      minutes = 720 - 4 * longitude - equationOfTime;
      continue;
    }
    const cosH = sunriseHourAngleCosine(latitude, declination);
    if (cosH > 1 || cosH < -1) return null;
    const hourAngle = deg(Math.acos(cosH));
    minutes = 720 - 4 * (longitude + (kind === 'rise' ? hourAngle : -hourAngle)) - equationOfTime;
  }
  return minutes;
}

export type SunTimes = {
  /** Epoch ms, or null during polar day/night. */
  sunrise: number | null;
  sunset: number | null;
  solarNoon: number;
  /** Minutes between sunrise and sunset; 1440 for polar day, 0 for polar night. */
  dayLengthMinutes: number;
  polar: 'day' | 'night' | null;
};

/**
 * Sun times for the local calendar `date` (in `timeZone`) at a location.
 * Latitude is positive north, longitude positive east.
 */
export function getSunTimes(latitude: number, longitude: number, date: CalendarDate, timeZone: string): SunTimes {
  let dayStart = utcMs(date.year, date.month, date.day);

  // Make sure the solar noon we compute falls on the requested local date
  // (matters for zones whose offset is far from their solar time).
  for (let attempt = 0; attempt < 2; attempt++) {
    const noon = dayStart + (eventMinutes('noon', dayStart, latitude, longitude) ?? 720) * MINUTE_MS;
    const local = getZonedDate(noon, timeZone);
    const diffDays = Math.round((utcMs(date.year, date.month, date.day) - utcMs(local.year, local.month, local.day)) / DAY_MS);
    if (diffDays === 0) break;
    dayStart += diffDays * DAY_MS;
  }

  const solarNoon = dayStart + (eventMinutes('noon', dayStart, latitude, longitude) ?? 720) * MINUTE_MS;
  const rise = eventMinutes('rise', dayStart, latitude, longitude);
  const set = eventMinutes('set', dayStart, latitude, longitude);

  if (rise === null || set === null) {
    const { declination } = solarParams(julianCentury(solarNoon));
    const polar = sunriseHourAngleCosine(latitude, declination) < -1 ? 'day' : 'night';
    return { sunrise: null, sunset: null, solarNoon, dayLengthMinutes: polar === 'day' ? 1440 : 0, polar };
  }

  const sunrise = Math.round(dayStart + rise * MINUTE_MS);
  const sunset = Math.round(dayStart + set * MINUTE_MS);
  return {
    sunrise,
    sunset,
    solarNoon: Math.round(solarNoon),
    dayLengthMinutes: Math.round((sunset - sunrise) / MINUTE_MS),
    polar: null,
  };
}
