import { headers } from 'next/headers';
import { consentRegion } from '@/lib/analytics-region';

export const dynamic = 'force-dynamic';

/**
 * Tells the browser whether this visitor is in a region where analytics needs
 * consent. Vercel adds `x-vercel-ip-country` to every request; without it
 * (local, e2e) the region is "unknown" and the banner is shown. Nothing is
 * stored server-side; the country is not echoed beyond this response.
 */
export async function GET() {
  const country = (await headers()).get('x-vercel-ip-country');
  return Response.json(
    { region: consentRegion(country) },
    { headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } },
  );
}
