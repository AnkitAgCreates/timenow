import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ClockPanel } from '@/components/clock/ClockPanel';
import { LiveTime } from '@/components/clock/LiveTime';
import { OffsetToLocal } from '@/components/converter/OffsetToLocal';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FAQ } from '@/components/ui/FAQ';
import { LinkList, type LinkItem } from '@/components/ui/LinkList';
import { Section } from '@/components/ui/Section';
import { SectionTabs } from '@/components/ui/SectionTabs';
import { describeOffset, getAbbreviationsForOffset, getOffsetUsage, groupOffsetUsage, offsetFaqs, offsetMetaDescription, offsetTitle } from '@/lib/content/offset';
import { getConvertersForTimezone } from '@/lib/data/converters';
import { getAdjacentOffsetPages, getAllOffsetPages, getOffsetPage } from '@/lib/data/offsets';
import { routes } from '@/lib/routes';
import { faqJsonLd, webPageJsonLd } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { getRenderInstant } from '@/lib/server/render-instant';
import { formatOffset, formatTimeFields } from '@/lib/time';

export const revalidate = 3600;
export const dynamicParams = false;

type Props = { params: Promise<{ offset: string }> };

export function generateStaticParams() {
  return getAllOffsetPages().map((page) => ({ offset: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getOffsetPage((await params).offset);
  if (!page) return {};
  const usage = getOffsetUsage(page, getRenderInstant());
  return buildMetadata({
    title: `${offsetTitle(page)} – Current Time at ${page.label} (GMT${page.label.slice(3)})`,
    description: offsetMetaDescription(page, usage),
    path: routes.utcOffset(page.slug),
    indexable: true,
  });
}

/** UTC hour → local hour at this offset, for every hour of the day. */
function conversionRows(offsetMinutes: number) {
  return Array.from({ length: 24 }, (_, hour) => {
    const local = ((hour * 60 + offsetMinutes) % 1440 + 1440) % 1440;
    const dayShift = Math.floor((hour * 60 + offsetMinutes) / 1440);
    return {
      utc: formatTimeFields({ hour, minute: 0, second: 0 }, { seconds: false }),
      local: formatTimeFields({ hour: Math.floor(local / 60), minute: local % 60, second: 0 }, { seconds: false }),
      note: dayShift === 1 ? 'next day' : dayShift === -1 ? 'previous day' : '',
    };
  });
}

export default async function UtcOffsetPage({ params }: Props) {
  const page = getOffsetPage((await params).offset);
  if (!page) notFound();

  const renderedAt = getRenderInstant();
  const path = routes.utcOffset(page.slug);
  const title = offsetTitle(page);
  const usage = getOffsetUsage(page, renderedAt);
  const groups = groupOffsetUsage(page, usage);
  const faqs = offsetFaqs(page, usage, renderedAt);
  const description = offsetMetaDescription(page, usage);
  const abbreviations = getAbbreviationsForOffset(page.offsetMinutes);
  const adjacent = getAdjacentOffsetPages(page);
  const gmtLabel = `GMT${page.label.slice(3)}`;

  const related: LinkItem[] = [
    ...abbreviations.map((tz) => ({ label: `${tz.name} (${tz.abbreviation})`, href: routes.timezone(tz.slug), detail: `Defined as ${page.label}` })),
    ...abbreviations
      .flatMap((tz) => getConvertersForTimezone(tz.slug))
      .filter((pair, index, all) => all.findIndex((p) => p.slug === pair.slug) === index)
      .slice(0, 4)
      .map((pair) => ({ label: `${pair.fromSide.label} to ${pair.toSide.label}`, href: routes.convert(pair.from, pair.to), detail: 'Converter' })),
    ...adjacent.map((other) => ({ label: `${other.label} time now`, href: routes.utcOffset(other.slug), detail: 'Neighbouring offset' })),
    { label: 'UTC time now', href: routes.utcHub(), detail: 'All UTC offsets' },
    { label: 'GMT time now', href: routes.gmtHub(), detail: 'Greenwich Mean Time' },
  ];

  return (
    <>
      <JsonLd data={[webPageJsonLd({ name: title, description, path }), faqJsonLd(faqs)]} />

      <div className="container-page pt-4 md:pt-6">
        <Breadcrumbs
          items={[
            { name: 'Home', path: routes.home() },
            { name: 'UTC', path: routes.utcHub() },
            { name: page.label, path },
          ]}
        />

        <div className="card mt-3 px-4 pb-5 pt-5 md:pb-7 md:pt-7">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-muted md:text-base">
              {page.label} ({page.iso}, also written {gmtLabel}) is {describeOffset(page.offsetMinutes)}.
            </p>
          </div>
          <ClockPanel
            id="offset-clock"
            timeZone={page.zoneId}
            renderedAt={renderedAt}
            className="mt-4"
            heading={<p className="text-xs font-semibold uppercase tracking-wide text-muted">{page.label} time now</p>}
          />
          <p className="mt-3 text-center text-sm text-body">
            UTC now: <LiveTime timeZone="UTC" kind="time" className="tabular font-semibold text-heading" />
          </p>
        </div>

        <SectionTabs
          className="mt-5"
          tabs={[
            { id: 'places', label: 'Where it is used' },
            { id: 'your-time', label: 'Your time' },
            { id: 'table', label: 'UTC table' },
            { id: 'faqs', label: 'FAQs' },
          ]}
        />

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Section id="places" title={`Where ${page.label} is used`} className="lg:col-span-7">
            {groups.length === 0 ? (
              <p className="card px-4 py-3 text-sm text-body">No major city in this dataset uses {page.label} this year.</p>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <div key={group.kind} className="card px-4 py-3">
                    <h3 className="text-sm font-semibold">{group.title}</h3>
                    <p className="text-xs text-muted">{group.description}</p>
                    <ul className="mt-2 space-y-2 text-sm">
                      {group.usages.slice(0, 12).map((u) => (
                        <li key={u.zone} className="flex flex-wrap items-baseline gap-x-2">
                          <span className="font-medium text-heading">{u.name}</span>
                          <span className="text-xs text-muted">
                            {u.abbreviation}
                            {u.otherOffset !== null ? ` · ${formatOffset(u.otherOffset)} the rest of the year` : ''}
                            {u.onOffsetNow ? '' : ' · not on this offset right now'}
                          </span>
                          {u.cities.length > 0 && (
                            <span className="basis-full text-body">
                              {u.cities.map((city, index) => (
                                <span key={city.slug}>
                                  {index > 0 && ', '}
                                  <Link href={routes.city(city.slug)} className="hover:text-primary hover:underline">
                                    {city.name}
                                  </Link>
                                </span>
                              ))}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <div className="space-y-6 lg:col-span-5">
            <Section id="your-time" title={`${page.label} in your time zone`}>
              <div className="card px-4 py-3">
                <OffsetToLocal offsetMinutes={page.offsetMinutes} label={page.label} />
              </div>
            </Section>

            <Section id="table" title={`UTC to ${page.label}`}>
              <div className="card max-h-[26rem] overflow-y-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Conversion from UTC to {page.label} for every hour</caption>
                  <thead className="sticky top-0 bg-surface text-left text-xs text-muted">
                    <tr>
                      <th scope="col" className="px-4 py-2 font-medium">UTC</th>
                      <th scope="col" className="px-4 py-2 font-medium">{page.label}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {conversionRows(page.offsetMinutes).map((row) => (
                      <tr key={row.utc}>
                        <td className="tabular px-4 py-1.5 text-heading">{row.utc}</td>
                        <td className="tabular px-4 py-1.5 text-body">
                          {row.local}
                          {row.note && <span className="ml-1.5 text-xs text-muted">({row.note})</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        </div>

        <Section id="related" title="Related" className="mt-8">
          <LinkList columns={3} items={related} />
        </Section>

        <Section id="faqs" title={`${page.label} FAQs`} className="mt-8">
          <FAQ items={faqs} />
        </Section>
      </div>
    </>
  );
}
