'use client';

/**
 * Client-side external stores for live time and the 12/24-hour preference.
 * Server snapshots are fixed (null / "12h") so hydration is deterministic;
 * real values arrive on the first client render after hydration.
 */
import { useSyncExternalStore } from 'react';
import type { HourCycle } from '@/lib/time';
import { HOUR_CYCLE_STORAGE_KEY } from './constants';

/* ---------- now (second resolution, single shared timer) ---------- */

const nowListeners = new Set<() => void>();
let nowValue = 0;
let nowTimer: ReturnType<typeof setTimeout> | undefined;

const readSecond = () => Math.floor(Date.now() / 1000) * 1000;

function tick() {
  nowValue = readSecond();
  nowListeners.forEach((listener) => listener());
  scheduleTick();
}

function scheduleTick() {
  clearTimeout(nowTimer);
  // Align to the next wall-clock second so all clocks change together.
  nowTimer = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') tick();
}

function subscribeNow(listener: () => void) {
  nowListeners.add(listener);
  if (nowListeners.size === 1) {
    nowValue = readSecond();
    scheduleTick();
    document.addEventListener('visibilitychange', onVisibilityChange);
  }
  return () => {
    nowListeners.delete(listener);
    if (nowListeners.size === 0) {
      clearTimeout(nowTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }
  };
}

function getNowSnapshot() {
  // While idle nothing refreshes the value, so read it on demand.
  if (nowListeners.size === 0) nowValue = readSecond();
  return nowValue;
}

const getNowServerSnapshot = () => null;

/** Current epoch ms at second resolution; null during SSR and hydration. */
export function useNow(): number | null {
  return useSyncExternalStore(subscribeNow, getNowSnapshot, getNowServerSnapshot);
}

/* ---------- 12/24-hour preference (persisted) ---------- */

const cycleListeners = new Set<() => void>();

function readCycle(): HourCycle {
  try {
    return window.localStorage.getItem(HOUR_CYCLE_STORAGE_KEY) === '24h' ? '24h' : '12h';
  } catch {
    return '12h';
  }
}

function subscribeCycle(listener: () => void) {
  cycleListeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === HOUR_CYCLE_STORAGE_KEY) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    cycleListeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useHourCycle(): HourCycle {
  return useSyncExternalStore(subscribeCycle, readCycle, () => '12h');
}

export function setHourCycle(cycle: HourCycle) {
  try {
    window.localStorage.setItem(HOUR_CYCLE_STORAGE_KEY, cycle);
  } catch {
    // Storage unavailable (private mode); the preference still applies until reload.
  }
  cycleListeners.forEach((listener) => listener());
}

/* ---------- hydration + browser zone ---------- */

const noopSubscribe = () => () => {};

/** False during SSR/hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

function readBrowserZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** The browser's IANA zone; null during SSR/hydration. */
export function useBrowserZone(): string | null {
  return useSyncExternalStore(noopSubscribe, readBrowserZone, () => null);
}
