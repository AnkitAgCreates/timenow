import { CityCard } from '@/components/city/CityCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FAQ } from '@/components/ui/FAQ';
import { LinkList } from '@/components/ui/LinkList';
import { Section } from '@/components/ui/Section';
import { WorldClock, type WorldClockEntry } from '@/components/world-clock/WorldClock';
import { WORLD_CLOCK_HOW_TO, WORLD_CLOCK_TITLE, worldClockDescription, worldClockFaqs } from '@/lib/content/world-clock';
import { getCity, getComparisonCities, getPopularCities } from '@/lib/data/cities';
import { routes } from '@/lib/routes';
import { faqJsonLd, webApplicationJsonLd } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { getRenderInstant } from '@/lib/server/render-instant';

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: 'World Clock – Current Time in Cities Around the World',
  description: worldClockDescription(),
  path: routes.worldClock(),
  indexable: true,
});

const DEFAULT_SLUGS = ['new-york', 'london', 'paris', 'dubai', 'new-delhi', 'singapore', 'tokyo', 'sydney'];

export default function WorldClockPage() {
  const renderedAt = getRenderInstant();
  const faqs = worldClockFaqs();
  const defaults: WorldClockEntry[] = DEFAULT_SLUGS.map(getCity)
    .filter((city) => city !== undefined)
    .map((city) => ({ key: `${city.timezone}|${city.name}`, zone: city.timezone, label: city.name, detail: [city.state, city.country].filter(Boolean).join(', '), href: routes.city(city.slug) }));
  const popular = [...getPopularCities(), ...getComparisonCities(getPopularCities()[0]!)].filter((city, index, all) => all.findIndex((c) => c.slug === city.slug) === index).slice(0, 12);

  return (
    <>
      <JsonLd data={[webApplicationJsonLd({ name: WORLD_CLOCK_TITLE, description: worldClockDescription(), path: routes.worldClock() }), faqJsonLd(faqs)]} />
      <div className="container-page pt-4 md:pt-6">
        <Breadcrumbs items={[{ name: 'Home', path: routes.home() }, { name: 'World Clock', path: routes.worldClock() }]} />
        <div className="mx-auto mt-3 max-w-3xl">
          <h1 className="text-center text-2xl font-bold tracking-tight md:text-3xl">{WORLD_CLOCK_TITLE}</h1>
          <p className="mx-auto mt-1.5 max-w-xl text-center text-sm text-muted md:text-base">
            Current time in the places you care about. Add cities, time zones or UTC offsets; your list stays on this device.
          </p>
          <div className="mt-5">
            <WorldClock defaults={defaults} renderedAt={renderedAt} />
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-4xl space-y-8">
          <Section id="popular" title="Popular cities right now" action={{ label: 'All countries', href: routes.countriesHub() }}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
              {popular.map((city) => (
                <CityCard key={city.slug} city={city} renderedAt={renderedAt} showDate />
              ))}
            </div>
          </Section>

          <Section id="how-to" title="How to use the world clock">
            <ol className="card divide-y divide-border">
              {WORLD_CLOCK_HOW_TO.map((step, index) => (
                <li key={step.title} className="flex gap-3 px-4 py-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-surface text-sm font-semibold text-primary">{index + 1}</span>
                  <span>
                    <span className="block text-sm font-semibold text-heading">{step.title}</span>
                    <span className="block text-sm text-body">{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="browse" title="Browse by time zone">
            <LinkList
              columns={3}
              items={[
                { label: 'Current time by country', href: routes.countriesHub(), detail: '96 countries' },
                { label: 'Time zone abbreviations', href: routes.timezonesHub(), detail: 'EST, CST, PST, IST, CET …' },
                { label: 'UTC time now', href: routes.utcHub(), detail: 'Every UTC offset' },
                { label: 'Time zone converter', href: routes.converterHub(), detail: 'Convert a specific time' },
                { label: 'Meeting planner', href: routes.meetingPlanner(), detail: 'Find hours that work for everyone' },
              ]}
            />
          </Section>

          <Section id="faqs" title="World clock FAQs">
            <FAQ items={faqs} />
          </Section>
        </div>
      </div>
    </>
  );
}
