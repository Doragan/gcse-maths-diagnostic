/**
 * Central page-title map.
 *
 * Almost every page in this app is a client component (`'use client'`), so it
 * can't `export const metadata` — which means, without this, every route falls
 * through to the root default title and the GA4 "Pages and screens" report
 * (grouped by page_title) collapses into one row.
 *
 * `titleForPath` is the single source of truth for the document <title>. The
 * Analytics component sets `document.title` from it (correct browser tab) AND
 * sends it to GA4 as an explicit `page_title` (so the report is right regardless
 * of when the tab title updates).
 *
 * Rules are matched top-to-bottom — put a more specific path BEFORE its parent
 * (e.g. `/dashboard/exam` before the `/dashboard/[id]` catch-all), or the
 * catch-all will swallow it.
 */

const BRAND = 'Mathsense'
/** Matches the `default` in app/layout.tsx — used for `/` and any unmapped route. */
export const DEFAULT_TITLE = 'Mathsense — GCSE Maths practice with instant feedback'

const RULES: [RegExp, string][] = [
  // Marketing / legal
  [/^\/about$/, 'About'],
  [/^\/for-teachers$/, 'For teachers'],
  [/^\/privacy\/complaints$/, 'Privacy complaints'],
  [/^\/privacy$/, 'Privacy policy'],
  [/^\/terms$/, 'Terms of service'],
  [/^\/dpa$/, 'Data processing agreement'],

  // Auth
  [/^\/auth\/confirm$/, 'Confirm your email'],
  [/^\/auth\/reset$/, 'Reset password'],
  [/^\/auth$/, 'Sign in'],

  // Join a class (invite flow)
  [/^\/join\/diagnostic$/, 'Join – diagnostic'],
  [/^\/join\/complete$/, 'Join – complete'],
  [/^\/join$/, 'Join a class'],

  // Practice & diagnostic
  [/^\/practice\/question\/[^/]+$/, 'Practice question'],
  [/^\/practice$/, 'Practise GCSE Maths'],
  [/^\/diagnostic$/, 'Diagnostic'],
  [/^\/account$/, 'Account'],

  // Student
  [/^\/student\/diagnostic$/, 'Diagnostic'],
  [/^\/student\/dashboard$/, 'Student dashboard'],
  [/^\/student\/assignments\/[^/]+$/, 'Assignment'],
  [/^\/student\/assignments$/, 'My assignments'],
  [/^\/student\/classes$/, 'My classes'],
  [/^\/student\/upgrade$/, 'Upgrade'],
  [/^\/student$/, 'Student sign in'],

  // Teacher dashboard (named routes before the /dashboard/[id] catch-all)
  [/^\/dashboard\/classes\/[^/]+$/, 'Class'],
  [/^\/dashboard\/classes$/, 'Classes'],
  [/^\/dashboard\/assignments\/create$/, 'Create assignment'],
  [/^\/dashboard\/assignments\/[^/]+$/, 'Assignment'],
  [/^\/dashboard\/assignments$/, 'Assignments'],
  [/^\/dashboard\/exam$/, 'Mini-exam'],
  [/^\/dashboard\/upgrade$/, 'Upgrade'],
  [/^\/dashboard\/[^/]+$/, 'Student overview'],
  [/^\/dashboard$/, 'Teacher dashboard'],

  // Admin (prefixed so they group together in analytics)
  [/^\/admin\/questions\/new$/, 'Admin – new question'],
  [/^\/admin\/questions\/preview$/, 'Admin – question preview'],
  [/^\/admin\/questions\/[^/]+$/, 'Admin – edit question'],
  [/^\/admin\/questions$/, 'Admin – questions'],
  [/^\/admin$/, 'Admin'],

  // Demo
  [/^\/demo\/marking$/, 'Demo – marking'],
  [/^\/demo\/dashboard\/teacher$/, 'Demo – teacher dashboard'],
  [/^\/demo\/dashboard\/student$/, 'Demo – student dashboard'],
]

/** Full document <title> for a pathname. Unmapped routes get the brand default. */
export function titleForPath(pathname: string): string {
  if (pathname === '/') return DEFAULT_TITLE
  const clean = pathname.replace(/\/+$/, '') || '/'
  for (const [re, label] of RULES) if (re.test(clean)) return `${label} — ${BRAND}`
  return DEFAULT_TITLE
}
