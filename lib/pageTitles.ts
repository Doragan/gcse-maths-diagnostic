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
 * `normalizePath` reuses the same rules to collapse a concrete pathname to its
 * route pattern (e.g. `/pay/<token>` → `/pay/[token]`) so dynamic segments —
 * capability tokens especially — never reach analytics. The third tuple element
 * is that canonical path; it's only set on dynamic routes.
 *
 * Rules are matched top-to-bottom — put a more specific path BEFORE its parent
 * (e.g. `/dashboard/exam` before the `/dashboard/[id]` catch-all), or the
 * catch-all will swallow it.
 */

const BRAND = 'Mathsense'
/** Matches the `default` in app/layout.tsx — used for `/` and any unmapped route. */
export const DEFAULT_TITLE = 'Mathsense — GCSE Maths practice with instant feedback'

const RULES: [RegExp, string, string?][] = [
  // Marketing / legal
  [/^\/about$/, 'About'],
  [/^\/for-teachers$/, 'For teachers'],
  [/^\/contact$/, 'Contact'],
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
  [/^\/practice\/question\/[^/]+$/, 'Practice question', '/practice/question/[id]'],
  // Noun "practice" (with a c) to read consistently with 'Practice question'
  // below — both are correct UK English, but the mixed verb/noun spelling looked
  // like a typo side by side in the GA4 report.
  [/^\/practice$/, 'GCSE Maths practice'],
  [/^\/diagnostic$/, 'Diagnostic'],
  [/^\/account$/, 'Account'],

  // Skill guides. The slug is a readable skill id, not a token — but it is
  // still collapsed here so GA4 reports one row for the surface. Which skill
  // was viewed rides on the skill_guide_view event instead.
  [/^\/skill\/[^/]+$/, 'Skill guide', '/skill/[slug]'],

  // Parent-pay (public, token link)
  [/^\/pay\/[^/]+$/, 'Pay for a subscription', '/pay/[token]'],

  // Student
  // Re-review of a sat paper before the /student/exam parent, and the session
  // id normalised away so it never reaches analytics.
  [/^\/student\/exam\/[^/]+$/, 'Exam review', '/student/exam/[sessionId]'],
  [/^\/student\/exam$/, 'Mini-exam'],
  [/^\/student\/diagnostic$/, 'Diagnostic'],
  [/^\/student\/dashboard$/, 'Student dashboard'],
  [/^\/student\/assignments\/[^/]+$/, 'Assignment', '/student/assignments/[id]'],
  [/^\/student\/assignments$/, 'My assignments'],
  [/^\/student\/classes$/, 'My classes'],
  [/^\/student\/upgrade$/, 'Upgrade'],
  [/^\/student$/, 'Student sign in'],

  // Teacher dashboard (named routes before the /dashboard/[id] catch-all)
  // More specific first: the bare-id rule below would otherwise swallow this.
  [/^\/dashboard\/classes\/[^/]+\/papers$/, 'Record a marked paper', '/dashboard/classes/[id]/papers'],
  [/^\/dashboard\/classes\/[^/]+$/, 'Class', '/dashboard/classes/[id]'],
  [/^\/dashboard\/classes$/, 'Classes'],
  [/^\/dashboard\/assignments\/create$/, 'Create assignment'],
  [/^\/dashboard\/assignments\/[^/]+$/, 'Assignment', '/dashboard/assignments/[id]'],
  [/^\/dashboard\/assignments$/, 'Assignments'],
  [/^\/dashboard\/exam$/, 'Mini-exam'],
  [/^\/dashboard\/upgrade$/, 'Upgrade'],
  [/^\/dashboard\/[^/]+$/, 'Student overview', '/dashboard/[id]'],
  [/^\/dashboard$/, 'Teacher dashboard'],

  // Admin (prefixed so they group together in analytics)
  [/^\/admin\/questions\/new$/, 'Admin – new question'],
  [/^\/admin\/questions\/preview$/, 'Admin – question preview'],
  [/^\/admin\/questions\/[^/]+$/, 'Admin – edit question', '/admin/questions/[id]'],
  [/^\/admin\/questions$/, 'Admin – questions'],
  [/^\/admin$/, 'Admin'],

  // Demo — the guided tour and its four stops. The /demo hub is last of these
  // so the deeper routes match first (see the ordering note at the top).
  [/^\/demo\/marking$/, 'Demo – marking'],
  [/^\/demo\/dashboard\/teacher$/, 'Demo – teacher dashboard'],
  [/^\/demo\/dashboard\/student$/, 'Demo – student dashboard'],
  [/^\/demo\/questions$/, 'Demo – question showcase'],
  [/^\/demo$/, 'Demo – guided tour'],
]

/** Full document <title> for a pathname. Unmapped routes get the brand default. */
export function titleForPath(pathname: string): string {
  if (pathname === '/') return DEFAULT_TITLE
  const clean = pathname.replace(/\/+$/, '') || '/'
  for (const [re, label] of RULES) if (re.test(clean)) return `${label} — ${BRAND}`
  return DEFAULT_TITLE
}

/**
 * Collapse a concrete pathname to its route pattern for analytics, so dynamic
 * segments (capability tokens, ids) never leave the browser. Dynamic routes map
 * to their canonical form (`/pay/<token>` → `/pay/[token]`); static routes and
 * unmatched paths are returned as-is (a static route has no dynamic segment to
 * leak). Reuses the ordered RULES so it can't drift from titleForPath.
 */
export function normalizePath(pathname: string): string {
  const clean = pathname.replace(/\/+$/, '') || '/'
  for (const [re, , canonical] of RULES) if (re.test(clean)) return canonical ?? clean
  return clean
}
