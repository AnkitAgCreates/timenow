'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Icon } from '@/components/ui/Icon';
import { routes } from '@/lib/routes';
import { OPEN_MENU_EVENT, openSearch } from './events';
import { Logo } from './Logo';
import { PRIMARY_NAV } from './navigation';

const SECONDARY_LINKS = [
  { label: 'Current time by country', href: routes.countriesHub() },
  { label: 'UTC time now', href: routes.utcHub() },
  { label: 'Current time in New York', href: routes.city('new-york') },
  { label: 'CST time zone', href: routes.timezone('cst') },
  { label: 'IST to EST converter', href: routes.convert('ist', 'est') },
  { label: '1 hour timer', href: routes.timer('1-hour') },
];

/** Slide-in navigation sheet for mobile (hamburger and bottom-nav "More"). */
export function MobileMenu() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const open = () => dialogRef.current?.showModal();
    window.addEventListener(OPEN_MENU_EVENT, open);
    return () => window.removeEventListener(OPEN_MENU_EVENT, open);
  }, []);

  const close = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      aria-label="Menu"
      onClick={(event) => {
        if (event.target === dialogRef.current || (event.target as HTMLElement).closest('a')) close();
      }}
      className="m-0 ml-auto h-dvh max-h-none w-[min(20rem,88vw)] max-w-none bg-white p-0 backdrop:bg-heading/40"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Logo />
          <button type="button" onClick={close} className="inline-flex size-11 items-center justify-center rounded-md text-heading hover:bg-surface" aria-label="Close menu">
            <Icon name="x" className="size-6" />
          </button>
        </div>
        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-2 py-3">
          <button
            type="button"
            onClick={() => {
              close();
              openSearch();
            }}
            className="mb-2 flex h-12 w-full items-center gap-3 rounded-md px-3 text-left font-medium text-heading hover:bg-surface"
          >
            <Icon name="search" className="size-5 text-muted" /> Search
          </button>
          <ul>
            {PRIMARY_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="flex h-12 items-center justify-between rounded-md px-3 font-medium text-heading hover:bg-surface">
                  {item.label}
                  <Icon name="chevron-right" className="size-4 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-5 px-3 text-xs font-semibold uppercase tracking-wide text-muted">Popular</p>
          <ul className="mt-1">
            {SECONDARY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="flex min-h-11 items-center rounded-md px-3 text-sm text-body hover:bg-surface">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </dialog>
  );
}
