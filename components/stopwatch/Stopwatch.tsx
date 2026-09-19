'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { track } from '@/lib/analytics';
import { formatStopwatch, lapRows } from '@/lib/tools/stopwatch';

type Status = 'idle' | 'running' | 'paused';

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

/**
 * Elapsed time is derived from the instant Start was pressed (plus time
 * accumulated before a pause), so it stays exact in throttled background tabs.
 */
export function Stopwatch() {
  const [status, setStatus] = useState<Status>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const accumulated = useRef(0);
  const startedAt = useRef(0);
  const tracked = useRef(false);
  const originalTitle = useRef<string | null>(null);

  const current = () => (status === 'running' ? accumulated.current + (Date.now() - startedAt.current) : accumulated.current);

  useEffect(() => {
    if (status !== 'running') return;
    const id = window.setInterval(() => setElapsed(accumulated.current + (Date.now() - startedAt.current)), 47);
    return () => window.clearInterval(id);
  }, [status]);

  const wholeSeconds = Math.floor(elapsed / 1000);
  useEffect(() => {
    originalTitle.current ??= document.title;
    const original = originalTitle.current;
    if (status === 'idle') document.title = original;
    else document.title = `${formatStopwatch(wholeSeconds * 1000).replace(/\.\d\d$/, '')}${status === 'paused' ? ' (paused)' : ''} · Stopwatch`;
    return () => {
      if (originalTitle.current) document.title = originalTitle.current;
    };
  }, [status, wholeSeconds]);

  const start = () => {
    startedAt.current = Date.now();
    setStatus('running');
    if (!tracked.current) {
      tracked.current = true;
      track('tool_selected', { tool: 'stopwatch' });
    }
  };
  const pause = () => {
    accumulated.current += Date.now() - startedAt.current;
    setElapsed(accumulated.current);
    setStatus('paused');
  };
  const reset = () => {
    accumulated.current = 0;
    setElapsed(0);
    setLaps([]);
    setStatus('idle');
  };
  const lap = () => {
    if (status !== 'running') return;
    setLaps((list) => [...list, current()].slice(-99));
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === ' ') {
        event.preventDefault();
        if (status === 'running') pause();
        else start();
      } else if (event.key.toLowerCase() === 'l' && status === 'running') {
        lap();
      } else if (event.key.toLowerCase() === 'r' && status !== 'running') {
        reset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const rows = lapRows(laps);
  const display = formatStopwatch(elapsed);
  const button = 'inline-flex h-12 min-w-28 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors';

  return (
    <div className="card px-4 py-6 md:px-8">
      <div role="timer" aria-label={`Stopwatch: ${display}`} data-stopwatch-display className="tabular text-center text-[clamp(2.75rem,11vw,4.5rem)] font-bold leading-none tracking-tight text-heading">
        {display}
      </div>
      <p className="mt-2 text-center text-xs text-muted">{status === 'idle' ? 'Space to start · L for a lap · R to reset' : status === 'running' ? 'Running' : 'Paused'}</p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {status === 'running' ? (
          <button type="button" onClick={pause} className={`${button} bg-primary-dark text-white hover:bg-primary`}>
            <Icon name="pause" className="size-4" /> Pause
          </button>
        ) : (
          <button type="button" onClick={start} className={`${button} bg-success text-white hover:bg-success-dark`}>
            <Icon name="play" className="size-4" /> {status === 'paused' ? 'Resume' : 'Start'}
          </button>
        )}
        <button type="button" onClick={lap} disabled={status !== 'running'} className={`${button} border border-border bg-white text-heading hover:bg-surface disabled:opacity-40`}>
          Lap
        </button>
        <button type="button" onClick={reset} disabled={status === 'running' || (elapsed === 0 && laps.length === 0)} className={`${button} border border-border bg-white text-heading hover:bg-surface disabled:opacity-40`}>
          <Icon name="reset" className="size-4" /> Reset
        </button>
      </div>

      {rows.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <caption className="sr-only">Lap times</caption>
            <thead className="bg-surface text-left text-xs text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Lap</th>
                <th scope="col" className="px-3 py-2 font-medium">Lap time</th>
                <th scope="col" className="px-3 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.index} className={row.fastest ? 'bg-green-50' : row.slowest ? 'bg-warning-surface' : ''}>
                  <td className="px-3 py-2 text-heading">
                    {row.index}
                    {row.fastest && <span className="ml-2 text-xs font-medium text-success-dark">fastest</span>}
                    {row.slowest && <span className="ml-2 text-xs font-medium text-warning-text">slowest</span>}
                  </td>
                  <td className="tabular px-3 py-2 text-heading">{formatStopwatch(row.lapMs)}</td>
                  <td className="tabular px-3 py-2 text-body">{formatStopwatch(row.totalMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {laps.length > 0 ? `Lap ${laps.length} recorded at ${formatStopwatch(laps[laps.length - 1]!)}` : ''}
      </p>
    </div>
  );
}
