'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { track } from '@/lib/analytics';
import { routes } from '@/lib/routes';
import { formatCountdown } from '@/lib/time/format';

type Status = 'idle' | 'running' | 'paused' | 'done';
type PresetLink = { slug: string; chip: string; seconds: number };

const RING_RADIUS = 88;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Short, repeating beep pattern generated with Web Audio (no audio file to download). */
function playAlarm(context: AudioContext | null) {
  if (!context) return;
  const start = context.currentTime + 0.05;
  for (let i = 0; i < 6; i++) {
    const t = start + i * 0.5;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = i % 2 === 0 ? 880 : 988;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(t);
    oscillator.stop(t + 0.4);
  }
}

/**
 * Countdown timer. Remaining time is derived from an absolute end timestamp,
 * so it stays accurate even when the browser throttles background tabs.
 */
export function Timer({
  initialSeconds,
  label,
  presets,
  activeSlug,
}: {
  initialSeconds: number;
  label: string;
  presets: PresetLink[];
  activeSlug?: string;
}) {
  const [durationMs, setDurationMs] = useState(initialSeconds * 1000);
  const [status, setStatus] = useState<Status>('idle');
  const [remainingMs, setRemainingMs] = useState(initialSeconds * 1000);
  const [soundOn, setSoundOn] = useState(true);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState({ h: '0', m: '0', s: '0' });
  const [announcement, setAnnouncement] = useState('');

  const endAtRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const soundOnRef = useRef(soundOn);
  const originalTitleRef = useRef<string | null>(null);

  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  const releaseWakeLock = useCallback(() => {
    void wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, []);

  const requestWakeLock = useCallback(async () => {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> } };
      wakeLockRef.current = (await nav.wakeLock?.request('screen')) ?? null;
    } catch {
      // Wake Lock is optional; ignore when unsupported or denied.
    }
  }, []);

  // Tick while running.
  useEffect(() => {
    if (status !== 'running') return;
    const update = () => {
      const left = Math.max(0, endAtRef.current - Date.now());
      setRemainingMs(left);
      if (left === 0) {
        setStatus('done');
        setAnnouncement(`Time’s up. The ${label.toLowerCase()} has finished.`);
        releaseWakeLock();
        if (soundOnRef.current) playAlarm(audioRef.current);
        track('timer_completed', { duration_seconds: Math.round(durationMs / 1000) });
      }
    };
    const interval = window.setInterval(update, 250);
    const onVisible = () => document.visibilityState === 'visible' && update();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [status, durationMs, label, releaseWakeLock]);

  // Reflect the countdown in the tab title so it is visible from other tabs.
  useEffect(() => {
    originalTitleRef.current ??= document.title;
    const original = originalTitleRef.current;
    if (status === 'running' || status === 'paused') document.title = `${formatCountdown(remainingMs / 1000)} · ${label}`;
    else if (status === 'done') document.title = `Time’s up! · ${label}`;
    else document.title = original;
  }, [status, remainingMs, label]);

  useEffect(
    () => () => {
      if (originalTitleRef.current) document.title = originalTitleRef.current;
      releaseWakeLock();
      void audioRef.current?.close().catch(() => {});
    },
    [releaseWakeLock],
  );

  const ensureAudio = () => {
    if (!audioRef.current) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      audioRef.current = Ctx ? new Ctx() : null;
    }
    void audioRef.current?.resume().catch(() => {});
  };

  const start = () => {
    ensureAudio(); // Created inside the click so browsers allow sound later.
    const base = status === 'paused' ? remainingMs : durationMs;
    if (base <= 0) return;
    endAtRef.current = Date.now() + base;
    setRemainingMs(base);
    setStatus('running');
    setAnnouncement(status === 'paused' ? 'Timer resumed.' : 'Timer started.');
    void requestWakeLock();
    if (status !== 'paused') track('timer_started', { duration_seconds: Math.round(base / 1000) });
  };

  const pause = () => {
    setRemainingMs(Math.max(0, endAtRef.current - Date.now()));
    setStatus('paused');
    setAnnouncement('Timer paused.');
    releaseWakeLock();
  };

  const reset = () => {
    setStatus('idle');
    setRemainingMs(durationMs);
    setAnnouncement('Timer reset.');
    releaseWakeLock();
  };

  const applyCustom = () => {
    const seconds = (Number(custom.h) || 0) * 3600 + (Number(custom.m) || 0) * 60 + (Number(custom.s) || 0);
    if (seconds <= 0) return;
    const clamped = Math.min(seconds, 99 * 3600 + 59 * 60 + 59);
    setDurationMs(clamped * 1000);
    setRemainingMs(clamped * 1000);
    setStatus('idle');
    setCustomOpen(false);
    setAnnouncement(`Timer set to ${formatCountdown(clamped)}.`);
  };

  // A finished timer shows a full green ring rather than an empty track.
  const progress = status === 'done' ? 1 : durationMs > 0 ? remainingMs / durationMs : 0;
  const display = formatCountdown(remainingMs / 1000);
  const primaryLabel = status === 'running' ? 'Pause' : status === 'paused' ? 'Resume' : 'Start';

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="relative mx-auto aspect-square w-[min(17rem,78vw)]" role="timer" aria-label={`${label}: ${display} remaining`}>
        <svg viewBox="0 0 200 200" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="100" cy="100" r={RING_RADIUS} fill="none" className="stroke-blue-surface" strokeWidth="10" />
          <circle
            cx="100"
            cy="100"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="10"
            visibility={progress > 0 ? 'visible' : 'hidden'}
            strokeLinecap={progress > 0 && progress < 1 ? 'round' : 'butt'}
            className={`${status === 'done' ? 'stroke-success' : 'stroke-blue-border'} transition-[stroke-dashoffset] duration-300 ease-linear`}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`tabular text-[clamp(2.25rem,10vw,3rem)] font-semibold tracking-tight ${status === 'done' ? 'text-success-dark' : 'text-heading'}`}>{display}</span>
          {status === 'done' && <span className="mt-1 text-sm font-semibold text-success-dark">Time’s up!</span>}
          {status === 'paused' && <span className="mt-1 text-sm font-medium text-muted">Paused</span>}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2.5">
        <button
          type="button"
          onClick={status === 'running' ? pause : status === 'done' ? reset : start}
          className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg text-base font-semibold text-white shadow-card transition-colors ${
            status === 'running' ? 'bg-primary hover:bg-primary-hover' : 'bg-success hover:bg-success-dark'
          }`}
        >
          <Icon name={status === 'running' ? 'pause' : status === 'done' ? 'reset' : 'play'} className="size-5" />
          {status === 'done' ? 'Restart' : primaryLabel}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={status === 'idle' && remainingMs === durationMs}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-white text-base font-semibold text-heading hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => setSoundOn((on) => !on)}
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Sound on — turn off the alarm sound' : 'Sound off — turn on the alarm sound'}
          className="inline-flex size-12 items-center justify-center rounded-lg border border-border bg-white text-heading hover:bg-surface"
        >
          <Icon name={soundOn ? 'volume' : 'volume-off'} className="size-5" />
        </button>
      </div>

      <nav aria-label="Timer presets" className="mt-5">
        <ul className="grid grid-cols-4 gap-2">
          {presets.map((preset) => {
            const active = preset.slug === activeSlug && !customOpen && durationMs === preset.seconds * 1000;
            return (
              <li key={preset.slug}>
                <Link
                  href={routes.timer(preset.slug)}
                  aria-current={preset.slug === activeSlug ? 'page' : undefined}
                  className={`flex h-11 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                    active ? 'border-blue-border bg-blue-surface text-primary' : 'border-border bg-white text-body hover:bg-surface'
                  }`}
                >
                  {preset.chip}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setCustomOpen((open) => !open)}
              aria-expanded={customOpen}
              aria-controls="custom-timer"
              className={`flex h-11 w-full items-center justify-center rounded-lg border text-sm font-medium ${
                customOpen ? 'border-blue-border bg-blue-surface text-primary' : 'border-border bg-white text-body hover:bg-surface'
              }`}
            >
              Custom
            </button>
          </li>
        </ul>
      </nav>

      <form
        id="custom-timer"
        hidden={!customOpen}
        onSubmit={(event) => {
          event.preventDefault();
          applyCustom();
        }}
        className="card mt-3 p-3"
      >
        <fieldset>
          <legend className="text-sm font-semibold text-heading">Set a custom time</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(
              [
                ['h', 'Hours', 99],
                ['m', 'Minutes', 59],
                ['s', 'Seconds', 59],
              ] as const
            ).map(([key, text, max]) => (
              <label key={key} className="text-xs text-muted">
                {text}
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={max}
                  value={custom[key]}
                  onChange={(event) => setCustom((c) => ({ ...c, [key]: event.target.value }))}
                  className="tabular mt-1 h-11 w-full rounded-md border border-border px-3 text-base text-heading focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
            ))}
          </div>
          <button type="submit" className="mt-3 h-11 w-full rounded-lg bg-primary text-sm font-semibold text-white hover:bg-primary-hover">
            Set timer
          </button>
        </fieldset>
      </form>

      <p className="sr-only" aria-live="assertive">
        {announcement}
      </p>
    </div>
  );
}
