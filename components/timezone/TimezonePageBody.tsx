import Link from 'next/link';
import type { ReactNode } from 'react';
import { CityCard } from '@/components/city/CityCard';
import { ClockPanel } from '@/components/clock/ClockPanel';
import { LiveDifference } from '@/components/clock/LiveDifference';
import { LiveTime } from '@/components/clock/LiveTime';
import { LiveZoneInfo } from '@/components/clock/LiveZoneInfo';
import { JsonLd } from '@/components/seo/JsonLd';
import { AbbreviationStatus } from '@/components/timezone/AbbreviationStatus';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FAQ } from '@/components/ui/FAQ';
import { InfoTile } from '@/components/ui/InfoRow';
import { LinkList } from '@/components/ui/LinkList';
import { Section } from '@/components/ui/Section';
import { SectionTabs, type TabLink } from '@/components/ui/SectionTabs';
import { timezoneFaqs, timezoneMetaDescription, watchZoneFor, yearRoundExampleCities } from '@/lib/content/timezone';
import { getCitiesInZones } from '@/lib/data/cities';
import { getConvertersForTimezone } from '@/lib/data/converters';
import { fixedOffsetZone, getSeasonalZones, getTimezone, getTimezones, getYearRoundZones } from '@/lib/data/timezones';
import { routes } from '@/lib/routes';
import { faqJsonLd, webPageJsonLd, type Crumb, type FaqItem } from '@/lib/seo/jsonld';
import { formatOffset, formatSignedDifference, getZoneGenericName } from '@/lib/time';
import type { RegionUsage, TimeZoneEntry } from '@/types/data';

function RegionList({ regions }: { regions: RegionUsage[] }) {
  return (
    <ul className="mt-1.5 list-disc space-y-1.5 pl-5 text-sm text-body">
      {regions.map((region) => (
        <li key={region.label}>
          {region.label}
          {region.note && <span className="mt-0.5 block text-xs leading-relaxed text-muted">{region.note}</span>}
        </li>
      ))}
    </ul>
  );
}

export function timezonePageTitle(entry: TimeZoneEntry): string {
  return `${entry.name} (${entry.abbreviation})`;
}

type Props = {
  entry: TimeZoneEntry;
  renderedAt: number;
  /** Canonical path of the page rendering this body. */
  path: string;
  breadcrumbs: Crumb[];
  /** Rendered below the hero card, before the tabs (hub-specific sections). */
  afterHero?: ReactNode;
  /** Extra in-page tabs for `afterHero` / `beforeFaqs` sections. */
  extraTabs?: TabLink[];
  /** Rendered before the FAQ section. */
  beforeFaqs?: ReactNode;
  /** Extra FAQ items appended to the generated ones. */
  extraFaqs?: FaqItem[];
  /** Overrides the generated meta description in JSON-LD. */
  description?: string;
};

/**
 * The time zone abbreviation template, shared by /timezones/[tz]/ and the
 * UTC and GMT hubs (which add an offsets directory around it).
 */
export function TimezonePageBody({ entry, renderedAt, path, breadcrumbs, afterHero, extraTabs = [], beforeFaqs, extraFaqs = [], description }: Props) {
  const title = timezonePageTitle(entry);
  const offset = formatOffset(entry.offsetMinutes);
  const counterpart = entry.counterpart ? getTimezone(entry.counterpart) : undefined;
  const watchZone = watchZoneFor(entry, renderedAt);
  const strictZone = watchZone === entry.referenceZone ? fixedOffsetZone(entry.offsetMinutes) : null;
  const seasonalCities = getCitiesInZones(getSeasonalZones(entry));
  const yearRoundCities = getCitiesInZones(getYearRoundZones(entry));
  // Reserve room for year-round cities so both behaviours stay visible (Chicago on CDT next to
  // Mexico City on CST) now that a zone can have dozens of seasonal cities.
  const yearRoundOnly = yearRoundCities.filter((c) => !seasonalCities.includes(c));
  const yearRoundShare = Math.min(4, yearRoundOnly.length);
  const cities = [...seasonalCities.slice(0, 12 - yearRoundShare), ...yearRoundOnly].slice(0, 12);
  const related = getTimezones(entry.related);
  const converters = getConvertersForTimezone(entry.slug);
  const faqs = [...timezoneFaqs(entry, renderedAt), ...extraFaqs];
  const clockLabel = entry.kind === 'universal' ? `${entry.abbreviation} time now` : `${entry.referenceLabel} now`;

  return (
    <>
      <JsonLd data={[webPageJsonLd({ name: title, description: description ?? timezoneMetaDescription(entry), path }), faqJsonLd(faqs)]} />

      <div className="container-page pt-4 md:pt-6">
        <Breadcrumbs items={breadcrumbs} />

        <div className="card mt-3 px-4 pb-5 pt-5 md:pb-7 md:pt-7">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-muted md:text-base">
              {entry.abbreviation} is {offset}. {entry.kind === 'universal' ? 'Current time and where it is used.' : `Current ${entry.referenceLabel} and when ${entry.abbreviation} applies.`}
            </p>
          </div>

          <ClockPanel
            id="timezone-clock"
            timeZone={entry.referenceZone}
            renderedAt={renderedAt}
            className="mt-4"
            heading={<p className="text-xs font-semibold uppercase tracking-wide text-muted">{clockLabel}</p>}
          />

          <div className="mx-auto mt-5 max-w-2xl space-y-2">
            <AbbreviationStatus entry={entry} renderedAt={renderedAt} yearRoundExamples={yearRoundExampleCities(entry)} />
            {strictZone && (
              <p className="text-center text-sm text-body">
                Exact {entry.abbreviation} ({offset}) time now:{' '}
                <LiveTime timeZone={strictZone} kind="time" className="tabular font-semibold text-heading" />
              </p>
            )}
            {!strictZone && watchZone && watchZone !== entry.referenceZone && (
              <p className="text-center text-sm text-body">
                {getZoneGenericName(watchZone) ?? watchZone} now: <LiveTime timeZone={watchZone} kind="time" className="tabular font-semibold text-heading" /> (
                <LiveZoneInfo timeZone={watchZone} field="abbreviation" renderedAt={renderedAt} />)
              </p>
            )}
          </div>
        </div>

        {afterHero}

        <SectionTabs
          className="mt-5"
          tabs={[
            { id: 'overview', label: 'Overview' },
            ...(cities.length > 0 ? [{ id: 'cities', label: 'Cities' }] : []),
            { id: 'comparison', label: `vs Other Time Zones` },
            ...extraTabs,
            { id: 'faqs', label: 'FAQs' },
          ]}
        />

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Section id="overview" title={`About ${entry.abbreviation}`} className="lg:col-span-6">
            <dl className="grid grid-cols-2 gap-2.5">
              <InfoTile label="Full Name">{entry.name}</InfoTile>
              <InfoTile label="Abbreviation">{entry.abbreviation}</InfoTile>
              <InfoTile label="UTC Offset">{offset}</InfoTile>
              <InfoTile label={entry.kind === 'universal' ? 'Currently' : `${entry.referenceLabel.split(' (')[0]} is on`}>
                {entry.kind === 'universal' ? 'No DST' : <LiveZoneInfo timeZone={entry.referenceZone} field="current-kind" renderedAt={renderedAt} />}
              </InfoTile>
              <InfoTile label="Daylight Saving Time" className="col-span-2">
                {watchZone ? (
                  <>
                    {getZoneGenericName(watchZone) ?? entry.referenceLabel}: <LiveZoneInfo timeZone={watchZone} field="next-transition" renderedAt={renderedAt} />
                    {counterpart && <span className="font-normal text-muted"> · switches between {entry.kind === 'daylight' ? `${counterpart.abbreviation} and ${entry.abbreviation}` : `${entry.abbreviation} and ${counterpart.abbreviation}`}</span>}
                  </>
                ) : (
                  `Not observed — ${entry.abbreviation} is ${offset} all year`
                )}
              </InfoTile>
            </dl>
            <p className="mt-4 text-[15px] leading-relaxed text-body">{entry.summary}</p>
          </Section>

          <Section id="where-used" title={`Where ${entry.abbreviation} is used`} className="lg:col-span-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {entry.seasonalRegions.length > 0 && (
                <div className="card px-4 py-3">
                  <h3 className="text-sm font-semibold">
                    {counterpart
                      ? `Switches between ${entry.kind === 'daylight' ? `${counterpart.abbreviation} and ${entry.abbreviation}` : `${entry.abbreviation} and ${counterpart.abbreviation}`}`
                      : 'Changes seasonally'}
                  </h3>
                  <RegionList regions={entry.seasonalRegions} />
                </div>
              )}
              {entry.yearRoundRegions.length > 0 && (
                <div className="card px-4 py-3">
                  <h3 className="text-sm font-semibold">{entry.kind === 'universal' ? `${offset} all year` : `${entry.abbreviation} all year (no DST)`}</h3>
                  <RegionList regions={entry.yearRoundRegions} />
                </div>
              )}
              {entry.alsoMeans && entry.alsoMeans.length > 0 && (
                <p className="text-xs leading-relaxed text-muted sm:col-span-2 lg:col-span-1">
                  Not to be confused with: {entry.alsoMeans.map((m) => `${m.name} (${formatOffset(m.offsetMinutes)})`).join('; ')}.
                </p>
              )}
            </div>
          </Section>
        </div>

        {cities.length > 0 && (
          <Section id="cities" title={`Major Cities in ${entry.referenceLabel.split(' (')[0]}${yearRoundCities.length && seasonalCities.length ? ` and ${entry.abbreviation}` : ''}`} className="mt-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {cities.map((city) => (
                <CityCard key={city.slug} city={city} renderedAt={renderedAt} layout="stacked" />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Each city shows its own current abbreviation, so places on daylight saving time are labelled accordingly.</p>
          </Section>
        )}

        <Section id="comparison" title={`${entry.abbreviation} vs Other Time Zones`} className="mt-8">
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <caption className="sr-only">
                Difference between {entry.abbreviation} and related time zones, by definition and right now
              </caption>
              <thead className="bg-surface text-left text-xs text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Comparison</th>
                  <th scope="col" className="px-4 py-2 font-medium">By definition</th>
                  <th scope="col" className="px-4 py-2 font-medium">Right now (local clocks)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {related.map((other) => (
                  <tr key={other.slug}>
                    <th scope="row" className="px-4 py-2.5 text-left font-normal">
                      {entry.abbreviation} <span aria-hidden="true">→</span>
                      <span className="sr-only">to</span>{' '}
                      <Link href={routes.timezone(other.slug)} className="inline-block py-3.5 -my-3.5 font-medium text-heading hover:text-primary hover:underline">
                        {other.abbreviation}
                      </Link>
                    </th>
                    <td className="tabular px-4 py-2.5 text-heading">{formatSignedDifference(other.offsetMinutes - entry.offsetMinutes)}</td>
                    <td className="tabular px-4 py-2.5 text-body">
                      {other.referenceZone === entry.referenceZone ? (
                        'Same region'
                      ) : (
                        <LiveDifference fromZone={entry.referenceZone} toZone={other.referenceZone} renderedAt={renderedAt} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">
            “By definition” compares the fixed offsets of the abbreviations. “Right now” compares the actual local time in each region today, including daylight saving time.
          </p>
        </Section>

        {converters.length > 0 && (
          <Section id="converters" title={`${entry.abbreviation} converters`} className="mt-8">
            <LinkList
              columns={3}
              items={converters.map((pair) => ({
                label: `${pair.fromSide.label} to ${pair.toSide.label}`,
                href: routes.convert(pair.from, pair.to),
                detail: `${pair.fromSide.name} → ${pair.toSide.name}`,
              }))}
            />
          </Section>
        )}

        {beforeFaqs}

        <Section id="faqs" title={`${entry.abbreviation} FAQs`} className="mt-8">
          <FAQ items={faqs} />
        </Section>
      </div>
    </>
  );
}
