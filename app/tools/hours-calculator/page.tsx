import { HoursCalculator } from '@/components/tools/HoursCalculator';
import { ToolPageShell } from '@/components/tools/ToolPageShell';
import { getToolContent } from '@/lib/content/tools';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';

const content = getToolContent('hours-calculator');

export const metadata = buildMetadata({
  title: content.documentTitle,
  description: content.description,
  path: routes.tool('hours-calculator'),
  indexable: true,
});

export default function HoursCalculatorPage() {
  return (
    <ToolPageShell toolKey="hours-calculator">
      <HoursCalculator />
    </ToolPageShell>
  );
}
