'use client';

import { useMemo } from 'react';
import { useBrowserZone, useNow } from '@/lib/clock/stores';
import { getZoneLabel, observesDST, getZonedParts } from '@/lib/time';
import { getNextTransitionInfo } from '@/lib/time/transitions';

export type ZoneInfoField =
  /** "CDT" */
  | 'abbreviation'
  /** "Central Daylight Time (CDT)" */
  | 'name-with-abbreviation'
  /** "Daylight Time (CDT)" / "Standard Time (CST)" */
  | 'current-kind'
  /** "In effect (PDT)" / "Not in effect" / "Not observed" */
  | 'dst-status'
  /** "Ends Nov 1, 2026" / "Starts Mar 14, 2027" / "No DST changes" */
  | 'next-transition';

const HOUR = 3_600_000;

function useInstant(renderedAt: number): number {
  // During SSR and hydration use the server's render time, so both sides
  // produce identical text; afterwards track the live clock.
  return useNow() ?? renderedAt;
}

/**
 * Live, DST-aware zone facts. Recomputed on the client after hydration so a
 * daylight saving switch is reflected immediately, not at the next revalidation.
 */
export function LiveZoneInfo({
  timeZone,
  field,
  renderedAt,
  className,
  names,
}: {
  /** IANA zone; omit for the browser zone. */
  timeZone?: string;
  field: ZoneInfoField;
  renderedAt: number;
  className?: string;
  /** Server-computed CLDR names for zones without metadata names (see lib/time/zone-names.ts). */
  names?: { standard: string | null; daylight: string | null };
}) {
  const instant = useInstant(renderedAt);
  const browserZone = useBrowserZone();
  const zone = timeZone ?? browserZone;
  const hourKey = Math.floor(instant / HOUR);

  const next = useMemo(
    () => (zone && field === 'next-transition' ? getNextTransitionInfo(zone, hourKey * HOUR) : null),
    [zone, field, hourKey],
  );

  if (!zone) return <span className={className} />;

  const label = getZoneLabel(zone, instant);
  let text = '';
  switch (field) {
    case 'abbreviation':
      text = label.abbreviation;
      break;
    case 'name-with-abbreviation': {
      const name = label.name ?? (label.isDST ? names?.daylight : names?.standard) ?? null;
      text = name ? `${name} (${label.abbreviation})` : label.offsetLabel;
      break;
    }
    case 'current-kind':
      text = `${label.isDST ? 'Daylight Time' : 'Standard Time'}${label.verified ? ` (${label.abbreviation})` : ''}`;
      break;
    case 'dst-status': {
      const observed = observesDST(zone, getZonedParts(instant, zone).year);
      text = !observed ? 'Not observed' : label.isDST ? `In effect (${label.abbreviation})` : 'Not in effect';
      break;
    }
    case 'next-transition':
      text = next ? `${next.kind === 'dst-start' ? 'Starts' : next.kind === 'dst-end' ? 'Ends' : 'Changes'} ${next.dateShort}` : 'No DST changes';
      break;
  }
  // Zone names and offsets come from the runtime's tzdata/ICU, which can differ between the server
  // and a visitor's browser (e.g. a rule change present in one release only). The server text stays
  // until the live value takes over after mount, so such differences never break hydration.
  return (
    <span className={className} suppressHydrationWarning>
      {text}
    </span>
  );
}
