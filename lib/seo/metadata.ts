import type { Metadata } from 'next';
import { INDEXING_ENABLED, SITE_NAME, absoluteUrl } from './site';

export type PageSeo = {
  /** Unique page title without the brand suffix. */
  title: string;
  /** 120–160 character description written for the searcher. */
  description: string;
  /** Canonical path, lowercase with trailing slash. */
  path: string;
  /** Per-page indexation control (combined with the global switch). */
  indexable: boolean;
  /** Use the title verbatim (homepage). */
  absoluteTitle?: boolean;
  ogType?: 'website' | 'article';
  /** Share image (path under /public) with its pixel size and alt text. */
  image?: { src: string; width: number; height: number; alt: string };
};

/** Standard metadata for every page: title, description, canonical, robots, Open Graph. */
export function buildMetadata({ title, description, path, indexable, absoluteTitle, ogType = 'website', image }: PageSeo): Metadata {
  const canIndex = INDEXING_ENABLED && indexable;
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  const images = image ? [{ url: absoluteUrl(image.src), width: image.width, height: image.height, alt: image.alt }] : undefined;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    robots: canIndex
      ? { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' } }
      : { index: false, follow: true },
    openGraph: {
      type: ogType,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      url: absoluteUrl(path),
      locale: 'en_US',
      ...(images ? { images } : {}),
    },
    twitter: images ? { card: 'summary_large_image', title: fullTitle, description, images: images.map((i) => i.url) } : { card: 'summary', title: fullTitle, description },
  };
}
