import { MilitaryTime } from '@/components/tools/MilitaryTime';
import { ToolPageShell } from '@/components/tools/ToolPageShell';
import { Section } from '@/components/ui/Section';
import { getToolContent } from '@/lib/content/tools';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';
import { militaryTable } from '@/lib/tools/military-time';

const content = getToolContent('military-time');

export const metadata = buildMetadata({
  title: content.documentTitle,
  description: content.description,
  path: routes.tool('military-time-converter'),
  indexable: true,
});

export default function MilitaryTimePage() {
  const rows = militaryTable();
  return (
    <ToolPageShell
      toolKey="military-time"
      extra={
        <Section id="chart" title="Military time chart (24-hour to 12-hour)">
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Every whole hour in military, 24-hour and 12-hour time</caption>
              <thead className="bg-surface text-left text-xs text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium sm:px-4">Military</th>
                  <th scope="col" className="px-3 py-2 font-medium sm:px-4">24-hour</th>
                  <th scope="col" className="px-3 py-2 font-medium sm:px-4">12-hour</th>
                  <th scope="col" className="px-3 py-2 font-medium sm:px-4">Spoken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.military}>
                    <td className="tabular whitespace-nowrap px-3 py-2 font-semibold text-heading sm:px-4">{row.military}</td>
                    <td className="tabular whitespace-nowrap px-3 py-2 text-heading sm:px-4">{row.hour24}</td>
                    <td className="tabular whitespace-nowrap px-3 py-2 text-heading sm:px-4">{row.hour12}</td>
                    <td className="px-3 py-2 text-body sm:px-4">{row.spoken}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      }
    >
      <MilitaryTime />
    </ToolPageShell>
  );
}
