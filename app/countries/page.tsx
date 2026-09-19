import Link from 'next/link';
import { LiveTime } from '@/components/clock/LiveTime';
import { LiveZoneInfo } from '@/components/clock/LiveZoneInfo';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Section } from '@/components/ui/Section';
import { getCountriesByContinent } from '@/lib/data/countries';
import { routes } from '@/lib/routes';
import { webPageJsonLd } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { getRenderInstant } from '@/lib/server/render-instant';

export const revalidate = 3600;

const TITLE = 'Current Time by Country';
const DESCRIPTION = 'Live local time in every country, grouped by continent, with each time zone abbreviation. Open a country for its zones, major cities and daylight saving rules.';

export const metadata = buildMetadata({
  title: `${TITLE} – Time Zones Directory`,
  description: DESCRIPTION,
  path: routes.countriesHub(),
  indexable: true,
});

export default function CountriesHubPage() {
  const renderedAt = getRenderInstant();
  const continents = getCountriesByContinent();
  const total = continents.reduce((sum, group) => sum + group.countries.length, 0);

  return (
    <>
      <JsonLd data={webPageJsonLd({ name: TITLE, description: DESCRIPTION, path: routes.countriesHub() })} />
      <div className="container-page pt-4 md:pt-6">
        <Breadcrumbs items={[{ name: 'Home', path: routes.home() }, { name: 'Countries', path: routes.countriesHub() }]} />
        <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{TITLE}</h1>
        <p className="mt-1 text-body">
          The current time in {total} countries. Countries with more than one time zone show the time in their capital or largest city.
        </p>

        <div className="mt-6 space-y-8">
          {continents.map((group) => (
            <Section key={group.code} id={`continent-${group.code.toLowerCase()}`} title={group.name}>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.countries.map((country) => (
                  <li key={country.code}>
                    <Link href={routes.country(country.slug)} className="card flex min-h-12 items-center justify-between gap-3 px-4 py-2.5 hover:border-blue-border">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-heading">{country.name}</span>
                        <span className="block text-xs text-muted">{country.multipleTimeZones ? `${country.zones.length > 1 ? 'Several time zones' : 'Multiple time zones'}` : 'One time zone'}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <LiveTime timeZone={country.primaryZone} kind="time-short" className="tabular block text-sm font-semibold text-heading" />
                        <LiveZoneInfo timeZone={country.primaryZone} field="abbreviation" renderedAt={renderedAt} className="block text-xs text-muted" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          ))}
        </div>
      </div>
    </>
  );
}
