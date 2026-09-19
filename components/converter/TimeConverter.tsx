'use client';

import { useId, useRef, useState } from 'react';
import { ZonePicker, type ZoneChoice } from '@/components/converter/ZonePicker';
import { Icon } from '@/components/ui/Icon';
import { track } from '@/lib/analytics';
import { useHourCycle, useNow } from '@/lib/clock/stores';
import { convertTime, dayShiftLabel, describeDifference, formatDate, formatTime, getZoneLabel, getZonedParts } from '@/lib/time';

const pad = (n: number) => String(n).padStart(2, '0');

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return { year, month, day };
}

function parseTime(value: string) {
  const match = /^(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour < 24 && minute < 60 ? { hour, minute } : null;
}

/**
 * "Convert a specific time" form. Either side is a city, a time zone
 * abbreviation or a UTC offset (searchable). Results update as you type and
 * are always computed for the selected date, so daylight saving time is
 * applied correctly.
 */
export function TimeConverter({ defaultFrom, defaultTo, renderedAt }: { defaultFrom: ZoneChoice; defaultTo: ZoneChoice; renderedAt: number }) {
  const id = useId();
  const now = useNow() ?? renderedAt;
  const hourCycle = useHourCycle();
  const [from, setFrom] = useState<ZoneChoice>(defaultFrom);
  const [to, setTo] = useState<ZoneChoice>(defaultTo);
  const [dateInput, setDateInput] = useState<string | null>(null);
  const [timeInput, setTimeInput] = useState<string | null>(null);
  const tracked = useRef(false);

  // Until the visitor edits them, date and time default to the current hour in the source zone.
  const nowParts = getZonedParts(now, from.zone);
  const date = dateInput ?? `${nowParts.year}-${pad(nowParts.month)}-${pad(nowParts.day)}`;
  const time = timeInput ?? `${pad(nowParts.hour)}:00`;

  const markUsed = () => {
    if (tracked.current) return;
    tracked.current = true;
    track('converter_used', { from: from.zone, to: to.zone });
  };

  const parsedDate = parseDate(date);
  const parsedTime = parseTime(time);
  const result = parsedDate && parsedTime ? convertTime(from.zone, to.zone, { ...parsedDate, ...parsedTime }) : null;
  const labelInstant = result?.instant ?? now;

  const inputClass =
    'tabular mt-1 h-11 w-full rounded-lg border border-border bg-white px-3 text-[15px] text-heading focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div className="space-y-3">
      <ZonePicker
        label="From"
        value={from}
        instant={labelInstant}
        onChange={(choice) => {
          setFrom(choice);
          markUsed();
        }}
      />
      <div className="grid grid-cols-[1.2fr_1fr] gap-2">
        <label className="text-xs font-medium text-muted">
          Date
          <input
            type="date"
            value={date}
            onChange={(event) => {
              setDateInput(event.target.value);
              markUsed();
            }}
            className={inputClass}
          />
        </label>
        <label className="text-xs font-medium text-muted">
          Time
          <input
            type="time"
            value={time}
            step={60}
            onChange={(event) => {
              setTimeInput(event.target.value);
              markUsed();
            }}
            className={inputClass}
          />
        </label>
      </div>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => {
            setFrom(to);
            setTo(from);
            markUsed();
          }}
          className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-white text-primary hover:bg-blue-surface"
          aria-label="Swap time zones"
        >
          <Icon name="swap-vertical" className="size-5" />
        </button>
      </div>
      <ZonePicker
        label="To"
        value={to}
        instant={labelInstant}
        onChange={(choice) => {
          setTo(choice);
          markUsed();
        }}
      />

      <output htmlFor={`${id}-from ${id}-to`} aria-live="polite" data-converter-result className="block rounded-lg border border-blue-border bg-blue-surface px-4 py-3">
        {result ? (
          <>
            <span className="tabular block text-2xl font-bold text-heading">{formatTime(result.instant, to.zone, { hourCycle, seconds: false })}</span>
            <span className="block text-sm text-body">
              {formatDate(result.instant, to.zone, 'medium')} · {getZoneLabel(to.zone, result.instant).abbreviation}
              {getZoneLabel(to.zone, result.instant).verified ? ` (${getZoneLabel(to.zone, result.instant).offsetLabel})` : ''}
              {dayShiftLabel(result.dayShift) && <span className="font-medium text-primary-dark"> · {dayShiftLabel(result.dayShift)}</span>}
            </span>
            <span className="mt-1 block text-xs text-muted">{describeDifference(to.label, from.label, result.toOffset - result.fromOffset)} on this date.</span>
            {result.status === 'gap' && (
              <span className="mt-1 block text-xs text-warning-text">
                {time} doesn’t exist on this date in {from.label} because clocks moved forward; showing {formatTime(result.instant, from.zone, { hourCycle, seconds: false })} instead.
              </span>
            )}
            {result.status === 'overlap' && (
              <span className="mt-1 block text-xs text-warning-text">
                {time} happens twice on this date in {from.label} because clocks moved back; showing the first occurrence ({getZoneLabel(from.zone, result.instant).abbreviation}).
              </span>
            )}
          </>
        ) : (
          <span className="text-sm text-body">Enter a valid date and time to see the result.</span>
        )}
      </output>
    </div>
  );
}
