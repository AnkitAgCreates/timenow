'use client';

import { useState } from 'react';
import { track } from '@/lib/analytics';
import { MONTHS_SHORT, WEEKDAYS, WEEKDAYS_SHORT, type CalendarDate } from '@/lib/time';
import { addDays, dateDifference, parseIsoDate, toUtcMs, weekday } from '@/lib/tools/date-difference';

const iso = (d: CalendarDate) => `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
const pretty = (d: CalendarDate) => `${WEEKDAYS_SHORT[weekday(d)]}, ${MONTHS_SHORT[d.month - 1]} ${d.day}, ${d.year}`;
const plural = (n: number, unit: string) => `${n.toLocaleString('en-US')} ${unit}${n === 1 ? '' : 's'}`;

const inputClass = 'tabular mt-1 h-11 w-full rounded-lg border border-border bg-white px-3 text-[15px] text-heading focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

/** `today` is the server's render date (ISO), so the first paint matches on both sides. */
export function DateDifference({ today }: { today: string }) {
  const [startInput, setStartInput] = useState(today);
  const [endInput, setEndInput] = useState(() => {
    const parsed = parseIsoDate(today);
    return parsed ? iso(addDays(parsed, 30)) : today;
  });
  const [includeEnd, setIncludeEnd] = useState(false);
  const [offsetDays, setOffsetDays] = useState('30');
  const [used, setUsed] = useState(false);
  const markUsed = () => {
    if (!used) {
      setUsed(true);
      track('tool_selected', { tool: 'date-difference' });
    }
  };

  const start = parseIsoDate(startInput);
  const end = parseIsoDate(endInput);
  const result = start && end ? dateDifference(start, end, includeEnd) : null;
  const [from, to] = start && end && toUtcMs(start) <= toUtcMs(end) ? [start, end] : [end, start];
  const offset = Number(offsetDays);
  const shifted = start && Number.isInteger(offset) ? addDays(start, offset) : null;

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-muted">
            Start date
            <input type="date" value={startInput} onChange={(e) => { setStartInput(e.target.value); markUsed(); }} className={inputClass} />
          </label>
          <label className="text-xs font-medium text-muted">
            End date
            <input type="date" value={endInput} onChange={(e) => { setEndInput(e.target.value); markUsed(); }} className={inputClass} />
          </label>
        </div>
        <label className="mt-3 flex min-h-11 items-center gap-2 text-sm text-body">
          <input type="checkbox" checked={includeEnd} onChange={(e) => { setIncludeEnd(e.target.checked); markUsed(); }} className="size-4 rounded border-border text-primary focus:ring-primary/30" />
          Include end date (count both days)
        </label>

        <output data-date-result aria-live="polite" className="mt-3 block rounded-lg border border-blue-border bg-blue-surface px-4 py-3">
          {result && from && to ? (
            <>
              <span className="block text-2xl font-bold text-heading">{plural(result.totalDays, 'day')}</span>
              <span className="block text-sm text-body">
                From {pretty(from)} to {pretty(to)}
                {includeEnd ? ', both included' : ''}
                {result.direction === 'backward' ? ' (the end date is before the start date)' : ''}.
              </span>
              <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-3"><dt className="text-muted">Weeks and days</dt><dd className="font-medium text-heading">{plural(result.weeks, 'week')}, {plural(result.remainingDays, 'day')}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Years, months, days</dt><dd className="font-medium text-heading">{result.breakdown.years}y {result.breakdown.months}m {result.breakdown.days}d</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Weekdays (Mon–Fri)</dt><dd className="font-medium text-heading">{result.weekdays.toLocaleString('en-US')}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Weekend days</dt><dd className="font-medium text-heading">{result.weekendDays.toLocaleString('en-US')}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Hours</dt><dd className="font-medium text-heading">{result.hours.toLocaleString('en-US')}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Minutes</dt><dd className="font-medium text-heading">{result.minutes.toLocaleString('en-US')}</dd></div>
              </dl>
            </>
          ) : (
            <span className="text-sm text-body">Enter two valid dates.</span>
          )}
        </output>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-semibold text-heading">Add or subtract days from a date</h3>
        <div className="mt-2 grid grid-cols-[1fr_7rem] gap-3">
          <p className="text-xs font-medium text-muted">
            Start date (above) <span className="block tabular mt-1 h-11 rounded-lg border border-border bg-surface px-3 leading-11 text-[15px] text-heading">{start ? pretty(start) : '—'}</span>
          </p>
          <label className="text-xs font-medium text-muted">
            Days (±)
            <input type="number" value={offsetDays} step={1} onChange={(e) => { setOffsetDays(e.target.value); markUsed(); }} className={inputClass} />
          </label>
        </div>
        <p className="mt-3 text-sm text-body">
          {shifted && start ? (
            <>
              {offset >= 0 ? `${plural(offset, 'day')} after` : `${plural(-offset, 'day')} before`} {pretty(start)} is{' '}
              <strong className="font-semibold text-heading">{WEEKDAYS[weekday(shifted)]}, {MONTHS_SHORT[shifted.month - 1]} {shifted.day}, {shifted.year}</strong>.
            </>
          ) : (
            'Enter a whole number of days.'
          )}
        </p>
      </div>
    </div>
  );
}
