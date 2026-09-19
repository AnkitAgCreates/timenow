/** Copy for timer pages, derived from the preset record. */
import type { FaqItem } from '@/lib/seo/jsonld';
import { getAllTimerPresets, timerGroup } from '@/lib/data/timers';
import type { TimerPreset } from '@/types/data';

const number = (n: number) => n.toLocaleString('en-US');

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

/** "60 minutes or 3,600 seconds" / "1 hour 30 minutes or 5,400 seconds" / "300 seconds" / "1 minute 30 seconds" / "30 seconds". */
export function equivalents(preset: TimerPreset): string {
  const { seconds } = preset;
  if (seconds >= 3600) {
    const wholeHours = seconds % 3600 === 0;
    const hoursAndMinutes = wholeHours ? number(seconds / 60) + ' minutes' : `${plural(Math.floor(seconds / 3600), 'hour')} ${plural((seconds % 3600) / 60, 'minute')}`;
    return `${hoursAndMinutes} or ${number(seconds)} seconds`;
  }
  if (seconds % 60 === 0) return `${number(seconds)} seconds`;
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${plural(minutes, 'minute')} ${seconds % 60} seconds` : `${seconds} seconds`;
}

const capitalise = (s: string) => `${s[0]!.toUpperCase()}${s.slice(1)}`;

/** "25 Minutes" → "25 Minute Timer", "1 Hour" → "1 Hour Timer": the unit reads as an adjective, as people search for it. */
export function timerTitle(preset: TimerPreset): string {
  return `${preset.label.replace(/s$/, '')} Timer`;
}

export function timerMetaDescription(preset: TimerPreset): string {
  return `Free ${preset.phrase} timer. ${preset.tagline} Start, pause and reset, with an alarm at zero.`;
}

/** Short intro paragraph under the timer, unique per preset. */
export function timerIntro(preset: TimerPreset): string {
  const seconds = preset.seconds % 60 === 0 ? equivalents(preset) : `${preset.seconds} seconds`;
  return `${preset.tagline} Press Start and the ${preset.phrase} timer counts down ${seconds}, keeps the remaining time in the tab title, and rings when it reaches zero.`;
}

export const TIMER_BENEFITS = [
  { icon: 'target', title: 'Stay focused', text: 'Great for work, study or exercise.' },
  { icon: 'zap', title: 'Be more productive', text: 'Break large tasks into smaller chunks.' },
  { icon: 'shield', title: 'Reduce stress', text: 'A clear end time helps you stay on track.' },
  { icon: 'devices', title: 'Works on any device', text: 'Use it on desktop, tablet or mobile.' },
] as const;

/** Questions every timer page answers; the preset's own questions come first. */
function sharedTimerFaqs(preset: TimerPreset): FaqItem[] {
  return [
    {
      question: `How do I use the ${preset.phrase} timer?`,
      answer: `Press Start and the timer counts down from ${preset.phrase}. You can pause and resume at any time, or press Reset to start over. When the countdown reaches zero you’ll see “Time’s up!” and, if sound is on, hear an alarm.`,
    },
    {
      question: `How long is ${preset.phrase}?`,
      answer: `${capitalise(preset.phrase)} is ${equivalents(preset)}.`,
    },
    {
      question: 'Will the timer keep running if I switch tabs?',
      answer:
        'Yes. The countdown is based on your device clock, so the remaining time stays accurate in a background tab and the tab title shows the time left. Browsers may delay sounds in background tabs and cannot play them if the tab is closed or the device is asleep, so keep the page open for important alerts.',
    },
    {
      question: 'Why didn’t I hear the alarm?',
      answer:
        'Check that the sound button is on and your device isn’t muted. Browsers only allow sound after you interact with the page, which pressing Start does. Some phones silence web audio when the screen locks.',
    },
  ];
}

export function timerFaqs(preset: TimerPreset): FaqItem[] {
  return [...(preset.faqs ?? []), ...sharedTimerFaqs(preset)];
}

// ---------------------------------------------------------------------------
// Timer hub

export const TIMER_HUB_TITLE = 'Online Timer';

export function timerHubDescription(): string {
  const presets = getAllTimerPresets();
  return `Free online countdown timer with an alarm. Set any hours, minutes and seconds, or pick one of ${presets.length} ready-made timers from ${presets[0]!.phrase} to ${presets[presets.length - 1]!.phrase}.`;
}

export const TIMER_GROUP_LABELS = {
  seconds: { title: 'Seconds', blurb: 'Short intervals for exercise, games and quick tasks.' },
  minutes: { title: 'Minutes', blurb: 'Breaks, focus sessions, cooking and workouts.' },
  hours: { title: 'Hours', blurb: 'Exams, slow cooking, shifts, fasting windows and long deadlines.' },
} as const;

export const TIMER_HOW_TO = [
  { title: 'Pick a length', text: 'Choose a preset chip, open one of the timer pages below, or select Custom and enter hours, minutes and seconds.' },
  { title: 'Press Start', text: 'The countdown begins immediately and the remaining time also appears in the browser tab, so you can switch to other work.' },
  { title: 'Pause, resume or reset', text: 'Pause keeps your place; Resume continues from the same second; Reset returns to the full length.' },
  { title: 'Hear the alarm', text: 'At zero the page shows “Time’s up!” and plays a repeating beep if sound is on. No download or account is needed.' },
] as const;

export const TIMER_COMPARISON = [
  {
    tool: 'Countdown timer',
    use: 'Counts down from a set length to zero and alerts you. Use it when the task has a fixed duration: a focus session, a rest interval, a bake.',
  },
  {
    tool: 'Stopwatch',
    use: 'Counts up from zero and records laps. Use it when you want to measure how long something takes rather than limit it.',
  },
  {
    tool: 'Alarm clock',
    use: 'Rings at a time of day rather than after a duration. Use it for “at 7:30”, not “in 25 minutes”.',
  },
] as const;

export function timerHubFaqs(): FaqItem[] {
  const groups = { seconds: 0, minutes: 0, hours: 0 };
  for (const preset of getAllTimerPresets()) groups[timerGroup(preset)] += 1;
  return [
    {
      question: 'Can I set the timer to any length?',
      answer:
        'Yes. Choose Custom and enter hours, minutes and seconds. The preset pages exist for the lengths people use most, so each can explain what that length is good for.',
    },
    {
      question: 'Which timer lengths are available as pages?',
      answer: `${groups.seconds} second timers, ${groups.minutes} minute timers and ${groups.hours} hour timers, from 30 seconds to 24 hours, each with its own use cases. Every other length is available through Custom.`,
    },
    {
      question: 'Does the timer work when the tab is in the background?',
      answer:
        'The countdown stays accurate because it is calculated from the end time, and the remaining time shows in the tab title. Browsers may mute or delay the alarm sound in background tabs, and cannot play it if the tab is closed or the device is asleep.',
    },
    {
      question: 'Is there a sound when the timer finishes?',
      answer:
        'Yes, a repeating beep generated by the browser, so nothing needs to download. You can turn it off with the sound button. Browsers only allow sound after you interact with the page, which pressing Start does.',
    },
    {
      question: 'Do I need to install anything or sign up?',
      answer: 'No. The timer runs entirely in your browser on desktop, tablet and mobile, and nothing you set is sent to a server.',
    },
  ];
}
