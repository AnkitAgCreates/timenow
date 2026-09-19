/** Copy for the Sprint 5 tool pages (stopwatch, alarm, calculators). Keyed by the tool registry key. */
import type { FaqItem } from '@/lib/seo/jsonld';

export type ToolContent = {
  /** H1 */
  title: string;
  documentTitle: string;
  description: string;
  subtitle: string;
  howTo: ReadonlyArray<{ title: string; text: string }>;
  faqs: FaqItem[];
};

export const TOOL_CONTENT: Record<string, ToolContent> = {
  'meeting-planner': {
    title: 'Meeting Planner',
    documentTitle: 'Meeting Planner – Find a Meeting Time Across Time Zones',
    description: 'Plan a meeting across two to four time zones: every hour side by side, your working hours, suggested slots that suit everyone, and a link to share.',
    subtitle: 'Compare up to four places hour by hour, set working hours, and pick a slot that works for everyone.',
    howTo: [
      { title: 'Add the places', text: 'Type a city or time zone for each participant (two to four). The first one is the reference for the date and the hour grid.' },
      { title: 'Set the date and hours', text: 'Pick the meeting date and length, and adjust the working hours if 9 AM–5 PM is not right. Early and late hours (7 AM–10 PM) count as acceptable but not ideal.' },
      { title: 'Choose a slot', text: 'Green columns are inside everyone’s working hours. Click a column to select it, then copy the summary or the share link.' },
    ],
    faqs: [
      {
        question: 'How are the suggested times chosen?',
        answer: 'The planner steps through every whole hour of the reference day and keeps the starts where the whole meeting fits inside each participant’s working hours. If no hour suits everyone, it offers hours that are within working hours for at least one participant and within 7 AM–10 PM for the rest.',
      },
      {
        question: 'Does it handle daylight saving time?',
        answer: 'Yes. Every column is computed for the date you choose using each zone’s rules, so a meeting planned for next month uses next month’s offsets.',
      },
      {
        question: 'Why does a column show a different date for one participant?',
        answer: 'When a time falls on the next or previous calendar day in that place, the cell says so. A 4 PM call in Los Angeles is 9 AM the next day in Sydney.',
      },
      {
        question: 'What does the share link contain?',
        answer: 'Only the time zones, the date and the working-hour settings, in the address. Nothing is stored on a server, and the link opens the planner with the same set-up for anyone.',
      },
      {
        question: 'Can I plan for more than four places?',
        answer: 'Not in one view. For larger groups, plan the two or three hardest zones first, then check the rest with the World Clock or the converter.',
      },
    ],
  },
  stopwatch: {
    title: 'Online Stopwatch',
    documentTitle: 'Online Stopwatch – Start, Pause, Lap Times',
    description: 'Free online stopwatch with lap times. Start, pause, resume and reset with a click or the space bar; laps show split and total times, fastest and slowest marked.',
    subtitle: 'Counts up from zero with hundredths of a second, records laps, and keeps going in a background tab.',
    howTo: [
      { title: 'Start and pause', text: 'Press Start (or the space bar). Pause keeps the time; Resume continues from the same instant.' },
      { title: 'Record laps', text: 'Press Lap (or L) while running. Each row shows that lap’s time and the total; the fastest and slowest laps are highlighted.' },
      { title: 'Reset', text: 'Pause first, then Reset (or R) clears the time and the laps.' },
    ],
    faqs: [
      {
        question: 'Does the stopwatch keep running if I switch tabs?',
        answer: 'Yes. The elapsed time is calculated from the moment you pressed Start, not by counting ticks, so it stays exact even when the browser slows down a background tab. The tab title shows the running time.',
      },
      {
        question: 'How precise is it?',
        answer: 'It displays hundredths of a second and uses your device clock. Reaction time in pressing the buttons (about a tenth of a second) matters more than the clock’s precision.',
      },
      {
        question: 'What is the difference between a stopwatch and a timer?',
        answer: 'A stopwatch counts up from zero to measure how long something takes; a countdown timer counts down from a length you set and alerts you at zero. Use the timer for “30 minutes of focus” and the stopwatch for “how long did that run take”.',
      },
      {
        question: 'Can I use keyboard shortcuts?',
        answer: 'Yes: space starts or pauses, L records a lap, R resets (when paused). Shortcuts are ignored while you are typing in a text field.',
      },
    ],
  },
  alarm: {
    title: 'Online Alarm Clock',
    documentTitle: 'Online Alarm Clock – Set an Alarm in Your Browser',
    description: 'Set an online alarm for any time with a label and a sound. The alarm rings in this browser tab while it stays open — read the limitations before relying on it.',
    subtitle: 'Rings in this tab at the time you choose, in your device’s local time. Works while the tab stays open and the device is awake.',
    howTo: [
      { title: 'Choose a time and label', text: 'Pick the time (your device’s local time), add a label such as “Call Sam” and press Set alarm. Setting the alarm is also what allows the browser to play sound later.' },
      { title: 'Keep the tab open', text: 'The alarm only rings while this page is open. Leave it in a tab; the countdown to the next alarm is shown on the page.' },
      { title: 'Stop or snooze', text: 'When it rings, press Stop to dismiss it or Snooze to ring again in five minutes. Alarms stay in your list, switched on or off, until you delete them.' },
    ],
    faqs: [
      {
        question: 'Will the alarm ring if I close the tab or lock my phone?',
        answer: 'No. A web page cannot run when its tab is closed, and most phones silence web audio when the screen locks or the device sleeps. For waking up, use your phone’s built-in alarm; this tool is for reminders while you are at the computer.',
      },
      {
        question: 'Why did the alarm not make a sound?',
        answer: 'Browsers only allow sound after you interact with the page. Setting the alarm counts as that interaction, but if the page was reloaded afterwards the browser may block audio until you click something. Press “Test sound” to check.',
      },
      {
        question: 'Which time zone does the alarm use?',
        answer: 'Your device’s current time zone. If you travel, the alarm follows the device clock. Use the World Clock if you need to see what that time is elsewhere.',
      },
      {
        question: 'Are my alarms saved?',
        answer: 'They are stored in this browser on this device (local storage). They are not synced anywhere and disappear if you clear site data.',
      },
      {
        question: 'Can I set more than one alarm?',
        answer: 'Yes. Each alarm has its own time, label and on/off switch. An alarm rings once per day at its time while it is switched on.',
      },
    ],
  },
  'date-difference': {
    title: 'Date Difference Calculator',
    documentTitle: 'Date Difference Calculator – Days Between Two Dates',
    description: 'Count the days between two dates with weeks, weekdays and the difference in years, months and days; include the end date if needed; add or subtract days.',
    subtitle: 'How many days between two dates — total days, weeks, weekdays only, and the difference in years, months and days.',
    howTo: [
      { title: 'Pick two dates', text: 'Enter a start and an end date. The order does not matter; the calculator tells you which is earlier.' },
      { title: 'Include the end date if you need to', text: 'For “how many days is the trip from the 10th to the 14th” you usually want both days counted; tick “Include end date”.' },
      { title: 'Read the breakdown', text: 'You get total days, weeks and days, weekdays (Monday to Friday) and the calendar difference in years, months and days.' },
    ],
    faqs: [
      {
        question: 'Is the end date counted?',
        answer: 'By default, no: from 1 January to 2 January is one day. Tick “Include end date” to count both days, which is how most deadlines and bookings are counted.',
      },
      {
        question: 'How are years and months calculated?',
        answer: 'The calculator takes the largest number of whole months that fits between the dates, then counts the remaining days. From 31 January to 1 March is 1 month and 1 day, because 31 January plus one month is the last day of February.',
      },
      {
        question: 'Does it handle leap years?',
        answer: 'Yes. 29 February is a real day in leap years (2024, 2028 …), so 28 February 2024 to 1 March 2024 is two days.',
      },
      {
        question: 'What counts as a weekday?',
        answer: 'Monday to Friday. Public holidays are not excluded, because they differ by country.',
      },
    ],
  },
  'hours-calculator': {
    title: 'Hours Calculator',
    documentTitle: 'Hours Calculator – Add Up Hours Worked Between Times',
    description: 'Hours and minutes between a start and end time, minus breaks, across several shifts, shown as hours:minutes and decimal hours for payroll.',
    subtitle: 'Hours between two times, minus breaks, across as many shifts as you like — shown as hours and minutes and as decimal hours.',
    howTo: [
      { title: 'Enter each shift', text: 'Type the start and end time and any unpaid break in minutes. Night shifts that end after midnight are handled automatically.' },
      { title: 'Add more rows', text: 'Press “Add shift” for each day or job; the total updates as you type.' },
      { title: 'Read the total', text: 'The total appears as hours and minutes (8h 30m) and as decimal hours (8.50), which payroll systems use. Enter an hourly rate to see the pay.' },
    ],
    faqs: [
      {
        question: 'How do I convert minutes to decimal hours?',
        answer: 'Divide the minutes by 60: 30 minutes is 0.50 hours, 45 minutes is 0.75, 20 minutes is 0.33. The calculator does this for the total.',
      },
      {
        question: 'What if the shift ends after midnight?',
        answer: 'Enter the times as they are, for example 22:00 to 06:00. An end time earlier than the start is treated as the next day, giving 8 hours.',
      },
      {
        question: 'Are breaks subtracted?',
        answer: 'Yes, enter unpaid break time in minutes for each row and it is taken off that row’s hours.',
      },
      {
        question: 'Can I calculate pay?',
        answer: 'Enter an hourly rate and the total pay is shown for the total hours. Overtime rates are not applied automatically.',
      },
    ],
  },
  'military-time': {
    title: 'Military Time Converter',
    documentTitle: 'Military Time Converter – 24-Hour to 12-Hour Time Chart',
    description: 'Convert military (24-hour) time to 12-hour AM/PM time and back, with a full 24-hour conversion chart and how each time is spoken (“fourteen thirty hours”).',
    subtitle: 'Type a time either way — 2:30 PM or 1430 — and see it in every format, plus the full 24-hour chart.',
    howTo: [
      { title: 'Type a time', text: 'Enter 12-hour time with AM/PM (2:30 pm), 24-hour time (14:30) or military time without the colon (1430).' },
      { title: 'Read the conversion', text: 'The result shows military time, 24-hour time with a colon, 12-hour time and how the military time is spoken.' },
      { title: 'Use the chart', text: 'The table lists every hour from 0000 to 2300 with its 12-hour equivalent.' },
    ],
    faqs: [
      {
        question: 'What is military time?',
        answer: 'The 24-hour clock written without a colon, from 0000 (midnight) to 2359. 1:00 PM is 1300, spoken “thirteen hundred hours”. It avoids AM/PM confusion and is used by the military, hospitals, aviation and much of the world in everyday life.',
      },
      {
        question: 'How do I convert PM times?',
        answer: 'Add 12 to the hour for 1 PM to 11 PM (3:45 PM → 1545). 12 PM stays 1200. For AM times keep the hour, with a leading zero below 10 (9:05 AM → 0905); 12 AM becomes 0000.',
      },
      {
        question: 'Is midnight 0000 or 2400?',
        answer: 'The start of a day is 0000; 2400 is sometimes used for the end of a day (“open until 2400”). This converter uses 0000.',
      },
      {
        question: 'How is military time spoken?',
        answer: 'Whole hours are “hundred hours” (0900 is “zero nine hundred hours”); other times are read as two pairs (1430 is “fourteen thirty hours”, 0005 is “zero zero zero five hours”).',
      },
    ],
  },
  'unix-timestamp': {
    title: 'Unix Timestamp Converter',
    documentTitle: 'Unix Timestamp Converter – Epoch Time to Date and Back',
    description: 'Convert a Unix timestamp (seconds or milliseconds) to a date in UTC, your zone or any city, and a date back to a timestamp. Shows the current epoch time live.',
    subtitle: 'Epoch seconds or milliseconds to a date in UTC or any time zone, and back again. The current Unix time is shown live.',
    howTo: [
      { title: 'Paste a timestamp', text: 'Seconds (10 digits) or milliseconds (13 digits) are detected automatically. Negative values are dates before 1970.' },
      { title: 'Or enter a date', text: 'Pick a date, time and time zone to get the timestamp for that moment, with daylight saving applied for that date.' },
      { title: 'Copy the results', text: 'Every result has a copy button: ISO 8601 in UTC, the local time, the RFC 2822 form and the timestamp in seconds and milliseconds.' },
    ],
    faqs: [
      {
        question: 'What is a Unix timestamp?',
        answer: 'The number of seconds since 00:00:00 UTC on 1 January 1970 (the Unix epoch), ignoring leap seconds. It is the same everywhere in the world, which is why systems store time this way and convert to local time only for display.',
      },
      {
        question: 'Seconds or milliseconds?',
        answer: 'Unix and most databases use seconds (10 digits today); JavaScript, Java and many APIs use milliseconds (13 digits). The converter reads anything with more than 11 digits as milliseconds.',
      },
      {
        question: 'What is the year 2038 problem?',
        answer: 'Systems that store the timestamp as a signed 32-bit integer cannot represent times after 2147483647 seconds, which is 03:14:07 UTC on 19 January 2038. Modern systems use 64-bit values.',
      },
      {
        question: 'Does the timestamp depend on my time zone?',
        answer: 'No. A timestamp identifies a single instant. Only the human-readable date depends on the zone you display it in, which is why this page lets you choose one.',
      },
    ],
  },
};

export function getToolContent(key: string): ToolContent {
  const content = TOOL_CONTENT[key];
  if (!content) throw new Error(`No content for tool "${key}"`);
  return content;
}
