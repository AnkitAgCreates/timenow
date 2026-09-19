'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ZonePicker, type ZoneChoice } from '@/components/converter/ZonePicker';
import { Icon } from '@/components/ui/Icon';
import { track } from '@/lib/analytics';
import { useHourCycle, useNow } from '@/lib/clock/stores';
import {
  DEFAULT_WORKING_HOURS,
  compareCalendarDates,
  formatDate,
  formatTime,
  getZoneLabel,
  getZonedDate,
  getZonedParts,
  isValidTimeZone,
  suggestMeetingSlots,
  wallTimeToInstant,
  type CalendarDate,
  type WorkingHours,
} from '@/lib/time';
import { parseClockTime } from '@/lib/tools/hours-calculator';
import { parseIsoDate } from '@/lib/tools/date-difference';

const MIN = 2;
const MAX = 4;
const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (d: CalendarDate) => `${d.year}-${pad(d.month)}-${pad(d.day)}`;
const minutesOf = (value: string, fallback: number) => {
  const t = parseClockTime(value);
  return t ? t.hour * 60 + t.minute : fallback;
};
const labelFor = (zone: string) => zone.split('/').pop()!.replace(/_/g, ' ');

type Quality = 'core' | 'extended' | 'off';

function classify(minutes: number, duration: number, hours: WorkingHours): Quality {
  if (minutes >= hours.coreStart && minutes + duration <= hours.coreEnd) return 'core';
  if (minutes >= hours.extendedStart && minutes + duration <= hours.extendedEnd) return 'extended';
  return 'off';
}

const inputClass = 'tabular mt-1 h-11 w-full rounded-lg border border-border bg-white px-3 text-[15px] text-heading focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

/**
 * 2–4 participants, a date, working hours and a duration → an hour grid with
 * every participant's local time, suggested slots, and copy/share.
 * Share links carry the set-up in the query string (?z=…&d=…&h=…&m=…).
 */
export function MeetingPlanner({ defaults, defaultDate, renderedAt }: { defaults: ZoneChoice[]; defaultDate: string; renderedAt: number }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const hourCycle = useHourCycle();
  const now = useNow() ?? renderedAt;

  const [participants, setParticipants] = useState<ZoneChoice[]>(() => {
    const fromUrl = (params.get('z') ?? '')
      .split(',')
      .filter((z) => z && isValidTimeZone(z))
      .slice(0, MAX)
      .map((zone) => ({ zone, label: labelFor(zone) }));
    return fromUrl.length >= MIN ? fromUrl : defaults;
  });
  const [dateInput, setDateInput] = useState(() => (parseIsoDate(params.get('d') ?? '') ? params.get('d')! : defaultDate));
  const [coreStart, setCoreStart] = useState(() => params.get('h')?.split('-')[0] ?? '09:00');
  const [coreEnd, setCoreEnd] = useState(() => params.get('h')?.split('-')[1] ?? '17:00');
  const [flexible, setFlexible] = useState(() => params.get('x') !== '0');
  const [duration, setDuration] = useState(() => (['30', '60', '90'].includes(params.get('m') ?? '') ? Number(params.get('m')) : 60));
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [copied, setCopied] = useState<'summary' | 'link' | null>(null);
  const [used, setUsed] = useState(false);
  const markUsed = () => {
    if (!used) {
      setUsed(true);
      track('meeting_planner_used', { participants: participants.length });
    }
  };

  const hours: WorkingHours = {
    coreStart: minutesOf(coreStart, DEFAULT_WORKING_HOURS.coreStart),
    coreEnd: minutesOf(coreEnd, DEFAULT_WORKING_HOURS.coreEnd),
    extendedStart: flexible ? DEFAULT_WORKING_HOURS.extendedStart : minutesOf(coreStart, DEFAULT_WORKING_HOURS.coreStart),
    extendedEnd: flexible ? DEFAULT_WORKING_HOURS.extendedEnd : minutesOf(coreEnd, DEFAULT_WORKING_HOURS.coreEnd),
  };
  const anchor = participants[0]!.zone;
  const date = parseIsoDate(dateInput) ?? parseIsoDate(defaultDate)!;
  const zones = participants.map((p) => p.zone);

  // One column per whole hour of the reference day.
  const columns = Array.from({ length: 24 }, (_, hour) => {
    const instant = wallTimeToInstant({ ...date, hour, minute: 0 }, anchor);
    if (compareCalendarDates(getZonedDate(instant, anchor), date) !== 0) return null; // skipped hour on a DST day
    const cells = zones.map((zone) => {
      const parts = getZonedParts(instant, zone);
      const minutes = parts.hour * 60 + parts.minute;
      const dayShift = compareCalendarDates({ year: parts.year, month: parts.month, day: parts.day }, date);
      return { zone, minutes, quality: classify(minutes, duration, hours), dayShift, instant };
    });
    const allCore = cells.every((c) => c.quality === 'core');
    const acceptable = !allCore && cells.some((c) => c.quality === 'core') && cells.every((c) => c.quality !== 'off');
    return { hour, instant, cells, allCore, acceptable };
  }).filter((c) => c !== null);

  const slots = suggestMeetingSlots({ zones, anchorZone: anchor, date, durationMinutes: duration, hours, limit: 6 });
  const selected = selectedHour === null ? null : columns.find((c) => c.hour === selectedHour) ?? null;

  const summaryFor = (instant: number) =>
    `Meeting on ${formatDate(instant, anchor, 'full')} (${duration} min): ${participants
      .map((p) => `${formatTime(instant, p.zone, { hourCycle, seconds: false })} ${getZoneLabel(p.zone, instant).abbreviation} ${p.label}`)
      .join(' · ')}`;

  const shareLink = () => {
    const query = new URLSearchParams({ z: zones.join(','), d: toIso(date), h: `${coreStart}-${coreEnd}`, m: String(duration), x: flexible ? '1' : '0' });
    return `${window.location.origin}${pathname}?${query.toString()}`;
  };

  const copy = (what: 'summary' | 'link', text: string) => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(what);
      window.setTimeout(() => setCopied(null), 1500);
    });
  };

  const updateParticipant = (index: number, choice: ZoneChoice) => {
    setParticipants((list) => list.map((p, i) => (i === index ? choice : p)));
    setSelectedHour(null);
    markUsed();
  };

  const timeLabel = (instant: number, zone: string) => formatTime(instant, zone, { hourCycle, seconds: false }).replace(':00', '');

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {participants.map((participant, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <ZonePicker label={index === 0 ? 'Reference place' : `Participant ${index + 1}`} value={participant} instant={now} onChange={(choice) => updateParticipant(index, choice)} />
              </div>
              <button
                type="button"
                onClick={() => {
                  setParticipants((list) => list.filter((_, i) => i !== index));
                  setSelectedHour(null);
                }}
                disabled={participants.length <= MIN}
                aria-label={`Remove ${participant.label}`}
                className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-heading disabled:opacity-30"
              >
                <Icon name="x" className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          {participants.length < MAX && (
            <button type="button" onClick={() => { setParticipants((list) => [...list, { zone: 'UTC', label: 'UTC / GMT' }]); markUsed(); }} className="inline-flex h-11 items-center rounded-lg border border-border bg-white px-4 text-sm font-medium text-heading hover:bg-surface">
              + Add participant
            </button>
          )}
          <label className="text-xs font-medium text-muted">
            Date
            <input type="date" value={dateInput} onChange={(e) => { setDateInput(e.target.value); setSelectedHour(null); markUsed(); }} className={`${inputClass} w-44`} />
          </label>
          <label className="text-xs font-medium text-muted">
            Length
            <select value={duration} onChange={(e) => { setDuration(Number(e.target.value)); markUsed(); }} className={`${inputClass} w-32`}>
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
            </select>
          </label>
          <label className="text-xs font-medium text-muted">
            Working hours from
            <input type="time" value={coreStart} onChange={(e) => { setCoreStart(e.target.value); markUsed(); }} className={`${inputClass} w-32`} />
          </label>
          <label className="text-xs font-medium text-muted">
            to
            <input type="time" value={coreEnd} onChange={(e) => { setCoreEnd(e.target.value); markUsed(); }} className={`${inputClass} w-32`} />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm text-body">
            <input type="checkbox" checked={flexible} onChange={(e) => { setFlexible(e.target.checked); markUsed(); }} className="size-4 rounded border-border text-primary" />
            Allow 7 AM–10 PM
          </label>
        </div>
      </div>

      <div className="card overflow-x-auto p-2">
        <table className="w-full min-w-[56rem] border-separate border-spacing-0.5 text-xs" data-meeting-grid>
          <caption className="sr-only">Local time for each participant at every hour of the reference day; green means inside working hours for everyone</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-white px-2 py-1 text-left font-medium text-muted">Place</th>
              {columns.map((column) => (
                <th key={column.hour} scope="col" className={`px-0.5 py-1 text-center font-medium ${column.allCore ? 'text-success-dark' : 'text-muted'}`}>
                  {hourCycle === '24h' ? pad(column.hour) : column.hour % 12 === 0 ? 12 : column.hour % 12}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {participants.map((participant, row) => (
              <tr key={`${participant.zone}-${row}`}>
                <th scope="row" className="sticky left-0 z-10 max-w-36 truncate bg-white px-2 py-1 text-left font-semibold text-heading">
                  {participant.label}
                </th>
                {columns.map((column) => {
                  const cell = column.cells[row]!;
                  const tone = column.allCore ? 'bg-green-100 text-success-dark' : cell.quality === 'core' ? 'bg-blue-surface text-heading' : cell.quality === 'extended' ? 'bg-surface text-body' : 'bg-surface text-muted opacity-60';
                  const ring = selectedHour === column.hour ? 'ring-2 ring-primary' : column.allCore ? 'ring-1 ring-success/40' : '';
                  return (
                    <td key={column.hour} className="p-0">
                      <button
                        type="button"
                        onClick={() => { setSelectedHour(column.hour); markUsed(); }}
                        aria-label={`${participant.label}: ${timeLabel(column.instant, participant.zone)}${cell.dayShift ? (cell.dayShift > 0 ? ' next day' : ' previous day') : ''}, ${cell.quality === 'core' ? 'working hours' : cell.quality === 'extended' ? 'early or late' : 'outside hours'}`}
                        aria-pressed={selectedHour === column.hour}
                        className={`tabular flex h-9 w-full min-w-8 flex-col items-center justify-center rounded ${tone} ${ring}`}
                      >
                        <span className="leading-none">{timeLabel(column.instant, participant.zone)}</span>
                        {cell.dayShift !== 0 && <span className="text-[9px] leading-none">{cell.dayShift > 0 ? '+1' : '−1'}</span>}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 px-2 text-xs text-muted">
          <span className="mr-3 inline-block size-3 rounded bg-green-100 align-middle" /> everyone’s working hours
          <span className="ml-3 mr-3 inline-block size-3 rounded bg-blue-surface align-middle" /> working hours for that person
          <span className="ml-3 mr-3 inline-block size-3 rounded bg-surface align-middle" /> early/late or outside hours
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-heading">Suggested times</h3>
          {slots.length > 0 ? (
            <>
              <p className="mt-0.5 text-xs text-muted">
                {slots[0]!.quality === 2 ? 'Inside everyone’s working hours.' : 'No hour suits everyone; these are within working hours for at least one participant and 7 AM–10 PM for the others.'}
              </p>
              <ul className="mt-2 divide-y divide-border" data-meeting-slots>
                {slots.map((slot) => (
                  <li key={slot.start}>
                    <button
                      type="button"
                      onClick={() => setSelectedHour(getZonedParts(slot.start, anchor).hour)}
                      className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 py-2 text-left text-sm hover:text-primary"
                    >
                      {participants.map((p) => (
                        <span key={p.zone + p.label} className="tabular">
                          <strong className="font-semibold text-heading">{formatTime(slot.start, p.zone, { hourCycle, seconds: false })}</strong> <span className="text-muted">{p.label}</span>
                        </span>
                      ))}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-1 text-sm text-body">No hour is acceptable for everyone with these settings. Try allowing 7 AM–10 PM, a shorter meeting or a different date.</p>
          )}
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-heading">Selected time</h3>
          {selected ? (
            <>
              <p className="mt-1 text-sm text-body" data-meeting-selected>{summaryFor(selected.instant)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => copy('summary', summaryFor(selected.instant))} className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary-dark px-4 text-sm font-semibold text-white hover:bg-primary">
                  <Icon name={copied === 'summary' ? 'check' : 'copy'} className="size-4" /> {copied === 'summary' ? 'Copied' : 'Copy summary'}
                </button>
                <button type="button" onClick={() => copy('link', shareLink())} className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-semibold text-heading hover:bg-surface">
                  <Icon name={copied === 'link' ? 'check' : 'copy'} className="size-4" /> {copied === 'link' ? 'Copied' : 'Copy share link'}
                </button>
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted">Click a column in the grid or a suggested time.</p>
          )}
        </div>
      </div>
    </div>
  );
}
