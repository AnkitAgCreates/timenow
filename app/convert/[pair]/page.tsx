import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LiveDifference } from '@/components/clock/LiveDifference';
import { LiveTime } from '@/components/clock/LiveTime';
import { LiveZoneInfo } from '@/components/clock/LiveZoneInfo';
import { TimeConverter } from '@/components/converter/TimeConverter';
import { JsonLd } from '@/components/seo/JsonLd';
import { AbbreviationStatus } from '@/components/timezone/AbbreviationStatus';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FAQ } from '@/components/ui/FAQ';
import { Icon } from '@/components/ui/Icon';
import { LinkList } from '@/components/ui/LinkList';
import { Section } from '@/components/ui/Section';
import {
  bestTimesToCall,
  conversionTable,
  converterFaqs,
  converterMetaDescription,
  converterTitle,
  differencePeriods,
  sideName,
} from '@/lib/content/converter';
import { yearRoundExampleCities } from '@/lib/content/timezone';
import { converterSlug, getAllConverterPairs, getConverterPair, getRelatedConverterPairs } from '@/lib/data/converters';
import { routes } from '@/lib/routes';
import { faqJsonLd, webApplicationJsonLd } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { formatDate, getZoneLabel, getZonedDate, observesDST, getZonedParts } from '@/lib/time';
import type { TimeZoneEntry } from '@/types/data';
import { getRenderInstant } from '@/lib/server/render-instant';

export const revalidate = 3600;
export const dynamicParams = false;

type Props = { params: Promise<{ pair: string }> };

export function generateStaticParams() {
  return getAllConverterPairs().map((pair) => ({ pair: pair.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pair = getConverterPair((await params).pair);
  if (!pair) return {};
  return buildMetadata({
    title: `${converterTitle(pair)} – ${pair.fromZone.name} to ${pair.toZone.referenceLabel.split(' (')[0]}`,
    description: converterMetaDescription(pair, getRenderInstant()),
    path: routes.convert(pair.from, pair.to),
    indexable: pair.indexable,
  });
}

function LiveSide({ entry, renderedAt, align }: { entry: TimeZoneEntry; renderedAt: number; align: 'left' | 'right' }) {
  return (
    <div className={`min-w-0 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <p className="truncate text-xs text-muted">{sideName(entry, renderedAt)}</p>
      <p className="text-sm font-semibold text-heading">
        (<LiveZoneInfo timeZone={entry.referenceZone} field="abbreviation" renderedAt={renderedAt} />)
      </p>
      <p className="mt-1.5">
        <LiveTime timeZone={entry.referenceZone} kind="time-short" className="tabular text-[clamp(1.5rem,6vw,2rem)] font-bold leading-none text-heading" />
      </p>
      <p className="mt-1 text-xs text-muted">
        <LiveTime timeZone={entry.referenceZone} kind="date-weekday-short" renderedAt={renderedAt} />
      </p>
    </div>
  );
}

export default async function ConvertPage({ params }: Props) {
  const pair = getConverterPair((await params).pair);
  if (!pair) notFound();

  const renderedAt = getRenderInstant();
  const path = routes.convert(pair.from, pair.to);
  const { fromZone: from, toZone: to } = pair;
  const title = converterTitle(pair);
  const fromName = sideName(from, renderedAt);
  const toName = sideName(to, renderedAt);
  const reverse = getConverterPair(converterSlug(pair.to, pair.from));
  const tableDate = getZonedDate(renderedAt, from.referenceZone);
  const rows = conversionTable(pair, tableDate);
  const calls = bestTimesToCall(pair, renderedAt);
  const periods = differencePeriods(pair, renderedAt);
  const faqs = converterFaqs(pair, renderedAt);
  const related = getRelatedConverterPairs(pair);
  // Explain strict-abbreviation vs. real local time for any side whose region observes DST.
  const seasonalSides = [from, to].filter(
    (entry) => entry.kind !== 'universal' && observesDST(entry.referenceZone, getZonedParts(renderedAt, entry.referenceZone).year),
  );

  return (
    <>
      <JsonLd data={[webApplicationJsonLd({ name: title, description: converterMetaDescription(pair, renderedAt), path }), faqJsonLd(faqs)]} />

      <div className="container-page pt-4 md:pt-6">
        <Breadcrumbs
          items={[
            { name: 'Home', path: routes.home() },
            { name: 'Converter', path: routes.converterHub() },
            { name: `${from.abbreviation} to ${to.abbreviation}`, path },
          ]}
        />

        <div className="mt-3 text-center">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          <p className="mx-auto mt-1.5 max-w-xl text-sm text-muted md:text-base">
            Convert time between {from.name} ({from.abbreviation}) and {toName}
            {to.kind === 'universal' ? '' : ` (${to.abbreviation}${to.counterpart ? `/${to.counterpart.toUpperCase()}` : ''})`}.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <section aria-label="Current time in both zones" className="card px-4 py-4">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <LiveSide entry={from} renderedAt={renderedAt} align="left" />
                {reverse ? (
                  <Link
                    href={routes.convert(reverse.from, reverse.to)}
                    className="inline-flex size-11 items-center justify-center rounded-full bg-blue-surface text-primary hover:bg-blue-border"
                    aria-label={`Switch to ${to.abbreviation} to ${from.abbreviation} converter`}
                  >
                    <Icon name="swap" className="size-5" />
                  </Link>
                ) : (
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-blue-surface text-primary" aria-hidden="true">
                    <Icon name="swap" className="size-5" />
                  </span>
                )}
                <LiveSide entry={to} renderedAt={renderedAt} align="right" />
              </div>
            </section>

            <Section id="convert-time" title="Convert a specific time">
              <div className="card p-4">
                <TimeConverter defaultFrom={from.referenceZone} defaultTo={to.referenceZone} renderedAt={renderedAt} />
              </div>
            </Section>
          </div>

          <div className="space-y-5">
            <Section id="time-difference" title="Time Difference">
              <div className="card px-4 py-3">
                <p className="text-[15px] font-semibold text-heading">
                  <LiveDifference
                    fromZone={from.referenceZone}
                    toZone={to.referenceZone}
                    renderedAt={renderedAt}
                    format="sentence"
                    subject={fromName}
                    reference={toName}
                  />{' '}
                  right now.
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-body">
                  {periods.map((period) => (
                    <li key={period.range} className="flex gap-2">
                      <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${period.current ? 'bg-primary' : 'bg-border-strong'}`} aria-hidden="true" />
                      <span>
                        <strong className="font-medium text-heading">{period.range}:</strong> {period.sentence}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-3 space-y-2">
                {seasonalSides.map((entry) => (
                  <AbbreviationStatus key={entry.slug} entry={entry} renderedAt={renderedAt} yearRoundExamples={yearRoundExampleCities(entry)} />
                ))}
              </div>
            </Section>

            <Section id="best-time" title="Best time to call">
              <p className="-mt-1 mb-2 text-sm text-muted">Convenient overlapping hours on {calls.anchorDateLabel}.</p>
              {calls.slots.length > 0 ? (
                <div className="card overflow-hidden">
                  <table className="w-full text-sm">
                    <caption className="sr-only">Suggested call times</caption>
                    <thead className="bg-surface text-left text-xs text-muted">
                      <tr>
                        <th scope="col" className="px-4 py-2 font-medium">
                          {from.abbreviation} ({fromName})
                        </th>
                        <th scope="col" className="px-4 py-2 font-medium">
                          {getZoneLabel(to.referenceZone, renderedAt).abbreviation} ({toName})
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {calls.slots.map((slot) => (
                        <tr key={slot.fromLabel}>
                          <td className="tabular px-4 py-2.5 font-medium text-heading">{slot.fromLabel}</td>
                          <td className="tabular px-4 py-2.5 font-medium text-heading">{slot.toLabel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="card px-4 py-3 text-sm text-body">There are no hours that fall within reasonable working hours in both places on this date.</p>
              )}
              <p className="mt-2 text-xs text-muted">
                {calls.slots[0]?.quality === 2
                  ? 'These hours fall within 9 AM–5 PM in both places.'
                  : 'No 9 AM–5 PM overlap: suggestions are within working hours on one side and between 7 AM and 10 PM on the other.'}
              </p>
              <Link
                href={routes.converterHub()}
                className="mt-3 flex h-12 items-center justify-center gap-2 rounded-lg bg-primary-dark text-sm font-semibold text-white hover:bg-primary"
              >
                Convert another time zone <Icon name="arrow-right" className="size-4" />
              </Link>
            </Section>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Section id="conversion-table" title={`${from.abbreviation} to ${to.abbreviation} conversion table`} className="lg:col-span-5">
            <p className="-mt-1 mb-2 text-sm text-muted">
              For {formatDate(renderedAt, from.referenceZone, 'full')} in {fromName}.
            </p>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Hourly conversion from {from.abbreviation} to {toName}
                </caption>
                <thead className="bg-surface text-left text-xs text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-2 font-medium">
                      {getZoneLabel(from.referenceZone, renderedAt).abbreviation}
                    </th>
                    <th scope="col" className="px-4 py-2 font-medium">
                      {getZoneLabel(to.referenceZone, renderedAt).abbreviation}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => (
                    <tr key={row.fromLabel}>
                      <td className="tabular px-4 py-2 text-heading">{row.fromLabel}</td>
                      <td className="tabular px-4 py-2 text-body">
                        {row.toLabel}
                        {row.toDayShift && <span className="ml-1.5 text-xs text-muted">({row.toDayShift})</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <div className="space-y-8 lg:col-span-7">
            <Section id="about-zones" title="About these time zones">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[from, to].map((entry) => (
                  <div key={entry.slug} className="card px-4 py-3">
                    <h3 className="text-[15px] font-semibold">
                      <Link href={routes.timezone(entry.slug)} className="inline-block py-3.5 -my-3.5 hover:text-primary hover:underline">
                        {entry.name} ({entry.abbreviation})
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-body">{entry.summary}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="faqs" title={`${from.abbreviation} to ${to.abbreviation} FAQs`}>
              <FAQ items={faqs} />
            </Section>

            {related.length > 0 && (
              <Section id="related" title="Related conversions">
                <LinkList
                  items={related.map((other) => ({
                    label: `${other.fromZone.abbreviation} to ${other.toZone.abbreviation}`,
                    href: routes.convert(other.from, other.to),
                    detail: `${other.fromZone.name} → ${other.toZone.name}`,
                  }))}
                />
              </Section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
