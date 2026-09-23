import Link from 'next/link';
import { FOOTER_MOBILE_CITIES, FOOTER_MOBILE_COUNTRIES, getFooterCities, getFooterCountries, getFooterTimezones } from '@/lib/data/footer';
import { routes } from '@/lib/routes';

/**
 * Footer link directory (major cities, major countries, time zones). Plain
 * links, no live values, so it costs nothing at runtime. On phones only the
 * first rows of each list are shown, with a link to the full directory; the
 * rest are hidden with CSS but remain in the HTML for crawlers.
 */
export function FooterDirectory() {
  const cities = getFooterCities();
  const countries = getFooterCountries();
  const zones = getFooterTimezones();

  return (
    <div className="footer-dir container-page divide-y divide-border" data-footer-directory>
      <nav aria-label="Current time in major cities" className="py-5">
        <p className="mb-2 text-sm font-semibold text-heading">Current time in major cities:</p>
        <ul className="grid grid-cols-2 gap-x-4 sm:grid-cols-4 lg:grid-cols-8">
          {cities.map((city, index) => (
            <li key={city.slug} className={index >= FOOTER_MOBILE_CITIES ? 'hidden md:block' : undefined}>
              <Link href={routes.city(city.slug)}>
                {city.name}
              </Link>
            </li>
          ))}
          <li className="md:hidden">
            <Link href={routes.worldClock()} className="font-medium">
              More cities →
            </Link>
          </li>
        </ul>
      </nav>

      <nav aria-label="Current time in major countries" className="py-5">
        <p className="mb-2 text-sm font-semibold text-heading">Current time in major countries:</p>
        <ul className="grid grid-cols-2 gap-x-4 sm:grid-cols-4 lg:grid-cols-8">
          {countries.map((country, index) => (
            <li key={country.code} className={index >= FOOTER_MOBILE_COUNTRIES ? 'hidden md:block' : undefined}>
              <Link href={routes.country(country.slug)}>
                <span className="code">{country.code}</span>
                {country.name}
              </Link>
            </li>
          ))}
          <li className="md:hidden">
            <Link href={routes.countriesHub()} className="font-medium">
              All countries →
            </Link>
          </li>
        </ul>
      </nav>

      <nav aria-label="Current time in time zones" className="py-5">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-semibold text-heading">Current time now in time zones:</span>
          {zones.map((tz) => (
            <Link key={tz.slug} href={routes.timezone(tz.slug)} title={tz.name}>
              {tz.abbreviation}
            </Link>
          ))}
          <Link href={routes.timezonesHub()} className="font-medium">
            All abbreviations →
          </Link>
        </p>
      </nav>
    </div>
  );
}
