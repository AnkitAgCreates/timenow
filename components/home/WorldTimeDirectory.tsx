import Link from 'next/link';
import type { ReactNode } from 'react';
import { LiveTime } from '@/components/clock/LiveTime';
import { Section } from '@/components/ui/Section';
import { getHomepageCities } from '@/lib/data/cities';
import { getHomepageCountries } from '@/lib/data/countries';
import { getPopularTimezones } from '@/lib/data/timezones';
import { routes } from '@/lib/routes';
import { fixedOffsetZoneId } from '@/lib/time';

type Row = {
  key: string;
  href: string;
  label: ReactNode;
  /** Zone the live time is shown in — an IANA id or a fixed-offset pseudo-zone. */
  timeZone: string;
  title?: string;
};

/**
 * Homepage directory: three lists (cities, countries, time zone abbreviations)
 * with a live weekday + time per row and a link to the page. The time zone
 * column shows each abbreviation at its defined offset (EST = UTC-5, always),
 * which is what its page is about; the city and country columns follow real
 * daylight saving rules through their IANA zones.
 */
export function WorldTimeDirectory() {
  const cities: Row[] = getHomepageCities().map((city) => ({
    key: city.slug,
    href: routes.city(city.slug),
    label: city.name,
    timeZone: city.timezone,
  }));
  const countries: Row[] = getHomepageCountries().map((country) => ({
    key: country.slug,
    href: routes.country(country.slug),
    label: (
      <>
        <span className="mr-2 inline-block w-6 text-[11px] font-semibold uppercase tracking-wide text-muted">{country.code}</span>
        {country.name}
      </>
    ),
    timeZone: country.primaryZone,
  }));
  const zones: Row[] = getPopularTimezones().map((tz) => ({
    key: tz.slug,
    href: routes.timezone(tz.slug),
    label: (
      <>
        {tz.abbreviation}
        <span className="ml-2 hidden text-xs font-normal text-muted sm:inline">{tz.name}</span>
      </>
    ),
    timeZone: fixedOffsetZoneId(tz.offsetMinutes),
    title: tz.name,
  }));

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6" data-world-time-directory>
      <Column id="directory-cities" title="Cities" rows={cities} seeAll={routes.worldClock()} />
      <Column id="directory-countries" title="Countries" rows={countries} seeAll={routes.countriesHub()} />
      <Column id="directory-time-zones" title="Time Zones" rows={zones} seeAll={routes.timezonesHub()} />
    </div>
  );
}

function Column({ id, title, rows, seeAll }: { id: string; title: string; rows: Row[]; seeAll: string }) {
  return (
    <Section id={id} title={title} headingLevel="h3" action={{ label: 'See all', href: seeAll }}>
      <ul className="card divide-y divide-border">
        {rows.map((row) => (
          <li key={row.key}>
            <Link href={row.href} title={row.title} className="group flex min-h-11 items-center justify-between gap-3 px-3 py-2 hover:bg-surface">
              <span className="min-w-0 truncate text-sm font-medium text-heading group-hover:text-primary">{row.label}</span>
              <LiveTime timeZone={row.timeZone} kind="weekday-time-short" className="tabular shrink-0 whitespace-nowrap text-sm text-body" />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
