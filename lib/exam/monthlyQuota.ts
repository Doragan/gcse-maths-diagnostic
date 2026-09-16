/**
 * Monthly mini-exam allowance — the rule that free students get a fixed number
 * of self-serve mini-exams per calendar month, and paid students get unlimited.
 *
 * Pure and DB-free so the period-rollover and limit logic can be unit-tested on
 * its own; the server route (app/api/exam/quota) supplies the stored counter +
 * the paid flag and persists whatever `next` this returns. The counter is
 * enforced server-side because a student can read but never write their own
 * `students` row (the SEC-CRIT-1 lockdown REVOKEd UPDATE), so a client could
 * otherwise just reset it.
 */

export const FREE_MINI_EXAMS_PER_MONTH = 1

/** The calendar-month bucket a moment falls in, as `YYYY-MM` in UK local time. */
export function examPeriodOf(now: Date): string {
  // Europe/London (not UTC) so the reset lands at UK midnight on the 1st, which
  // is what a UK student experiences as "a new month".
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', year: 'numeric', month: '2-digit',
  }).formatToParts(now)
  const y = parts.find(p => p.type === 'year')!.value
  const m = parts.find(p => p.type === 'month')!.value
  return `${y}-${m}`
}

/** The stored counter for one student: which month it counts, and how many used. */
export type QuotaState = { period: string | null; used: number }

export type QuotaDecision = {
  /** Whether a generation is allowed right now (always true when paid). */
  allowed: boolean
  /**
   * Generations left BEFORE this one is consumed; null = unlimited (paid). A
   * peek reads this to show "N left"; a consume checks `allowed`.
   */
  remaining: number | null
  /** The current period, after any stale-month reset. */
  period: string
  /** Used-count within the current period, after the stale-month reset. */
  usedThisPeriod: number
  /** What to persist IF this generation is consumed (period rolled + used+1). */
  next: QuotaState
  /**
   * Whether `next` should actually be written. FALSE for a paid or
   * school-covered student, because their generation consumes nothing.
   *
   * It used to be written for everyone, described as harmless bookkeeping, and
   * it was harmless while the only way to be paid was to pay personally. A
   * school grant broke that. The free allowance is one a month, so a covered
   * student who ran a single mini-exam and then lost the grant mid-month had
   * none left, while a student who was never covered still had theirs: briefly
   * benefiting from a school grant left a pupil WORSE OFF than never having had
   * one. That is not explicable to a parent, let alone to the school.
   *
   * This counter has exactly one reader — the free limit itself — so it is a
   * quota device, not a record, and a quota device should only charge for what
   * it actually rations. Real usage is not lost either way: every mini-exam
   * writes an exam_sessions row regardless.
   *
   * Skipping the write entirely, period included, is safe: a counter left from
   * an earlier month already reads as zero above, so a stale period on a covered
   * student's row resolves correctly the moment they revert to free.
   */
  persist: boolean
}

/**
 * Resolve the allowance for one student at `now`. Does not mutate — the route
 * decides whether to persist `next`. A stored counter from an earlier month is
 * treated as zero (the month rolled over), which is how the monthly reset
 * happens without a scheduled job.
 */
export function resolveMiniExamQuota(
  state: QuotaState,
  now: Date,
  isPaid: boolean,
  limit: number = FREE_MINI_EXAMS_PER_MONTH,
): QuotaDecision {
  const period = examPeriodOf(now)
  // A counter left over from a previous month no longer applies.
  const usedThisPeriod = state.period === period ? Math.max(0, state.used) : 0
  const next: QuotaState = { period, used: usedThisPeriod + 1 }

  if (isPaid) {
    // Never blocked, and nothing consumed — so nothing to write. See `persist`.
    return { allowed: true, remaining: null, period, usedThisPeriod, next, persist: false }
  }
  const remaining = Math.max(0, limit - usedThisPeriod)
  return { allowed: remaining > 0, remaining, period, usedThisPeriod, next, persist: true }
}
