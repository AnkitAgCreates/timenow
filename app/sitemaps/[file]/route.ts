import { getSitemapEntries, getSitemapFiles, renderUrlSet } from '@/lib/seo/sitemap';

export const dynamic = 'force-static';
export const dynamicParams = false;

// Empty when indexing is disabled, so every child sitemap URL is a 404.
export function generateStaticParams() {
  return getSitemapFiles().map((file) => ({ file }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const entries = getSitemapEntries(file);
  if (!entries) return new Response('Not found', { status: 404 });
  return new Response(renderUrlSet(entries), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
