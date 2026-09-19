import type { Tool } from '@/types/data';

/**
 * Tool registry. `status: 'planned'` tools are shown as "coming soon" and
 * never linked, so navigation never points at routes that don't exist yet.
 */
export const TOOLS: Tool[] = [
  { key: 'converter', name: 'Time Zone Converter', shortName: 'Time Zone Converter', description: 'Convert a time between any two time zones, DST included.', href: '/converter/', icon: 'converter', status: 'live' },
  { key: 'meeting-planner', name: 'Meeting Planner', shortName: 'Meeting Planner', description: 'Find hours that work across several time zones.', href: '/meeting-planner/', icon: 'meeting', status: 'live' },
  { key: 'timer', name: 'Countdown Timer', shortName: 'Countdown Timer', description: 'Set a timer for any length with sound when it ends.', href: '/timer/', icon: 'timer', status: 'live' },
  { key: 'alarm', name: 'Alarm Clock', shortName: 'Alarm Clock', description: 'An online alarm for the current browser tab.', href: '/alarm/', icon: 'alarm', status: 'live' },
  { key: 'stopwatch', name: 'Stopwatch', shortName: 'Stopwatch', description: 'Start, pause and record lap times.', href: '/stopwatch/', icon: 'stopwatch', status: 'live' },
  { key: 'date-difference', name: 'Date Calculator', shortName: 'Date Calculator', description: 'Count the days between two dates.', href: '/tools/date-difference/', icon: 'calendar', status: 'live' },
  { key: 'hours-calculator', name: 'Hours Calculator', shortName: 'Hours Calculator', description: 'Add up hours and minutes worked.', href: '/tools/hours-calculator/', icon: 'hourglass', status: 'live' },
  { key: 'military-time', name: 'Military Time Converter', shortName: 'Military Time', description: 'Convert between 12-hour and 24-hour time.', href: '/tools/military-time-converter/', icon: 'clock', status: 'live' },
  { key: 'unix-timestamp', name: 'Unix Timestamp Converter', shortName: 'Unix Timestamp', description: 'Convert Unix timestamps to dates and back.', href: '/tools/unix-timestamp/', icon: 'hash', status: 'live' },
];

/** Homepage "Time Tools", in display order (matches the Visual PRD). */
export const HOME_TOOL_KEYS = ['converter', 'meeting-planner', 'timer', 'alarm', 'stopwatch', 'date-difference'];
