import Link from 'next/link';
import { BrandName } from '@/components/layout/Logo';
import { routes } from '@/lib/routes';
import { SITE_TAGLINE } from '@/lib/seo/site';

const FOOTER_LINKS = [
  { label: 'Popular Cities', href: routes.worldClock() },
  { label: 'Countries', href: routes.countriesHub() },
  { label: 'Time Zones', href: routes.timezonesHub() },
  { label: 'UTC', href: routes.utcHub() },
  { label: 'Converter', href: routes.converterHub() },
  { label: 'Timers', href: routes.timerHub() },
  { label: 'Tools', href: routes.tools() },
];

const VALUES = ['Fast', 'Accurate', 'Global', 'Free'];

export function Footer() {
  return (
    <footer className="mt-12 border-t border-border bg-white pb-20 md:pb-0">
      <div className="container-page flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
          <BrandName className="text-lg font-extrabold tracking-[-0.03em] text-heading" />
          <span className="text-sm text-muted">{SITE_TAGLINE}</span>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-flex min-h-11 items-center text-sm text-body hover:text-primary md:min-h-0">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-xs text-muted">{VALUES.join(' · ')}</p>
      </div>
      <div className="border-t border-border">
        <p className="container-page py-3 text-xs text-muted">
          Times are calculated in your browser from the IANA time zone database, including daylight saving time rules. City and country data ©{' '}
          <a href="https://www.geonames.org/" rel="license noopener" className="underline hover:text-primary">
            GeoNames
          </a>
          , CC BY 4.0.
        </p>
      </div>
    </footer>
  );
}
