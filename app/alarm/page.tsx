import { AlarmClock } from '@/components/alarm/AlarmClock';
import { ToolPageShell } from '@/components/tools/ToolPageShell';
import { getToolContent } from '@/lib/content/tools';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';

const content = getToolContent('alarm');

export const metadata = buildMetadata({
  title: content.documentTitle,
  description: content.description,
  path: routes.alarm(),
  indexable: true,
});

export default function AlarmPage() {
  return (
    <ToolPageShell toolKey="alarm">
      <AlarmClock />
    </ToolPageShell>
  );
}
