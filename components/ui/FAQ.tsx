import type { FaqItem } from '@/lib/seo/jsonld';
import { Icon } from './Icon';

/** Accessible FAQ using native disclosure elements. Pair with faqJsonLd(items) on the page. */
export function FAQ({ items, className = '' }: { items: FaqItem[]; className?: string }) {
  return (
    <div className={`card divide-y divide-border ${className}`}>
      {items.map((item, index) => (
        <details key={item.question} className="group" open={index === 0}>
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-medium text-heading marker:hidden hover:bg-surface [&::-webkit-details-marker]:hidden">
            <h3 className="text-[15px] font-semibold">{item.question}</h3>
            <Icon name="chevron-down" className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
          </summary>
          <p className="px-4 pb-4 text-[15px] leading-relaxed text-body">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
