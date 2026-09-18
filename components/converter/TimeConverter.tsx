'use client';

import { useId, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { CONVERTER_ZONE_OPTIONS } from '@/data/converter-zones';
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

function optionLabel(zone: string, label: string, instant: number) {
  // Fixed-offset options already state their offset in the label.
  if (zone.startsWith('Etc/')) return label;
  const zoneLabel = getZoneLabel(zone, instant);
  return zoneLabel.verified ? `${label} (${zoneLabel.abbreviation}, ${zoneLabel.offsetLabel})` : `${label} (${zoneLabel.offsetLabel})`;
}

/**
 * "Convert a specific time" form. Results update as you type and are always
 * computed for the selected date, so daylight saving time is applied correctly.
 */
export function TimeConverter({ defaultFrom, defaultTo, renderedAt }: { defaultFrom: string; defaultTo: string; renderedAt: number }) {
  const id = useId();
  const now = useNow() ?? renderedAt;
  const hourCycle = useHourCycle();
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [dateInput, setDateInput] = useState<string | null>(null);
  const [timeInput, setTimeInput] = useState<string | null>(null);
  const tracked = useRef(false);

  // Until the visitor edits them, date and time default to the current hour in the source zone.
  const nowParts = getZonedParts(now, from);
  const date = dateInput ?? `${nowParts.year}-${pad(nowParts.month)}-${pad(nowParts.day)}`;
  const time = timeInput ?? `${pad(nowParts.hour)}:00`;

  const markUsed = () => {
    if (tracked.current) return;
    tracked.current = true;
    track('converter_used', { from, to });
  };

  const parsedDate = parseDate(date);
  const parsedTime = parseTime(time);
  const result = parsedDate && parsedTime ? convertTime(from, to, { ...parsedDate, ...parsedTime }) : null;
  const fromOption = CONVERTER_ZONE_OPTIONS.find((o) => o.zone === from);
  const toOption = CONVERTER_ZONE_OPTIONS.find((o) => o.zone === to);
  const labelInstant = result?.instant ?? now;
  const groups = [...new Set(CONVERTER_ZONE_OPTIONS.map((o) => o.group))];

  const select = (value: string, onChange: (zone: string) => void, labelText: string, fieldId: string) => (
    <div>
      <label htmlFor={fieldId} className="text-xs font-medium text-muted">
        {labelText}
      </label>
      <div className="relative mt-1">
        <select
          id={fieldId}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            markUsed();
          }}
          className="h-11 w-full appearance-none rounded-lg border border-border bg-white pl-3 pr-9 text-[15px] text-heading focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {groups.map((group) => (
            <optgroup key={group} label={group}>
              {CONVERTER_ZONE_OPTIONS.filter((o) => o.group === group).map((option) => (
                <option key={option.zone} value={option.zone}>
                  {optionLabel(option.zone, option.label, labelInstant)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );

  const inputClass =
    'tabular mt-1 h-11 w-full rounded-lg border border-border bg-white px-3 text-[15px] text-heading focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div className="space-y-3">
      {select(from, setFrom, 'From', `${id}-from`)}
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
      {select(to, setTo, 'To', `${id}-to`)}

      <output htmlFor={`${id}-from ${id}-to`} aria-live="polite" className="block rounded-lg border border-blue-border bg-blue-surface px-4 py-3">
        {result ? (
          <>
            <span className="tabular block text-2xl font-bold text-heading">{formatTime(result.instant, to, { hourCycle, seconds: false })}</span>
            <span className="block text-sm text-body">
              {formatDate(result.instant, to, 'medium')} · {getZoneLabel(to, result.instant).abbreviation}
              {getZoneLabel(to, result.instant).verified ? ` (${getZoneLabel(to, result.instant).offsetLabel})` : ''}
              {dayShiftLabel(result.dayShift) && <span className="font-medium text-primary-dark"> · {dayShiftLabel(result.dayShift)}</span>}
            </span>
            <span className="mt-1 block text-xs text-muted">
              {describeDifference(toOption?.label ?? to, fromOption?.label ?? from, result.toOffset - result.fromOffset)} on this date.
            </span>
            {result.status === 'gap' && (
              <span className="mt-1 block text-xs text-warning-text">
                {time} doesn’t exist on this date in {fromOption?.label ?? from} because clocks moved forward; showing {formatTime(result.instant, from, { hourCycle, seconds: false })} instead.
              </span>
            )}
            {result.status === 'overlap' && (
              <span className="mt-1 block text-xs text-warning-text">
                {time} happens twice on this date in {fromOption?.label ?? from} because clocks moved back; showing the first occurrence ({getZoneLabel(from, result.instant).abbreviation}).
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
