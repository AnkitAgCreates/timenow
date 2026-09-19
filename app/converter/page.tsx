import Link from 'next/link';
import { TimeConverter } from '@/components/converter/TimeConverter';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FAQ } from '@/components/ui/FAQ';
import { Section } from '@/components/ui/Section';
import { CONVERTER_DST_NOTES, CONVERTER_HUB_TITLE, converterHubDescription, converterHubFaqs } from '@/lib/content/converter';
import { getCityConverterPairs, getZoneConverterPairs, getZoneConvertersByFrom } from '@/lib/data/converters';
import { routes } from '@/lib/routes';
import { faqJsonLd, webApplicationJsonLd } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { getRenderInstant } from '@/lib/server/render-instant';

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: 'Time Zone Converter – Cities, Time Zones & UTC Offsets',
  description: converterHubDescription(),
  path: routes.converterHub(),
  indexable: true,
});

const chipClass = 'inline-flex min-h-11 items-center rounded-md border border-border bg-white px-3 text-sm font-medium text-heading hover:border-blue-border hover:text-primary';

export default function ConverterHubPage() {
  const renderedAt = getRenderInstant();
  const faqs = converterHubFaqs();
  const groups = getZoneConvertersByFrom();
  const cityPairs = getCityConverterPairs();
  const zoneCount = getZoneConverterPairs().length;

  return (
    <>
      <JsonLd data={[webApplicationJsonLd({ name: CONVERTER_HUB_TITLE, description: converterHubDescription(), path: routes.converterHub() }), faqJsonLd(faqs)]} />

      <div className="container-page pt-4 md:pt-6">
        <Breadcrumbs items={[{ name: 'Home', path: routes.home() }, { name: 'Converter', path: routes.converterHub() }]} />
        <div className="mx-auto mt-3 max-w-xl">
          <h1 className="text-center text-2xl font-bold tracking-tight md:text-3xl">{CONVERTER_HUB_TITLE}</h1>
          <p className="mt-1.5 text-center text-sm text-muted md:text-base">
            Pick any two cities, time zones or UTC offsets. Results use each zone’s real rules on the date you choose.
          </p>
          <div className="card mt-5 p-4">
            <TimeConverter
              defaultFrom={{ zone: 'America/New_York', label: 'Eastern Time – New York' }}
              defaultTo={{ zone: 'Asia/Kolkata', label: 'India' }}
              renderedAt={renderedAt}
            />
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-4xl space-y-8">
          <Section id="popular-conversions" title="Popular time zone conversions">
            <p className="-mt-1 mb-3 text-sm text-muted">
              {zoneCount} curated pages, each with live clocks, an hourly table, the difference through the year and the best hours to call.
            </p>
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.side.slug}>
                  <h3 className="text-sm font-semibold text-heading">
                    <Link href={group.side.href} className="hover:text-primary hover:underline">
                      {group.side.label}
                    </Link>{' '}
                    <span className="font-normal text-muted">({group.side.name}) to…</span>
                  </h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {group.pairs.map((pair) => (
                      <li key={pair.slug}>
                        <Link href={routes.convert(pair.from, pair.to)} className={chipClass}>
                          {pair.toSide.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section id="city-conversions" title="City to city">
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {cityPairs.map((pair) => (
                <li key={pair.slug}>
                  <Link href={routes.convert(pair.from, pair.to)} className="card flex min-h-11 items-center justify-between gap-2 px-3 py-2 text-sm hover:border-blue-border hover:text-primary">
                    <span className="font-medium text-heading">
                      {pair.fromSide.label} → {pair.toSide.label}
                    </span>
                    <span className="shrink-0 text-xs text-muted">{pair.toSide.city!.country}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="dst" title="How daylight saving time is handled">
            <ul className="card divide-y divide-border">
              {CONVERTER_DST_NOTES.map((note) => (
                <li key={note.title} className="px-4 py-3">
                  <p className="text-sm font-semibold text-heading">{note.title}</p>
                  <p className="mt-0.5 text-sm text-body">{note.text}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="faqs" title="Time zone converter FAQs">
            <FAQ items={faqs} />
          </Section>
        </div>
      </div>
    </>
  );
}
