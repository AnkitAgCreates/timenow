import { useSyncExternalStore } from 'react';

/**
 * A localStorage-backed value exposed as an external store, so components
 * read it with useSyncExternalStore: null on the server and during hydration,
 * the saved value afterwards, and updates propagate across tabs.
 */
export type PersistedStore<T> = {
  subscribe: (listener: () => void) => () => void;
  get: () => T | null;
  getServer: () => null;
  set: (value: T) => void;
  clear: () => void;
};

export function createPersistedStore<T>(key: string, validate: (raw: unknown) => T | null): PersistedStore<T> {
  let cache: T | null | undefined;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());

  const read = (): T | null => {
    if (cache === undefined) {
      try {
        const raw = window.localStorage.getItem(key);
        cache = raw ? validate(JSON.parse(raw)) : null;
      } catch {
        cache = null;
      }
    }
    return cache;
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) {
          cache = undefined;
          listener();
        }
      };
      window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
      };
    },
    get: read,
    getServer: () => null,
    set(value) {
      cache = value;
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Storage unavailable (private mode, quota): the value still works for this visit.
      }
      notify();
    },
    clear() {
      cache = null;
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
      notify();
    },
  };
}

export function usePersisted<T>(store: PersistedStore<T>): T | null {
  return useSyncExternalStore(store.subscribe, store.get, store.getServer);
}
