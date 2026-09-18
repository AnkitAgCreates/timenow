'use client';

import { useEffect, useState } from 'react';

export type TabLink = { id: string; label: string };

/**
 * In-page section navigation styled as tabs (Visual PRD). All sections are
 * server-rendered and visible, so content stays indexable; the active tab
 * follows scroll position.
 */
export function SectionTabs({ tabs, className = '' }: { tabs: TabLink[]; className?: string }) {
  const [active, setActive] = useState(tabs[0]?.id);

  useEffect(() => {
    const sections = tabs.map((tab) => document.getElementById(tab.id)).filter((el): el is HTMLElement => Boolean(el));
    if (!('IntersectionObserver' in window) || sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-80px 0px -60% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [tabs]);

  return (
    <nav aria-label="On this page" className={`-mx-4 overflow-x-auto overflow-y-hidden border-b border-border px-4 [scrollbar-width:none] md:mx-0 md:px-0 ${className}`}>
      <ul className="flex min-w-max gap-5">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <li key={tab.id}>
              <a
                href={`#${tab.id}`}
                onClick={() => setActive(tab.id)}
                aria-current={isActive ? 'location' : undefined}
                className={`-mb-px inline-flex min-h-11 items-center border-b-2 text-sm font-medium transition-colors ${
                  isActive ? 'border-primary text-primary' : 'border-transparent text-body hover:text-heading'
                }`}
              >
                {tab.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
