'use client';

import { useId } from 'react';
import { clockFillScript } from '@/lib/clock/bootstrap';
import { LIVE_PLACEHOLDER, formatKind, type LiveKind } from '@/lib/clock/format-kind';
import { useBrowserZone, useHourCycle, useNow } from '@/lib/clock/stores';
import { InlineScript } from './InlineScript';

type LiveTimeProps = {
  /** IANA zone. Omit to use the visitor's browser zone. */
  timeZone?: string;
  kind: LiveKind;
  className?: string;
  /** Marks the element for fullscreen sizing rules. */
  dataRole?: 'clock-time' | 'clock-date';
  /**
   * Server render instant. When given with a known zone, slow-changing kinds
   * (offset, dates) are server-rendered as real text for crawlers instead of a
   * placeholder. Clock digits always use the placeholder so no stale time is
   * ever shown.
   */
  renderedAt?: number;
};

const SERVER_RENDERABLE: ReadonlySet<LiveKind> = new Set(['offset', 'date-full', 'date-medium', 'date-weekday-short', 'zone-city']);

/**
 * A single live-updating text value. Filled before first paint by the inline
 * bootstrap, then kept current by a shared once-per-second store. Not an
 * aria-live region: screen readers read the current value on demand instead
 * of being interrupted every second.
 */
export function LiveTime({ timeZone, kind, className, dataRole, renderedAt }: LiveTimeProps) {
  const id = useId();
  const now = useNow();
  const hourCycle = useHourCycle();
  const browserZone = useBrowserZone();
  const zone = timeZone ?? browserZone;

  let text: string;
  if (now !== null && zone !== null) text = formatKind(now, zone, kind, hourCycle);
  else if (timeZone && renderedAt !== undefined && SERVER_RENDERABLE.has(kind)) text = formatKind(renderedAt, timeZone, kind, '12h');
  else text = LIVE_PLACEHOLDER[kind];

  return (
    <>
      <span
        id={id}
        className={className}
        data-tz={timeZone}
        data-kind={kind}
        data-clock-time={dataRole === 'clock-time' ? '' : undefined}
        data-clock-date={dataRole === 'clock-date' ? '' : undefined}
        suppressHydrationWarning
      >
        {text}
      </span>
      <InlineScript html={clockFillScript(id)} />
    </>
  );
}
