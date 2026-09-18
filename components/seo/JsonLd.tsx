import { serializeJsonLd } from '@/lib/seo/jsonld';

type JsonLdData = Record<string, unknown> | null | undefined;

/** Renders one or more JSON-LD blocks (null entries are skipped). */
export function JsonLd({ data }: { data: JsonLdData | JsonLdData[] }) {
  const items = (Array.isArray(data) ? data : [data]).filter((item): item is Record<string, unknown> => Boolean(item));
  if (items.length === 0) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(items.length === 1 ? items[0]! : items) }} />;
}
