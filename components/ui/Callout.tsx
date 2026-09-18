import type { ReactNode } from 'react';
import { Icon } from './Icon';

/** Restrained inline notice. `notice` is used when an abbreviation is not currently in effect. */
export function Callout({ tone = 'neutral', title, children, className = '' }: { tone?: 'neutral' | 'notice'; title: ReactNode; children?: ReactNode; className?: string }) {
  const styles = tone === 'notice' ? 'border-warning/40 bg-warning-surface' : 'border-blue-border bg-blue-surface';
  const iconColor = tone === 'notice' ? 'text-warning-text' : 'text-primary';
  return (
    <div className={`flex gap-3 rounded-lg border px-4 py-3 text-left ${styles} ${className}`}>
      <Icon name="info" className={`mt-0.5 size-5 shrink-0 ${iconColor}`} />
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-heading">{title}</p>
        {children && <div className="mt-0.5 text-sm leading-relaxed text-body">{children}</div>}
      </div>
    </div>
  );
}
