import Link from 'next/link';
import { LiveTime } from '@/components/clock/LiveTime';
import { LiveZoneInfo } from '@/components/clock/LiveZoneInfo';
import { routes } from '@/lib/routes';
import type { City } from '@/types/data';

/** Deterministic artwork variant per city so cards don't all look identical. */
function skylineClass(slug: string) {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 2 === 0 ? 'skyline' : 'skyline skyline-alt';
}

/**
 * City card with live local time and abbreviation.
 * layout="responsive": horizontal row on mobile, stacked card from `sm` (Visual PRD).
 */
export function CityCard({
  city,
  renderedAt,
  layout = 'responsive',
  showDate = false,
}: {
  city: City;
  renderedAt: number;
  layout?: 'responsive' | 'stacked';
  showDate?: boolean;
}) {
  const stacked = layout === 'stacked';
  return (
    <Link
      href={routes.city(city.slug)}
      className={`card group flex overflow-hidden transition-shadow hover:border-blue-border hover:shadow-raised ${
        stacked ? 'flex-col' : 'flex-row items-center sm:flex-col sm:items-stretch'
      }`}
    >
      <span
        aria-hidden="true"
        className={`${skylineClass(city.slug)} block shrink-0 ${stacked ? 'h-16 w-full' : 'h-14 w-20 rounded-md sm:h-16 sm:w-full sm:rounded-none'} ${stacked ? '' : 'ml-2 sm:ml-0'}`}
      />
      <span className={`flex min-w-0 flex-1 ${stacked ? 'flex-col px-3 py-2.5' : 'items-center justify-between gap-2 px-3 py-2.5 sm:flex-col sm:items-start sm:justify-start sm:gap-0'}`}>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-heading group-hover:text-primary">{city.name}</span>
          <LiveTime timeZone={city.timezone} kind="time-short" className="tabular block text-sm text-body" />
          {showDate && <LiveTime timeZone={city.timezone} kind="date-weekday-short" renderedAt={renderedAt} className="block text-xs text-muted" />}
        </span>
        <LiveZoneInfo timeZone={city.timezone} field="abbreviation" renderedAt={renderedAt} className="shrink-0 text-xs font-medium text-muted" />
      </span>
    </Link>
  );
}
