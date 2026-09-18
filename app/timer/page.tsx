import { Timer } from '@/components/timer/Timer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { LinkList } from '@/components/ui/LinkList';
import { Section } from '@/components/ui/Section';
import { getAllTimerPresets, getQuickPresets } from '@/lib/data/timers';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';

// Timer hub SEO is a Sprint 3 deliverable; functional now, noindex until then.
export const metadata = buildMetadata({
  title: 'Online Timer – Free Countdown Timer with Alarm',
  description: 'Set a countdown for any number of hours, minutes and seconds, with start, pause, reset and an alarm sound.',
  path: routes.timerHub(),
  indexable: false,
});

export default function TimerHubPage() {
  const quickPresets = getQuickPresets().map(({ slug, chip, seconds }) => ({ slug, chip, seconds }));
  return (
    <div className="container-page pt-4 md:pt-6">
      <Breadcrumbs items={[{ name: 'Home', path: routes.home() }, { name: 'Timers', path: routes.timerHub() }]} />
      <div className="card mx-auto mt-3 max-w-2xl px-4 pb-6 pt-6 md:px-8">
        <h1 className="text-center text-2xl font-bold tracking-tight md:text-3xl">Online Timer</h1>
        <p className="mt-1.5 text-center text-sm text-muted">Pick a preset or choose Custom to set any length.</p>
        <div className="mt-6">
          <Timer initialSeconds={300} label="Online Timer" presets={quickPresets} />
        </div>
      </div>
      <Section id="all-timers" title="All timers" className="mx-auto mt-8 max-w-4xl">
        <LinkList columns={3} items={getAllTimerPresets().map((p) => ({ label: `${p.label} Timer`, href: routes.timer(p.slug) }))} />
      </Section>
    </div>
  );
}
