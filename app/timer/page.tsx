import { JsonLd } from '@/components/seo/JsonLd';
import { Timer } from '@/components/timer/Timer';
import { TimerDirectory } from '@/components/timer/TimerDirectory';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FAQ } from '@/components/ui/FAQ';
import { Section } from '@/components/ui/Section';
import { TIMER_COMPARISON, TIMER_HOW_TO, TIMER_HUB_TITLE, timerHubDescription, timerHubFaqs } from '@/lib/content/timer';
import { getAllTimerPresets, getQuickPresets } from '@/lib/data/timers';
import { routes } from '@/lib/routes';
import { faqJsonLd, webApplicationJsonLd } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Online Timer – Free Countdown Timer with Alarm',
  description: timerHubDescription(),
  path: routes.timerHub(),
  indexable: true,
});

export default function TimerHubPage() {
  const quickPresets = getQuickPresets().map(({ slug, chip, seconds }) => ({ slug, chip, seconds }));
  const presets = getAllTimerPresets();
  const faqs = timerHubFaqs();

  return (
    <>
      <JsonLd data={[webApplicationJsonLd({ name: TIMER_HUB_TITLE, description: timerHubDescription(), path: routes.timerHub() }), faqJsonLd(faqs)]} />

      <div className="container-page pt-4 md:pt-6">
        <Breadcrumbs items={[{ name: 'Home', path: routes.home() }, { name: 'Timers', path: routes.timerHub() }]} />

        <div className="card mx-auto mt-3 max-w-2xl px-4 pb-6 pt-6 md:px-8">
          <h1 className="text-center text-2xl font-bold tracking-tight md:text-3xl">{TIMER_HUB_TITLE}</h1>
          <p className="mx-auto mt-1.5 max-w-md text-center text-sm text-muted md:text-base">
            Set any length, or pick one of {presets.length} ready-made timers from {presets[0]!.phrase} to {presets[presets.length - 1]!.phrase}. Start,
            pause, reset and get an alarm when time is up.
          </p>
          <div className="mt-6">
            <Timer initialSeconds={300} label={TIMER_HUB_TITLE} presets={quickPresets} />
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-4xl space-y-8">
          <Section id="timers" title="Ready-made timers">
            <TimerDirectory />
          </Section>

          <Section id="how-to" title="How to use the online timer">
            <ol className="card divide-y divide-border">
              {TIMER_HOW_TO.map((step, index) => (
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

          <Section id="compare" title="Timer, stopwatch or alarm?">
            <dl className="card divide-y divide-border">
              {TIMER_COMPARISON.map((row) => (
                <div key={row.tool} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                  <dt className="text-sm font-semibold text-heading">{row.tool}</dt>
                  <dd className="text-sm text-body">{row.use}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-muted">The stopwatch and alarm clock are planned for a later release; the countdown timer is available now.</p>
          </Section>

          <Section id="faqs" title="Online timer FAQs">
            <FAQ items={faqs} />
          </Section>
        </div>
      </div>
    </>
  );
}
