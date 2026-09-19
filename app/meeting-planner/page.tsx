import { Suspense } from 'react';
import { MeetingPlanner } from '@/components/meeting/MeetingPlanner';
import { ToolPageShell } from '@/components/tools/ToolPageShell';
import { getToolContent } from '@/lib/content/tools';
import { routes } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';
import { getRenderInstant } from '@/lib/server/render-instant';
import { getZonedDate } from '@/lib/time';

export const revalidate = 3600;

const content = getToolContent('meeting-planner');

export const metadata = buildMetadata({
  title: content.documentTitle,
  description: content.description,
  path: routes.meetingPlanner(),
  indexable: true,
});

const pad = (n: number) => String(n).padStart(2, '0');

export default function MeetingPlannerPage() {
  const renderedAt = getRenderInstant();
  const today = getZonedDate(renderedAt, 'America/New_York');
  const defaultDate = `${today.year}-${pad(today.month)}-${pad(today.day)}`;
  return (
    <ToolPageShell toolKey="meeting-planner" width="max-w-5xl">
      <Suspense fallback={<div className="card p-4 text-sm text-muted">Loading the planner…</div>}>
        <MeetingPlanner
          defaults={[
            { zone: 'America/New_York', label: 'New York' },
            { zone: 'Europe/London', label: 'London' },
          ]}
          defaultDate={defaultDate}
          renderedAt={renderedAt}
        />
      </Suspense>
    </ToolPageShell>
  );
}
