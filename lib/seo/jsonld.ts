/**
 * JSON-LD builders. Only emit schema that describes content visible on the
 * page (see SEO_ARCHITECTURE.md → Structured data).
 */
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from './site';

export type Crumb = { name: string; path?: string };
export type FaqItem = { question: string; answer: string };

type JsonLdObject = Record<string, unknown>;

export function websiteJsonLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: SITE_DESCRIPTION,
    inLanguage: 'en',
  };
}

export type PageImage = {
  /** Path under /public. */
  src: string;
  width: number;
  height: number;
  alt: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
};

/** ImageObject with the licence fields Google reads for image credits. */
export function imageObjectJsonLd(path: string, image: PageImage): JsonLdObject {
  return {
    '@type': 'ImageObject',
    '@id': `${absoluteUrl(path)}#primaryimage`,
    url: absoluteUrl(image.src),
    contentUrl: absoluteUrl(image.src),
    width: image.width,
    height: image.height,
    caption: image.alt,
    creditText: image.author,
    creator: { '@type': 'Person', name: image.author },
    license: image.licenseUrl || image.sourceUrl,
    acquireLicensePage: image.sourceUrl,
  };
}

export function webPageJsonLd({ name, description, path, image }: { name: string; description: string; path: string; image?: PageImage }): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${absoluteUrl(path)}#webpage`,
    name,
    description,
    url: absoluteUrl(path),
    inLanguage: 'en',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    ...(image ? { primaryImageOfPage: imageObjectJsonLd(path, image), image: { '@id': `${absoluteUrl(path)}#primaryimage` } } : {}),
  };
}

/**
 * BreadcrumbList. Google requires `item` on every element except the last,
 * so crumbs without a path (unpublished pages) are omitted from the schema.
 */
export function breadcrumbJsonLd(crumbs: Crumb[]): JsonLdObject | null {
  const items = crumbs.filter((crumb, index) => crumb.path || index === crumbs.length - 1);
  if (items.length < 2) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      ...(crumb.path ? { item: absoluteUrl(crumb.path) } : {}),
    })),
  };
}

/** FAQPage — only for FAQs rendered visibly on the same page. */
export function faqJsonLd(items: FaqItem[]): JsonLdObject | null {
  if (items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function webApplicationJsonLd({ name, description, path }: { name: string; description: string; path: string }): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url: absoluteUrl(path),
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    isPartOf: { '@id': `${SITE_URL}/#website` },
  };
}

/** Serialise for a <script type="application/ld+json">, escaping "<" to prevent injection. */
export function serializeJsonLd(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
