'use client';

import { useRouter } from 'next/navigation';
import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { track } from '@/lib/analytics';
import { GROUP_LABELS, GROUP_ORDER, flattenResults, searchItems, type SearchItem } from '@/lib/search/match';

let indexPromise: Promise<SearchItem[]> | null = null;

/** Fetch the static search index once per session, on first interaction. */
function loadIndex(): Promise<SearchItem[]> {
  indexPromise ??= fetch('/api/search-index/')
    .then((response) => (response.ok ? (response.json() as Promise<SearchItem[]>) : []))
    .catch(() => {
      indexPromise = null;
      return [];
    });
  return indexPromise;
}

type GlobalSearchProps = {
  size?: 'md' | 'lg';
  autoFocus?: boolean;
  onNavigate?: () => void;
  className?: string;
};

/**
 * Global search combobox (WAI-ARIA 1.2 pattern): grouped results for cities,
 * countries and time zones with full keyboard support.
 */
export function GlobalSearch({ size = 'md', autoFocus, onNavigate, className = '' }: GlobalSearchProps) {
  const router = useRouter();
  const id = useId();
  const listboxId = `${id}-listbox`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SearchItem[] | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const trackedQuery = useRef(false);

  const results = useMemo(() => searchItems(items ?? [], query), [items, query]);
  const flat = useMemo(() => flattenResults(results), [results]);
  const showList = open && query.trim().length > 0;
  const activeItem = activeIndex >= 0 ? flat[activeIndex] : undefined;

  const ensureIndex = () => {
    if (!items) void loadIndex().then(setItems);
  };

  const select = (item: SearchItem) => {
    track(item.type === 'city' ? 'city_selected' : item.type === 'timezone' ? 'timezone_selected' : 'search_used', {
      label: item.label,
      source: 'search',
    });
    setOpen(false);
    setQuery('');
    setActiveIndex(-1);
    onNavigate?.();
    router.push(item.href);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setOpen(true);
        setActiveIndex((i) => (flat.length ? (i + 1) % flat.length : -1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setOpen(true);
        setActiveIndex((i) => (flat.length ? (i <= 0 ? flat.length - 1 : i - 1) : -1));
        break;
      case 'Home':
        if (showList && flat.length) {
          event.preventDefault();
          setActiveIndex(0);
        }
        break;
      case 'End':
        if (showList && flat.length) {
          event.preventDefault();
          setActiveIndex(flat.length - 1);
        }
        break;
      case 'Enter': {
        const target = activeItem ?? flat[0];
        if (target) {
          event.preventDefault();
          select(target);
        }
        break;
      }
      case 'Escape':
        if (showList) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          setActiveIndex(-1);
        }
        break;
    }
  };

  const inputHeight = size === 'lg' ? 'h-12 text-base' : 'h-11 text-[15px]';
  let optionIndex = -1;

  return (
    <div className={`relative ${className}`}>
      <label htmlFor={`${id}-input`} className="sr-only">
        Search a city, country or time zone
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-activedescendant={showList && activeItem ? `${id}-option-${activeIndex}` : undefined}
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          placeholder="Search a city, country or timezone..."
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
            if (!trackedQuery.current && event.target.value.trim().length >= 2) {
              trackedQuery.current = true;
              track('search_used');
            }
          }}
          onFocus={() => {
            ensureIndex();
            setOpen(true);
          }}
          onPointerEnter={ensureIndex}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className={`${inputHeight} w-full rounded-lg border border-border bg-white pl-4 pr-12 text-heading shadow-card placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 [&::-webkit-search-cancel-button]:hidden`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-center text-heading">
          <Icon name="search" className="size-5" />
        </span>
      </div>

      <div
        id={listboxId}
        role="listbox"
        aria-label="Search results"
        hidden={!showList}
        className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-[min(24rem,60vh)] overflow-y-auto rounded-lg border border-border bg-white py-1.5 text-left shadow-raised"
      >
        {items === null ? (
          <p className="px-4 py-3 text-sm text-muted">Loading…</p>
        ) : flat.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted">No matches. Try a city name, a country or an abbreviation like “CST”.</p>
        ) : (
          GROUP_ORDER.filter((group) => results[group].length > 0).map((group) => (
            <div key={group} role="group" aria-labelledby={`${id}-group-${group}`}>
              <div id={`${id}-group-${group}`} role="presentation" className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {GROUP_LABELS[group]}
              </div>
              {results[group].map((item) => {
                optionIndex += 1;
                const index = optionIndex;
                const active = index === activeIndex;
                return (
                  <div
                    key={item.href}
                    id={`${id}-option-${index}`}
                    role="option"
                    aria-selected={active}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => select(item)}
                    onMouseMove={() => setActiveIndex(index)}
                    className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-2 ${active ? 'bg-blue-surface' : ''}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-heading">{item.label}</span>
                      <span className="block truncate text-xs text-muted">{item.detail}</span>
                    </span>
                    <Icon name={item.type === 'timezone' ? 'globe' : 'pin'} className="size-4 shrink-0 text-muted" />
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {showList && items !== null ? `${flat.length} result${flat.length === 1 ? '' : 's'} available` : ''}
      </p>
    </div>
  );
}
