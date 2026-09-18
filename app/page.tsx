import Link from 'next/link';
import { CityCard } from '@/components/city/CityCard';
import { ClockPanel } from '@/components/clock/ClockPanel';
import { LiveTime } from '@/components/clock/LiveTime';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { JsonLd } from '@/components/seo/JsonLd';
import { ToolCard } from '@/components/tools/ToolCard';
import { Icon } from '@/components/ui/Icon';
import { Section } from '@/components/ui/Section';
import { getPopularCities } from '@/lib/data/cities';
import { getPopularTimezones } from '@/lib/data/timezones';
import { getHomeTools } from '@/lib/data/tools';
import { routes } from '@/lib/routes';
import { webPageJsonLd, websiteJsonLd } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { getRenderInstant } from '@/lib/server/render-instant';

// Server-rendered abbreviations on city cards stay fresh around DST changes;
// clients recompute them live after hydration regardless.
export const revalidate = 3600;

const TITLE = 'Current Time Now – Exact Local Time, World Clocks & Time Zones';
const DESCRIPTION =
  'See the exact current time in your time zone, with live clocks for major cities, time zone abbreviations like EST, CST and IST, a DST-aware converter and free timers.';

export const metadata = buildMetadata({ title: TITLE, absoluteTitle: true, description: DESCRIPTION, path: '/', indexable: true });

export default function HomePage() {
  const renderedAt = getRenderInstant();
  const cities = getPopularCities();
  const timezones = getPopularTimezones();
  const tools = getHomeTools();

  return (
    <>
      <JsonLd data={[websiteJsonLd(), webPageJsonLd({ name: TITLE, description: DESCRIPTION, path: '/' })]} />

      <div className="bg-gradient-to-b from-blue-surface to-white">
        <div className="container-page pb-8 pt-6 md:pb-12 md:pt-10">
          <div className="mx-auto max-w-xl text-center">
            <h1 className="text-2xl font-bold tracking-tight md:text-[2rem]">Current Time Now</h1>
            <p className="mt-1.5 text-sm text-body md:text-base">Accurate time for any place in the world.</p>
            <GlobalSearch size="lg" className="mt-4 md:mt-5" />
          </div>

          <ClockPanel
            id="local-clock"
            renderedAt={renderedAt}
            className="mt-6 md:mt-8"
            meta={
              <p className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-heading">
                <Icon name="pin" className="size-4 text-primary" />
                <LiveTime kind="zone-city" />
                <span className="font-normal text-muted">· your time zone</span>
              </p>
            }
          />
        </div>
      </div>

      <div className="container-page space-y-8 md:space-y-10">
        <Section id="popular-cities" title="Popular Cities" action={{ label: 'See all', href: routes.worldClock() }}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
            {cities.map((city) => (
              <CityCard key={city.slug} city={city} renderedAt={renderedAt} />
            ))}
          </div>
        </Section>

        <Section id="popular-time-zones" title="Popular Time Zones" action={{ label: 'See all', href: routes.timezonesHub() }}>
          <ul className="flex flex-wrap gap-2">
            {timezones.map((tz) => (
              <li key={tz.slug}>
                <Link
                  href={routes.timezone(tz.slug)}
                  title={tz.name}
                  className="inline-flex h-11 min-w-16 items-center justify-center rounded-lg border border-border bg-white px-4 text-sm font-semibold text-heading shadow-card hover:border-blue-border hover:text-primary"
                >
                  {tz.abbreviation}
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="time-tools" title="Time Tools">
          <ul className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
            {tools.map((tool) => (
              <li key={tool.key}>
                <ToolCard tool={tool} />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-center">
            <Link href={routes.tools()} className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all tools <Icon name="arrow-right" className="size-4" />
            </Link>
          </p>
        </Section>

        <section aria-labelledby="how-it-works" className="rounded-xl border border-border bg-surface px-4 py-5 md:px-6">
          <h2 id="how-it-works" className="text-base font-bold">
            How the time on this page is calculated
          </h2>
          <ul className="mt-3 grid grid-cols-1 gap-3 text-sm leading-relaxed text-body md:grid-cols-3">
            <li>
              <strong className="text-heading">No location access needed.</strong> Your time zone comes from your browser’s settings, not GPS.
            </li>
            <li>
              <strong className="text-heading">Daylight saving handled.</strong> Offsets and abbreviations come from the IANA time zone database for
              the exact moment shown.
            </li>
            <li>
              <strong className="text-heading">Based on your device clock.</strong> If your device clock is wrong, the time shown will be too.
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
