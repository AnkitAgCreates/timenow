import type { MetadataRoute } from 'next';
import { INDEXING_ENABLED, absoluteUrl } from '@/lib/seo/site';

export default function robots(): MetadataRoute.Robots {
  if (!INDEXING_ENABLED) {
    // Non-production environments must never be crawled.
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Internal endpoints have no search value. Query-string variants are
        // handled with canonical tags rather than robots rules, so crawlers can
        // still fetch versioned assets needed for rendering.
        disallow: ['/api/'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
