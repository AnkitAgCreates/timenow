'use client';

import { useEffect, useRef, useState } from 'react';
import { OPEN_SEARCH_EVENT } from '@/components/layout/events';
import { Icon } from '@/components/ui/Icon';
import { GlobalSearch } from './GlobalSearch';

/** Modal search opened from the header search icon or mobile bottom navigation. */
export function SearchDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [session, setSession] = useState(0);

  useEffect(() => {
    const open = () => {
      setSession((s) => s + 1);
      dialogRef.current?.showModal();
    };
    window.addEventListener(OPEN_SEARCH_EVENT, open);
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, open);
  }, []);

  const close = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      aria-label="Search"
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
      className="m-0 w-full max-w-none bg-transparent p-0 backdrop:bg-heading/40 md:mx-auto md:mt-24 md:max-w-xl"
    >
      <div className="min-h-dvh bg-white p-4 md:min-h-0 md:rounded-xl md:border md:border-border md:p-5 md:shadow-raised">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Search</h2>
          <button type="button" onClick={close} className="inline-flex size-11 items-center justify-center rounded-md text-body hover:bg-surface" aria-label="Close search">
            <Icon name="x" />
          </button>
        </div>
        {session > 0 && <GlobalSearch key={session} size="lg" autoFocus onNavigate={close} />}
        <p className="mt-3 text-xs text-muted">Try “San Diego”, “India” or “CST”. Use ↑ ↓ to move and Enter to open.</p>
      </div>
    </dialog>
  );
}
