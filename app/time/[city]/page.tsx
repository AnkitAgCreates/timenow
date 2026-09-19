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
import { Icon } from '@/components/ui/Icon';
import { InfoRow } from '@/components/ui/InfoRow';
import { LinkList, type LinkItem } from '@/components/ui/LinkList';
import { Section } from '@/components/ui/Section';
import { SectionTabs } from '@/components/ui/SectionTabs';
import { cityFaqs, cityMetaDescription, cityRegion, getCitySunTimes, getZoneFacts } from '@/lib/content/city';
import { getAllCities, getCity, getComparisonCities, getNearbyCities } from '@/lib/data/cities';
import { getConvertersForCity, getConvertersForTimezone } from '@/lib/data/converters';
import { getCountryByCode } from '@/lib/data/countries';
import { getTimezonesForZone } from '@/lib/data/timezones';
import { routes } from '@/lib/routes';
import { faqJsonLd, webPageJsonLd } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { formatDuration, formatTime } from '@/lib/time';
import { getRenderInstant } from '@/lib/server/render-instant';

export const revalidate = 3600;
export const dynamicParams = false;

type Props = { params: Promise<{ city: string }> };

export function generateStaticParams() {
  return getAllCities().map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCity((await params).city);
  if (!city) return {};
  const facts = getZoneFacts(city.timezone, getRenderInstant());
  return buildMetadata({
    title: `Current Time in ${city.name}, ${cityRegion(city)} – Time Zone & DST`,
    description: cityMetaDescription(city, facts),
    path: routes.city(city.slug),
    indexable: city.indexable,
  });
}

export default async function CityPage({ params }: Props) {
  const city = getCity((await params).city);
  if (!city) notFound();

  const renderedAt = getRenderInstant();
  const path = routes.city(city.slug);
  const country = getCountryByCode(city.countryCode);
  const facts = getZoneFacts(city.timezone, renderedAt);
  const comparisons = getComparisonCities(city);
  const nearby = getNearbyCities(city, 4);
  const { dateLabel, sun } = getCitySunTimes(city, renderedAt);
  const faqs = cityFaqs(city, facts, renderedAt, comparisons[0]);
  const zoneEntries = getTimezonesForZone(city.timezone);
  const title = `Current Time in ${city.name}, ${city.country}`;

  const related: LinkItem[] = [
    ...zoneEntries.map((tz) => ({ label: `${tz.name} (${tz.abbreviation})`, href: routes.timezone(tz.slug), detail: 'Time zone' })),
    ...getConvertersForCity(city.slug)
      .filter((pair) => pair.from === city.slug)
      .slice(0, 4)
      .map((pair) => ({ label: `${city.name} to ${pair.toSide.label} time`, href: routes.convert(pair.from, pair.to), detail: 'City converter' })),
    ...zoneEntries
      .flatMap((tz) => getConvertersForTimezone(tz.slug))
      .filter((pair, index, all) => all.findIndex((p) => p.slug === pair.slug) === index)
      .slice(0, 4)
      .map((pair) => ({
        label: `${pair.fromSide.label} to ${pair.toSide.label} converter`,
        href: routes.convert(pair.from, pair.to),
        detail: 'Time zone converter',
      })),
    { label: 'Time zone converter', href: routes.converterHub(), detail: `Convert a time from ${city.name}` },
  ];

  return (
    <>
      <JsonLd data={[webPageJsonLd({ name: title, description: cityMetaDescription(city, facts), path }), faqJsonLd(faqs)]} />

      <div className="container-page pt-4 md:pt-6">
        <Breadcrumbs
          items={[
            { name: 'Home', path: routes.home() },
            { name: city.country, path: country?.published ? routes.country(country.slug) : undefined },
            { name: city.name, path },
          ]}
        />

        <div className="card mt-3 overflow-hidden">
          <div aria-hidden="true" className="skyline h-20 md:h-28" />
          <ClockPanel
            id="city-clock"
            timeZone={city.timezone}
            renderedAt={renderedAt}
            className="px-4 pb-5 pt-4 md:pb-7"
            heading={
              <h1 className="text-lg font-bold leading-snug tracking-tight md:text-2xl">
                <span className="block text-base font-semibold md:text-xl">Current Time in</span> {city.name}, {city.country}
              </h1>
            }
          />
        </div>

        <SectionTabs
          className="mt-5"
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'time-difference', label: 'Time Difference' },
            { id: 'nearby', label: 'Nearby Cities' },
            { id: 'about', label: 'About' },
          ]}
        />

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Section id="overview" title={`${city.name} time zone`} className="lg:col-span-5">
            <ul className="card divide-y divide-border">
              <InfoRow icon="clock" label="Time Zone" note={`IANA: ${city.timezone}`}>
                <LiveZoneInfo timeZone={city.timezone} field="name-with-abbreviation" renderedAt={renderedAt} names={facts.names} />
              </InfoRow>
              <InfoRow icon="globe" label="UTC Offset">
                <LiveTime timeZone={city.timezone} kind="offset" renderedAt={renderedAt} />
              </InfoRow>
              <InfoRow
                icon="sun"
                label="Daylight Saving Time"
                note={facts.observesDST ? <LiveZoneInfo timeZone={city.timezone} field="next-transition" renderedAt={renderedAt} /> : 'Same offset all year'}
              >
                <LiveZoneInfo timeZone={city.timezone} field="dst-status" renderedAt={renderedAt} />
              </InfoRow>
              <InfoRow icon="pin" label="Coordinates">
                {Math.abs(city.latitude).toFixed(2)}° {city.latitude >= 0 ? 'N' : 'S'}, {Math.abs(city.longitude).toFixed(2)}° {city.longitude >= 0 ? 'E' : 'W'}
              </InfoRow>
            </ul>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {sun.polar ? (
                <p className="card col-span-2 px-4 py-3 text-sm text-body">
                  {sun.polar === 'day' ? 'The sun does not set' : 'The sun does not rise'} in {city.name} on {dateLabel}.
                </p>
              ) : (
                <>
                  <div className="card flex items-center gap-3 px-4 py-3">
                    <Icon name="sunrise" className="size-7 text-warning" />
                    <div>
                      <p className="text-xs text-muted">Sunrise</p>
                      <p className="tabular text-[15px] font-semibold text-heading">{formatTime(sun.sunrise!, city.timezone, { seconds: false })}</p>
                    </div>
                  </div>
                  <div className="card flex items-center gap-3 px-4 py-3">
                    <Icon name="sunset" className="size-7 text-warning" />
                    <div>
                      <p className="text-xs text-muted">Sunset</p>
                      <p className="tabular text-[15px] font-semibold text-heading">{formatTime(sun.sunset!, city.timezone, { seconds: false })}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            <p className="mt-2 text-xs text-muted">
              Sun times for {dateLabel} (local date){sun.polar ? '' : ` · ${formatDuration(sun.dayLengthMinutes)} of daylight`}.
            </p>
          </Section>

          <Section id="time-difference" title="Time Difference" className="lg:col-span-7">
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <caption className="sr-only">Current time difference between {city.name} and other cities</caption>
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
                        {city.name} <span aria-hidden="true">→</span>
                        <span className="sr-only">to</span>{' '}
                        <Link href={routes.city(other.slug)} className="inline-block py-3.5 -my-3.5 font-medium text-heading hover:text-primary hover:underline">
                          {other.name}
                        </Link>
                      </th>
                      <td className="tabular hidden px-4 py-2.5 text-body sm:table-cell">
                        <LiveTime timeZone={other.timezone} kind="time-short" />
                      </td>
                      <td className="tabular px-4 py-2.5 text-right font-medium text-heading">
                        <LiveDifference fromZone={city.timezone} toZone={other.timezone} renderedAt={renderedAt} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted">Positive values mean the other city is ahead of {city.name}. Differences update automatically when daylight saving time changes.</p>
          </Section>
        </div>

        {nearby.length > 0 && (
          <Section id="nearby" title="Nearby Cities" className="mt-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {nearby.map(({ city: other }) => (
                <CityCard key={other.slug} city={other} renderedAt={renderedAt} layout="stacked" />
              ))}
            </div>
          </Section>
        )}

        <section id="about" aria-labelledby="about-title" className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 id="about-title" className="text-lg font-bold tracking-tight md:text-xl">
              About time in {city.name}
            </h2>
            <div className="mt-3">
              <FAQ items={faqs} />
            </div>
          </div>
          <aside className="lg:col-span-5" aria-labelledby="related-title">
            <h2 id="related-title" className="text-lg font-bold tracking-tight md:text-xl">
              Related
            </h2>
            <div className="mt-3">
              <LinkList items={related} columns={2} />
            </div>
          </aside>
        </section>
      </div>
    </>
  );
}
