import type { Metadata } from 'next';
import Link from 'next/link';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { routes } from '@/lib/routes';

// Next.js adds <meta name="robots" content="noindex"> to 404 responses itself.
export const metadata: Metadata = {
  title: 'Page not found',
};

export default function NotFound() {
  return (
    <div className="container-page py-16 text-center md:py-24">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">We couldn’t find that page</h1>
      <p className="mx-auto mt-3 max-w-md text-body">
        The city, time zone or tool you’re looking for may not be available yet. Try searching instead.
      </p>
      <div className="mx-auto mt-6 max-w-md">
        <GlobalSearch size="lg" />
      </div>
      <p className="mt-6 text-sm">
        <Link href={routes.home()} className="font-medium text-primary hover:underline">
          Go to the homepage
        </Link>
      </p>
    </div>
  );
}
