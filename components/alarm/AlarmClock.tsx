'use client';

import { useEffect, useRef, useState } from 'react';
import { Callout } from '@/components/ui/Callout';
import { Icon } from '@/components/ui/Icon';
import { track } from '@/lib/analytics';
import { createBeepContext, playBeepPattern } from '@/lib/clock/beep';
import { createPersistedStore, usePersisted } from '@/lib/clock/persisted';
import { useHourCycle, useHydrated, useNow } from '@/lib/clock/stores';
import { dueAlarms, formatAlarmTime, formatUntil, minuteKey, msUntilAlarm, parseAlarmTime, type Alarm } from '@/lib/tools/alarm';

const store = createPersistedStore<Alarm[]>('timenow:alarms', (raw) =>
  Array.isArray(raw) ? raw.filter((a): a is Alarm => typeof a === 'object' && a !== null && typeof (a as Alarm).time === 'string' && parseAlarmTime((a as Alarm).time) !== null).slice(0, 20) : null,
);

const EMPTY: Alarm[] = [];
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Alarms ring in this tab, in the device's local time, once per day while
 * switched on. Sound needs a prior user interaction (setting the alarm).
 */
export function AlarmClock() {
  const hydrated = useHydrated();
  const now = useNow();
  const hourCycle = useHourCycle();
  const alarms = usePersisted(store) ?? EMPTY;
  const [time, setTime] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [soundOn, setSoundOn] = useState(true);
  const [ringing, setRinging] = useState<Alarm | null>(null);
  const ringingRef = useRef<Alarm | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const tracked = useRef(false);

  const nowDate = now === null ? null : new Date(now);
  const defaultTime = nowDate ? `${pad((nowDate.getHours() + 1) % 24)}:00` : '';
  const timeValue = time ?? defaultTime;

  useEffect(() => {
    ringingRef.current = ringing;
  }, [ringing]);

  // Check for due alarms once a second, reading the store directly so the interval never re-subscribes.
  useEffect(() => {
    const check = () => {
      if (ringingRef.current) return;
      const current = store.get() ?? [];
      const at = new Date();
      const due = dueAlarms(current, at);
      if (due.length === 0) return;
      const key = minuteKey(at);
      store.set(current.map((a) => (due.some((d) => d.id === a.id) ? { ...a, lastFired: key } : a)));
      setRinging(due[0]!);
    };
    const id = window.setInterval(check, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Repeat the beep while ringing.
  useEffect(() => {
    if (!ringing || !soundOn) return;
    playBeepPattern(audio.current);
    const id = window.setInterval(() => playBeepPattern(audio.current), 3500);
    return () => window.clearInterval(id);
  }, [ringing, soundOn]);

  useEffect(() => {
    if (!ringing) return;
    const original = document.title;
    document.title = `⏰ ${ringing.label || 'Alarm'} · TimeNow`;
    return () => {
      document.title = original;
    };
  }, [ringing]);

  const ensureAudio = () => {
    audio.current ??= createBeepContext();
    if (audio.current?.state === 'suspended') void audio.current.resume();
  };

  const addAlarm = () => {
    if (parseAlarmTime(timeValue) === null) return;
    ensureAudio();
    const alarm: Alarm = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, time: timeValue, label: label.trim().slice(0, 60), enabled: true };
    store.set([...alarms, alarm].slice(-20));
    setLabel('');
    if (!tracked.current) {
      tracked.current = true;
      track('tool_selected', { tool: 'alarm' });
    }
  };

  const snooze = () => {
    if (!ringing) return;
    const at = new Date(Date.now() + 5 * 60_000);
    const alarm: Alarm = { id: `${Date.now()}-snooze`, time: `${pad(at.getHours())}:${pad(at.getMinutes())}`, label: `${ringing.label || 'Alarm'} (snoozed)`, enabled: true };
    store.set([...alarms, alarm].slice(-20));
    setRinging(null);
  };

  const inputClass = 'mt-1 h-11 w-full rounded-lg border border-border bg-white px-3 text-[15px] text-heading focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div className="space-y-4">
      {ringing && (
        <div role="alert" data-alarm-ringing className="card border-primary bg-blue-surface px-4 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Alarm</p>
          <p className="mt-1 text-2xl font-bold text-heading">{ringing.label || formatAlarmTime(ringing.time, hourCycle)}</p>
          {ringing.label && <p className="text-sm text-muted">{formatAlarmTime(ringing.time, hourCycle)}</p>}
          <div className="mt-3 flex justify-center gap-2">
            <button type="button" onClick={() => setRinging(null)} className="inline-flex h-11 items-center rounded-lg bg-primary-dark px-5 text-sm font-semibold text-white hover:bg-primary">
              Stop
            </button>
            <button type="button" onClick={snooze} className="inline-flex h-11 items-center rounded-lg border border-border bg-white px-5 text-sm font-semibold text-heading hover:bg-surface">
              Snooze 5 min
            </button>
          </div>
        </div>
      )}

      <form
        className="card p-4"
        onSubmit={(event) => {
          event.preventDefault();
          addAlarm();
        }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[9rem_1fr]">
          <label className="text-xs font-medium text-muted">
            Time
            <input type="time" required value={timeValue} onChange={(event) => setTime(event.target.value)} className={`tabular ${inputClass}`} />
          </label>
          <label className="text-xs font-medium text-muted">
            Label (optional)
            <input type="text" value={label} maxLength={60} placeholder="Call Sam" onChange={(event) => setLabel(event.target.value)} className={inputClass} />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-lg bg-success px-5 text-sm font-semibold text-white hover:bg-success-dark">
            <Icon name="alarm" className="size-4" /> Set alarm
          </button>
          <button
            type="button"
            onClick={() => setSoundOn((v) => !v)}
            aria-pressed={soundOn}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-medium text-heading hover:bg-surface"
          >
            <Icon name={soundOn ? 'volume' : 'volume-off'} className="size-4" /> {soundOn ? 'Sound on' : 'Sound off'}
          </button>
          <button
            type="button"
            onClick={() => {
              ensureAudio();
              playBeepPattern(audio.current, 2);
            }}
            className="inline-flex h-11 items-center rounded-lg px-3 text-sm font-medium text-primary hover:bg-blue-surface"
          >
            Test sound
          </button>
        </div>
      </form>

      <ul className="card divide-y divide-border" aria-label="Your alarms">
        {hydrated && alarms.length === 0 && <li className="px-4 py-5 text-center text-sm text-muted">No alarms yet.</li>}
        {alarms.map((alarm) => {
          const until = nowDate && alarm.enabled ? msUntilAlarm(nowDate, alarm.time) : null;
          return (
            <li key={alarm.id} data-alarm-row className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="tabular text-lg font-semibold text-heading">{formatAlarmTime(alarm.time, hourCycle)}</p>
                <p className="truncate text-xs text-muted">
                  {alarm.label || 'Alarm'}
                  {until !== null && ` · in ${formatUntil(until)}`}
                  {!alarm.enabled && ' · off'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={alarm.enabled}
                aria-label={`${alarm.label || formatAlarmTime(alarm.time, hourCycle)} alarm ${alarm.enabled ? 'on' : 'off'}`}
                onClick={() => store.set(alarms.map((a) => (a.id === alarm.id ? { ...a, enabled: !a.enabled } : a)))}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${alarm.enabled ? 'bg-primary' : 'bg-border-strong'}`}
              >
                <span className={`absolute top-1 left-1 size-5 rounded-full bg-white transition-transform ${alarm.enabled ? 'translate-x-5' : ''}`} />
              </button>
              <button type="button" onClick={() => store.set(alarms.filter((a) => a.id !== alarm.id))} aria-label={`Delete ${alarm.label || formatAlarmTime(alarm.time, hourCycle)} alarm`} className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-heading">
                <Icon name="x" className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>

      <Callout tone="notice" title="What a browser alarm can and cannot do">
        It rings only while this tab is open and your device is awake; browsers cannot run closed tabs, and phones usually mute web audio when the screen locks. Use your phone’s built-in alarm to wake up; use this for reminders while you are at the computer.
      </Callout>
    </div>
  );
}
