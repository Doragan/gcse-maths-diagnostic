/**
 * Single source of truth for whether a student has paid ("premium") access.
 *
 * Access is a UNION of two independent grants:
 *   1. Personal grant  — the student bought a plan (subscription_tier 'paid'
 *                        with a future paid_until).
 *   2. Class grant     — the student belongs to a teacher's class that covers
 *                        premium features (Phase 2 — not yet wired up).
 *
 * Defining access as `class OR personal` means an already-paid student who
 * later joins a class never loses anything: while class-covered their personal
 * grant is PAUSED (paid_until set to null, remaining time banked in
 * paid_remaining_seconds — see the class join/leave handlers in Phase 2), so
 * the personal side reads false but the class side keeps them premium. When
 * they leave the class their banked time resumes.
 *
 * Keep ALL premium checks routed through this helper so that when classes ship
 * we flip one function instead of editing every call site.
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
