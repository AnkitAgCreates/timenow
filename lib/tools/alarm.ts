/** Alarm scheduling helpers. Pure; times are the device's local wall clock. */

export type Alarm = { id: string; time: string; label: string; enabled: boolean; lastFired?: string };

/** "HH:MM" → minutes after midnight, or null. */
export function parseAlarmTime(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour <= 23 && minute <= 59 ? hour * 60 + minute : null;
}

/** Milliseconds from `nowLocal` (a Date in the device zone) until the next occurrence of "HH:MM". */
export function msUntilAlarm(nowLocal: Date, time: string): number | null {
  const minutes = parseAlarmTime(time);
  if (minutes === null) return null;
  const next = new Date(nowLocal);
  next.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  if (next.getTime() <= nowLocal.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - nowLocal.getTime();
}

/** 27_000_000 → "7 h 30 min"; 90_000 → "1 min"; 30_000 → "less than a minute". */
export function formatUntil(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return 'less than a minute';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

/** Key that identifies the minute an alarm fires in, so it rings once per day. */
export function minuteKey(nowLocal: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${nowLocal.getFullYear()}-${p(nowLocal.getMonth() + 1)}-${p(nowLocal.getDate())} ${p(nowLocal.getHours())}:${p(nowLocal.getMinutes())}`;
}

/** Alarms that should ring at `nowLocal`: enabled, matching HH:MM, not already fired this minute. */
export function dueAlarms(alarms: Alarm[], nowLocal: Date): Alarm[] {
  const key = minuteKey(nowLocal);
  const hhmm = key.slice(11);
  return alarms.filter((alarm) => alarm.enabled && alarm.time === hhmm && alarm.lastFired !== key);
}

/** "07:30" → "7:30 AM" for display. */
export function formatAlarmTime(time: string, hourCycle: '12h' | '24h' = '12h'): string {
  const minutes = parseAlarmTime(time);
  if (minutes === null) return time;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (hourCycle === '24h') return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
