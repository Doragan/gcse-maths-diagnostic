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

const SESSION_KEY = 'mathsense_sid'
const DEV_KEY     = 'mathsense_dev'

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

// ── Main tracking function ────────────────────────────────────────────────────

export function trackEvent(
  name: string,
  properties: Record<string, unknown> = {}
): void {
  if (typeof window === 'undefined') return   // skip server-side renders
  if (isDevMode())                   return   // skip when testing

  const sessionId = getSessionId()

  // 1. Supabase — fire and forget (don't block the UI)
  supabase.from('analytics_events').insert({
    event:      name,
    path:       window.location.pathname,
    session_id: sessionId,
    properties,
  }).then()

  // 2. Google Analytics 4 (only if the script is loaded)
  const gtag = (window as any).gtag
  if (gtag) {
    gtag('event', name, {
      page_path: window.location.pathname,
      ...properties,
    })
  }
}
