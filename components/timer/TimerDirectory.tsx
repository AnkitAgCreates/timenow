import Link from 'next/link';
import { TIMER_GROUP_LABELS, timerTitle } from '@/lib/content/timer';
import { getTimerPresetsByGroup, type TimerGroup } from '@/lib/data/timers';
import { routes } from '@/lib/routes';

const ORDER: TimerGroup[] = ['seconds', 'minutes', 'hours'];

/**
 * Every curated timer, grouped by seconds / minutes / hours. The hub shows
 * cards with taglines; timer pages show compact chips with the current one marked.
 */
export function TimerDirectory({ currentSlug, compact = false }: { currentSlug?: string; compact?: boolean }) {
  const groups = getTimerPresetsByGroup();
  return (
    <div className="space-y-6">
      {ORDER.map((group) => (
        <div key={group}>
          <h3 className="text-sm font-semibold text-heading">{TIMER_GROUP_LABELS[group].title}</h3>
          {!compact && <p className="mt-0.5 text-sm text-muted">{TIMER_GROUP_LABELS[group].blurb}</p>}
          {compact ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {groups[group].map((preset) =>
                preset.slug === currentSlug ? (
                  <li key={preset.slug}>
                    <span aria-current="page" className="inline-flex min-h-11 items-center rounded-md border border-primary bg-blue-surface px-3 text-sm font-medium text-primary">
                      {preset.label}
                    </span>
                  </li>
                ) : (
                  <li key={preset.slug}>
                    <Link
                      href={routes.timer(preset.slug)}
                      className="inline-flex min-h-11 items-center rounded-md border border-border bg-white px-3 text-sm font-medium text-heading hover:border-blue-border hover:text-primary"
                    >
                      {preset.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          ) : (
            <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groups[group].map((preset) => (
                <li key={preset.slug}>
                  <Link href={routes.timer(preset.slug)} className="card block h-full px-4 py-3 transition-shadow hover:border-blue-border hover:shadow-raised">
                    <span className="block text-sm font-semibold text-heading">{timerTitle(preset)}</span>
                    <span className="mt-1 block text-sm text-muted">{preset.tagline}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
