import 'server-only';

/**
 * The instant a Server Component page is rendered (at build or ISR
 * revalidation). Pages compute server-rendered, indexable time facts for this
 * instant and pass it to client components as `renderedAt`, which use it for
 * hydration before switching to the live clock.
 *
 * Server Components render once per request/revalidation and never re-render
 * on the client, so reading the clock here is intentional. Never call this
 * from a Client Component — use the `useNow()` store instead.
 */
export function getRenderInstant(): number {
  return Date.now();
}
