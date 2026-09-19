import { JsonLd } from '@/components/seo/JsonLd';
import { ToolCard } from '@/components/tools/ToolCard';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FAQ } from '@/components/ui/FAQ';
import { Section } from '@/components/ui/Section';
import { getAllTools } from '@/lib/data/tools';
import { routes } from '@/lib/routes';
import { faqJsonLd, webPageJsonLd } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';

const TITLE = 'Time Tools';
const DESCRIPTION = 'Ten free online time tools: world clock, time zone converter, meeting planner, timer, alarm, stopwatch, date difference, hours, military time and Unix timestamp.';

export const metadata = buildMetadata({
  title: 'Time Tools – Converter, Planner, Timer, Stopwatch, Alarm & Calculators',
  description: DESCRIPTION,
  path: routes.tools(),
  indexable: true,
});

const GUIDE = [
  { need: 'What time is it somewhere else right now?', use: 'World Clock', href: routes.worldClock() },
  { need: 'What time will 3 PM here be over there?', use: 'Time Zone Converter', href: routes.converterHub() },
  { need: 'When can three offices meet?', use: 'Meeting Planner', href: routes.meetingPlanner() },
  { need: 'Remind me in 25 minutes', use: 'Countdown Timer', href: routes.timerHub() },
  { need: 'Remind me at 4:30', use: 'Alarm Clock', href: routes.alarm() },
  { need: 'How long did that take?', use: 'Stopwatch', href: routes.stopwatch() },
  { need: 'How many days until…?', use: 'Date Difference Calculator', href: routes.tool('date-difference') },
  { need: 'How many hours did I work?', use: 'Hours Calculator', href: routes.tool('hours-calculator') },
  { need: 'What is 1730 in normal time?', use: 'Military Time Converter', href: routes.tool('military-time-converter') },
  { need: 'What date is timestamp 1700000000?', use: 'Unix Timestamp Converter', href: routes.tool('unix-timestamp') },
];

const FAQS = [
  { question: 'Are the tools free and do they need an account?', answer: 'All of them are free and run in your browser. Nothing you enter is sent to a server, and there is no sign-up.' },
  { question: 'Do the tools work on a phone?', answer: 'Yes. Every tool is built for phone screens first, with large touch targets, and the timer, stopwatch and alarm keep working in a background tab (sound may be muted when the screen locks).' },
  { question: 'Do the converter and planner account for daylight saving time?', answer: 'Yes. They use the IANA time zone database through your browser, so conversions and meeting times are correct for the date you pick, including the weeks when only one side has switched.' },
  { question: 'Where are my saved cities and alarms kept?', answer: 'In your browser’s local storage on this device only. They are not synced between devices and are removed if you clear site data.' },
];

export default function ToolsPage() {
  const tools = getAllTools();
  return (
    <>
      <JsonLd data={[webPageJsonLd({ name: TITLE, description: DESCRIPTION, path: routes.tools() }), faqJsonLd(FAQS)]} />
      <div className="container-page pt-4 md:pt-6">
        <Breadcrumbs items={[{ name: 'Home', path: routes.home() }, { name: 'Tools', path: routes.tools() }]} />
        <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{TITLE}</h1>
        <p className="mt-1 max-w-2xl text-body">Ten free tools for checking, comparing, converting and measuring time — no account, nothing to install.</p>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tools.map((tool) => (
            <li key={tool.key}>
              <ToolCard tool={tool} showDescription />
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-8 max-w-4xl space-y-8">
          <Section id="which-tool" title="Which tool do I need?">
            <ul className="card divide-y divide-border">
              {GUIDE.map((row) => (
                <li key={row.href} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span className="text-body">{row.need}</span>
                  <a href={row.href} className="inline-flex min-h-11 items-center font-medium text-primary hover:underline">
                    {row.use} →
                  </a>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="faqs" title="Time tools FAQs">
            <FAQ items={FAQS} />
          </Section>
        </div>
      </div>
    </>
  );
}
