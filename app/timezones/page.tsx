import Link from 'next/link';
import { LiveTime } from '@/components/clock/LiveTime';
import { LiveZoneInfo } from '@/components/clock/LiveZoneInfo';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FAQ } from '@/components/ui/FAQ';
import { LinkList } from '@/components/ui/LinkList';
import { Section } from '@/components/ui/Section';
import { getAllTimezones } from '@/lib/data/timezones';
import { routes } from '@/lib/routes';
import { faqJsonLd, webPageJsonLd } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { formatOffset } from '@/lib/time';
import { getRenderInstant } from '@/lib/server/render-instant';
import type { TimeZoneEntry } from '@/types/data';

export const revalidate = 3600;

const TITLE = 'Time Zone Abbreviations';
const DESCRIPTION = 'EST, CST, PST, IST, GMT, UTC, CET, AEST, JST and 40 more abbreviations with their UTC offsets, the current time where each is used, and which one is in effect today.';

export const metadata = buildMetadata({
  title: 'Time Zone Abbreviations – Current Time & UTC Offsets',
  description: DESCRIPTION,
  path: routes.timezonesHub(),
  indexable: true,
});

/** Display groups in order; composite regions fold into their main group. */
const GROUPS: Array<{ title: string; regions: string[] }> = [
  { title: 'Universal', regions: ['Global'] },
  { title: 'North America', regions: ['North America', 'North America & Caribbean'] },
  { title: 'South America', regions: ['South America'] },
  { title: 'Europe', regions: ['Europe', 'Europe & Africa', 'Europe & Asia'] },
  { title: 'Middle East', regions: ['Middle East'] },
  { title: 'Africa', regions: ['Africa'] },
  { title: 'Asia', regions: ['Asia'] },
  { title: 'Oceania', regions: ['Oceania'] },
];

const FAQS = [
  {
    question: 'Why can one abbreviation mean two different time zones?',
    answer: 'Abbreviations were never standardised. CST is Central Standard Time in North America (UTC−6), China Standard Time (UTC+8) and Cuba Standard Time (UTC−5); IST is India (UTC+5:30), Ireland (UTC+1) and Israel (UTC+2). Each page here states which meaning it covers, and the converter uses unambiguous IANA zones underneath.',
  },
  {
    question: 'Is a place on EST or EDT right now?',
    answer: 'The card for each abbreviation shows the abbreviation actually in effect in that region today. Most of the eastern United States is on EDT from March to November and EST the rest of the year; the EST page explains both and shows the exact UTC−5 time as well.',
  },
  {
    question: 'What is the difference between UTC and GMT?',
    answer: 'They share the same offset (UTC+0) and never change for daylight saving. UTC is the scientific standard used by computers and aviation; GMT is the older civil name, still used in the UK in winter. The UK switches to BST (UTC+1) in summer, when it is no longer on GMT.',
  },
  {
    question: 'Which abbreviation should I use in an invitation?',
    answer: 'Prefer a city and a UTC offset, for example “3 PM New York (UTC−4)”, or send a converter or meeting-planner link. If you use an abbreviation, use the one in effect on that date (EDT in July, EST in January).',
  },
];

function ZoneCard({ tz, renderedAt }: { tz: TimeZoneEntry; renderedAt: number }) {
  return (
    <Link href={routes.timezone(tz.slug)} className="card flex items-center justify-between gap-3 px-4 py-3 hover:border-blue-border">
      <span className="min-w-0">
        <span className="block font-semibold text-heading">
          {tz.abbreviation} <span className="font-normal text-muted">· {formatOffset(tz.offsetMinutes)}</span>
        </span>
        <span className="block truncate text-sm text-body">{tz.name}</span>
      </span>
      <span className="shrink-0 text-right">
        <LiveTime timeZone={tz.referenceZone} kind="time-short" className="tabular block font-semibold text-heading" />
        <LiveZoneInfo timeZone={tz.referenceZone} field="abbreviation" renderedAt={renderedAt} className="block text-xs text-muted" />
      </span>
    </Link>
  );
}

export default function TimezonesHubPage() {
  const renderedAt = getRenderInstant();
  const timezones = getAllTimezones();
  const groups = GROUPS.map((group) => ({ ...group, entries: timezones.filter((tz) => group.regions.includes(tz.region)) })).filter((g) => g.entries.length > 0);
  const listed = new Set(groups.flatMap((g) => g.entries.map((e) => e.slug)));
  const other = timezones.filter((tz) => !listed.has(tz.slug));

  return (
    <>
      <JsonLd data={[webPageJsonLd({ name: TITLE, description: DESCRIPTION, path: routes.timezonesHub() }), faqJsonLd(FAQS)]} />
      <div className="container-page pt-4 md:pt-6">
        <Breadcrumbs items={[{ name: 'Home', path: routes.home() }, { name: 'Time Zones', path: routes.timezonesHub() }]} />
        <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{TITLE}</h1>
        <p className="mt-1 max-w-2xl text-body">
          {timezones.length} abbreviations by region. Each card shows the current time in the region that uses the abbreviation, with the abbreviation in effect there today — so CST shows CDT in summer.
        </p>

        <div className="mt-6 space-y-8">
          {groups.map((group) => (
            <Section key={group.title} id={group.title.toLowerCase().replace(/\s+/g, '-')} title={group.title} headingLevel="h2">
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.entries.map((tz) => (
                  <li key={tz.slug}>
                    <ZoneCard tz={tz} renderedAt={renderedAt} />
                  </li>
                ))}
              </ul>
            </Section>
          ))}
          {other.length > 0 && (
            <Section id="other" title="Other">
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {other.map((tz) => (
                  <li key={tz.slug}>
                    <ZoneCard tz={tz} renderedAt={renderedAt} />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <div className="mx-auto max-w-4xl space-y-8">
            <Section id="offsets" title="By UTC offset instead">
              <LinkList
                columns={3}
                items={[
                  { label: 'UTC time now', href: routes.utcHub(), detail: 'Every offset from UTC−10 to UTC+13:45' },
                  { label: 'GMT time now', href: routes.gmtHub(), detail: 'Greenwich Mean Time and BST' },
                  { label: 'Current time by country', href: routes.countriesHub(), detail: '96 countries' },
                  { label: 'Time zone converter', href: routes.converterHub(), detail: 'Convert between any two zones' },
                  { label: 'World clock', href: routes.worldClock(), detail: 'Your own list of places' },
                  { label: 'Meeting planner', href: routes.meetingPlanner(), detail: 'Hours that work for everyone' },
                ]}
              />
            </Section>

            <Section id="faqs" title="Time zone abbreviation FAQs">
              <FAQ items={FAQS} />
            </Section>
          </div>
        </div>
      </div>
    </>
  );
}
