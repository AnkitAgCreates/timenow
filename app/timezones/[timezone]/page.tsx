import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TimezonePageBody, timezonePageTitle } from '@/components/timezone/TimezonePageBody';
import { timezoneMetaDescription } from '@/lib/content/timezone';
import { getAllTimezones, getTimezone } from '@/lib/data/timezones';
import { isTimezoneHubSlug, routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';
import { fitTitle } from '@/lib/seo/title';
import { getRenderInstant } from '@/lib/server/render-instant';
import { formatOffset } from '@/lib/time';

export const revalidate = 3600;
export const dynamicParams = false;

type Props = { params: Promise<{ timezone: string }> };

// UTC and GMT are served at /utc/ and /gmt/ (with 308 redirects from here).
export function generateStaticParams() {
  return getAllTimezones()
    .filter((tz) => !isTimezoneHubSlug(tz.slug))
    .map((tz) => ({ timezone: tz.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = getTimezone((await params).timezone);
  if (!entry) return {};
  return buildMetadata({
    title: fitTitle(
      fitTitle(`${timezonePageTitle(entry)} – Current Time, ${formatOffset(entry.offsetMinutes)} & DST`, `${entry.abbreviation} Time Now – ${entry.name.replace(/ Time$/, '')}, ${formatOffset(entry.offsetMinutes)}`),
      `${entry.abbreviation} Time Now – ${formatOffset(entry.offsetMinutes)}`,
    ),
    description: timezoneMetaDescription(entry),
    path: routes.timezone(entry.slug),
    indexable: entry.indexable,
  });
}

export default async function TimezonePage({ params }: Props) {
  const slug = (await params).timezone;
  const entry = getTimezone(slug);
  if (!entry || isTimezoneHubSlug(slug)) notFound();

  const renderedAt = getRenderInstant();
  const path = routes.timezone(entry.slug);

  return (
    <TimezonePageBody
      entry={entry}
      renderedAt={renderedAt}
      path={path}
      breadcrumbs={[
        { name: 'Home', path: routes.home() },
        { name: 'Time Zones', path: routes.timezonesHub() },
        { name: entry.abbreviation, path },
      ]}
    />
  );
}
