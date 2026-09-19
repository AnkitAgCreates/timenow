'use client';

import Link from 'next/link';
import { LiveTime } from '@/components/clock/LiveTime';
import { LiveZoneInfo } from '@/components/clock/LiveZoneInfo';
import { ZonePicker } from '@/components/converter/ZonePicker';
import { Icon } from '@/components/ui/Icon';
import { track } from '@/lib/analytics';
import { createPersistedStore, usePersisted } from '@/lib/clock/persisted';
import { useBrowserZone, useHydrated } from '@/lib/clock/stores';
import { isValidTimeZone } from '@/lib/time';

export type WorldClockEntry = { key: string; zone: string; label: string; detail: string; href?: string };

const isEntry = (e: unknown): e is WorldClockEntry =>
  typeof e === 'object' && e !== null && typeof (e as WorldClockEntry).zone === 'string' && typeof (e as WorldClockEntry).label === 'string' && isValidTimeZone((e as WorldClockEntry).zone);

const store = createPersistedStore<WorldClockEntry[]>('timenow:world-clock', (raw) => {
  if (!Array.isArray(raw)) return null;
  const entries = raw.filter(isEntry).slice(0, 30);
  return entries.length > 0 ? entries : null;
});

/**
 * Add/remove places and keep them in this browser. The server renders the
 * default list; after hydration the saved list (if any) replaces it.
 */
export function WorldClock({ defaults, renderedAt }: { defaults: WorldClockEntry[]; renderedAt: number }) {
  const hydrated = useHydrated();
  const browserZone = useBrowserZone();
  const saved = usePersisted(store);
  const entries = saved ?? defaults;

  const add = (choice: { zone: string; label: string; detail?: string }) => {
    if (entries.some((e) => e.zone === choice.zone && e.label === choice.label)) return;
    const entry: WorldClockEntry = { key: `${choice.zone}|${choice.label}`, zone: choice.zone, label: choice.label, detail: choice.detail ?? '' };
    store.set([...entries, entry].slice(0, 30));
    track('city_selected', { source: 'world_clock', zone: choice.zone });
  };
  const remove = (key: string) => store.set(entries.filter((e) => e.key !== key));
  const move = (key: string, direction: -1 | 1) => {
    const index = entries.findIndex((e) => e.key === key);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= entries.length) return;
    const next = [...entries];
    [next[index], next[target]] = [next[target]!, next[index]!];
    store.set(next);
  };

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <ZonePicker label="Add a city, time zone or UTC offset" value={{ zone: '', label: '' }} instant={renderedAt} onChange={add} />
      </div>

      <ol className="card divide-y divide-border" aria-label="World clock">
        {hydrated && browserZone && (
          <li className="flex items-center justify-between gap-3 bg-blue-surface px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-heading">Your time</p>
              <p className="truncate text-xs text-muted">
                {browserZone.replace(/_/g, ' ')} · <LiveZoneInfo timeZone={browserZone} field="abbreviation" renderedAt={renderedAt} /> <LiveTime timeZone={browserZone} kind="offset" />
              </p>
            </div>
            <div className="shrink-0 text-right">
              <LiveTime timeZone={browserZone} kind="time-short" className="tabular block text-xl font-semibold text-heading" />
              <LiveTime timeZone={browserZone} kind="date-weekday-short" className="block text-xs text-muted" />
            </div>
          </li>
        )}
        {entries.map((entry, index) => (
          <li key={entry.key} data-world-clock-row className="flex items-center gap-2 px-3 py-3 sm:px-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-heading">
                {entry.href ? (
                  <Link href={entry.href} className="hover:text-primary hover:underline">
                    {entry.label}
                  </Link>
                ) : (
                  entry.label
                )}
              </p>
              <p className="truncate text-xs text-muted">
                {entry.detail && `${entry.detail} · `}
                <LiveZoneInfo timeZone={entry.zone} field="abbreviation" renderedAt={renderedAt} /> <LiveTime timeZone={entry.zone} kind="offset" renderedAt={renderedAt} />
              </p>
            </div>
            <div className="shrink-0 text-right">
              <LiveTime timeZone={entry.zone} kind="time-short" className="tabular block text-xl font-semibold text-heading" />
              <LiveTime timeZone={entry.zone} kind="date-weekday-short" renderedAt={renderedAt} className="block text-xs text-muted" />
            </div>
            <div className="ml-1 flex shrink-0 flex-col">
              <button type="button" onClick={() => move(entry.key, -1)} disabled={index === 0} aria-label={`Move ${entry.label} up`} className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-heading disabled:opacity-30">
                <Icon name="chevron-down" className="size-4 rotate-180" />
              </button>
              <button type="button" onClick={() => move(entry.key, 1)} disabled={index === entries.length - 1} aria-label={`Move ${entry.label} down`} className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-heading disabled:opacity-30">
                <Icon name="chevron-down" className="size-4" />
              </button>
            </div>
            <button type="button" onClick={() => remove(entry.key)} aria-label={`Remove ${entry.label}`} className="ml-1 flex size-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-heading">
              <Icon name="x" className="size-4" />
            </button>
          </li>
        ))}
        {entries.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">No places yet. Add a city above.</li>}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>Saved in this browser only.</span>
        <button type="button" onClick={() => store.clear()} className="min-h-11 rounded-md px-3 font-medium text-primary hover:bg-blue-surface">
          Reset to default cities
        </button>
      </div>
    </div>
  );
}
