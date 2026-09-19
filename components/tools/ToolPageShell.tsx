import type { ReactNode } from 'react';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FAQ } from '@/components/ui/FAQ';
import { LinkList } from '@/components/ui/LinkList';
import { Section } from '@/components/ui/Section';
import { getToolContent } from '@/lib/content/tools';
import { getLiveTools, getTool } from '@/lib/data/tools';
import { routes } from '@/lib/routes';
import { faqJsonLd, webApplicationJsonLd } from '@/lib/seo/jsonld';

/**
 * Layout shared by the Sprint 5 tool pages: breadcrumbs, H1, the tool itself,
 * optional extra sections, how-to steps, FAQs and links to the other tools.
 */
export function ToolPageShell({ toolKey, width = 'max-w-2xl', children, extra }: { toolKey: string; width?: string; children: ReactNode; extra?: ReactNode }) {
  const tool = getTool(toolKey);
  if (!tool) throw new Error(`Unknown tool "${toolKey}"`);
  const content = getToolContent(toolKey);
  const underTools = tool.href.startsWith('/tools/');
  const related = getLiveTools().filter((t) => t.key !== toolKey);

  return (
    <>
      <JsonLd data={[webApplicationJsonLd({ name: content.title, description: content.description, path: tool.href }), faqJsonLd(content.faqs)]} />
      <div className="container-page pt-4 md:pt-6">
        <Breadcrumbs
          items={[
            { name: 'Home', path: routes.home() },
            ...(underTools ? [{ name: 'Tools', path: routes.tools() }] : []),
            { name: tool.shortName, path: tool.href },
          ]}
        />
        <div className={`mx-auto mt-3 ${width}`}>
          <h1 className="text-center text-2xl font-bold tracking-tight md:text-3xl">{content.title}</h1>
          <p className="mx-auto mt-1.5 max-w-xl text-center text-sm text-muted md:text-base">{content.subtitle}</p>
          <div className="mt-5">{children}</div>
        </div>

        <div className="mx-auto mt-8 max-w-4xl space-y-8">
          {extra}

          <Section id="how-to" title={`How to use the ${tool.name.toLowerCase()}`}>
            <ol className="card divide-y divide-border">
              {content.howTo.map((step, index) => (
                <li key={step.title} className="flex gap-3 px-4 py-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-surface text-sm font-semibold text-primary">{index + 1}</span>
                  <span>
                    <span className="block text-sm font-semibold text-heading">{step.title}</span>
                    <span className="block text-sm text-body">{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="faqs" title={`${content.title} FAQs`}>
            <FAQ items={content.faqs} />
          </Section>

          <Section id="more-tools" title="More time tools" action={{ label: 'All tools', href: routes.tools() }}>
            <LinkList columns={3} items={related.map((t) => ({ label: t.name, href: t.href, detail: t.description }))} />
          </Section>
        </div>
      </div>
    </>
  );
}
