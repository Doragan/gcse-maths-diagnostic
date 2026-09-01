/**
 * The weekly practice goal, and the streak built on it.
 *
 * Replaces a consecutive-DAYS streak. The daily version encoded a claim the
 * product can't support: that revision is a daily habit. A student doing two
 * solid sessions a week is doing well, but a daily chain marks them as failing
 * and — worse — breaks permanently the first busy day, so the counter is dead
 * for exactly the students it was meant to pull back. A weekly quota fits how
 * the app is actually used, and a missed week costs one week, not everything.
 *
 * Deliberately pure and free of browser APIs (`now` is injected rather than
 * read) so a cron job can compute the same number the dashboard shows — the
 * re-engagement email's best hook is "you're 3 off your goal", and a cron can't
 * render a dashboard. See docs/audit/13-pwa-push-plan.md, constraint 2.
 */

/** Questions per week. One a day is too many; five is not a week's work. */
export const WEEKLY_GOAL = 10

const WEEK_MS = 7 * 86400000

export type WeeklyGoalProgress = {
  /** Attempts inside the current week. Not capped at the goal — beating it should show. */
  answered: number
  goal: number
  met: boolean
  /**
   * Consecutive weeks the goal was met. The current week counts only once it is
   * met, but a not-yet-met current week does NOT reset the count — otherwise
   * every streak would read 0 each Monday morning, which is the failure mode of
   * the daily version in slower motion.
   */
  streak: number
}

/**
 * UTC midnight on the Monday of the week containing `ms`.
 *
 * UTC throughout, matching the rest of the dashboard's date handling. It also
 * buys correctness here: UTC has no DST, so a week is exactly WEEK_MS and the
 * streak walk can step back by subtraction. In local time the two clock-change
 * weekends of a British year are 23 and 25 hours long, and stepping by a fixed
 * week would drift across a boundary.
 *
 * The residual cost is that a student practising between midnight and 1am BST
 * is credited to the previous day — which lands on the wrong WEEK only if that
 * happens in the small hours of a Monday. A daily streak faced that risk every
 * night; here it is one boundary in seven.
 */
export function mondayOf(ms: number): number {
  const d = new Date(ms)
  const daysSinceMonday = (d.getUTCDay() + 6) % 7 // getUTCDay: 0=Sunday
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - daysSinceMonday * 86400000
}

export function computeWeeklyGoal(
  attempts: { attempted_at: string }[],
  now: number = Date.now(),
  goal: number = WEEKLY_GOAL,
): WeeklyGoalProgress {
  const currentWeek = mondayOf(now)

  const perWeek = new Map<number, number>()
  for (const a of attempts) {
    const t = Date.parse(a.attempted_at)
    // Skip unparseable timestamps and anything dated in the future: a bad clock
    // on one row should not be able to manufacture a streak.
    if (!Number.isFinite(t) || t > now) continue
    const week = mondayOf(t)
    perWeek.set(week, (perWeek.get(week) ?? 0) + 1)
  }

  const answered = perWeek.get(currentWeek) ?? 0
  const met = answered >= goal

  let streak = 0
  for (
    let week = met ? currentWeek : currentWeek - WEEK_MS;
    (perWeek.get(week) ?? 0) >= goal;
    week -= WEEK_MS
  ) streak++

  return { answered, goal, met, streak }
}

/** How many more questions this week to hit the goal. 0 once met. */
export function questionsToGoal(progress: WeeklyGoalProgress): number {
  return Math.max(0, progress.goal - progress.answered)
}

/**
 * The current week's Monday as an ISO date (`YYYY-MM-DD`), for anything that
 * needs to name a week rather than measure one — the nudge cron's ledger key,
 * for instance. Derived from `mondayOf`, so a week means the same thing in the
 * database as it does on the dashboard.
 */
export function weekStartDate(ms: number = Date.now()): string {
  return new Date(mondayOf(ms)).toISOString().slice(0, 10)
}
