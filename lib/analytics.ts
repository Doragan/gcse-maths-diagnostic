/**
 * Analytics — dual-destination event tracking.
 *
 * Every call to trackEvent() writes to two places:
 *   1. Supabase `analytics_events` table (your own data, queryable in the dashboard)
 *   2. Google Analytics 4 via gtag (if NEXT_PUBLIC_GA_ID is configured)
 *
 * Dev mode (Ctrl+Alt+D):
 *   Toggles a localStorage flag. While active, all tracking is silently skipped
 *   and a small badge is shown in the corner so you know it's on.
 */

import { supabase } from './supabase'
import { normalizePath } from './pageTitles'

/**
 * GA4 measurement ID — the single source of truth (loaded by CookieBanner after
 * consent). Prefer the env var; fall back to the known production property so
 * analytics keep working even if the env var isn't set in an environment.
 * (Measurement IDs are public — they ship in the client either way.)
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-7FCDN55EVJ'

const SESSION_KEY = 'mathsense_sid'
const DEV_KEY     = 'mathsense_dev'
const ATTRIBUTION_KEY = 'mathsense_attr'

// ── Session ID ────────────────────────────────────────────────────────────────

/**
 * Returns a stable anonymous session ID for this browser session.
 * Generated on first access, stored in sessionStorage so it resets when the
 * tab closes (unlike localStorage).
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  let sid = sessionStorage.getItem(SESSION_KEY)
  if (!sid) {
    sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
    sessionStorage.setItem(SESSION_KEY, sid)
  }
  return sid
}

// ── Dev mode ──────────────────────────────────────────────────────────────────

export function isDevMode(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(DEV_KEY) === '1'
}

/**
 * Toggles dev mode on/off. Returns the new state (true = dev mode is now on).
 * Keyboard shortcut: Ctrl+Alt+D (wired up in DevModeToggle component).
 */
export function toggleDevMode(): boolean {
  if (typeof window === 'undefined') return false
  const next = !isDevMode()
  if (next) localStorage.setItem(DEV_KEY, '1')
  else      localStorage.removeItem(DEV_KEY)
  return next
}

// ── Campaign attribution (first-touch) ─────────────────────────────────────────

const ATTRIBUTION_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'] as const

/**
 * Capture campaign attribution from the landing URL (utm_* / gclid), first-touch:
 * the first hit of the session wins, so a later internal navigation can't
 * overwrite the ad click that brought them in. Stored in sessionStorage and
 * attached to every tracked event (see trackEvent), so a signup can be tied back
 * to its campaign in our own analytics_events — independent of GA, which
 * ad-blockers and consent declines can drop. No-op for organic visits (no params).
 */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return
  if (sessionStorage.getItem(ATTRIBUTION_KEY)) return // first touch already recorded
  const params = new URLSearchParams(window.location.search)
  const attr: Record<string, string> = {}
  for (const f of ATTRIBUTION_FIELDS) {
    const v = params.get(f)
    if (v) attr[f] = v
  }
  if (Object.keys(attr).length > 0) {
    attr.landing_page = normalizePath(window.location.pathname)
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attr))
  }
}

function getAttribution(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) || '{}') } catch { return {} }
}

// ── Main tracking function ────────────────────────────────────────────────────

export function trackEvent(
  name: string,
  properties: Record<string, unknown> = {}
): void {
  if (typeof window === 'undefined') return   // skip server-side renders
  if (isDevMode())                   return   // skip when testing

  const sessionId = getSessionId()
  // Attach first-touch campaign attribution to every event (explicit properties
  // win on any key collision). Empty for organic visits.
  const enriched = { ...getAttribution(), ...properties }
  // Normalise the path so dynamic segments (parent-pay tokens, ids) never reach
  // analytics — applies to EVERY event, not just page_view.
  const path = normalizePath(window.location.pathname)

  // 1. Supabase — fire and forget (don't block the UI)
  supabase.from('analytics_events').insert({
    event:      name,
    path,
    session_id: sessionId,
    properties: enriched,
  }).then()

  // 2. Google Analytics 4 (only if the script is loaded — i.e. after consent)
  const gtag = (window as any).gtag
  if (gtag) {
    gtag('event', name, {
      page_path: path,
      ...enriched,
    })
  }
}
