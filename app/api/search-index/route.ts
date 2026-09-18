import { buildSearchIndex } from '@/lib/search/build-index';

export const dynamic = 'force-static';

/** Static search index, fetched lazily by the search combobox. */
export function GET() {
  return Response.json(buildSearchIndex(), {
    headers: { 'X-Robots-Tag': 'noindex' },
  });
}
