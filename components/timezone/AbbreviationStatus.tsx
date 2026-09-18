'use client';

import { useMemo } from 'react';
import { Callout } from '@/components/ui/Callout';
import { useNow } from '@/lib/clock/stores';
import { computeAbbreviationStatus } from '@/lib/timezones/status';
import type { TimeZoneEntry } from '@/types/data';

const MINUTE = 60_000;

/**
 * Explains whether an abbreviation is actually in effect right now
 * ("Central Time is on CDT right now, not CST"). Server and hydration render
 * use `renderedAt`; the client then re-evaluates every minute.
 */
export function AbbreviationStatus({
  entry,
  renderedAt,
  yearRoundExamples,
  className,
}: {
  entry: TimeZoneEntry;
  renderedAt: number;
  yearRoundExamples: string[];
  className?: string;
}) {
  const minute = Math.floor((useNow() ?? renderedAt) / MINUTE);
  const status = useMemo(
    () => computeAbbreviationStatus(entry, minute * MINUTE, { yearRoundExamples }),
    [entry, minute, yearRoundExamples],
  );
  return (
    <div aria-live="polite" className={className}>
      <Callout tone={status.tone} title={status.headline}>
        {status.detail}
      </Callout>
    </div>
  );
}
