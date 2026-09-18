import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, type Crumb } from '@/lib/seo/jsonld';
import { Icon } from './Icon';

/** Visible breadcrumb trail plus BreadcrumbList JSON-LD. Crumbs without a path render as plain text. */
export function Breadcrumbs({ items, className = '' }: { items: Crumb[]; className?: string }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className={`text-[13px] ${className}`}>
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted">
          {items.map((item, index) => {
            const last = index === items.length - 1;
            return (
              <li key={`${item.name}-${index}`} className="flex items-center gap-1.5">
                {item.path && !last ? (
                  <Link href={item.path} className="text-primary hover:underline">
                    {item.name}
                  </Link>
                ) : (
                  <span aria-current={last ? 'page' : undefined} className={last ? 'text-body' : ''}>
                    {item.name}
                  </span>
                )}
                {!last && <Icon name="chevron-right" className="size-3.5 text-border-strong" />}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(items)} />
    </>
  );
}
