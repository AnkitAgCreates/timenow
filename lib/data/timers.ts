// Relative imports: this module is also loaded by next.config.ts, where the
// "@/" path alias is not available.
import { TIMER_PRESETS } from '../../data/timers';
import type { TimerPreset } from '../../types/data';

const bySlug = new Map(TIMER_PRESETS.map((preset) => [preset.slug, preset]));

export function getAllTimerPresets(): TimerPreset[] {
  return [...TIMER_PRESETS].sort((a, b) => a.seconds - b.seconds);
}

export function getTimerPreset(slug: string): TimerPreset | undefined {
  return bySlug.get(slug);
}

export function getQuickPresets(): TimerPreset[] {
  return getAllTimerPresets().filter((preset) => preset.quickPreset);
}

/** Canonical slug for a duration in seconds: 60 → "1-minute", 3600 → "1-hour", 5400 → "90-minutes". */
export function timerSlugForSeconds(seconds: number): string {
  if (seconds % 3600 === 0) {
    const h = seconds / 3600;
    return `${h}-${h === 1 ? 'hour' : 'hours'}`;
  }
  if (seconds % 60 === 0) {
    const m = seconds / 60;
    return `${m}-${m === 1 ? 'minute' : 'minutes'}`;
  }
  return `${seconds}-seconds`;
}

/**
 * Alternate spellings that should permanently redirect to a canonical preset,
 * e.g. /timer/60-minutes/ → /timer/1-hour/, /timer/1-minutes/ → /timer/1-minute/.
 */
export function getTimerAliases(): Array<{ source: string; destination: string }> {
  const aliases: Array<{ source: string; destination: string }> = [];
  for (const preset of TIMER_PRESETS) {
    const candidates = new Set<string>();
    const minutes = preset.seconds / 60;
    candidates.add(`${minutes}-minutes`);
    candidates.add(`${minutes}-minute`);
    candidates.add(`${minutes}-min`);
    candidates.add(`${minutes}-mins`);
    if (preset.seconds % 3600 === 0) {
      const hours = preset.seconds / 3600;
      candidates.add(`${hours}-hours`);
      candidates.add(`${hours}-hour`);
      candidates.add(`${hours}-hr`);
      candidates.add(`${hours}-hrs`);
    }
    candidates.delete(preset.slug);
    for (const alias of candidates) aliases.push({ source: alias, destination: preset.slug });
  }
  return aliases;
}
