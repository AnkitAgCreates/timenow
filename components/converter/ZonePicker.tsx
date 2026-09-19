'use client';

import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { CONVERTER_ZONE_OPTIONS } from '@/data/converter-zones';
import { loadSearchIndex } from '@/lib/search/client';
import { flattenResults, searchItems, type SearchItem } from '@/lib/search/match';
import { getZoneLabel } from '@/lib/time';

export type ZoneChoice = { zone: string; label: string };

type Suggestion = ZoneChoice & { detail: string; key: string };

function offsetText(zone: string, instant: number): string {
  const label = getZoneLabel(zone, instant);
  return label.verified ? `${label.abbreviation}, ${label.offsetLabel}` : label.offsetLabel;
}

/**
 * Combobox that resolves a city, country-free time zone abbreviation or UTC
 * offset to an IANA zone. With an empty query it offers the common zones;
 * as you type it searches the same index as the site search (cities,
 * abbreviations, offsets), fetched once on first use.
 */
export function ZonePicker({
  label,
  value,
  onChange,
  instant,
}: {
  label: string;
  value: ZoneChoice;
  onChange: (choice: ZoneChoice) => void;
  instant: number;
}) {
  const id = useId();
  const listboxId = `${id}-listbox`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SearchItem[] | null>(null);
  const [active, setActive] = useState(0);

  const ensureIndex = () => {
    if (items === null) void loadSearchIndex().then(setItems);
  };

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = (query ?? '').trim();
    const common: Suggestion[] = CONVERTER_ZONE_OPTIONS.filter((o) => !q || o.label.toLowerCase().includes(q.toLowerCase())).map((o) => ({
      zone: o.zone,
      label: o.label,
      detail: o.zone.startsWith('Etc/') ? 'Fixed offset, no DST' : offsetText(o.zone, instant),
      key: `common:${o.zone}`,
    }));
    if (!q) return common;
    const matched: Suggestion[] = flattenResults(searchItems(items ?? [], q))
      .filter((item): item is SearchItem & { zone: string } => Boolean(item.zone))
      .slice(0, 8)
      .map((item) => ({
        zone: item.zone,
        label: item.type === 'timezone' ? `${item.label} – ${item.detail.split(' · ')[0]}` : item.label,
        detail: item.type === 'city' ? `${item.detail} · ${offsetText(item.zone, instant)}` : offsetText(item.zone, instant),
        key: `${item.type}:${item.href}`,
      }));
    const seen = new Set<string>();
    return [...common.slice(0, 3), ...matched].filter((s) => {
      const k = `${s.zone}|${s.label}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [query, items, instant]);

  const choose = (suggestion: Suggestion) => {
    onChange({ zone: suggestion.zone, label: suggestion.label });
    setQuery(null);
    setOpen(false);
    setActive(0);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      ensureIndex();
      setActive((i) => Math.min(i + 1, Math.max(suggestions.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      if (open && suggestions[active]) {
        event.preventDefault();
        choose(suggestions[active]);
      }
    } else if (event.key === 'Escape') {
      setQuery(null);
      setOpen(false);
    }
  };

  const showList = open && suggestions.length > 0;

  return (
    <div className="relative">
      <label htmlFor={`${id}-input`} className="text-xs font-medium text-muted">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-activedescendant={showList ? `${id}-option-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder="City, time zone or UTC offset"
          value={query ?? value.label}
          onFocus={(event) => {
            // Select the current label so typing replaces it instead of appending to it.
            event.target.select();
            setOpen(true);
            ensureIndex();
          }}
          onBlur={() => {
            setOpen(false);
            setQuery(null);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(0);
            ensureIndex();
          }}
          onKeyDown={onKeyDown}
          className="h-11 w-full rounded-lg border border-border bg-white pl-3 pr-9 text-[15px] text-heading focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
      <ul
        id={listboxId}
        role="listbox"
        aria-label={`${label} suggestions`}
        hidden={!showList}
        className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-raised"
      >
        {suggestions.map((suggestion, index) => (
          <li
            key={suggestion.key}
            id={`${id}-option-${index}`}
            role="option"
            aria-selected={index === active}
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => setActive(index)}
            onClick={() => choose(suggestion)}
            className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-sm ${index === active ? 'bg-blue-surface' : ''}`}
          >
            <span className="truncate font-medium text-heading">{suggestion.label}</span>
            <span className="shrink-0 text-xs text-muted">{suggestion.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
