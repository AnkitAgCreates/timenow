'use client';

import { useBrowserZone, useHourCycle, useNow } from '@/lib/clock/stores';
import { describeDifference, formatOffset, formatTime, getUTCOffset, getZoneLabel } from '@/lib/time';
import { zoneCity } from '@/lib/clock/format-kind';

/**
 * "UTC-5 in your time zone": compares a fixed offset with the visitor's
 * browser zone. Renders nothing until hydrated (no browser zone on the server).
 */
export function OffsetToLocal({ offsetMinutes, label }: { offsetMinutes: number; label: string }) {
  const now = useNow();
  const zone = useBrowserZone();
  const hourCycle = useHourCycle();
  if (now === null || zone === null) {
    return <p className="text-sm text-muted">Loading your time zone…</p>;
  }
  const localOffset = getUTCOffset(zone, now);
  const zoneLabel = getZoneLabel(zone, now);
  const diff = offsetMinutes - localOffset;
  const localName = `${zoneCity(zone)} (${zoneLabel.abbreviation})`;

  return (
    <div className="text-sm text-body">
      <p>
        Your time zone is <strong className="text-heading">{localName}</strong>, currently {formatOffset(localOffset)}.
      </p>
      <p className="mt-1">
        <strong className="text-heading">{diff === 0 ? `${label} matches your local time right now.` : `${describeDifference(label, 'your local time', diff)}.`}</strong>
      </p>
      <p className="mt-1">
        Right now it is <span className="tabular font-semibold text-heading">{formatTime(now, `UTC${offsetMinutes < 0 ? '-' : '+'}${String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0')}:${String(Math.abs(offsetMinutes) % 60).padStart(2, '0')}`, { hourCycle, seconds: false })}</span> at {label} and{' '}
        <span className="tabular font-semibold text-heading">{formatTime(now, zone, { hourCycle, seconds: false })}</span> where you are.
      </p>
    </div>
  );
}
