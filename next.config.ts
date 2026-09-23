import type { NextConfig } from 'next';
import { getTimerAliases } from './lib/data/timers';

const nextConfig: NextConfig = {
  // Lets end-to-end tests build separate outputs (indexing on/off) side by side.
  distDir: process.env.TIMENOW_DIST_DIR || '.next',
  // Canonical URLs are lowercase and end with a slash (/time/san-diego/).
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Static generation forks one worker per CPU by default (15 here). On a loaded laptop that
  // exhausts memory and the build dies with ENOENT/UNKNOWN file errors or a Node fatal error,
  // so local builds can cap it: TIMENOW_BUILD_CPUS=4 npm run build. Unset in CI and on Vercel.
  ...(process.env.TIMENOW_BUILD_CPUS ? { experimental: { cpus: Number(process.env.TIMENOW_BUILD_CPUS) } } : {}),
  async redirects() {
    return [
      // UTC and GMT are canonical at their hubs; GMT offsets are the same offsets as UTC.
      { source: '/timezones/utc/', destination: '/utc/', permanent: true },
      { source: '/timezones/gmt/', destination: '/gmt/', permanent: true },
      { source: '/gmt/gmt-:rest/', destination: '/utc/utc-:rest/', permanent: true },
      // Alternate duration spellings → one canonical timer page.
      ...getTimerAliases().map(({ source, destination }) => ({
        source: `/timer/${source}/`,
        destination: `/timer/${destination}/`,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
