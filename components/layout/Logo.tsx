import Link from 'next/link';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex min-h-11 items-center text-heading ${className}`} aria-label="TimeNow home">
      <span className="text-[1.375rem] font-extrabold leading-none tracking-[-0.03em]">TimeNow</span>
    </Link>
  );
}
