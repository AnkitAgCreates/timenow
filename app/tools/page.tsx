import { ToolCard } from '@/components/tools/ToolCard';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAllTools } from '@/lib/data/tools';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Time Tools – Converters, Timers and Calculators',
  description: 'Free time tools: time zone converter, countdown timer and more calculators coming soon.',
  path: routes.tools(),
  indexable: false,
});

export default function ToolsPage() {
  const tools = getAllTools();
  return (
    <div className="container-page pt-4 md:pt-6">
      <Breadcrumbs items={[{ name: 'Home', path: routes.home() }, { name: 'Tools', path: routes.tools() }]} />
      <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">Time Tools</h1>
      <p className="mt-1 text-body">Tools marked “Soon” are planned and not available yet.</p>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tools.map((tool) => (
          <li key={tool.key}>
            <ToolCard tool={tool} showDescription />
          </li>
        ))}
      </ul>
    </div>
  );
}
