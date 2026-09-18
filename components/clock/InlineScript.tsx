/**
 * Inline script that executes during HTML parsing on hard navigations only.
 * On the client it renders as text/plain so React never tries to run it
 * (pattern from the Next.js "Preventing flash before hydration" guide).
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
