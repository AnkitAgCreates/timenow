'use client';

import { useState } from 'react';
import { ZonePicker, type ZoneChoice } from '@/components/converter/ZonePicker';
import { Icon } from '@/components/ui/Icon';
import { track } from '@/lib/analytics';
import { useBrowserZone, useNow } from '@/lib/clock/stores';
import { formatDate, formatTime, getZoneLabel } from '@/lib/time';
import { parseClockTime } from '@/lib/tools/hours-calculator';
import { isoUtc, parseTimestamp, relativeTime, toSeconds, wallTimeToTimestamp } from '@/lib/tools/unix-timestamp';
import { parseIsoDate } from '@/lib/tools/date-difference';

const inputClass = 'tabular mt-1 h-11 w-full rounded-lg border border-border bg-white px-3 text-[15px] text-heading focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-heading"
    >
      <Icon name={copied ? 'check' : 'copy'} className="size-4" />
    </button>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="tabular truncate text-sm font-semibold text-heading">{value}</p>
      </div>
      <CopyButton value={value} label={label} />
    </div>
  );
}

/** `renderedAt` seeds the date → timestamp form so the first paint matches the server. */
export function UnixTimestamp({ renderedAt }: { renderedAt: number }) {
  const now = useNow();
  const browserZone = useBrowserZone();
  const [input, setInput] = useState('');
  const [zone, setZone] = useState<ZoneChoice>({ zone: 'UTC', label: 'UTC / GMT' });
  const [dateInput, setDateInput] = useState(() => isoUtc(renderedAt).slice(0, 10));
  const [timeInput, setTimeInput] = useState(() => isoUtc(renderedAt).slice(11, 16));
  const [used, setUsed] = useState(false);
  const markUsed = () => {
    if (!used) {
      setUsed(true);
      track('tool_selected', { tool: 'unix-timestamp' });
    }
  };

  const current = now ?? renderedAt;
  const parsed = input.trim() ? parseTimestamp(input) : null;
  const date = parseIsoDate(dateInput);
  const time = parseClockTime(timeInput);
  const fromDate = date && time ? wallTimeToTimestamp(date, time, zone.zone) : null;

  const describe = (instant: number) => {
    const local = browserZone ?? 'UTC';
    return [
      { label: 'ISO 8601 (UTC)', value: isoUtc(instant) },
      { label: `${zone.label}`, value: `${formatDate(instant, zone.zone, 'full')}, ${formatTime(instant, zone.zone, { seconds: true })} ${getZoneLabel(zone.zone, instant).abbreviation}` },
      { label: `Your time (${local})`, value: `${formatDate(instant, local, 'full')}, ${formatTime(instant, local, { seconds: true })} ${getZoneLabel(local, instant).abbreviation}` },
      { label: 'RFC 2822', value: new Date(instant).toUTCString() },
      { label: 'Seconds', value: String(toSeconds(instant)) },
      { label: 'Milliseconds', value: String(instant) },
      { label: 'Relative', value: relativeTime(instant, current) },
    ];
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-xs text-muted">Current Unix time (seconds)</p>
          <p data-unix-now className="tabular text-2xl font-bold text-heading">{now === null ? '—' : toSeconds(now)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { setInput(String(toSeconds(current))); markUsed(); }} className="inline-flex h-11 items-center rounded-lg border border-border bg-white px-4 text-sm font-medium text-heading hover:bg-surface">
            Use now
          </button>
          {now !== null && <CopyButton value={String(toSeconds(now))} label="current timestamp" />}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-semibold text-heading">Timestamp → date</h3>
        <label className="mt-2 block text-xs font-medium text-muted">
          Unix timestamp (seconds or milliseconds)
          <input type="text" inputMode="numeric" value={input} placeholder="1700000000" onChange={(e) => { setInput(e.target.value); markUsed(); }} autoComplete="off" className={inputClass} />
        </label>
        <div className="mt-3">
          <ZonePicker label="Show the date in" value={zone} instant={current} onChange={(choice) => { setZone(choice); markUsed(); }} />
        </div>
        <output data-unix-result aria-live="polite" className="mt-3 block divide-y divide-blue-border rounded-lg border border-blue-border bg-blue-surface px-4 py-2">
          {parsed ? (
            <>
              <p className="py-1.5 text-xs text-muted">Read as {parsed.unit}.</p>
              {describe(parsed.instant).map((row) => (
                <ResultRow key={row.label} label={row.label} value={row.value} />
              ))}
            </>
          ) : (
            <span className="block py-1.5 text-sm text-body">{input.trim() ? 'That is not a valid timestamp.' : 'Enter a timestamp, or press “Use now”.'}</span>
          )}
        </output>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-semibold text-heading">Date → timestamp</h3>
        <div className="mt-2 grid grid-cols-[1.2fr_1fr] gap-3">
          <label className="text-xs font-medium text-muted">
            Date
            <input type="date" value={dateInput} onChange={(e) => { setDateInput(e.target.value); markUsed(); }} className={inputClass} />
          </label>
          <label className="text-xs font-medium text-muted">
            Time
            <input type="time" value={timeInput} onChange={(e) => { setTimeInput(e.target.value); markUsed(); }} className={inputClass} />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">Interpreted in {zone.label} (choose the zone above).</p>
        <output data-unix-from-date aria-live="polite" className="mt-3 block divide-y divide-blue-border rounded-lg border border-blue-border bg-blue-surface px-4 py-2">
          {fromDate !== null ? (
            <>
              <ResultRow label="Seconds" value={String(toSeconds(fromDate))} />
              <ResultRow label="Milliseconds" value={String(fromDate)} />
              <ResultRow label="ISO 8601 (UTC)" value={isoUtc(fromDate)} />
            </>
          ) : (
            <span className="block py-1.5 text-sm text-body">Enter a valid date and time.</span>
          )}
        </output>
      </div>
    </div>
  );
}
