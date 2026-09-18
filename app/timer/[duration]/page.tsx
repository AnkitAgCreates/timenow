import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { Timer } from '@/components/timer/Timer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FAQ } from '@/components/ui/FAQ';
import { Icon } from '@/components/ui/Icon';
import { LinkList } from '@/components/ui/LinkList';
import { Section } from '@/components/ui/Section';
import { TIMER_BENEFITS, timerFaqs, timerMetaDescription } from '@/lib/content/timer';
import { getAllTimerPresets, getQuickPresets, getTimerPreset } from '@/lib/data/timers';
import { routes } from '@/lib/routes';
import { faqJsonLd, webApplicationJsonLd } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';

export const dynamicParams = false;

type Props = { params: Promise<{ duration: string }> };

export function generateStaticParams() {
  return getAllTimerPresets().map((preset) => ({ duration: preset.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const preset = getTimerPreset((await params).duration);
  if (!preset) return {};
  return buildMetadata({
    title: `${preset.label} Timer – Free Online Countdown with Alarm`,
    description: timerMetaDescription(preset),
    path: routes.timer(preset.slug),
    indexable: preset.indexable,
  });
}

export default async function TimerPage({ params }: Props) {
  const preset = getTimerPreset((await params).duration);
  if (!preset) notFound();

  const path = routes.timer(preset.slug);
  const title = `${preset.label} Timer`;
  const faqs = timerFaqs(preset);
  const quickPresets = getQuickPresets().map(({ slug, chip, seconds }) => ({ slug, chip, seconds }));
  const others = getAllTimerPresets().filter((p) => p.slug !== preset.slug);

  return (
    <>
      <JsonLd data={[webApplicationJsonLd({ name: title, description: timerMetaDescription(preset), path }), faqJsonLd(faqs)]} />

      <div className="container-page pt-4 md:pt-6">
        <Breadcrumbs
          items={[
            { name: 'Home', path: routes.home() },
            { name: 'Timers', path: routes.timerHub() },
            { name: title, path },
          ]}
        />

        <div className="card mx-auto mt-3 max-w-2xl px-4 pb-6 pt-6 md:px-8 md:pb-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted md:text-base">
              A simple, reliable {preset.phrase} timer. Set it and stay productive.
            </p>
          </div>
          <div className="mt-6">
            <Timer initialSeconds={preset.seconds} label={title} presets={quickPresets} activeSlug={preset.slug} />
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-4xl space-y-8">
          <Section id="why" title="Why use a timer?">
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {TIMER_BENEFITS.map((benefit) => (
                <li key={benefit.title} className="card flex items-start gap-3 px-4 py-3 lg:flex-col">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-surface text-primary">
                    <Icon name={benefit.icon} className="size-[18px]" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-heading">{benefit.title}</span>
                    <span className="block text-sm text-muted">{benefit.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="ideas" title={`Ideas for a ${preset.phrase} timer`}>
            <ul className="card divide-y divide-border">
              {preset.useCases.map((useCase) => (
                <li key={useCase} className="flex items-center gap-3 px-4 py-3 text-[15px] text-body">
                  <Icon name="check" className="size-4 shrink-0 text-success" />
                  {useCase}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="faqs" title={`${title} FAQs`}>
            <FAQ items={faqs} />
          </Section>

          <Section id="more-timers" title="More timers">
            <LinkList
              columns={3}
              items={others.map((other) => ({ label: `${other.label} Timer`, href: routes.timer(other.slug) }))}
            />
          </Section>
        </div>
      </div>
    </>
  );
}
