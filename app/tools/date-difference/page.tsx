import { DateDifference } from '@/components/tools/DateDifference';
import { ToolPageShell } from '@/components/tools/ToolPageShell';
import { getToolContent } from '@/lib/content/tools';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';
import { getRenderInstant } from '@/lib/server/render-instant';

export const revalidate = 3600;

const content = getToolContent('date-difference');

export const metadata = buildMetadata({
  title: content.documentTitle,
  description: content.description,
  path: routes.tool('date-difference'),
  indexable: true,
});

export default function DateDifferencePage() {
  const today = new Date(getRenderInstant()).toISOString().slice(0, 10);
  return (
    <ToolPageShell toolKey="date-difference">
      <DateDifference today={today} />
    </ToolPageShell>
  );
}
