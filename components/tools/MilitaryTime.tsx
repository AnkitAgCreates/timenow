'use client';

import { useState } from 'react';
import { track } from '@/lib/analytics';
import { parseFlexibleTime, spokenMilitary, to12Hour, to24Hour, toMilitary } from '@/lib/tools/military-time';

const EXAMPLES = ['2:30 PM', '0900', '12:00 AM', '23:45', '1200', '6:15 am'];

export function MilitaryTime() {
  const [input, setInput] = useState('2:30 PM');
  const [used, setUsed] = useState(false);
  const time = parseFlexibleTime(input);
  const onChange = (value: string) => {
    setInput(value);
    if (!used) {
      setUsed(true);
      track('tool_selected', { tool: 'military-time' });
    }
  };

  return (
    <div className="card p-4">
      <label className="text-xs font-medium text-muted">
        Time in any format (2:30 PM, 14:30 or 1430)
        <input
          type="text"
          value={input}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="tabular mt-1 h-11 w-full rounded-lg border border-border bg-white px-3 text-[15px] text-heading focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button key={example} type="button" onClick={() => onChange(example)} className="inline-flex min-h-9 items-center rounded-md border border-border bg-white px-2.5 text-xs font-medium text-heading hover:border-blue-border hover:text-primary">
            {example}
          </button>
        ))}
      </div>
      <output data-military-result aria-live="polite" className="mt-3 block rounded-lg border border-blue-border bg-blue-surface px-4 py-3">
        {time ? (
          <dl className="grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2 sm:gap-x-6">
            <div><dt className="text-xs text-muted">Military time</dt><dd className="tabular text-2xl font-bold text-heading">{toMilitary(time)}</dd></div>
            <div><dt className="text-xs text-muted">12-hour time</dt><dd className="tabular text-2xl font-bold text-heading">{to12Hour(time)}</dd></div>
            <div><dt className="text-xs text-muted">24-hour time</dt><dd className="tabular font-semibold text-heading">{to24Hour(time)}</dd></div>
            <div><dt className="text-xs text-muted">Spoken</dt><dd className="font-semibold text-heading">{spokenMilitary(time)}</dd></div>
          </dl>
        ) : (
          <span className="text-sm text-body">Enter a time such as 2:30 PM, 14:30 or 1430.</span>
        )}
      </output>
    </div>
  );
}
