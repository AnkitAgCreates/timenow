/** Copy for the World Clock page. */
import type { FaqItem } from '@/lib/seo/jsonld';
import { getAllCities } from '@/lib/data/cities';

export const WORLD_CLOCK_TITLE = 'World Clock';

export function worldClockDescription(): string {
  return `Live world clock: add any of ${getAllCities().length} cities or time zones, see the current time, date and UTC offset in each, and keep your list on this device. Free, no sign-up.`;
}

export const WORLD_CLOCK_HOW_TO = [
  { title: 'Add a place', text: 'Type a city, a time zone abbreviation such as EST or a UTC offset, then pick it from the list.' },
  { title: 'Read the clocks', text: 'Each row shows the local time, weekday and date, the abbreviation in effect right now and the UTC offset. Your own time zone stays at the top.' },
  { title: 'Keep your list', text: 'Your places are saved in this browser, so they are there next time. Remove any row, or reset to the default cities.' },
] as const;

export function worldClockFaqs(): FaqItem[] {
  return [
    {
      question: 'Do the clocks account for daylight saving time?',
      answer: 'Yes. Every clock follows its IANA time zone rules, so cities switch on their own dates and the abbreviation shown (EDT, BST, AEDT …) is the one in effect right now.',
    },
    {
      question: 'Where is my list of cities stored?',
      answer: 'In your browser’s local storage on this device only. Nothing is sent to a server, and the list is not shared between devices or browsers.',
    },
    {
      question: 'Why does the date differ between cities?',
      answer: 'Because the world spans 26 hours of offsets (UTC−12 to UTC+14), it is often already tomorrow in Sydney or Tokyo while it is still today in Los Angeles. The weekday and date under each clock tell you which day it is there.',
    },
    {
      question: 'Can I show 24-hour time?',
      answer: 'Yes. The 12-hour / 24-hour toggle on any clock page applies to every clock on the site, including the world clock.',
    },
    {
      question: 'How accurate are the clocks?',
      answer: 'They use your device’s clock, converted with the same time zone rules operating systems use. If your device clock is right, the world clock is right to the second.',
    },
  ];
}
