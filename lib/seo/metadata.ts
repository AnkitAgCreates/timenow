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
};

/** Standard metadata for every page: title, description, canonical, robots, Open Graph. */
export function buildMetadata({ title, description, path, indexable, absoluteTitle, ogType = 'website' }: PageSeo): Metadata {
  const canIndex = INDEXING_ENABLED && indexable;
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
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
    },
    twitter: { card: 'summary', title: fullTitle, description },
  };
}
