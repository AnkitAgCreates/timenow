import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Callout } from '@/components/ui/Callout';
import { FAQ } from '@/components/ui/FAQ';
import { LinkList, type LinkItem } from '@/components/ui/LinkList';
import { Section } from '@/components/ui/Section';
import {
  clockChangeFaqs,
  clockChangesDescription,
  daysUntil,
  describeNight,
  describeShift,
  getCountryChangeRows,
  getDifferenceShifts,
  getNoChangeCountries,
  getUpcomingChanges,
  guideYears,
  nextChangesFor,
  type ClockChange,
  type ClockMove,
  type MovingCountry,
} from '@/lib/content/clock-changes';
import { getPublishedCountries } from '@/lib/data/countries';
import { routes } from '@/lib/routes';
import { faqJsonLd, webPageJsonLd } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { getRenderInstant } from '@/lib/server/render-instant';

export const revalidate = 3600;

const PATH = routes.clockChanges();
const H1 = 'When do the clocks change?';

export async function generateMetadata(): Promise<Metadata> {
  const now = getRenderInstant();
  const [y1, y2] = guideYears(now);
  return buildMetadata({ title: `When Do the Clocks Change? ${y1}–${y2} DST Dates`, description: clockChangesDescription(now), path: PATH, indexable: true });
}

const noYear = (change: ClockChange | null) => (change ? change.dateShort.replace(/, \d{4}$/, '') : '–');

function CountryLinks({ countries, limit = 10 }: { countries: MovingCountry[]; limit?: number }) {
  const shown = countries.slice(0, limit);
  return (
    <>
      {shown.map(({ country, place }, i) => (
        <span key={`${country.code}-${place}`}>
          <Link href={routes.country(country.slug)} className="text-primary hover:underline">
            {country.name}
          </Link>
          {place && <span className="text-muted"> ({place})</span>}
          {i < shown.length - 1 ? ', ' : ''}
        </span>
      ))}
      {countries.length > limit ? ` and ${countries.length - limit} more` : ''}
    </>
  );
}

function MoveList({ moves }: { moves: ClockMove[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {moves.map((move) => (
        <li key={`${move.from}-${move.to}-${move.abbreviations}`} className="text-sm leading-relaxed text-body">
          <span className="tabular font-semibold text-heading">
            {move.from} → {move.to}
          </span>{' '}
          <span className="text-muted">({move.abbreviations})</span>: <CountryLinks countries={move.countries} />
        </li>
      ))}
    </ul>
  );
}

export default function ClockChangesPage() {
  const now = getRenderInstant();
  const [y1, y2] = guideYears(now);
  const upcoming = getUpcomingChanges(now);
  const [next, ...later] = upcoming;
  const rows = getCountryChangeRows(now);
  const noChange = getNoChangeCountries(now);
  const shifts = getDifferenceShifts(now);
  const london = nextChangesFor('london', now);
  const newYork = nextChangesFor('new-york', now);
  const faqs = clockChangeFaqs(now);
  const total = getPublishedCountries().length;

  const related: LinkItem[] = [
    { label: 'British Summer Time (BST)', href: routes.timezone('bst'), detail: 'UK summer time' },
    { label: 'Central European Summer Time (CEST)', href: routes.timezone('cest'), detail: 'Most of the EU' },
    { label: 'Eastern Daylight Time (EDT)', href: routes.timezone('edt'), detail: 'New York, Toronto' },
    { label: 'Pacific Daylight Time (PDT)', href: routes.timezone('pdt'), detail: 'Los Angeles, Vancouver' },
    { label: 'Australian Eastern Daylight Time (AEDT)', href: routes.timezone('aedt'), detail: 'Sydney, Melbourne' },
    { label: 'New York to London converter', href: routes.convert('new-york', 'london'), detail: 'Any date, DST-aware' },
    { label: 'Meeting planner', href: routes.meetingPlanner(), detail: 'Find hours that work across zones' },
    { label: 'Current time by country', href: routes.countriesHub(), detail: `${total} countries` },
  ];

  return (
    <>
      <JsonLd data={[webPageJsonLd({ name: H1, description: clockChangesDescription(now), path: PATH }), faqJsonLd(faqs)]} />

      <div className="container-page pt-4 md:pt-6">
        <Breadcrumbs
          items={[
            { name: 'Home', path: routes.home() },
            { name: 'Clock changes', path: PATH },
          ]}
        />

        <div className="mx-auto mt-3 max-w-4xl">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{H1}</h1>
          <p className="mt-2 max-w-2xl text-body md:text-lg">
            Every daylight saving time change in {y1} and {y2} for the {total} countries on this site, worked out from the IANA time zone database, with local times and
            what each change does to time differences.
          </p>

          {next && (
            <section data-next-change aria-labelledby="next-change-title" className="mt-6 rounded-xl border border-blue-border bg-blue-surface p-5 md:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Next clock change · {daysUntil(now, next.instant)}</p>
              <h2 id="next-change-title" className="mt-1 text-xl font-bold tracking-tight md:text-2xl">
                {next.dateLabel}
              </h2>
              <p className="mt-1 text-body">
                Clocks go <strong className="text-heading">{next.direction}</strong> {describeShift(next.shiftMinutes)} in {next.countryCount}{' '}
                {next.countryCount === 1 ? 'country' : 'countries'}.
              </p>
              <MoveList moves={next.moves} />
            </section>
          )}

          <div className="mt-8 space-y-10">
            {later.length > 0 && (
              <Section id="upcoming" title="Coming up">
                <ol className="card divide-y divide-border" data-upcoming>
                  {later.map((moment) => (
                    <li key={`${moment.dateShort}-${moment.direction}`} className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
                      <div>
                        <p className="tabular font-semibold text-heading">{moment.dateShort}</p>
                        <p className="text-xs text-muted">
                          {moment.direction === 'back' ? 'Back' : 'Forward'} {describeShift(moment.shiftMinutes)} · {daysUntil(now, moment.instant)}
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed text-body">
                        <CountryLinks countries={moment.moves.flatMap((m) => m.countries)} limit={8} />
                      </p>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {(london?.back || newYork?.forward) && (
              <Section id="night" title="What happens on the night">
                <div className="space-y-3 text-body">
                  {london?.back && <p>{describeNight(london.city, london.back)}</p>}
                  {newYork?.forward && <p>{describeNight(newYork.city, newYork.forward)}</p>}
                </div>
                <Callout title="Most devices change by themselves" className="mt-4">
                  Phones and computers that set their time automatically switch on their own, and so do the clocks on this site. Check alarms, timers and anything
                  scheduled for the hour that repeats or disappears.
                </Callout>
              </Section>
            )}

            {shifts.length > 0 && (
              <Section id="differences" title="Time differences that shift">
                <p className="-mt-1 mb-3 text-sm text-muted">
                  Countries change on different dates, and the northern and southern hemispheres change in opposite seasons, so the gap between two cities moves
                  during the year. Short in-between spells are marked.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {shifts.map((shift) => (
                    <div key={`${shift.fromCity}-${shift.toCity}`} className="card px-4 py-3">
                      <h3 className="font-semibold text-heading">
                        {shift.href ? (
                          <Link href={shift.href} className="hover:text-primary hover:underline">
                            {shift.fromCity} and {shift.toCity}
                          </Link>
                        ) : (
                          `${shift.fromCity} and ${shift.toCity}`
                        )}
                      </h3>
                      <ul className="mt-2 space-y-1.5 text-sm">
                        {shift.periods.map((period) => (
                          <li key={period.start} className="flex flex-wrap items-baseline justify-between gap-x-3">
                            <span className="tabular text-muted">
                              {period.startLabel ? `${period.startLabel} – ${period.endLabel ?? 'onward'}` : `Until ${period.endLabel}`}
                            </span>
                            <span className={period.brief ? 'font-semibold text-heading' : 'text-body'}>
                              {period.sentence}
                              {period.lengthLabel && (
                                <span className="ml-1.5 rounded bg-warning-surface px-1.5 py-0.5 text-xs font-medium text-warning-text">for {period.lengthLabel}</span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section id="by-country" title="Clock changes by country">
              <p className="-mt-1 mb-3 text-sm text-muted">
                {rows.length} of {total} countries change their clocks. Dates are local; the clocks move in the early hours of the morning.
              </p>
              {/* Phones: one card per country (a five-column table is unreadable at 375px). */}
              <ul className="space-y-2 sm:hidden">
                {rows.map((r) => (
                  <li key={r.country.code} data-change-row={r.country.code} className="card px-4 py-3">
                    <Link href={routes.country(r.country.slug)} className="font-semibold text-heading hover:text-primary">
                      {r.country.name}
                    </Link>
                    <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
                      {r.years.map((y) => (
                        <div key={y.year} className="contents">
                          <dt className="tabular text-muted">{y.year}</dt>
                          <dd className="tabular text-body">
                            Forward {noYear(y.forward)} · Back {noYear(y.back)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {r.notes.length > 0 && <p className="mt-1.5 text-xs text-muted">{r.notes.join(' ')}</p>}
                  </li>
                ))}
              </ul>
              <div className="card hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[40rem] text-sm">
                  <caption className="sr-only">
                    Dates when the clocks go forward and back in {y1} and {y2}, by country
                  </caption>
                  <thead className="bg-surface text-left text-xs text-muted">
                    <tr>
                      <th scope="col" className="px-4 py-2 font-medium">
                        Country
                      </th>
                      <th scope="col" className="px-4 py-2 font-medium">
                        {y1} forward
                      </th>
                      <th scope="col" className="px-4 py-2 font-medium">
                        {y1} back
                      </th>
                      <th scope="col" className="px-4 py-2 font-medium">
                        {y2} forward
                      </th>
                      <th scope="col" className="px-4 py-2 font-medium">
                        {y2} back
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((r) => (
                      <tr key={r.country.code} data-change-row={r.country.code}>
                        <th scope="row" className="px-4 py-2.5 text-left align-top font-medium text-heading">
                          <Link href={routes.country(r.country.slug)} className="hover:text-primary hover:underline">
                            {r.country.name}
                          </Link>
                          {r.notes.length > 0 && <span className="mt-0.5 block max-w-xs text-xs font-normal text-muted">{r.notes.join(' ')}</span>}
                        </th>
                        {r.years.flatMap((y) => [y.forward, y.back]).map((change, i) => (
                          <td key={i} className="tabular whitespace-nowrap px-4 py-2.5 align-top text-body" title={change?.dateLabel}>
                            {noYear(change)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section id="no-change" title="Countries that don't change their clocks">
              <p className="-mt-1 mb-3 text-sm text-muted">These {noChange.length} countries keep the same time all year.</p>
              <ul className="flex flex-wrap gap-2" data-no-change>
                {noChange.map((country) => (
                  <li key={country.code}>
                    <Link
                      href={routes.country(country.slug)}
                      className="inline-flex min-h-11 items-center rounded-md border border-border bg-white px-3 text-sm font-medium text-heading hover:border-blue-border hover:text-primary md:min-h-9"
                    >
                      {country.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="faqs" title="Clock change FAQs">
              <FAQ items={faqs} />
            </Section>

            <Section id="related" title="Related">
              <LinkList items={related} columns={2} />
            </Section>
          </div>
        </div>
      </div>
    </>
  );
}
