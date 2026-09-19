import { ToolPageShell } from '@/components/tools/ToolPageShell';
import { UnixTimestamp } from '@/components/tools/UnixTimestamp';
import { Section } from '@/components/ui/Section';
import { getToolContent } from '@/lib/content/tools';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';
import { getRenderInstant } from '@/lib/server/render-instant';
import { TIMESTAMP_LANDMARKS, isoUtc } from '@/lib/tools/unix-timestamp';

export const revalidate = 3600;

const content = getToolContent('unix-timestamp');

export const metadata = buildMetadata({
  title: content.documentTitle,
  description: content.description,
  path: routes.tool('unix-timestamp'),
  indexable: true,
});

export default function UnixTimestampPage() {
  const renderedAt = getRenderInstant();
  return (
    <ToolPageShell
      toolKey="unix-timestamp"
      extra={
        <Section id="landmarks" title="Notable timestamps">
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Well-known Unix timestamps and their UTC dates</caption>
              <thead className="bg-surface text-left text-xs text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium sm:px-4">Timestamp</th>
                  <th scope="col" className="px-3 py-2 font-medium sm:px-4">UTC</th>
                  <th scope="col" className="px-3 py-2 font-medium sm:px-4">What it is</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {TIMESTAMP_LANDMARKS.map((row) => (
                  <tr key={row.seconds}>
                    <td className="tabular whitespace-nowrap px-3 py-2 font-semibold text-heading sm:px-4">{row.seconds.toLocaleString('en-US')}</td>
                    <td className="tabular whitespace-nowrap px-3 py-2 text-heading sm:px-4">{isoUtc(row.seconds * 1000).replace('.000Z', 'Z')}</td>
                    <td className="px-3 py-2 text-body sm:px-4">{row.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      }
    >
      <UnixTimestamp renderedAt={renderedAt} />
    </ToolPageShell>
  );
}
