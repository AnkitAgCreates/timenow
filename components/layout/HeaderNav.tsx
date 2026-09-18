'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { openMenu, openSearch } from './events';
import { PRIMARY_NAV, isNavActive } from './navigation';

export function HeaderNav() {
  const pathname = usePathname() ?? '/';
  return (
    <>
      <nav aria-label="Primary" className="hidden md:block">
        <ul className="flex items-center gap-1">
          {PRIMARY_NAV.map((item) => {
            const active = isNavActive(item, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  className={`inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-surface hover:text-heading ${
                    active ? 'text-primary' : 'text-body'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={openSearch}
          className="hidden size-10 items-center justify-center rounded-md text-heading hover:bg-surface md:inline-flex"
          aria-label="Search cities, countries and time zones"
        >
          <Icon name="search" />
        </button>
        <button
          type="button"
          onClick={openMenu}
          className="inline-flex size-11 items-center justify-center rounded-md text-heading hover:bg-surface md:hidden"
          aria-label="Open menu"
        >
          <Icon name="menu" className="size-6" />
        </button>
      </div>
    </>
  );
}
