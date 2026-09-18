import type { SVGProps } from 'react';

/** Inline stroke icons (24×24). Decorative by default (aria-hidden). */
const PATHS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></>,
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  more: <><circle cx="5" cy="12" r="1.25" /><circle cx="12" cy="12" r="1.25" /><circle cx="19" cy="12" r="1.25" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  swap: <><path d="M4 8h15l-3.5-3.5" /><path d="M20 16H5l3.5 3.5" /></>,
  'swap-vertical': <><path d="M8 20V4L4.5 7.5" /><path d="M16 4v16l3.5-3.5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  sunrise: <><path d="M17 18a5 5 0 0 0-10 0" /><path d="M12 9V2m-3.5 3.5L12 2l3.5 3.5" /><path d="M4.2 10.2l1.4 1.4M1 18h2M21 18h2M18.4 11.6l1.4-1.4M2 22h20" /></>,
  sunset: <><path d="M17 18a5 5 0 0 0-10 0" /><path d="M12 2v7m-3.5-3.5L12 9l3.5-3.5" /><path d="M4.2 10.2l1.4 1.4M1 18h2M21 18h2M18.4 11.6l1.4-1.4M2 22h20" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />,
  maximize: <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />,
  volume: <><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></>,
  'volume-off': <><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="m22 9-6 6M16 9l6 6" /></>,
  timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9.5 2h5M12 2v3" /></>,
  stopwatch: <><circle cx="12" cy="14" r="7" /><path d="M12 10.5V14M9.5 2h5M12 2v5M18.5 7.5 17 9" /></>,
  alarm: <><circle cx="12" cy="13" r="7" /><path d="M12 10v3l2 1.5M5 3 2 6M22 6l-3-3M6.4 19.5 5 21M17.6 19.5 19 21" /></>,
  meeting: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /><path d="m9 15.5 2 2 4-4" /></>,
  converter: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /><path d="M20.5 3.5v4h-4" /></>,
  hash: <path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />,
  hourglass: <path d="M6 2h12M6 22h12M7 2v4l5 6-5 6v4M17 2v4l-5 6 5 6v4" />,
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  zap: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />,
  shield: <><path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3z" /><path d="m9 12 2 2 4-4" /></>,
  devices: <><rect x="2.5" y="4" width="13" height="10" rx="1.5" /><path d="M6 18h5" /><rect x="17.5" y="8" width="4.5" height="12" rx="1.2" /></>,
  copy: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></>,
  check: <path d="m5 12 5 5 9-10" />,
  play: <path d="M7 4.5v15l12.5-7.5z" />,
  pause: <path d="M8 5v14M16 5v14" />,
  reset: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = 'size-5', strokeWidth = 1.75, ...props }: { name: IconName; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
