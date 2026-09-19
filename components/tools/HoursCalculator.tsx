'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { track } from '@/lib/analytics';
import { formatDecimalHours, formatHoursMinutes, payFor, shiftMinutes, totalMinutes, type ShiftRow } from '@/lib/tools/hours-calculator';

const inputClass = 'tabular mt-1 h-11 w-full rounded-lg border border-border bg-white px-3 text-[15px] text-heading focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

type Row = ShiftRow & { id: number };

export function HoursCalculator() {
  const [rows, setRows] = useState<Row[]>([{ id: 1, start: '09:00', end: '17:00', breakMinutes: 30 }]);
  const [rate, setRate] = useState('');
  const [used, setUsed] = useState(false);
  const markUsed = () => {
    if (!used) {
      setUsed(true);
      track('tool_selected', { tool: 'hours-calculator' });
    }
  };
  const update = (id: number, patch: Partial<ShiftRow>) => {
    setRows((list) => list.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    markUsed();
  };

  const total = totalMinutes(rows);
  const hourlyRate = Number(rate);
  const pay = rate.trim() && Number.isFinite(hourlyRate) && hourlyRate >= 0 ? payFor(total, hourlyRate) : null;

  return (
    <div className="card p-4">
      <ol className="space-y-3">
        {rows.map((row, index) => {
          const result = shiftMinutes(row);
          return (
            <li key={row.id} className="rounded-lg border border-border p-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_7rem_auto] sm:items-end">
                <label className="text-xs font-medium text-muted">
                  Start
                  <input type="time" value={row.start} onChange={(e) => update(row.id, { start: e.target.value })} className={inputClass} />
                </label>
                <label className="text-xs font-medium text-muted">
                  End
                  <input type="time" value={row.end} onChange={(e) => update(row.id, { end: e.target.value })} className={inputClass} />
                </label>
                <label className="text-xs font-medium text-muted">
                  Break (min)
                  <input type="number" min={0} step={5} value={row.breakMinutes} onChange={(e) => update(row.id, { breakMinutes: Math.max(0, Number(e.target.value) || 0) })} className={inputClass} />
                </label>
                <div className="flex items-end justify-between gap-2">
                  <p className="tabular text-sm font-semibold text-heading" data-shift-hours>
                    {result.valid ? formatHoursMinutes(result.minutes) : '—'}
                  </p>
                  <button type="button" onClick={() => setRows((list) => (list.length > 1 ? list.filter((r) => r.id !== row.id) : list))} disabled={rows.length === 1} aria-label={`Remove shift ${index + 1}`} className="flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-heading disabled:opacity-30">
                    <Icon name="x" className="size-4" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => { setRows((list) => [...list, { id: Date.now(), start: '09:00', end: '17:00', breakMinutes: 0 }]); markUsed(); }} className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-medium text-heading hover:bg-surface">
          + Add shift
        </button>
        <label className="text-xs font-medium text-muted">
          Hourly rate (optional)
          <input type="number" min={0} step="0.01" inputMode="decimal" value={rate} placeholder="20.00" onChange={(e) => { setRate(e.target.value); markUsed(); }} className="tabular mt-1 h-11 w-36 rounded-lg border border-border bg-white px-3 text-[15px] text-heading focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </label>
      </div>

      <output data-hours-total aria-live="polite" className="mt-4 block rounded-lg border border-blue-border bg-blue-surface px-4 py-3">
        <span className="block text-2xl font-bold text-heading">{formatHoursMinutes(total)}</span>
        <span className="block text-sm text-body">
          {formatDecimalHours(total)} decimal hours · {total.toLocaleString('en-US')} minutes
          {pay !== null && ` · pay ${pay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </span>
      </output>
    </div>
  );
}
