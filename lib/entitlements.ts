/**
 * Single source of truth for whether a student has paid ("premium") access.
 *
 * Access is a UNION of two independent grants:
 *   1. Personal grant  — the student bought a plan (subscription_tier 'paid'
 *                        with a future paid_until).
 *   2. Class grant     — the student is in a class whose SCHOOL has an in-date
 *                        grant. Invoice-paced, set by hand. Read it with
 *                        lib/classGrant.ts and pass it in as
 *                        `activeClassMembership` below.
 *
 * Defining access as `class OR personal` means an already-paid student who
 * later joins a covered class never loses anything: their personal grant keeps
 * running, untouched, alongside the class one.
 *
 * ── A mechanism this comment used to describe, deliberately NOT built ───────
 * It used to say the personal grant was PAUSED while class-covered, with the
 * remaining time banked in `paid_remaining_seconds`. That column never existed
 * and no code ever referenced it. It is not coming:
 *
 *   1. Pausing only pays off if we own the clock, and for the recurring monthly
 *      and annual plans the clock is Stripe's. A column cannot pause a
 *      subscription; only cancelling it can.
 *   2. The exam pass expires on a fixed calendar date, so there is no
 *      per-student remainder to bank in the first place.
 *   3. It would need a write to students.paid_until on every class join and
 *      leave — a path that can fail halfway and destroy paid time, on columns
 *      the client is deliberately forbidden to write.
 *
 * The union already protects what the banking was meant to protect. A student
 * paying for something their school now covers is a refund conversation, not a
 * mechanism. See docs/audit/20-school-accounts-design.md §2.
 *
 * Keep ALL premium checks routed through this helper, so the rule has one
 * definition rather than one per call site.
 */
export type StudentEntitlementInputs = {
  subscription_tier: 'free' | 'paid'
  paid_until: string | null
  /**
   * True when the student currently belongs to a class that grants premium.
   * Undefined/false until classes exist (Phase 2). Passing it keeps every call
   * site class-ready today.
   */
  activeClassMembership?: boolean
}

/**
 * `now` (epoch ms) defaults to the real clock. Pass it from anything that
 * already reasons about a fixed point in time — reports, tests — so the answer
 * depends on that timestamp rather than on when the code happens to run.
 */
export function isPaidStudent(s: StudentEntitlementInputs, now: number = Date.now()): boolean {
  // Class grant takes precedence and is independent of the personal grant.
  if (s.activeClassMembership) return true

  // Personal grant: must be on the paid tier with an unexpired paid_until.
  return (
    s.subscription_tier === 'paid' &&
    s.paid_until != null &&
    Date.parse(s.paid_until) > now
  )
}
