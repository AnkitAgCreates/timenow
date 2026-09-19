import { Stopwatch } from '@/components/stopwatch/Stopwatch';
import { ToolPageShell } from '@/components/tools/ToolPageShell';
import { getToolContent } from '@/lib/content/tools';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';

const content = getToolContent('stopwatch');

export const metadata = buildMetadata({
  title: content.documentTitle,
  description: content.description,
  path: routes.stopwatch(),
  indexable: true,
});

export default function StopwatchPage() {
  return (
    <ToolPageShell toolKey="stopwatch">
      <Stopwatch />
    </ToolPageShell>
  );
}
