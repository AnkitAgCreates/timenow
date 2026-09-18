import type { NextConfig } from 'next';
import { getTimerAliases } from './lib/data/timers';

const nextConfig: NextConfig = {
  // Lets end-to-end tests build separate outputs (indexing on/off) side by side.
  distDir: process.env.TIMENOW_DIST_DIR || '.next',
  // Canonical URLs are lowercase and end with a slash (/time/san-diego/).
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
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
