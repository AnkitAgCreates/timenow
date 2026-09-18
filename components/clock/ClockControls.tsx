'use client';

import { useSyncExternalStore } from 'react';
import { Icon } from '@/components/ui/Icon';
import { setHourCycle, useHourCycle } from '@/lib/clock/stores';

const noopSubscribe = () => () => {};

/** 12/24-hour toggle (persisted, applies to every clock) and fullscreen control. */
export function ClockControls({ panelId, size = 'md' }: { panelId: string; size?: 'sm' | 'md' }) {
  const hourCycle = useHourCycle();
  const fullscreenSupported = useSyncExternalStore(
    noopSubscribe,
    () => Boolean(document.fullscreenEnabled),
    () => true,
  );

  const toggleFullscreen = () => {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void panel.requestFullscreen?.();
  };

  const height = size === 'sm' ? 'h-11 md:h-9' : 'h-11 md:h-10';
  const segment = `${height} min-w-14 px-3 sm:min-w-[4.25rem] text-sm font-medium transition-colors`;

  return (
    <div className="flex items-center justify-center gap-2">
      <div role="group" aria-label="Clock format" className="inline-flex rounded-md border border-border bg-white p-0.5">
        {(['12h', '24h'] as const).map((cycle) => {
          const active = hourCycle === cycle;
          return (
            <button
              key={cycle}
              type="button"
              aria-pressed={active}
              onClick={() => setHourCycle(cycle)}
              className={`${segment} rounded-[5px] ${active ? 'bg-primary text-white shadow-sm' : 'text-body hover:bg-surface'}`}
            >
              <span className="sm:hidden">{cycle === '12h' ? '12H' : '24H'}</span>
              <span className="hidden sm:inline">{cycle === '12h' ? '12 Hour' : '24 Hour'}</span>
            </button>
          );
        })}
      </div>
      {fullscreenSupported && (
        <button
          type="button"
          onClick={toggleFullscreen}
          className={`${height} inline-flex w-11 md:w-10 items-center justify-center rounded-md border border-border bg-white text-body hover:bg-surface`}
          aria-label="Show clock in full screen"
          title="Full screen"
        >
          <Icon name="maximize" className="size-4" />
        </button>
      )}
    </div>
  );
}
