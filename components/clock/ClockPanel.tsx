import type { ReactNode } from 'react';
import { parseFixedOffsetZone } from '@/lib/time';
import { ClockControls } from './ClockControls';
import { LiveTime } from './LiveTime';
import { LiveZoneInfo } from './LiveZoneInfo';

type ClockPanelProps = {
  /** Unique id; also the fullscreen target. */
  id: string;
  /** IANA zone, or omit for the visitor's browser zone. */
  timeZone?: string;
  renderedAt: number;
  /** Heading content rendered above the time (H1 or caption). */
  heading?: ReactNode;
  /** Extra line under the date (e.g. location). */
  meta?: ReactNode;
  size?: 'xl' | 'lg';
  className?: string;
};

/** Large live clock: time, date, "ABBR · UTC±X", 12/24-hour toggle and fullscreen. */
export function ClockPanel({ id, timeZone, renderedAt, heading, meta, size = 'xl', className = '' }: ClockPanelProps) {
  // Fixed-offset pseudo-zones (UTC-05:00) have no abbreviation; show the offset once.
  const fixedOffset = timeZone !== undefined && parseFixedOffsetZone(timeZone) !== null;
  return (
    <section id={id} data-clock-panel aria-label="Current time" className={`flex flex-col items-center text-center ${className}`}>
      {heading}
      <p className="mt-2">
        <LiveTime
          timeZone={timeZone}
          kind="time"
          dataRole="clock-time"
          className={`${size === 'xl' ? 'text-clock-xl' : 'text-clock-lg'} tabular block font-bold leading-none tracking-[-0.02em] text-heading`}
        />
      </p>
      <p className="mt-2.5 text-[15px] text-body md:text-base">
        <LiveTime timeZone={timeZone} kind="date-full" dataRole="clock-date" renderedAt={renderedAt} />
      </p>
      {meta}
      <p className="mt-1.5 text-sm font-semibold text-heading">
        {fixedOffset ? (
          <>
            <span className="font-normal text-muted">Fixed offset </span>
            <LiveTime timeZone={timeZone} kind="offset" renderedAt={renderedAt} />
          </>
        ) : (
          <>
            <LiveZoneInfo timeZone={timeZone} field="abbreviation" renderedAt={renderedAt} className="inline-block min-w-[2.5ch]" />
            <span aria-hidden="true"> · </span>
            <LiveTime timeZone={timeZone} kind="offset" renderedAt={renderedAt} />
          </>
        )}
      </p>
      <div className="mt-4">
        <ClockControls panelId={id} />
      </div>
    </section>
  );
}
