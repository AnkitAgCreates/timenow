import { getSitemapFiles, renderSitemapIndex } from '@/lib/seo/sitemap';
import { INDEXING_ENABLED } from '@/lib/seo/site';

export const dynamic = 'force-static';

/**
 * Sitemap index pointing at chunked child sitemaps (/sitemaps/[file]).
 * Returns 404 when the global indexing kill switch is off.
 */
export function GET() {
  if (!INDEXING_ENABLED) {
    return new Response('Not found', { status: 404, headers: { 'X-Robots-Tag': 'noindex' } });
  }
  return new Response(renderSitemapIndex(getSitemapFiles()), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
