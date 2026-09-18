import Link from 'next/link';
import { LiveTime } from '@/components/clock/LiveTime';
import { LiveZoneInfo } from '@/components/clock/LiveZoneInfo';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAllTimezones } from '@/lib/data/timezones';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';
import { formatOffset } from '@/lib/time';
import { getRenderInstant } from '@/lib/server/render-instant';

export const revalidate = 3600;

// Hub pages are functional in Sprint 1 but stay noindex until their SEO sprint.
export const metadata = buildMetadata({
  title: 'Time Zones – Abbreviations, UTC Offsets & Current Time',
  description: 'Current time for common time zone abbreviations such as UTC, GMT, EST, CST, PST and IST, with their UTC offsets and daylight saving rules.',
  path: routes.timezonesHub(),
  indexable: false,
});

export default function TimezonesHubPage() {
  const renderedAt = getRenderInstant();
  const timezones = getAllTimezones();
  return (
    <div className="container-page pt-4 md:pt-6">
      <Breadcrumbs items={[{ name: 'Home', path: routes.home() }, { name: 'Time Zones', path: routes.timezonesHub() }]} />
      <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">Time Zones</h1>
      <p className="mt-1 text-body">Each abbreviation shows the current time in the region that uses it, with that region’s real abbreviation today.</p>
      <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {timezones.map((tz) => (
          <li key={tz.slug}>
            <Link href={routes.timezone(tz.slug)} className="card flex items-center justify-between gap-3 px-4 py-3 hover:border-blue-border">
              <span className="min-w-0">
                <span className="block font-semibold text-heading">
                  {tz.abbreviation} <span className="font-normal text-muted">· {formatOffset(tz.offsetMinutes)}</span>
                </span>
                <span className="block truncate text-sm text-body">{tz.name}</span>
              </span>
              <span className="text-right">
                <LiveTime timeZone={tz.referenceZone} kind="time-short" className="tabular block font-semibold text-heading" />
                <LiveZoneInfo timeZone={tz.referenceZone} field="abbreviation" renderedAt={renderedAt} className="block text-xs text-muted" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
