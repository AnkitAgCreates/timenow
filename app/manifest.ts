import type { MetadataRoute } from 'next';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo/site';

/** Manifest icon files, written by scripts/generate-icons.mjs from app/icon.svg. */
export const MANIFEST_ICONS = [
  { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
] as const satisfies NonNullable<MetadataRoute.Manifest['icons']>;

/**
 * Web app manifest (/manifest.webmanifest). Gives Android home-screen shortcuts and
 * installs a sharp 192/512 px icon, a name and colours. Next.js adds the
 * <link rel="manifest"> tag to every page.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: SITE_NAME,
    short_name: 'whattimein',
    description: SITE_DESCRIPTION,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    categories: ['utilities', 'productivity'],
    icons: [...MANIFEST_ICONS],
  };
}
