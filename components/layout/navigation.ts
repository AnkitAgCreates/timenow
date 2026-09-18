import { routes } from '@/lib/routes';

export type NavItem = { label: string; href: string; match: string[] };

/** Primary navigation (CLAUDE.md: World Clock | Time Zones | Converter | Timers | Tools). */
export const PRIMARY_NAV: NavItem[] = [
  { label: 'World Clock', href: routes.worldClock(), match: ['/world-clock', '/time/'] },
  { label: 'Time Zones', href: routes.timezonesHub(), match: ['/timezones'] },
  { label: 'Converter', href: routes.converterHub(), match: ['/converter', '/convert/'] },
  { label: 'Timers', href: routes.timerHub(), match: ['/timer'] },
  { label: 'Tools', href: routes.tools(), match: ['/tools'] },
];

export function isNavActive(item: NavItem, pathname: string): boolean {
  return item.match.some((prefix) => pathname.startsWith(prefix));
}
