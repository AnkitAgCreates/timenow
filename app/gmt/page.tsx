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
  'Current GMT time (Greenwich Mean Time, UTC+0), updated live: whether the UK is on GMT or BST right now, GMT in your time zone, and every GMT offset.';

export const metadata = buildMetadata({
  title: 'GMT Time Now – Greenwich Mean Time & Offsets',
  description: DESCRIPTION,
  path: routes.gmtHub(),
  indexable: true,
});

export default function GmtHubPage() {
  const entry = getTimezone('gmt')!;
  const renderedAt = getRenderInstant();

  return (
    <TimezonePageBody
      entry={entry}
      renderedAt={renderedAt}
      path={routes.gmtHub()}
      description={DESCRIPTION}
      breadcrumbs={[
        { name: 'Home', path: routes.home() },
        { name: 'GMT', path: routes.gmtHub() },
      ]}
      afterHero={
        <Section id="your-time" title="GMT in your time zone" className="mt-6">
          <div className="card px-4 py-3">
            <OffsetToLocal offsetMinutes={0} label="GMT" />
          </div>
        </Section>
      }
      extraTabs={[{ id: 'offsets', label: 'GMT Offsets' }]}
      beforeFaqs={
        <Section id="offsets" title="Current time at every GMT offset" className="mt-8">
          <p className="-mt-1 mb-3 text-sm text-muted">
            GMT-5, GMT+1 and so on are the same offsets as UTC-5 and UTC+1. Each links to the page for that offset.
          </p>
          <OffsetsDirectory renderedAt={renderedAt} prefix="GMT" />
        </Section>
      }
    />
  );
}
