'use client';

import { useNow } from '@/lib/clock/stores';
import { describeDifference, formatSignedDifference, getTimeDifference } from '@/lib/time';

/**
 * Live time difference between two zones ("+3 hours" or a sentence).
 * Always computed from both zones' real offsets at the current instant.
 */
export function LiveDifference({
  fromZone,
  toZone,
  renderedAt,
  format = 'signed',
  subject,
  reference,
  className,
}: {
  fromZone: string;
  toZone: string;
  renderedAt: number;
  /** signed: "+3 hours". sentence: "{subject} is 3 hours ahead of {reference}" (subject = fromZone). */
  format?: 'signed' | 'sentence';
  subject?: string;
  reference?: string;
  className?: string;
}) {
  const instant = useNow() ?? renderedAt;
  const minutes = getTimeDifference(fromZone, toZone, instant);
  const text =
    format === 'sentence' ? describeDifference(subject ?? fromZone, reference ?? toZone, -minutes) : formatSignedDifference(minutes);
  // Same reasoning as LiveZoneInfo: the difference depends on both zones' tzdata.
  return (
    <span className={className} suppressHydrationWarning>
      {text}
    </span>
  );
}
