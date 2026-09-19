/** 12-hour ↔ 24-hour (military) time conversion. Pure. */
import type { ClockTime } from './hours-calculator';

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Accepts "2:30 pm", "2:30PM", "14:30", "1430", "0930", "9 am", "9", "noon", "midnight".
 * A bare number under 13 without AM/PM is read as a 24-hour hour ("9" → 09:00).
 */
export function parseFlexibleTime(input: string): ClockTime | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;
  if (raw === 'noon' || raw === '12 noon') return { hour: 12, minute: 0 };
  if (raw === 'midnight' || raw === '12 midnight') return { hour: 0, minute: 0 };
  const match = /^(\d{1,2})(?::?(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?$/.exec(raw);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3]?.replace(/\./g, '');
  if (minute > 59) return null;
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === 'am') hour = hour === 12 ? 0 : hour;
    else hour = hour === 12 ? 12 : hour + 12;
  } else if (hour > 23) {
    return null;
  }
  return { hour, minute };
}

/** { hour: 14, minute: 30 } → "1430". */
export function toMilitary(time: ClockTime): string {
  return `${pad2(time.hour)}${pad2(time.minute)}`;
}

/** { hour: 14, minute: 30 } → "14:30". */
export function to24Hour(time: ClockTime): string {
  return `${pad2(time.hour)}:${pad2(time.minute)}`;
}

/** { hour: 14, minute: 30 } → "2:30 PM"; midnight → "12:00 AM". */
export function to12Hour(time: ClockTime): string {
  const meridiem = time.hour < 12 ? 'AM' : 'PM';
  const hour12 = time.hour % 12 === 0 ? 12 : time.hour % 12;
  return `${hour12}:${pad2(time.minute)} ${meridiem}`;
}

/** How the military time is read aloud: "1430" → "fourteen thirty hours", "0900" → "zero nine hundred hours". */
export function spokenMilitary(time: ClockTime): string {
  const hourWord = time.hour < 10 ? `zero ${NUMBERS[time.hour]}` : NUMBERS[time.hour]!;
  if (time.minute === 0) return `${hourWord} hundred hours`;
  const minuteWord = time.minute < 10 ? `zero ${NUMBERS[time.minute]}` : numberWord(time.minute);
  return `${hourWord} ${minuteWord} hours`;
}

const NUMBERS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
  'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two', 'twenty-three',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];

function numberWord(n: number): string {
  if (n < 24) return NUMBERS[n]!;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return ones ? `${TENS[tens]}-${NUMBERS[ones]}` : TENS[tens]!;
}

export type MilitaryRow = { hour24: string; military: string; hour12: string; spoken: string };

/** The 24 whole hours, for the reference table. */
export function militaryTable(): MilitaryRow[] {
  return Array.from({ length: 24 }, (_, hour) => {
    const time = { hour, minute: 0 };
    return { hour24: to24Hour(time), military: toMilitary(time), hour12: to12Hour(time), spoken: spokenMilitary(time) };
  });
}
