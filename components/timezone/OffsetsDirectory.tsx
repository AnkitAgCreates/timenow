import Link from 'next/link';
import { LiveTime } from '@/components/clock/LiveTime';
import { getOffsetUsage } from '@/lib/content/offset';
import { getAllOffsetPages } from '@/lib/data/offsets';
import { routes } from '@/lib/routes';

/** Table of every curated UTC offset with its live time and an example region. */
export function OffsetsDirectory({ renderedAt, prefix = 'UTC' }: { renderedAt: number; prefix?: 'UTC' | 'GMT' }) {
  const pages = getAllOffsetPages();
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Current time at every {prefix} offset</caption>
        <thead className="bg-surface text-left text-xs text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium sm:px-4">Offset</th>
            <th scope="col" className="px-3 py-2 font-medium sm:px-4">Time now</th>
            <th scope="col" className="px-3 py-2 font-medium sm:px-4">Used by</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {pages.map((page) => {
            const usage = getOffsetUsage(page, renderedAt);
            const examples = usage
              .flatMap((u) => u.cities.slice(0, 1).map((c) => c.name))
              .slice(0, 3)
              .join(', ');
            const label = prefix === 'GMT' ? page.label.replace('UTC', 'GMT') : page.label;
            return (
              <tr key={page.slug}>
                <th scope="row" className="whitespace-nowrap px-3 py-2 text-left sm:px-4">
                  <Link href={routes.utcOffset(page.slug)} className="inline-block py-3.5 -my-3.5 font-semibold text-heading hover:text-primary hover:underline">
                    {label}
                  </Link>
                </th>
                <td className="tabular whitespace-nowrap px-3 py-2 text-heading sm:px-4">
                  <LiveTime timeZone={page.zoneId} kind="time-short" renderedAt={renderedAt} />
                </td>
                <td className="w-full px-3 py-2 text-body sm:px-4">{examples || usage[0]?.name || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
