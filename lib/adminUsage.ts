/**
 * The numbers behind /admin/usage.
 *
 * Pure — every input is passed in and `now` is injected — so the whole report is
 * testable without a database, and the API route is left doing nothing but
 * fetching rows.
 *
 * ── What is here, and what deliberately isn't ───────────────────────────────
 * Every figure is one that changed a decision during the 2026-09-01 analysis.
 * Total signups is NOT among them and is deliberately not a headline: 57
 * signups reads like success while 10 returners is the actual story, and a
 * flattering number at the top of a page is worse than no page.
 *
 * Nothing here needs new instrumentation. The day-2 rate is distinct attempt
 * dates per student against `students.created_at`; the funnel is the same two
 * tables counted at four thresholds. That is why this was a small build.
 *
 * ── No PII ──────────────────────────────────────────────────────────────────
 * Aggregates and opaque ids only. No email address or display name enters this
 * module, so none can reach the page.
 */
import { mondayOf } from './skills/weeklyGoal'
import { isPaidStudent } from './entitlements'

const DAY = 86400000

export type UsageStudent = {
  id: string
  created_at: string
  subscription_tier?: string | null
  paid_until?: string | null
}

export type UsageAttempt = {
  student_id: string
  attempted_at: string
}

export type UsageSend = {
  student_id: string
  sent_at: string
  clicked_at?: string | null
}

/** One week of activity. `activeStudents` is distinct students, not attempts. */
export type WeeklyRow = {
  weekStart: string
  signups: number
  activeStudents: number
  attempts: number
}

/**
 * One signup cohort, counted at each step of the funnel.
 *
 * The steps are cumulative and each is a subset of the one before, so the shape
 * of the drop-off is readable straight down the row — which is how the day-1
 * to day-2 cliff became visible rather than being inferred.
 */
export type CohortRow = {
  cohort: string        // YYYY-MM of signup
  signedUp: number
  practised: number     // answered at least one question
  engaged: number       // answered ENGAGED_THRESHOLD or more
  returned: number      // came back on a second distinct day
  retained: number      // still answering 28+ days after signing up
}

export type EmailFunnelRow = {
  channel: string
  sends: number
  clicks: number
  students: number
  /**
   * Null until there are enough sends for a rate to mean anything. At 12 sends,
   * a 10%-clicking email shows zero clicks 28% of the time — printing "0%"
   * invites a conclusion the sample cannot support. See MIN_SENDS_FOR_RATE.
   */
  clickRate: number | null
}

/** A first day of six or more questions — the bar most signups actually clear. */
export const ENGAGED_THRESHOLD = 6

/**
 * Below this, a click rate is not reported at all.
 *
 * Chosen from the failure it prevents rather than convention: P(0 clicks) at a
 * healthy 10% rate is 0.9^n, which is 28% at n=12 and still 12% at n=20. Only
 * past ~100 does a zero become genuinely surprising, and the number here is the
 * point at which a printed percentage stops being actively misleading.
 */
export const MIN_SENDS_FOR_RATE = 30

export type UsageReport = {
  generatedAt: string
  totals: {
    students: number
    /**
     * Students who currently HAVE premium access, via `isPaidStudent` — the
     * same rule the app gates features on, rather than a second definition.
     *
     * NOT the same as customers. Manual grants, comped accounts and test
     * checkouts all land here and are indistinguishable from purchases: the
     * exam-pass branch of the Stripe webhook records neither a customer id nor
     * a subscription id, so a real one-off purchase looks exactly like an
     * account someone set to paid by hand. Nothing in the schema records HOW
     * access was granted. Hence `conversions` below.
     */
    withPremiumAccess: number
    /**
     * Purchases seen by the webhook since conversion tracking was added
     * (2026-09-02). Trustworthy, but only forward-looking — it cannot
     * distinguish the grants that predate it, which is why both are shown.
     */
    conversions: number
    attempts: number
    /** Distinct students with an attempt in the last 7 days. */
    activeLast7: number
    /** The headline: share of all students who ever came back on a second day. */
    everReturned: number
    everReturnedRate: number
  }
  weekly: WeeklyRow[]
  cohorts: CohortRow[]
  email: EmailFunnelRow[]
}

/** UTC calendar date of an instant — the unit "came back on another day" counts. */
const dayKey = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const monthKey = (ms: number) => new Date(ms).toISOString().slice(0, 7)
const weekKey = (ms: number) => new Date(mondayOf(ms)).toISOString().slice(0, 10)

export function computeUsage(input: {
  students: UsageStudent[]
  attempts: UsageAttempt[]
  sends: { channel: string; rows: UsageSend[] }[]
  /** Count of `subscription_started` analytics events. */
  conversions?: number
  now?: number
  weeks?: number
}): UsageReport {
  const now = input.now ?? Date.now()
  const weeksBack = input.weeks ?? 8

  // ── Per-student attempt summary ──────────────────────────────────────────────
  const byStudent = new Map<string, { count: number; days: Set<string>; last: number }>()
  for (const a of input.attempts) {
    const t = Date.parse(a.attempted_at)
    if (!Number.isFinite(t)) continue
    let s = byStudent.get(a.student_id)
    if (!s) { s = { count: 0, days: new Set(), last: 0 }; byStudent.set(a.student_id, s) }
    s.count++
    s.days.add(dayKey(t))
    if (t > s.last) s.last = t
  }

  // ── Weekly activity ─────────────────────────────────────────────────────────
  const weekStarts: string[] = []
  for (let i = weeksBack - 1; i >= 0; i--) weekStarts.push(weekKey(now - i * 7 * DAY))

  const signupsByWeek = new Map<string, number>()
  for (const s of input.students) {
    const t = Date.parse(s.created_at)
    if (Number.isFinite(t)) signupsByWeek.set(weekKey(t), (signupsByWeek.get(weekKey(t)) ?? 0) + 1)
  }

  const attemptsByWeek = new Map<string, number>()
  const activeByWeek = new Map<string, Set<string>>()
  for (const a of input.attempts) {
    const t = Date.parse(a.attempted_at)
    if (!Number.isFinite(t)) continue
    const w = weekKey(t)
    attemptsByWeek.set(w, (attemptsByWeek.get(w) ?? 0) + 1)
    if (!activeByWeek.has(w)) activeByWeek.set(w, new Set())
    activeByWeek.get(w)!.add(a.student_id)
  }

  const weekly: WeeklyRow[] = weekStarts.map(w => ({
    weekStart: w,
    signups: signupsByWeek.get(w) ?? 0,
    activeStudents: activeByWeek.get(w)?.size ?? 0,
    attempts: attemptsByWeek.get(w) ?? 0,
  }))

  // ── Signup cohorts ──────────────────────────────────────────────────────────
  const cohortMap = new Map<string, CohortRow>()
  for (const s of input.students) {
    const created = Date.parse(s.created_at)
    if (!Number.isFinite(created)) continue
    const key = monthKey(created)
    let row = cohortMap.get(key)
    if (!row) {
      row = { cohort: key, signedUp: 0, practised: 0, engaged: 0, returned: 0, retained: 0 }
      cohortMap.set(key, row)
    }
    row.signedUp++

    const a = byStudent.get(s.id)
    if (!a) continue
    row.practised++
    if (a.count >= ENGAGED_THRESHOLD) row.engaged++
    if (a.days.size >= 2) row.returned++
    // Measured from THEIR signup, not a fixed date, so a cohort is never
    // penalised for being recent — a student who joined last week simply has
    // not had 28 days yet and is not counted either way.
    if (a.last - created >= 28 * DAY) row.retained++
  }
  const cohorts = [...cohortMap.values()].sort((a, b) => a.cohort.localeCompare(b.cohort))

  // ── Email ───────────────────────────────────────────────────────────────────
  const email: EmailFunnelRow[] = input.sends.map(({ channel, rows }) => {
    const clicks = rows.filter(r => r.clicked_at).length
    return {
      channel,
      sends: rows.length,
      clicks,
      students: new Set(rows.map(r => r.student_id)).size,
      clickRate: rows.length >= MIN_SENDS_FOR_RATE ? clicks / rows.length : null,
    }
  })

  // ── Totals ──────────────────────────────────────────────────────────────────
  const weekAgo = now - 7 * DAY
  const activeLast7 = new Set(
    input.attempts
      .filter(a => { const t = Date.parse(a.attempted_at); return Number.isFinite(t) && t >= weekAgo })
      .map(a => a.student_id)
  ).size
  const everReturned = [...byStudent.values()].filter(s => s.days.size >= 2).length

  return {
    generatedAt: new Date(now).toISOString(),
    totals: {
      students: input.students.length,
      // Routed through isPaidStudent rather than re-checking the tier column.
      // A bare `subscription_tier === 'paid'` also counts a student whose
      // paid_until is null or in the past — someone the app itself treats as
      // free — which overstated this figure before.
      withPremiumAccess: input.students.filter(s => isPaidStudent({
        subscription_tier: s.subscription_tier === 'paid' ? 'paid' : 'free',
        paid_until: s.paid_until ?? null,
      })).length,
      conversions: input.conversions ?? 0,
      attempts: input.attempts.length,
      activeLast7,
      everReturned,
      everReturnedRate: input.students.length > 0 ? everReturned / input.students.length : 0,
    },
    weekly,
    cohorts,
    email,
  }
}
