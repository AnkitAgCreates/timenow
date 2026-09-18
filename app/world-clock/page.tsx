import { CityCard } from '@/components/city/CityCard';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAllCities } from '@/lib/data/cities';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';
import { getUTCOffset } from '@/lib/time';
import { getRenderInstant } from '@/lib/server/render-instant';

export const revalidate = 3600;

// The full World Clock (add/remove cities, saved locally) is Sprint 5. This
// interim page lists seeded cities and stays noindex until then.
export const metadata = buildMetadata({
  title: 'World Clock – Current Time in Major Cities',
  description: 'Live local time in major cities around the world, ordered by UTC offset.',
  path: routes.worldClock(),
  indexable: false,
});

export default function WorldClockPage() {
  const renderedAt = getRenderInstant();
  const cities = getAllCities().sort(
    (a, b) => getUTCOffset(a.timezone, renderedAt) - getUTCOffset(b.timezone, renderedAt) || a.name.localeCompare(b.name),
  );
  return (
    <div className="container-page pt-4 md:pt-6">
      <Breadcrumbs items={[{ name: 'Home', path: routes.home() }, { name: 'World Clock', path: routes.worldClock() }]} />
      <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">World Clock</h1>
      <p className="mt-1 text-body">Current local time in major cities, from west to east.</p>
      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {cities.map((city) => (
          <CityCard key={city.slug} city={city} renderedAt={renderedAt} showDate />
        ))}
      </div>
    </div>
  );
}
