/**
 * Analytics cookie consent: the one place that decides whether Google Analytics
 * may load, and the only place that writes the stored choice.
 *
 * ── Two defects this exists to close (2026-09-22) ───────────────────────────
 *
 * 1. CONSENT COULD NOT BE WITHDRAWN. `cookie-consent` was written once by the
 *    banner and read nowhere else. Once it said "true" the banner never
 *    rendered again and no other surface could change it, so a visitor who
 *    accepted had no way back short of clearing the site's data in their
 *    browser. Under PECR, withdrawing consent must be as easy as giving it.
 *
 * 2. DECLINING WAS NOT REMEMBERED. `declineCookies` set React state and wrote
 *    nothing, so the banner reappeared on the visitor's next page load while
 *    "accept" was remembered forever. An interface that forgets no and
 *    remembers yes is asking the question until it gets the answer it wants,
 *    which is exactly what the Children's Code means by a nudge. Most of this
 *    product's users are 13 to 16.
 *
 * ── The stored value ────────────────────────────────────────────────────────
 * "true" accepted, "false" declined, absent undecided. "true" is unchanged from
 * the original implementation on purpose: every visitor who has already
 * accepted keeps their choice across this change rather than being asked again.
 */

/**
 * ── This module imports nothing, on purpose ─────────────────────────────────
 * It used to take GA_MEASUREMENT_ID from lib/analytics, which imports
 * lib/supabase, which builds a Supabase client at module load and throws
 * without env vars. That made the consent rules untestable: the test file
 * failed to import before a single case ran. The id is defined here instead and
 * re-exported by lib/analytics for its existing callers, so the dependency runs
 * the other way and the rules below can be tested with no environment at all.
 * Same reasoning as lib/retention.ts, which does no IO for the same reason.
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-7FCDN55EVJ'

export const CONSENT_KEY = 'cookie-consent'

export type ConsentState = 'accepted' | 'declined' | 'undecided'

/**
 * Read a stored value into a decision.
 *
 * Anything unrecognised is `undecided`, which means the banner asks again. That
 * is the safe direction: a corrupted or half-written value must never be read
 * as consent, because consent is the state that starts sending data to Google.
 */
export function parseConsent(raw: string | null | undefined): ConsentState {
  if (raw === 'true') return 'accepted'
  if (raw === 'false') return 'declined'
  return 'undecided'
}

/** The value to store for a decision. */
export function consentValue(state: Exclude<ConsentState, 'undecided'>): string {
  return state === 'accepted' ? 'true' : 'false'
}

/** Show the banner only when no choice has been recorded. */
export function shouldShowBanner(state: ConsentState): boolean {
  return state === 'undecided'
}

/**
 * Read the current choice. Returns `undecided` when storage is unavailable —
 * a private window, or a browser blocking site data — so the visitor is asked
 * rather than silently treated as having consented.
 */
export function readConsent(): ConsentState {
  if (typeof window === 'undefined') return 'undecided'
  try {
    return parseConsent(localStorage.getItem(CONSENT_KEY))
  } catch {
    return 'undecided'
  }
}

/** Record a choice. Failure to persist is swallowed; the caller still applies it. */
export function writeConsent(state: Exclude<ConsentState, 'undecided'>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CONSENT_KEY, consentValue(state))
  } catch {
    /* storage disabled — the in-page decision below still takes effect */
  }
}

/** Google's documented per-property opt-out flag. */
const GA_DISABLE_KEY = `ga-disable-${GA_MEASUREMENT_ID}`

/**
 * Load Google Analytics. Called only after an explicit accept.
 *
 * `send_page_view` is disabled because the Analytics component sends every
 * page_view manually, for the initial load and for client-side route changes,
 * so leaving it on would double-count.
 *
 * Idempotent: re-accepting in the same page session does not add a second copy
 * of the script.
 */
export function loadGA(): void {
  if (typeof window === 'undefined') return
  const w = window as unknown as Record<string, unknown>
  w[GA_DISABLE_KEY] = false
  if (document.getElementById('ga-loader')) return

  const script1 = document.createElement('script')
  script1.id = 'ga-loader'
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  script1.async = true
  document.head.appendChild(script1)

  const script2 = document.createElement('script')
  script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
    `
  document.head.appendChild(script2)
}

/**
 * Stop Google Analytics sending, and clear what it has already stored.
 *
 * Withdrawal has to do more than stop future page loads from loading the
 * script. On the page where someone withdraws, gtag is already in the document,
 * so `ga-disable-<id>` is set first: that is Google's own opt-out switch and it
 * makes every subsequent call a no-op without a reload. The cookies it has
 * already set are then deleted, so the identifier does not survive to be picked
 * up again if the visitor later changes their mind.
 */
export function disableGA(): void {
  if (typeof window === 'undefined') return
  const w = window as unknown as Record<string, unknown>
  w[GA_DISABLE_KEY] = true
  clearGaCookies()
}

/**
 * Delete the cookies GA sets: `_ga`, and `_ga_<container>` for GA4.
 *
 * A cookie is only removed by a matching domain and path, and GA writes on the
 * registrable domain rather than the exact host. Both are attempted, along with
 * the bare host, because there is no way to read back which one was used and a
 * missed cookie leaves the identifier in place.
 */
function clearGaCookies(): void {
  const names = document.cookie
    .split(';')
    .map(c => c.split('=')[0]?.trim())
    .filter((n): n is string => !!n && (n === '_ga' || n.startsWith('_ga_')))

  const host = window.location.hostname
  // "a.b.co.uk" -> also try ".b.co.uk". Enough for this domain; not a public
  // suffix parser, and it does not need to be, because a wrong domain simply
  // fails to match and deletes nothing.
  const parts = host.split('.')
  const parent = parts.length > 2 ? `.${parts.slice(-3).join('.')}` : `.${host}`
  const domains = [undefined, host, parent, `.${host}`]

  for (const name of names) {
    for (const domain of domains) {
      document.cookie =
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/` +
        (domain ? `; domain=${domain}` : '')
    }
  }
}
