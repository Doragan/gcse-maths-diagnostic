/**
 * Central page-title map.
 *
 * Almost every page in this app is a client component (`'use client'`), so it
 * can't `export const metadata` — which means, without this, every route falls
 * through to the root default title and every unmapped surface reports as one
 * undifferentiated row.
 *
 * `titleForPath` is the single source of truth for the document <title>. The
 * Analytics component sets `document.title` from it (correct browser tab) AND
 * sends it as an explicit `page_title` property on the event, so the stored
 * title is right regardless of when the tab title updates.
 *
 * WHERE THE EVENTS GO: `analytics_events` in Supabase, and nowhere else. Google
 * Analytics was removed on 2026-10-12 (#139) and this file's comments went on
 * describing GA4 for days afterwards — including in a change written after the
 * removal, which then reasoned from it. The destination is worth naming
 * precisely here because the rules below exist to shape what lands there.
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
  [/^\/guide$/, 'Quick start guide'],
  [/^\/mark$/, 'Mark a paper'],
  [/^\/contact$/, 'Contact'],
  [/^\/privacy\/complaints$/, 'Privacy complaints'],
  [/^\/privacy$/, 'Privacy policy'],
  [/^\/terms$/, 'Terms of service'],
  // Was 'Data processing agreement' until 2026-09-17, when the route stopped
  // serving one: Mathsense is not a school's processor. See app/dpa/page.tsx.
  [/^\/dpa$/, 'School data protection'],

  // Auth
  // The Google OAuth landing page. Not purely a redirect — a new student stops
  // here to give the 13+ consent Google cannot, so it is a page someone reads.
  // It had no rule and reported as the brand default; static, so no id leaked.
  [/^\/auth\/callback$/, 'Finishing sign-in'],
  [/^\/auth\/confirm$/, 'Confirm your email'],
  [/^\/auth\/reset$/, 'Reset password'],
  [/^\/auth$/, 'Sign in'],

  // The no-login class session join page (docs/audit/29). Deliberately the
  // shortest route in the app, because a teacher reads it out loud.
  [/^\/s$/, 'Join your class'],

  // Join a class (invite flow)
  [/^\/join\/diagnostic$/, 'Join – diagnostic'],
  [/^\/join\/complete$/, 'Join – complete'],
  [/^\/join$/, 'Join a class'],

  // Practice & diagnostic
  [/^\/practice\/question\/[^/]+$/, 'Practice question', '/practice/question/[id]'],
  // Noun "practice" (with a c) to read consistently with 'Practice question'
  // below — both are correct UK English, but the mixed verb/noun spelling looked
  // like a typo side by side in the analytics report.
  //
  // Qualification-NEUTRAL, deliberately: this said "GCSE Maths practice"
  // while a student who had switched to International GCSE was practising
  // 4MA1 content.
  //
  // Fixed by dropping the qualification rather than by naming the right one.
  // titleForPath is a pure function of the PATH, and it shares RULES with
  // normalizePath, which feeds the stored page_title. Branching the title on a
  // per-browser preference would either break that purity or split one
  // surface into two rows — the exact collapse this whole file exists to
  // prevent. A tab title does not need to state the student's syllabus.
  [/^\/practice$/, 'Maths practice'],
  [/^\/diagnostic$/, 'Diagnostic'],
  [/^\/account$/, 'Account'],

  // Skill guides. The slug is a readable skill id, not a token — but it is
  // still collapsed here so analytics reports one row for the surface. Which skill
  // was viewed rides on the skill_briefing_view event instead.
  // The index sits at /skills and must be matched BEFORE the singular pattern
  // so it keeps its own row rather than being swallowed.
  [/^\/skills$/, 'All skills'],
  [/^\/skill\/[^/]+$/, 'Exam briefing', '/skill/[slug]'],

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

  // Where an emailed class invitation lands. Outside /student because the
  // visitor usually has no account yet — that is the point of inviting.
  // The title must not name the class: it is read before anyone is signed in,
  // and a browser history entry is not the place to put a class name.
  [/^\/invite\/[^/]+$/, 'Class invitation', '/invite/[token]'],

  // Teacher dashboard (named routes before the /dashboard/[id] catch-all)
  // More specific first: the bare-id rule below would otherwise swallow this.
  [/^\/dashboard\/classes\/[^/]+\/papers$/, 'Record a marked paper', '/dashboard/classes/[id]/papers'],
  // Join code, invitations and roster. Split off the class page 2026-10-13.
  // Grouped with its siblings by convention; the bare-id rule below is
  // $-anchored so it could not actually swallow this one.
  [/^\/dashboard\/classes\/[^/]+\/people$/, 'Class people', '/dashboard/classes/[id]/people'],
  // A teacher reading one student's sat paper. Had NO rule until 2026-10-18,
  // so it fell through to the brand default and — worse — normalizePath
  // returned it unchanged, putting a class id AND a session id into
  // analytics_events on every view. Two dynamic segments, which is exactly
  // what the third tuple element exists to collapse.
  //
  // Titled without the student's name, like the class invitation rule below:
  // the page heading says "<name>'s paper", but a browser history entry and an
  // analytics row are not places to put a child's name.
  [/^\/dashboard\/classes\/[^/]+\/exam\/[^/]+$/, 'Class exam review', '/dashboard/classes/[id]/exam/[sessionId]'],
  [/^\/dashboard\/classes\/[^/]+$/, 'Class', '/dashboard/classes/[id]'],
  [/^\/dashboard\/classes$/, 'Classes'],
  // The join-code diagnostic, moved off the landing page (docs/audit/30).
  // ABOVE the bare-id catch-all, which would otherwise swallow it and title
  // it "Student overview" — the same trap as the two rules below.
  [/^\/dashboard\/assessments$/, 'Class diagnostic'],

  // No-login class sessions (docs/audit/29). Both rules must stay above the
  // bare-id catch-all: `/dashboard/sessions` matches /^\/dashboard\/[^/]+$/
  // perfectly well, so without the second one it would be titled "Student
  // overview" and normalised into `/dashboard/[id]` in GA4.
  //
  // The title does not name the session, and the id is normalised away: while a
  // session is live this page is the one most likely to be PROJECTED, and a
  // browser tab is not where a class name belongs.
  // The projector view goes BEFORE the session rule. That one is $-anchored so
  // it would not swallow this deeper path, but specific-before-general is the
  // convention in this file and the next segment added under sessions/ would
  // otherwise be a live trap.
  //
  // The title is deliberately dull: this page gets PROJECTED, and on a screen
  // that is not full-screened the tab strip is in front of the class.
  [/^\/dashboard\/sessions\/[^/]+\/display$/, 'Session code', '/dashboard/sessions/[id]/display'],
  [/^\/dashboard\/sessions\/[^/]+$/, 'Class session', '/dashboard/sessions/[id]'],
  [/^\/dashboard\/sessions$/, 'Class sessions'],
  [/^\/dashboard\/assignments\/create$/, 'Create assignment'],
  [/^\/dashboard\/assignments\/[^/]+$/, 'Assignment', '/dashboard/assignments/[id]'],
  [/^\/dashboard\/assignments$/, 'Assignments'],
  [/^\/dashboard\/exam$/, 'Mini-exam'],
  [/^\/dashboard\/upgrade$/, 'Upgrade'],
  // The tutor's cross-class student view (docs/audit/26). BOTH rules must stay
  // above the bare-id catch-all below: `/dashboard/students` matches
  // /^\/dashboard\/[^/]+$/ perfectly well, so without this it would be titled
  // "Student overview" and normalised to `/dashboard/[id]` — wrong in the tab
  // and silently merged with a different route in analytics.
  [/^\/dashboard\/students\/[^/]+$/, 'Student', '/dashboard/students/[id]'],
  [/^\/dashboard\/students$/, 'My students'],
  [/^\/dashboard\/[^/]+$/, 'Student overview', '/dashboard/[id]'],
  [/^\/dashboard$/, 'Teacher dashboard'],

  // Admin (prefixed so they group together in analytics)
  [/^\/admin\/questions\/new$/, 'Admin – new question'],
  [/^\/admin\/questions\/preview$/, 'Admin – question preview'],
  [/^\/admin\/questions\/[^/]+$/, 'Admin – edit question', '/admin/questions/[id]'],
  [/^\/admin\/questions$/, 'Admin – questions'],
  [/^\/admin\/schools$/, 'Admin – schools'],
  [/^\/admin\/usage$/, 'Admin – usage'],
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
