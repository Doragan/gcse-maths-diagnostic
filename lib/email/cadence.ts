/**
 * How often a student may receive the same email.
 *
 * The re-engagement email originally allowed ONE per student for life, enforced
 * by a `unique(student_id)` index. That was sized for a failure this product
 * turns out not to have: "they drifted off, remind them once". The measured
 * behaviour (2026-09-01, 56 students) is that a student does one solid session
 * — 38 of 56 answered 6+ questions — and then never returns, with only 10 ever
 * coming back on a second day. Against that, one email sent once is a single
 * attempt at a conversation that then never happens again.
 *
 * ── Rolling window, not a calendar bucket ───────────────────────────────────
 * "One per fortnight" is implemented as "no send within the last 14 days", NOT
 * as a fortnight-numbered bucket like the weekly nudge's `week_start` key.
 *
 * The bucket is tempting because it makes the cap a unique index. It is also
 * wrong here: a bucket boundary permits a send on the last day of one fortnight
 * and the first day of the next — two emails 24 hours apart, which is precisely
 * the thing the cap exists to prevent. A weekly bucket is defensible for the
 * nudge because that email is ABOUT a named week; this one is about elapsed
 * silence, so the window has to be measured from the last contact.
 *
 * The consequence is that the cadence can't be an index, so it lives in the
 * cron. `unique (student_id, sent_on)` still backs it up at the database, which
 * catches the realistic race — a same-day double run — while the 14-day rule is
 * applied when selecting who to send to.
 */

/** Minimum days between two re-engagement emails to the same student. */
export const REENGAGEMENT_COOLDOWN_DAYS = 14

/**
 * The instant before which a previous send no longer blocks a new one.
 * A student whose most recent send is at or after this is still cooling down.
 */
export function cooldownCutoff(now: number, days: number = REENGAGEMENT_COOLDOWN_DAYS): Date {
  return new Date(now - Math.max(1, days) * 86400000)
}

/**
 * Removes students contacted within the cooldown from a candidate list.
 *
 * Applied BEFORE any batch slice: with the cap welded into the SQL selector this
 * ordering is invisible, but once the cohort includes already-contacted students
 * a `.slice(BATCH_LIMIT)` taken first would let them occupy the batch on every
 * run and starve someone never reached.
 */
export function dueForContact<T extends { student_id: string }>(
  candidates: T[],
  cooledDownStudentIds: Iterable<string>,
): T[] {
  const blocked = cooledDownStudentIds instanceof Set
    ? cooledDownStudentIds
    : new Set(cooledDownStudentIds)
  return candidates.filter(c => !blocked.has(c.student_id))
}

/** UTC calendar date of an instant, for the same-day uniqueness key. */
export function sentOnDate(ms: number = Date.now()): string {
  return new Date(ms).toISOString().slice(0, 10)
}
