import { TimeConverter } from '@/components/converter/TimeConverter';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { LinkList } from '@/components/ui/LinkList';
import { Section } from '@/components/ui/Section';
import { getAllConverterPairs } from '@/lib/data/converters';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';
import { getRenderInstant } from '@/lib/server/render-instant';

export const revalidate = 3600;

// Converter hub SEO is a Sprint 4 deliverable; functional now, noindex until then.
export const metadata = buildMetadata({
  title: 'Time Zone Converter – Convert Time Between Zones',
  description: 'Convert a date and time between time zones with daylight saving time applied for the selected date.',
  path: routes.converterHub(),
  indexable: false,
});

export default function ConverterHubPage() {
  const renderedAt = getRenderInstant();
  return (
    <div className="container-page pt-4 md:pt-6">
      <Breadcrumbs items={[{ name: 'Home', path: routes.home() }, { name: 'Converter', path: routes.converterHub() }]} />
      <div className="mx-auto mt-3 max-w-xl">
        <h1 className="text-center text-2xl font-bold tracking-tight md:text-3xl">Time Zone Converter</h1>
        <p className="mt-1.5 text-center text-sm text-muted">Results use each zone’s real rules on the date you choose.</p>
        <div className="card mt-5 p-4">
          <TimeConverter defaultFrom="America/New_York" defaultTo="Asia/Kolkata" renderedAt={renderedAt} />
        </div>
      </div>
      <Section id="popular-conversions" title="Popular conversions" className="mx-auto mt-8 max-w-4xl">
        <LinkList
          columns={3}
          items={getAllConverterPairs().map((pair) => ({
            label: `${pair.fromZone.abbreviation} to ${pair.toZone.abbreviation}`,
            href: routes.convert(pair.from, pair.to),
            detail: `${pair.fromZone.name} → ${pair.toZone.name}`,
          }))}
        />
      </Section>
    </div>
  );
}
