import { NextResponse, type NextRequest } from 'next/server';
import { canonicalRedirect } from '@/lib/seo/canonical-host';

/**
 * Canonical URL enforcement:
 * - every public URL is lowercase: mixed-case variants (/time/San-Diego/)
 *   permanently redirect to the lowercase URL so they can never be indexed
 *   as duplicates;
 * - on the indexable production site, requests that arrive on another host
 *   (the *.vercel.app aliases, per-deployment URLs) permanently redirect to
 *   the canonical origin. Local servers and previews are left alone.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const lower = pathname.toLowerCase();
  const target = canonicalRedirect(request.headers.get('host'), lower, search);
  if (target) return NextResponse.redirect(target, 308);
  if (pathname === lower) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = lower;
  return NextResponse.redirect(url, 308);
}

export const config = {
  // Skip Next internals, API routes and files with extensions.
  matcher: ['/((?!_next/|api/|.*\.[a-zA-Z0-9]+$).*)'],
};
