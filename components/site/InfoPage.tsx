import type { ReactNode } from 'react';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Section } from '@/components/ui/Section';
import { routes } from '@/lib/routes';
import { webPageJsonLd } from '@/lib/seo/jsonld';

/**
 * Shell for the site's information pages (About, Privacy, Contact): breadcrumbs,
 * H1, an intro line, an optional "last updated" note and a column of sections.
 */
export function InfoPage({
  title,
  crumb,
  description,
  path,
  intro,
  updated,
  children,
}: {
  title: string;
  /** Short breadcrumb label, e.g. "About". */
  crumb: string;
  description: string;
  path: string;
  intro?: ReactNode;
  /** Human-readable date, e.g. "19 September 2026". */
  updated?: string;
  children: ReactNode;
}) {
  return (
    <>
      <JsonLd data={webPageJsonLd({ name: title, description, path })} />
      <div className="container-page pt-4 md:pt-6">
        <Breadcrumbs
          items={[
            { name: 'Home', path: routes.home() },
            { name: crumb, path },
          ]}
        />
        <div className="mx-auto mt-3 max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          {intro && <p className="mt-2 text-base text-body md:text-lg">{intro}</p>}
          {updated && <p className="mt-2 text-xs text-muted">Last updated {updated}</p>}
          <div className="mt-6 space-y-8">{children}</div>
        </div>
      </div>
    </>
  );
}

/** One titled block of prose on an information page. */
export function InfoSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <Section id={id} title={title}>
      <div className="card space-y-3 px-4 py-4 text-sm leading-relaxed text-body md:text-base [&_a]:underline [&_a:hover]:text-primary [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </Section>
  );
}
