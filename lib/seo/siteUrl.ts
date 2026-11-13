import { normaliseBase } from './sitemap'

/** The canonical production origin. The bare domain 307-redirects to this host. */
export const CANONICAL_ORIGIN = 'https://www.mathsense.net'

/**
 * The site's own origin, without a trailing slash. NEXT_PUBLIC_SITE_URL first —
 * the same variable app/layout.tsx uses for `metadataBase`, so the sitemap and
 * the page metadata can never name different hosts.
 *
 * The fallback is the real production origin, NOT localhost (which is what the
 * layout falls back to): a sitemap that quietly listed `http://localhost:3000`
 * URLs would be worse than useless to a crawler, and the variable is only ever
 * unset in a misconfigured deploy.
 */
export function siteUrl(): string {
  return normaliseBase(process.env.NEXT_PUBLIC_SITE_URL || CANONICAL_ORIGIN)
}
