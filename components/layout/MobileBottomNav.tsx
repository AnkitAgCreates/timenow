'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/ui/Icon';
import { routes } from '@/lib/routes';
import { openMenu, openSearch } from './events';

const itemClass = 'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium';

function Item({ icon, label, active }: { icon: IconName; label: string; active?: boolean }) {
  return (
    <>
      <Icon name={icon} className="size-[22px]" strokeWidth={active ? 2.1 : 1.75} />
      <span>{label}</span>
    </>
  );
}

/** Sticky bottom navigation for mobile: Home · Search · Tools · More. */
export function MobileBottomNav() {
  const pathname = usePathname() ?? '/';
  const homeActive = pathname === '/';
  const toolsActive = pathname.startsWith('/tools');

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="mx-auto flex max-w-lg">
        <Link href={routes.home()} aria-current={homeActive ? 'page' : undefined} className={`${itemClass} ${homeActive ? 'text-primary' : 'text-muted'}`}>
          <Item icon="home" label="Home" active={homeActive} />
        </Link>
        <button type="button" onClick={openSearch} className={`${itemClass} text-muted`}>
          <Item icon="search" label="Search" />
        </button>
        <Link href={routes.tools()} aria-current={toolsActive ? 'page' : undefined} className={`${itemClass} ${toolsActive ? 'text-primary' : 'text-muted'}`}>
          <Item icon="grid" label="Tools" active={toolsActive} />
        </Link>
        <button type="button" onClick={openMenu} className={`${itemClass} text-muted`}>
          <Item icon="more" label="More" />
        </button>
      </div>
    </nav>
  );
}
