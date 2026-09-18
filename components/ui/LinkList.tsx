import Link from 'next/link';
import { Icon } from './Icon';

export type LinkItem = { label: string; href: string; detail?: string };

/** Related-link grid for internal linking sections. */
export function LinkList({ items, columns = 2 }: { items: LinkItem[]; columns?: 2 | 3 }) {
  if (items.length === 0) return null;
  return (
    <ul className={`grid grid-cols-1 gap-2 ${columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className="card flex min-h-12 items-center justify-between gap-3 px-4 py-2.5 hover:border-blue-border">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-heading">{item.label}</span>
              {item.detail && <span className="block truncate text-xs text-muted">{item.detail}</span>}
            </span>
            <Icon name="chevron-right" className="size-4 shrink-0 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
