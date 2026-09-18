import { NextResponse, type NextRequest } from 'next/server';

/**
 * Canonical URL enforcement: every public URL is lowercase. Mixed-case
 * variants (/time/San-Diego/) permanently redirect to the lowercase URL so
 * they can never be indexed as duplicates.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === pathname.toLowerCase()) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = pathname.toLowerCase();
  return NextResponse.redirect(url, 308);
}

export const config = {
  // Skip Next internals, API routes and files with extensions.
  matcher: ['/((?!_next/|api/|.*\\.[a-zA-Z0-9]+$).*)'],
};
