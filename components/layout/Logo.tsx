import Link from 'next/link';

/** Wordmark: the domain, with the TLD in the primary accent. */
export function BrandName({ className = '' }: { className?: string }) {
  return (
    <span className={className}>
      whattimein<span className="text-primary">.world</span>
    </span>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex min-h-11 items-center text-heading ${className}`} aria-label="whattimein.world home">
      <BrandName className="text-[1.25rem] font-extrabold leading-none tracking-[-0.03em]" />
    </Link>
  );
}
