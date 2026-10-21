/**
 * Which class sessions are due for deletion.
 *
 * The join page tells a child, in the only sentence about their data they will
 * read: "it is all deleted at the end of the day." This is that sentence,
 * expressed as a pure function. The route (app/api/cron/session-sweep) supplies
 * the rows and performs the deletion; nothing here does any IO.
 *
 * ── Why this is NOT dry-run by default, when lib/retention.ts is ────────────
 *
 * The retention rule deletes a child's whole account and a year of their work,
 * so every judgement there is made in the direction of NOT deleting: a wrongly
 * kept account is a notice breach fixable next week, a wrongly deleted one is
 * gone for good. Those are not the same mistake.
 *
 * Here the asymmetry is REVERSED, and it matters that the code reflects that
 * rather than copying the shape of the other rule. What this deletes is a first
 * name and a few hours of right-or-wrong marks that the product has already
 * promised to delete and that earn no mastery, so:
 *
 *   * NOT deleting is the harm. A session kept past its day makes the join page
 *     false, which is the exact failure docs/audit/21 keeps finding — copy that
 *     says one thing while the system does another. A dry-run default would
 *     mean the promise is untrue until somebody remembers to flip a switch.
 *   * Deleting costs a teacher a view they were told would vanish, of data they
 *     were told not to rely on.
 *
 * So the sweep is armed by default. The env switch still exists, to inspect a
 * run before it acts, but it has to be set to disarm rather than to arm.
 *
 * The per-run cap stays, for the same reason it exists in the retention route:
 * if a date bug ever made every session look finished, the loss is bounded and
 * visible in the report while most of the data is still there.
 */

/**
 * How long after a session ends before its data goes.
 *
 * Not zero, for one reason: a teacher who closes a session at the end of a
 * lesson may well look at the screen for another minute, and having the table
 * empty itself under them teaches them not to trust it. An hour is long enough
 * to finish looking and far short of "the end of the day".
 *
 * ⚠ THE SCHEDULE IS DAILY, NOT HOURLY, AND THAT IS A PLATFORM LIMIT. This was
 * written for an hourly cron, which is what the grace below was sized against.
 * Vercel's Hobby plan rejects any cron that would run more than once a day —
 * the deployment fails outright — so vercel.json runs this at 22:40 UTC, which
 * is before local midnight in both GMT and BST and therefore still the same day
 * for every realistic lesson. The documents say "at the end of the same day"
 * rather than "within the hour" because of this, and they must keep matching
 * it: see the deletion sentences in app/privacy, app/dpa and the DPIA scope
 * table.
 *
 * The grace rule is kept as it is anyway. It is the right rule, it is harmless
 * at a daily cadence (anything ending before 21:40 is already past it), and it
 * is what makes moving back to hourly a one-line change to vercel.json if the
 * project is ever on a Pro plan.
 */
export const SWEEP_GRACE_MS = 60 * 60 * 1000

export type SweepCandidate = {
  id: string
  /** 'open' or 'closed'. */
  status: string
  expires_at: string
  /** When the teacher closed it, or null if they never did. */
  closed_at: string | null
}

export type SweepDecision = {
  id: string
  delete: boolean
  /** Why it was kept. Null when `delete` is true. */
  keptBecause: 'still_live' | 'within_grace' | 'unreadable_dates' | null
  /** Epoch ms when the session ended, or null if that cannot be read. */
  endedAt: number | null
}

const ms = (iso: string | null | undefined): number | null => {
  if (!iso) return null
  const t = Date.parse(iso)
  return Number.isFinite(t) ? t : null
}

/**
 * Decide one session.
 *
 * A session ends at whichever came FIRST: the teacher closing it, or its expiry
 * passing. Closing early is the teacher saying the lesson is over, so a session
 * closed at 10am is swept from 11am rather than waiting for a 2pm expiry it
 * will never reach. That is the more data-minimising reading and it matches
 * what the teacher just did.
 */
export function decideSweep(c: SweepCandidate, now: number): SweepDecision {
  const expires = ms(c.expires_at)
  const closed  = ms(c.closed_at)

  if (expires === null && closed === null) {
    // Defensive only: both columns are timestamptz, which Postgres validates,
    // so this should be unreachable. KEPT rather than deleted, and reported
    // under its own reason so a run that hits it is noticed by a person
    // instead of quietly destroying rows on the strength of a parse failure.
    return { id: c.id, delete: false, keptBecause: 'unreadable_dates', endedAt: null }
  }

  const endedAt = expires === null ? closed!
    : closed === null ? expires
    : Math.min(expires, closed)

  if (endedAt > now) {
    // Still running. A closed session always has closed_at in the past, so
    // this branch only ever holds an open one that has not expired yet.
    return { id: c.id, delete: false, keptBecause: 'still_live', endedAt }
  }
  if (now - endedAt < SWEEP_GRACE_MS) {
    return { id: c.id, delete: false, keptBecause: 'within_grace', endedAt }
  }
  return { id: c.id, delete: true, keptBecause: null, endedAt }
}

export type SweepPlan = {
  /** Sessions to delete this run, oldest first, capped. */
  due: SweepDecision[]
  /** Everything not being deleted, with the reason. */
  kept: SweepDecision[]
  /** True when the cap held some back — the next run takes them. */
  capped: boolean
}

/**
 * Plan a whole run.
 *
 * Oldest first, so a backlog drains in the order it built up and the rows that
 * have been kept longest past their promise go first.
 */
export function planSessionSweep(
  candidates: SweepCandidate[],
  now: number,
  cap: number,
): SweepPlan {
  const decisions = candidates.map(c => decideSweep(c, now))
  const allDue = decisions
    .filter(d => d.delete)
    .sort((a, b) => (a.endedAt ?? 0) - (b.endedAt ?? 0))

  return {
    due:    allDue.slice(0, Math.max(0, cap)),
    kept:   decisions.filter(d => !d.delete),
    capped: allDue.length > Math.max(0, cap),
  }
}
