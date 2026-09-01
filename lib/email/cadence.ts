/**
 * How often a student may receive the re-engagement email.
 *
 * History: the cap was one per student for life, enforced by a
 * `unique(student_id)` index. That was sized for a failure this product turns
 * out not to have. The measured behaviour (2026-09-01, 56 students) is that a
 * student does one solid session — 38 of 56 answered 6+ questions — and then
 * never returns, with only 10 ever coming back on a second day. One email,
 * once, cannot address that.
 *
 * It became a flat fortnightly cadence, and a flat cadence has the opposite
 * problem: a student who stays lapsed and never unsubscribes receives ~26
 * emails a year. On a domain whose reputation is already fragile, that buys
 * spam complaints rather than returns.
 *
 * So the cadence TAPERS. Each unanswered email doubles the wait before the
 * next, and after MAX_SENDS_PER_LAPSE the sequence stops:
 *
 *   1st   as soon as they qualify as lapsed
 *   2nd   14 days later
 *   3rd   28 days after that
 *   4th   56 days after that
 *   5th  112 days after that
 *   —     then silence
 *
 * Five emails over roughly seven months, instead of fifteen. The shape encodes
 * a belief that is easy to state and easy to check: someone who ignored the
 * last three is less likely to answer the fourth, so asking sooner is both less
 * likely to work and more likely to annoy.
 *
 * ── The counter resets when they come back ─────────────────────────────────
 * Sends are only counted if they happened AFTER the student's most recent
 * attempt. A student who returns, practises, and later lapses again starts the
 * sequence from the beginning — their attempts move past the old sends, so the
 * count falls to zero on its own. Without that, someone who came back once
 * would be permanently penalised by a history that no longer describes them.
 * It needs no extra state: `last_attempt` already comes from the selector.
 *
 * ── Rolling windows, not calendar buckets ──────────────────────────────────
 * Every wait here is measured from the previous send, never from a bucket
 * boundary. A fortnight-numbered bucket is tempting because it makes the cap a
 * unique index, and wrong for the reason the cap exists: a boundary permits
 * sends on consecutive days. (The weekly nudge's `week_start` bucket is fine by
 * contrast — that email is ABOUT a named week; this one is about elapsed
 * silence, so it has to measure from the last contact.)
 *
 * The consequence is that the cadence cannot be an index, so it lives in the
 * cron. `unique (student_id, sent_on)` still backs it at the database, catching
 * the realistic race: a same-day double run.
 */

/** Wait before the SECOND email. Each subsequent gap doubles. */
export const BASE_COOLDOWN_DAYS = 14

/** Emails per lapse before the sequence stops. Reset by any new attempt. */
export const MAX_SENDS_PER_LAPSE = 5

const DAY = 86400000

/**
 * Days to wait after the nth send before the next one.
 * `priorSends` counts emails already sent during this lapse.
 */
export function cooldownDaysAfter(
  priorSends: number,
  baseDays: number = BASE_COOLDOWN_DAYS,
): number {
  if (priorSends <= 0) return 0
  // Guard the exponent as well as the base: a misconfigured base of 0 must not
  // collapse the wait to nothing and let the cron mail daily.
  return Math.max(1, baseDays) * 2 ** (priorSends - 1)
}

export type ContactState = {
  /** Emails sent since the student's last attempt. */
  priorSends: number
  /** True when the next email is due now. */
  due: boolean
  /** Set when not due and not exhausted: when it will be. */
  nextDueAt: Date | null
  /** True once the sequence has run out; only a new attempt reopens it. */
  exhausted: boolean
}

/**
 * Where a student sits in the taper.
 *
 * Pure, with `now` injected, so the cron and the dry-run script can agree and
 * the whole schedule is testable without a database.
 */
export function contactState(opts: {
  now: number
  /** Timestamp of the student's most recent attempt. */
  lastAttempt: number
  /** Timestamps of every re-engagement email sent to this student, any order. */
  sends: number[]
  baseDays?: number
  maxSends?: number
}): ContactState {
  const { now, lastAttempt, sends } = opts
  const baseDays = opts.baseDays ?? BASE_COOLDOWN_DAYS
  const maxSends = opts.maxSends ?? MAX_SENDS_PER_LAPSE

  // Only sends that postdate their last attempt describe the CURRENT lapse.
  const thisLapse = sends.filter(t => Number.isFinite(t) && t > lastAttempt)
  const priorSends = thisLapse.length

  if (priorSends >= Math.max(1, maxSends)) {
    return { priorSends, due: false, nextDueAt: null, exhausted: true }
  }
  if (priorSends === 0) {
    // Never contacted during this lapse. The selector's own lapsed threshold is
    // the only gate on the first email.
    return { priorSends, due: true, nextDueAt: null, exhausted: false }
  }

  const lastSend = Math.max(...thisLapse)
  const dueAt = lastSend + cooldownDaysAfter(priorSends, baseDays) * DAY
  return {
    priorSends,
    due: now >= dueAt,
    nextDueAt: now >= dueAt ? null : new Date(dueAt),
    exhausted: false,
  }
}

/**
 * Narrows a candidate list to those actually due, given each student's send
 * history.
 *
 * Applied BEFORE any batch slice: with a cap welded into the SQL selector this
 * ordering is invisible, but once the cohort contains not-yet-due students, a
 * `.slice(BATCH_LIMIT)` taken first would let them occupy the batch on every
 * run and starve someone who has never been reached.
 */
export function dueForContact<T extends { student_id: string; last_attempt: string }>(
  candidates: T[],
  sendsByStudent: Map<string, number[]>,
  now: number = Date.now(),
  baseDays: number = BASE_COOLDOWN_DAYS,
  maxSends: number = MAX_SENDS_PER_LAPSE,
): T[] {
  return candidates.filter(c => contactState({
    now,
    lastAttempt: Date.parse(c.last_attempt),
    sends: sendsByStudent.get(c.student_id) ?? [],
    baseDays,
    maxSends,
  }).due)
}

/** UTC calendar date of an instant, for the same-day uniqueness key. */
export function sentOnDate(ms: number = Date.now()): string {
  return new Date(ms).toISOString().slice(0, 10)
}
