import { OffsetToLocal } from '@/components/converter/OffsetToLocal';
import { OffsetsDirectory } from '@/components/timezone/OffsetsDirectory';
import { TimezonePageBody } from '@/components/timezone/TimezonePageBody';
import { Section } from '@/components/ui/Section';
import { getTimezone } from '@/lib/data/timezones';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';
import { getRenderInstant } from '@/lib/server/render-instant';

export const revalidate = 3600;

const DESCRIPTION =
  'Current UTC time (Coordinated Universal Time), updated live. See UTC in your own time zone, which places use UTC+0, and the current time at every UTC offset from UTC-12 to UTC+14.';

export const metadata = buildMetadata({
  title: 'UTC Time Now – Coordinated Universal Time (UTC+0) & All UTC Offsets',
  description: DESCRIPTION,
  path: routes.utcHub(),
  indexable: true,
});

export default function UtcHubPage() {
  const entry = getTimezone('utc')!;
  const renderedAt = getRenderInstant();

  return (
    <TimezonePageBody
      entry={entry}
      renderedAt={renderedAt}
      path={routes.utcHub()}
      description={DESCRIPTION}
      breadcrumbs={[
        { name: 'Home', path: routes.home() },
        { name: 'UTC', path: routes.utcHub() },
      ]}
      afterHero={
        <Section id="your-time" title="UTC in your time zone" className="mt-6">
          <div className="card px-4 py-3">
            <OffsetToLocal offsetMinutes={0} label="UTC" />
          </div>
        </Section>
      }
      extraTabs={[{ id: 'offsets', label: 'UTC Offsets' }]}
      beforeFaqs={
        <Section id="offsets" title="Current time at every UTC offset" className="mt-8">
          <p className="-mt-1 mb-3 text-sm text-muted">
            Every offset used somewhere in the world today, from UTC-12 to UTC+14 (including half- and quarter-hour offsets). Each links to a page with the places that use it.
          </p>
          <OffsetsDirectory renderedAt={renderedAt} />
        </Section>
      }
      extraFaqs={[
        {
          question: 'How do I find the current time in UTC?',
          answer:
            'The clock at the top of this page shows UTC now, computed from your device clock. UTC never changes for daylight saving time, so to convert it to your local time add your current UTC offset — the “UTC in your time zone” section does this for you.',
        },
      ]}
    />
  );
}
