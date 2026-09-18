import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

/** Icon + label + value row used in overview lists (Visual PRD city page). Render inside a <ul>. */
export function InfoRow({ icon, label, children, note }: { icon: IconName; label: string; children: ReactNode; note?: ReactNode }) {
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-surface text-primary">
        <Icon name={icon} className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-[15px] font-semibold text-heading">{children}</p>
        {note && <p className="text-xs text-muted">{note}</p>}
      </div>
    </li>
  );
}

/** Compact label/value tile used in 2-column info grids (Visual PRD timezone page). Render inside a <dl>. */
export function InfoTile({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-white px-3.5 py-3 ${className}`}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-semibold text-heading">{children}</dd>
    </div>
  );
}
