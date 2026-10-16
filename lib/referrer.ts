/**
 * Where a visit arrived from.
 *
 * ── This module imports nothing, on purpose ─────────────────────────────────
 * It belongs with the rest of attribution in lib/analytics, but that file
 * imports lib/supabase, which builds a Supabase client at module load and throws
 * without env vars — so a test importing it fails before a single case runs.
 * Same reason lib/cookieConsent was split out, and the same shape as
 * lib/retention: the rules live somewhere testable, the IO stays where it is.
 */

/**
 * The HOST a visit arrived from, or null.
 *
 * Replaces the one thing Google Analytics told us that our own events table
 * could not: where a non-advert visit came from. With advertising off, "organic
 * held up" is only half an answer — the useful half is whether that was search,
 * a shared link, or people typing the address.
 *
 * ── Host only, never the full referring URL ─────────────────────────────────
 * A full referrer carries the other site's path and query string, which can hold
 * whatever they put there — a search term is somebody's own words. The host
 * answers the question we have; the rest is data we have no reason to hold.
 *
 * Returns null for: no referrer (a direct visit, or one the browser stripped),
 * our own host (internal navigation is not an arrival), and anything
 * unparseable. **Null means "nothing worth recording", never "direct"** — the
 * two are indistinguishable from here and the data should not pretend otherwise.
 */
export function referrerHost(raw: string | null | undefined, selfHost: string): string | null {
  if (!raw) return null

  let host: string
  try {
    host = new URL(raw).hostname
  } catch {
    // document.referrer is whatever the browser hands over. Throwing here would
    // take captureAttribution with it, and every event on the page after it.
    return null
  }
  if (!host) return null

  // `www.` is the same site. Deliberately narrow: any OTHER subdomain of our own
  // domain is a real arrival worth seeing, so only the www prefix is folded.
  const strip = (h: string) => h.replace(/^www\./, '').toLowerCase()
  return strip(host) === strip(selfHost) ? null : host.toLowerCase()
}
