import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import type { Tool } from '@/types/data';

const ACCENTS: Record<Tool['icon'], string> = {
  converter: 'bg-blue-50 text-blue-600',
  meeting: 'bg-indigo-50 text-indigo-600',
  timer: 'bg-amber-50 text-amber-600',
  alarm: 'bg-violet-50 text-violet-600',
  stopwatch: 'bg-green-50 text-green-600',
  calendar: 'bg-rose-50 text-rose-600',
  clock: 'bg-sky-50 text-sky-600',
  hash: 'bg-slate-100 text-slate-600',
  hourglass: 'bg-teal-50 text-teal-600',
};

/** Tool tile. Planned tools are not linked and are labelled "Soon". */
export function ToolCard({ tool, showDescription = false }: { tool: Tool; showDescription?: boolean }) {
  const body = (
    <>
      <span className={`flex size-10 items-center justify-center rounded-lg ${ACCENTS[tool.icon]}`}>
        <Icon name={tool.icon} className="size-5" />
      </span>
      <span className="mt-2 block text-[13px] font-medium leading-tight text-heading">{tool.shortName}</span>
      {showDescription && <span className="mt-1 block text-xs leading-snug text-muted">{tool.description}</span>}
      {tool.status === 'planned' && (
        <span className="mt-1.5 inline-block rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-muted">Soon</span>
      )}
    </>
  );

  const base = 'card flex h-full flex-col items-center px-2 py-3 text-center';
  if (tool.status === 'live') {
    return (
      <Link href={tool.href} className={`${base} transition-shadow hover:border-blue-border hover:shadow-raised`}>
        {body}
      </Link>
    );
  }
  return (
    <div className={`${base} opacity-80`} aria-label={`${tool.name} (coming soon)`}>
      {body}
    </div>
  );
}
