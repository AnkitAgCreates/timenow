/** Copy for timer pages, derived from the preset record. */
import type { FaqItem } from '@/lib/seo/jsonld';
import type { TimerPreset } from '@/types/data';

const number = (n: number) => n.toLocaleString('en-US');

/** "60 minutes or 3,600 seconds" / "300 seconds" */
function equivalents(preset: TimerPreset): string {
  const minutes = preset.seconds / 60;
  if (preset.seconds >= 3600) return `${number(minutes)} minutes or ${number(preset.seconds)} seconds`;
  return `${number(preset.seconds)} seconds`;
}

export function timerMetaDescription(preset: TimerPreset): string {
  return `Free ${preset.phrase} timer that counts down ${equivalents(preset)} with an alarm sound. Start, pause and reset in one click — no sign-up or download.`;
}

export const TIMER_BENEFITS = [
  { icon: 'target', title: 'Stay focused', text: 'Great for work, study or exercise.' },
  { icon: 'zap', title: 'Be more productive', text: 'Break large tasks into smaller chunks.' },
  { icon: 'shield', title: 'Reduce stress', text: 'A clear end time helps you stay on track.' },
  { icon: 'devices', title: 'Works on any device', text: 'Use it on desktop, tablet or mobile.' },
] as const;

export function timerFaqs(preset: TimerPreset): FaqItem[] {
  return [
    {
      question: `How do I use the ${preset.phrase} timer?`,
      answer: `Press Start and the timer counts down from ${preset.phrase}. You can pause and resume at any time, or press Reset to start over. When the countdown reaches zero you’ll see “Time’s up!” and, if sound is on, hear an alarm.`,
    },
    {
      question: `How long is ${preset.phrase}?`,
      answer: `${preset.phrase[0]!.toUpperCase()}${preset.phrase.slice(1)} is ${equivalents(preset)}.`,
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
    {
      question: 'Can I set a different length?',
      answer: 'Yes. Choose one of the quick presets or select Custom to enter any number of hours, minutes and seconds.',
    },
  ];
}
