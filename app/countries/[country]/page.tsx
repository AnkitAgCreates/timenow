import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CityCard } from '@/components/city/CityCard';
import { ClockPanel } from '@/components/clock/ClockPanel';
import { LiveDifference } from '@/components/clock/LiveDifference';
import { LiveTime } from '@/components/clock/LiveTime';
import { LiveZoneInfo } from '@/components/clock/LiveZoneInfo';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FAQ } from '@/components/ui/FAQ';
import { LinkList, type LinkItem } from '@/components/ui/LinkList';
import { Section } from '@/components/ui/Section';
import { SectionTabs } from '@/components/ui/SectionTabs';
import { countryFaqs, countryMetaDescription, countryTitle, getCountryZoneGroups, type ZoneGroup } from '@/lib/content/country';
import { getCitiesInCountry, getComparisonCitiesForZone } from '@/lib/data/cities';
import { countryPhrase, getCountry, getNeighbours, getPublishedCountries } from '@/lib/data/countries';
import { getTimezonesForZone } from '@/lib/data/timezones';
import { routes } from '@/lib/routes';
import { faqJsonLd, webPageJsonLd } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { getRenderInstant } from '@/lib/server/render-instant';
import { formatOffset } from '@/lib/time';

export const revalidate = 3600;
export const dynamicParams = false;

type Props = { params: Promise<{ country: string }> };

export function generateStaticParams() {
  return getPublishedCountries().map((country) => ({ country: country.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const country = getCountry((await params).country);
  if (!country?.published) return {};
  const groups = getCountryZoneGroups(country, getRenderInstant());
  return buildMetadata({
    title: `${countryTitle(country)} – Time Zones, DST & Major Cities`,
    description: countryMetaDescription(country, groups),
    path: routes.country(country.slug),
    indexable: country.indexable,
  });
}

/** "America/Adak" → "Adak": the IANA location, for zone groups with no city in the dataset. */
function zoneLocationName(zone: string): string {
  return zone.split('/').pop()!.replace(/_/g, ' ');
}

/** Up to three city links for a zone group, or the IANA location when the dataset has no city there. */
function ZoneGroupCities({ group }: { group: ZoneGroup }) {
  if (group.cities.length === 0) return <span className="text-muted">{group.zones.map(zoneLocationName).join(', ')}</span>;
  return (
    <>
      {group.cities.slice(0, 3).map((city, index) => (
        <span key={city.slug}>
          {index > 0 && ', '}
          <Link href={routes.city(city.slug)} className="hover:text-primary hover:underline">
            {city.name}
          </Link>
        </span>
      ))}
    </>
  );
}

export default async function CountryPage({ params }: Props) {
  const country = getCountry((await params).country);
  if (!country?.published) notFound();

  const renderedAt = getRenderInstant();
  const path = routes.country(country.slug);
  const title = countryTitle(country);
  const groups = getCountryZoneGroups(country, renderedAt);
  const primaryGroup = groups.find((g) => g.zones.includes(country.primaryZone)) ?? groups[0]!;
  const cities = getCitiesInCountry(country.code, 12);
  const capital = country.capitalSlug ? getCitiesInCountry(country.code).find((c) => c.slug === country.capitalSlug) : undefined;
  const comparisons = getComparisonCitiesForZone(country.primaryZone, 5);
  const neighbours = getNeighbours(country);
  const faqs = countryFaqs(country, groups, renderedAt);
  const description = countryMetaDescription(country, groups);
  const multi = groups.length > 1;

  const zoneLinks: LinkItem[] = groups
    .flatMap((group) => getTimezonesForZone(group.zone))
    .filter((tz, index, all) => all.findIndex((t) => t.slug === tz.slug) === index)
    .map((tz) => ({ label: `${tz.name} (${tz.abbreviation})`, href: routes.timezone(tz.slug), detail: 'Time zone' }));

  return (
    <>
      <JsonLd data={[webPageJsonLd({ name: title, description, path }), faqJsonLd(faqs)]} />

      <div className="container-page pt-4 md:pt-6">
        <Breadcrumbs
          items={[
            { name: 'Home', path: routes.home() },
            { name: 'Countries', path: routes.countriesHub() },
            { name: country.name, path },
          ]}
        />

        <div className="card mt-3 px-4 pb-5 pt-5 md:pb-7 md:pt-7">
          <ClockPanel
            id="country-clock"
            timeZone={country.primaryZone}
            renderedAt={renderedAt}
            heading={
              <>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
                <p className="mt-1 text-sm text-muted md:text-base">
                  {multi
                    ? `${primaryGroup.name}${capital ? ` (${capital.name})` : ''} — ${countryPhrase(country)} spans ${groups.length} time zones.`
                    : `${countryPhrase(country, true)} uses ${primaryGroup.name}${primaryGroup.daylightOffset === null ? ' all year' : ', with daylight saving time'}.`}
                </p>
              </>
            }
          />
        </div>

        <SectionTabs
          className="mt-5"
          tabs={[
            { id: 'zones', label: multi ? 'Time Zones' : 'Time Zone' },
            { id: 'cities', label: 'Cities' },
            { id: 'time-difference', label: 'Time Difference' },
            { id: 'faqs', label: 'FAQs' },
          ]}
        />

        <Section id="zones" title={multi ? `Time zones in ${country.name}` : `${country.name} time zone`} className="mt-5">
          {/* Phones: one card per zone group (the five-column table is unreadable at 375px). */}
          <ul className="space-y-2 sm:hidden">
            {groups.map((group) => (
              <li key={group.key} data-zone-group className="card px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-heading">{group.name}</p>
                    <p className="text-xs text-muted">
                      <LiveZoneInfo timeZone={group.zone} field="name-with-abbreviation" renderedAt={renderedAt} names={group.names} />
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <LiveTime timeZone={group.zone} kind="time-short" renderedAt={renderedAt} className="tabular block text-lg font-semibold text-heading" />
                    <LiveTime timeZone={group.zone} kind="offset" renderedAt={renderedAt} className="tabular block text-xs text-muted" />
                  </div>
                </div>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <dt className="text-muted">Daylight saving</dt>
                  <dd className="text-body">
                    {group.daylightOffset === null ? 'Not observed' : <LiveZoneInfo timeZone={group.zone} field="dst-status" renderedAt={renderedAt} />}
                  </dd>
                  <dt className="text-muted">Cities</dt>
                  <dd className="text-body">
                    <ZoneGroupCities group={group} />
                  </dd>
                </dl>
              </li>
            ))}
          </ul>
          <div className="card hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[36rem] text-sm">
              <caption className="sr-only">Time zones of {country.name} with the current time in each</caption>
              <thead className="bg-surface text-left text-xs text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Time zone</th>
                  <th scope="col" className="px-4 py-2 font-medium">Time now</th>
                  <th scope="col" className="px-4 py-2 font-medium">Offset</th>
                  <th scope="col" className="px-4 py-2 font-medium">Daylight saving</th>
                  <th scope="col" className="px-4 py-2 font-medium">Cities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {groups.map((group) => (
                  <tr key={group.key} data-zone-group>
                    <th scope="row" className="px-4 py-2.5 text-left font-medium text-heading">
                      {group.name}
                      <span className="block text-xs font-normal text-muted">
                        <LiveZoneInfo timeZone={group.zone} field="name-with-abbreviation" renderedAt={renderedAt} names={group.names} />
                      </span>
                    </th>
                    <td className="tabular px-4 py-2.5 text-heading">
                      <LiveTime timeZone={group.zone} kind="time-short" renderedAt={renderedAt} />
                    </td>
                    <td className="tabular px-4 py-2.5 text-body">
                      <LiveTime timeZone={group.zone} kind="offset" renderedAt={renderedAt} />
                    </td>
                    <td className="px-4 py-2.5 text-body">
                      {group.daylightOffset === null ? 'Not observed' : <LiveZoneInfo timeZone={group.zone} field="dst-status" renderedAt={renderedAt} />}
                    </td>
                    <td className="px-4 py-2.5 text-body">
                      <ZoneGroupCities group={group} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">
            {multi
              ? `Zones are grouped by behaviour: standard offset and daylight saving rules. Offsets: ${groups.map((g) => formatOffset(g.standardOffset)).join(', ')}.`
              : `IANA time zone${country.zones.length > 1 ? 's' : ''}: ${country.zones.join(', ')}.`}
          </p>
        </Section>

        {cities.length > 0 && (
          <Section id="cities" title={`Major cities in ${country.name}`} className="mt-8" action={cities.length >= 12 ? undefined : undefined}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {cities.map((city) => (
                <CityCard key={city.slug} city={city} renderedAt={renderedAt} layout="stacked" />
              ))}
            </div>
          </Section>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Section id="time-difference" title="Time Difference" className="lg:col-span-7">
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Current time difference between {country.name} ({primaryGroup.name}) and other cities
                </caption>
                <thead className="bg-surface text-left text-xs text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-2 font-medium">Compared with</th>
                    <th scope="col" className="hidden px-4 py-2 font-medium sm:table-cell">Local time</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {comparisons.map((other) => (
                    <tr key={other.slug}>
                      <th scope="row" className="px-4 py-2.5 text-left font-normal text-body">
                        {country.name} <span aria-hidden="true">→</span>
                        <span className="sr-only">to</span>{' '}
                        <Link href={routes.city(other.slug)} className="inline-block py-3.5 -my-3.5 font-medium text-heading hover:text-primary hover:underline">
                          {other.name}
                        </Link>
                      </th>
                      <td className="tabular hidden px-4 py-2.5 text-body sm:table-cell">
                        <LiveTime timeZone={other.timezone} kind="time-short" />
                      </td>
                      <td className="tabular px-4 py-2.5 text-right font-medium text-heading">
                        <LiveDifference fromZone={country.primaryZone} toZone={other.timezone} renderedAt={renderedAt} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted">
              {multi ? `Based on ${primaryGroup.name}${capital ? ` (${capital.name})` : ''}. ` : ''}Positive values mean the other city is ahead. Differences update automatically when daylight saving time changes.
            </p>
          </Section>

          <aside className="lg:col-span-5" aria-labelledby="related-title">
            <h2 id="related-title" className="text-lg font-bold tracking-tight md:text-xl">
              Related
            </h2>
            <div className="mt-3">
              <LinkList
                items={[
                  ...zoneLinks,
                  ...neighbours.map((n) => ({ label: `Time in ${n.name}`, href: routes.country(n.slug), detail: 'Neighbouring country' })),
                  { label: 'Time zone converter', href: routes.converterHub(), detail: `Convert a time from ${country.name}` },
                  { label: 'All countries', href: routes.countriesHub(), detail: 'Current time by country' },
                ]}
              />
            </div>
          </aside>
        </div>

        <Section id="faqs" title={`Time in ${country.name}: FAQs`} className="mt-8">
          <FAQ items={faqs} />
        </Section>
      </div>
    </>
  );
}
