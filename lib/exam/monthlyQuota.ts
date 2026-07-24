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
    // Still advance the counter (harmless bookkeeping), but never block.
    return { allowed: true, remaining: null, period, usedThisPeriod, next }
  }
  const remaining = Math.max(0, limit - usedThisPeriod)
  return { allowed: remaining > 0, remaining, period, usedThisPeriod, next }
}
