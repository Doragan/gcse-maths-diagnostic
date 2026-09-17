/**
 * Which inactive student accounts are due for deletion.
 *
 * The privacy notice promises: "if you do not sign in or practise for 1 year, we
 * delete the account and everything in it." This is that promise, expressed as a
 * pure function so the rule can be tested exhaustively without a database — and
 * it is the rule that matters, because the action it authorises is irreversible
 * and lands on children's data.
 *
 * The route (app/api/cron/retention) supplies the rows and performs the
 * deletion. Nothing here does any IO, so every branch below is reachable from a
 * test.
 *
 * ── Deliberately conservative ───────────────────────────────────────────────
 * Every judgement call here is made in the direction of NOT deleting. A wrongly
 * kept account is a privacy-notice breach measured in weeks and fixable by the
 * next run; a wrongly deleted one is a child's work gone for good. Those are not
 * the same mistake and are not weighted the same.
 */

/** One year, in milliseconds. Leap years are irrelevant at this granularity. */
export const RETENTION_MS = 365 * 24 * 60 * 60 * 1000

export type RetentionCandidate = {
  /** students.id, which is also the auth user id. */
  id: string
  /** auth.users.created_at — the floor for "last activity". */
  created_at: string
  /** auth.users.last_sign_in_at. Null for an account that never signed in. */
  last_sign_in_at: string | null
  /** Most recent practice_attempts.attempted_at, or null if they never practised. */
  last_attempt_at: string | null
  /** students.subscription_tier. */
  subscription_tier?: string | null
  /** students.paid_until. */
  paid_until?: string | null
}

export type RetentionDecision = {
  id: string
  /** Epoch ms of the most recent thing we count as activity. */
  lastActivity: number
  delete: boolean
  /** Why it was kept. Null when `delete` is true. */
  keptBecause: 'recent_activity' | 'paying' | 'unreadable_dates' | null
}

const ms = (iso: string | null | undefined): number | null => {
  if (!iso) return null
  const t = Date.parse(iso)
  return Number.isFinite(t) ? t : null
}

/**
 * Decide one account.
 *
 * Activity is the LATEST of: signing in, and practising. Signing in counts even
 * with no practice — somebody who logs in to look at their progress has not
 * abandoned the account. `created_at` is the floor, so a brand-new account that
 * has never signed in (which happens: the students row is written at signup,
 * before email confirmation) is dated from its creation rather than treated as
 * infinitely old.
 *
 * Two things stop a deletion outright:
 *
 *   PAYING — an account with an unexpired `paid_until` is never deleted,
 *   however quiet. Deleting someone's data while taking their money would be
 *   indefensible, and a dormant monthly subscriber is exactly the person this
 *   would otherwise catch. The privacy notice's promise is about abandonment,
 *   and a live subscription is evidence against abandonment.
 *
 *   UNREADABLE DATES — if no date on the row parses, we do not know when they
 *   were last here, and "unknown" must never resolve to "delete".
 *
 * Note what is NOT a reason to keep an account: being in a class, or that class
 * belonging to a paying school. A pupil who has not signed in or practised for a
 * year has abandoned the account whoever is paying for the seat, and their
 * membership row is not their data alone to be kept for someone else's benefit.
 */
export function decideRetention(
  c: RetentionCandidate,
  now: number,
  retentionMs: number = RETENTION_MS,
): RetentionDecision {
  const created = ms(c.created_at)
  const signedIn = ms(c.last_sign_in_at)
  const attempted = ms(c.last_attempt_at)

  const known = [created, signedIn, attempted].filter((t): t is number => t !== null)
  if (known.length === 0) {
    return { id: c.id, lastActivity: 0, delete: false, keptBecause: 'unreadable_dates' }
  }

  const lastActivity = Math.max(...known)

  const paidUntil = ms(c.paid_until)
  if (c.subscription_tier === 'paid' && paidUntil !== null && paidUntil > now) {
    return { id: c.id, lastActivity, delete: false, keptBecause: 'paying' }
  }

  // `<=`, not `<`: at exactly one year the account is KEPT, and only the
  // millisecond after it qualifies. The difference is meaningless in practice
  // and the direction is the point — a boundary on an irreversible action reads
  // in favour of the account.
  if (now - lastActivity <= retentionMs) {
    return { id: c.id, lastActivity, delete: false, keptBecause: 'recent_activity' }
  }

  return { id: c.id, lastActivity, delete: true, keptBecause: null }
}

export type RetentionPlan = {
  decisions: RetentionDecision[]
  /** Ids to delete, already capped. */
  toDelete: string[]
  /** How many qualified before the cap was applied. */
  eligible: number
  /** True when the cap held some back — they go next run. */
  capped: boolean
}

/**
 * Plan a run over many accounts.
 *
 * `cap` is a blast radius, not a performance limit. If a date bug or a bad query
 * ever makes everyone look inactive, the damage is bounded by this number and
 * shows up in the run's report while most of the data is still there. A daily
 * schedule drains any genuine backlog within days, so the cap costs nothing in
 * the case where the logic is right.
 *
 * Oldest-first, so a real backlog is worked through in the order the promise was
 * made rather than in whatever order the database returned rows.
 */
export function planRetention(
  candidates: RetentionCandidate[],
  now: number,
  cap: number,
  retentionMs: number = RETENTION_MS,
): RetentionPlan {
  const decisions = candidates.map(c => decideRetention(c, now, retentionMs))
  const due = decisions
    .filter(d => d.delete)
    .sort((a, b) => a.lastActivity - b.lastActivity)

  return {
    decisions,
    toDelete: due.slice(0, Math.max(0, cap)).map(d => d.id),
    eligible: due.length,
    capped: due.length > Math.max(0, cap),
  }
}
