import { describe, expect, it } from 'vitest';
import { TIMER_PRESETS } from '@/data/timers';
import { TIMER_HUB_TITLE, equivalents, timerFaqs, timerHubDescription, timerHubFaqs, timerIntro, timerMetaDescription, timerTitle } from '@/lib/content/timer';
import { getAllTimerPresets, getQuickPresets, getRelatedTimerPresets, getTimerAliases, getTimerPresetsByGroup, timerGroup } from '@/lib/data/timers';

const unique = <T,>(values: T[]) => new Set(values).size === values.length;

describe('curated timer presets (Sprint 3 rules)', () => {
  it('stay a curated set: between 20 and 40 presets, each duration once, sorted by length', () => {
    expect(TIMER_PRESETS.length).toBeGreaterThanOrEqual(20);
    expect(TIMER_PRESETS.length).toBeLessThanOrEqual(40);
    expect(unique(TIMER_PRESETS.map((p) => p.seconds))).toBe(true);
    const sorted = getAllTimerPresets().map((p) => p.seconds);
    expect(sorted).toEqual([...sorted].sort((a, b) => a - b));
  });

  it('keep the Sprint 1 presets and add the curated Sprint 3 lengths', () => {
    const slugs = new Set(TIMER_PRESETS.map((p) => p.slug));
    for (const slug of ['1-minute', '2-minutes', '3-minutes', '5-minutes', '10-minutes', '15-minutes', '20-minutes', '30-minutes', '45-minutes', '1-hour', '2-hours', '3-hours']) {
      expect(slugs.has(slug), slug).toBe(true);
    }
    for (const slug of ['30-seconds', '90-seconds', '4-minutes', '7-minutes', '25-minutes', '50-minutes', '90-minutes', '8-hours', '12-hours', '24-hours']) {
      expect(slugs.has(slug), slug).toBe(true);
    }
  });

  it('give every preset a unique tagline, at least three unique use cases and a preset-specific FAQ', () => {
    expect(unique(TIMER_PRESETS.map((p) => p.tagline))).toBe(true);
    const ownQuestions: string[] = [];
    for (const preset of TIMER_PRESETS) {
      expect(preset.tagline, preset.slug).toMatch(/[.!]$/);
      expect(preset.useCases.length, preset.slug).toBeGreaterThanOrEqual(3);
      expect(unique(preset.useCases), preset.slug).toBe(true);
      expect(preset.faqs?.length ?? 0, `${preset.slug} needs its own FAQ`).toBeGreaterThanOrEqual(1);
      ownQuestions.push(...(preset.faqs ?? []).map((f) => f.question));
    }
    // No two pages share a preset-specific question.
    expect(unique(ownQuestions)).toBe(true);
  });

  it('only reference existing presets in related lists, never themselves', () => {
    const slugs = new Set(TIMER_PRESETS.map((p) => p.slug));
    for (const preset of TIMER_PRESETS) {
      for (const slug of preset.related ?? []) {
        expect(slugs.has(slug), `${preset.slug} → ${slug}`).toBe(true);
        expect(slug).not.toBe(preset.slug);
      }
    }
  });

  it('group presets by unit and keep quick presets to a short chip row', () => {
    const groups = getTimerPresetsByGroup();
    expect(groups.seconds.map((p) => p.slug)).toEqual(['30-seconds', '90-seconds']);
    expect(groups.minutes[0]!.slug).toBe('1-minute');
    expect(groups.hours[0]!.slug).toBe('1-hour');
    expect(timerGroup({ seconds: 5400 } as never)).toBe('minutes'); // 90 minutes is not a whole number of hours
    expect(groups.seconds.length + groups.minutes.length + groups.hours.length).toBe(TIMER_PRESETS.length);
    const quick = getQuickPresets().map((p) => p.slug);
    expect(quick.length).toBeLessThanOrEqual(8);
    expect(quick).toContain('1-hour');
    expect(quick).toContain('5-minutes');
  });

  it('relate each page to its nearest lengths plus curated picks, without itself or duplicates', () => {
    const related = getRelatedTimerPresets(TIMER_PRESETS.find((p) => p.slug === '25-minutes')!).map((p) => p.slug);
    expect(related).toEqual(['5-minutes', '15-minutes', '20-minutes', '30-minutes', '40-minutes', '50-minutes']);
    for (const preset of TIMER_PRESETS) {
      const slugs = getRelatedTimerPresets(preset).map((p) => p.slug);
      expect(slugs.length, preset.slug).toBeGreaterThanOrEqual(2);
      expect(slugs).not.toContain(preset.slug);
      expect(unique(slugs)).toBe(true);
    }
  });

  it('redirect second, minute and hour spellings to the canonical slug', () => {
    const aliases = new Map(getTimerAliases().map((a) => [a.source, a.destination]));
    expect(aliases.get('30-sec')).toBe('30-seconds');
    expect(aliases.get('30-secs')).toBe('30-seconds');
    expect(aliases.get('30-second')).toBe('30-seconds');
    expect(aliases.get('90-min')).toBe('90-minutes');
    expect(aliases.get('5400-seconds')).toBe('90-minutes');
    expect(aliases.get('60-minutes')).toBe('1-hour');
    expect(aliases.get('1-hr')).toBe('1-hour');
    expect(aliases.get('24-hrs')).toBe('24-hours');
    expect(aliases.get('1440-minutes')).toBe('24-hours');
    expect(unique([...aliases.keys()])).toBe(true);
    const canonical = new Set(TIMER_PRESETS.map((p) => p.slug));
    for (const source of aliases.keys()) expect(canonical.has(source), source).toBe(false);
  });
});

describe('timer copy', () => {
  it('writes unique, length-appropriate descriptions and intros', () => {
    const descriptions = TIMER_PRESETS.map(timerMetaDescription);
    expect(unique(descriptions)).toBe(true);
    for (const [i, description] of descriptions.entries()) {
      expect(description.length, TIMER_PRESETS[i]!.slug).toBeLessThanOrEqual(165);
      expect(description).toContain(TIMER_PRESETS[i]!.phrase);
    }
    expect(unique(TIMER_PRESETS.map(timerIntro))).toBe(true);
  });

  it('spells out equivalents for seconds, minutes and hours', () => {
    const by = (slug: string) => TIMER_PRESETS.find((p) => p.slug === slug)!;
    expect(equivalents(by('30-seconds'))).toBe('30 seconds');
    expect(equivalents(by('90-seconds'))).toBe('1 minute 30 seconds');
    expect(equivalents(by('5-minutes'))).toBe('300 seconds');
    expect(equivalents(by('90-minutes'))).toBe('1 hour 30 minutes or 5,400 seconds');
    expect(equivalents(by('1-hour'))).toBe('60 minutes or 3,600 seconds');
    expect(equivalents(by('24-hours'))).toBe('1,440 minutes or 86,400 seconds');
  });

  it('puts preset-specific questions before the shared ones and never repeats a question on a page', () => {
    for (const preset of TIMER_PRESETS) {
      const faqs = timerFaqs(preset);
      expect(faqs[0]!.question).toBe(preset.faqs![0]!.question);
      expect(unique(faqs.map((f) => f.question)), preset.slug).toBe(true);
      expect(faqs.some((f) => f.question === `How long is ${preset.phrase}?`)).toBe(true);
    }
  });

  it('titles pages with the unit as an adjective, keeping the Sprint 1 reference title', () => {
    const by = (slug: string) => TIMER_PRESETS.find((p) => p.slug === slug)!;
    expect(timerTitle(by('1-hour'))).toBe('1 Hour Timer');
    expect(timerTitle(by('1-minute'))).toBe('1 Minute Timer');
    expect(timerTitle(by('25-minutes'))).toBe('25 Minute Timer');
    expect(timerTitle(by('30-seconds'))).toBe('30 Second Timer');
    expect(timerTitle(by('24-hours'))).toBe('24 Hour Timer');
    expect(unique(TIMER_PRESETS.map(timerTitle))).toBe(true);
  });

  it('describes the hub from the dataset', () => {
    expect(TIMER_HUB_TITLE).toBe('Online Timer');
    expect(timerHubDescription().length).toBeLessThanOrEqual(160);
    expect(timerHubDescription()).toContain(`${TIMER_PRESETS.length} ready-made timers`);
    expect(timerHubDescription()).toContain('from 30 seconds to 24 hours');
    const faqs = timerHubFaqs();
    expect(faqs.length).toBe(5);
    expect(faqs[1]!.answer).toContain('2 second timers');
    expect(unique(faqs.map((f) => f.question))).toBe(true);
  });
});
