import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from './Icon';

/** Section with an H2 and an optional "See all →" link, matching the Visual PRD section headers. */
export function Section({
  id,
  title,
  action,
  children,
  className = '',
  headingLevel = 'h2',
}: {
  id?: string;
  title: ReactNode;
  action?: { label: string; href: string };
  children: ReactNode;
  className?: string;
  headingLevel?: 'h2' | 'h3';
}) {
  const Heading = headingLevel;
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={className}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <Heading id={id ? `${id}-title` : undefined} className="text-lg font-bold tracking-tight md:text-xl">
          {title}
        </Heading>
        {action && (
          <Link href={action.href} className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline md:min-h-0">
            {action.label}
            <Icon name="arrow-right" className="size-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
