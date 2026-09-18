/**
 * "Is it CST or CDT right now?" — the accuracy core of abbreviation pages.
 * Pure and deterministic for a given instant, so the server and the client
 * render identical text (the client re-evaluates live after hydration).
 */
import { formatDuration, formatOffset, getZoneGenericName, getZoneLabel, getZonedParts, observesDST } from '@/lib/time';
import { getNextTransitionInfo, type TransitionInfo } from '@/lib/time/transitions';
import { joinList } from '@/lib/text';
import type { TimeZoneEntry } from '@/types/data';

export type AbbreviationStatus = {
  /** The zone whose seasonal behaviour is described (Chicago for CST, London for GMT). */
  watchZone: string;
  /** Plain name for the watched region: "Central Time", "UK time". */
  regionName: string;
  /** Abbreviation the watched region is using at this instant ("CDT"). */
  currentAbbreviation: string;
  currentOffsetMinutes: number;
  /** True when the watched region is currently on this page's abbreviation/offset. */
  inEffect: boolean;
  /** False for abbreviations with no seasonal behaviour at all (IST, UTC). */
  seasonal: boolean;
  next: TransitionInfo | null;
  tone: 'neutral' | 'notice';
  headline: string;
  detail: string;
};

export function computeAbbreviationStatus(
  entry: TimeZoneEntry,
  now: number,
  { yearRoundExamples = [] }: { yearRoundExamples?: string[] } = {},
): AbbreviationStatus {
  const year = getZonedParts(now, entry.referenceZone).year;
  const referenceSeasonal = observesDST(entry.referenceZone, year);
  const firstSeasonalZone = entry.seasonalRegions[0]?.zones[0];
  const watchZone = referenceSeasonal ? entry.referenceZone : (firstSeasonalZone ?? entry.referenceZone);
  const label = getZoneLabel(watchZone, now);
  const seasonal = observesDST(watchZone, year);
  const regionName = getZoneGenericName(watchZone) ?? entry.referenceLabel;
  const offset = formatOffset(entry.offsetMinutes);
  const next = seasonal ? getNextTransitionInfo(watchZone, now) : null;
  const base = { watchZone, regionName, currentAbbreviation: label.abbreviation, currentOffsetMinutes: label.offsetMinutes, seasonal, next };

  if (!seasonal) {
    return {
      ...base,
      inEffect: label.offsetMinutes === entry.offsetMinutes,
      tone: 'neutral',
      headline: `${entry.abbreviation} does not change for daylight saving time`,
      detail: `${entry.abbreviation} is ${offset} all year, so the clock never moves forward or back.`,
    };
  }

  const inEffect = label.offsetMinutes === entry.offsetMinutes;
  const nextText = next ? ` on ${next.dateLabel} at ${next.localTimeBefore}` : '';
  const gap = formatDuration(label.offsetMinutes - entry.offsetMinutes);

  // Universal abbreviations (GMT) watch a seasonal region (the UK) but never change themselves.
  if (entry.kind === 'universal') {
    return {
      ...base,
      inEffect,
      tone: inEffect ? 'neutral' : 'notice',
      headline: inEffect ? `${regionName} is on ${entry.abbreviation} right now` : `${regionName} is on ${label.abbreviation} right now, not ${entry.abbreviation}`,
      detail: inEffect
        ? `${entry.abbreviation} itself is always ${offset}.${next ? ` ${regionName} switches to ${next.abbreviationAfter} (${formatOffset(next.offsetAfter)})${nextText}.` : ''}`
        : `${label.abbreviation} is ${label.offsetLabel}, ${gap} ahead of ${entry.abbreviation}. ${entry.abbreviation} itself is always ${offset}.${next ? ` ${regionName} returns to ${entry.abbreviation}${nextText}.` : ''}`,
    };
  }

  if (inEffect) {
    return {
      ...base,
      inEffect,
      tone: 'neutral',
      headline: `${regionName} is on ${entry.abbreviation} right now`,
      detail: next
        ? `${entry.abbreviation} is ${offset}. ${regionName} switches to ${next.abbreviationAfter} (${formatOffset(next.offsetAfter)})${nextText}.`
        : `${entry.abbreviation} is ${offset}.`,
    };
  }

  const direction = label.offsetMinutes > entry.offsetMinutes ? 'ahead of' : 'behind';
  const yearRound =
    entry.kind === 'standard' && yearRoundExamples.length > 0
      ? ` Places that stay on ${entry.abbreviation} all year, such as ${joinList(yearRoundExamples)}, are on ${offset} now.`
      : '';
  return {
    ...base,
    inEffect,
    tone: 'notice',
    headline: `${regionName} is on ${label.abbreviation} right now, not ${entry.abbreviation}`,
    detail: `${label.abbreviation} is ${label.offsetLabel}, ${gap} ${direction} ${entry.abbreviation} (${offset}).${
      next ? ` ${regionName} ${entry.kind === 'daylight' ? 'switches to' : 'returns to'} ${entry.abbreviation}${nextText}.` : ''
    }${yearRound}`,
  };
}
