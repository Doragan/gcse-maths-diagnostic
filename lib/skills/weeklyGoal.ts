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

/**
 * Distinct days that week's practice must span.
 *
 * Why the count alone was not enough: WEEKLY_GOAL is 10 and SESSION_LENGTH
 * (lib/practice/session.ts, the measured median sitting) is also 10, so a
 * typical engaged first session met the whole week's goal in ONE sitting. The
 * card then read green until Monday, and the Saturday nudge — which selects
 * students still short of the goal — had nothing to say to exactly the students
 * about to lapse. The product's one in-app retention mechanic was satisfied by
 * the behaviour that precedes the day-1-to-day-2 cliff.
 *
 * Two days is the smallest rule that makes coming back part of the goal rather
 * than a separate ask. See docs/audit/18-retention-diagnosis.md §3.
 *
 * It applies to past weeks too, so a week met in a single sitting no longer
 * counts towards a streak. That is the honest reading — the streak claims weeks
 * of returning — and it is why the streak may fall for some students once this
 * ships.
 */
export const MIN_GOAL_DAYS = 2

const WEEK_MS = 7 * 86400000

export type WeeklyGoalProgress = {
  /** Attempts inside the current week. Not capped at the goal — beating it should show. */
  answered: number
  /** Distinct UTC days inside the current week that carry at least one attempt. */
  days: number
  goal: number
  /** Distinct days required alongside the count. */
  minDays: number
  /** Both halves of the goal: enough questions, spread over enough days. */
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

/**
 * UTC midnight of the day containing `ms` — the same clock `mondayOf` uses, so
 * a day and a week can never disagree about which side of Monday an attempt
 * falls on.
 */
function startOfDay(ms: number): number {
  const d = new Date(ms)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

type WeekTally = { count: number; days: Set<number> }

export function computeWeeklyGoal(
  attempts: { attempted_at: string }[],
  now: number = Date.now(),
  goal: number = WEEKLY_GOAL,
  minDays: number = MIN_GOAL_DAYS,
): WeeklyGoalProgress {
  const currentWeek = mondayOf(now)
  // A nonsense minimum falls back to the default rather than to zero: a zero
  // would quietly restore the single-sitting goal this rule exists to replace.
  const need = Number.isFinite(minDays) && minDays >= 1 ? Math.floor(minDays) : MIN_GOAL_DAYS

  const perWeek = new Map<number, WeekTally>()
  for (const a of attempts) {
    const t = Date.parse(a.attempted_at)
    // Skip unparseable timestamps and anything dated in the future: a bad clock
    // on one row should not be able to manufacture a streak.
    if (!Number.isFinite(t) || t > now) continue
    const week = mondayOf(t)
    let tally = perWeek.get(week)
    if (!tally) { tally = { count: 0, days: new Set() }; perWeek.set(week, tally) }
    tally.count++
    tally.days.add(startOfDay(t))
  }

  /** Both halves of the goal, applied identically to every week. */
  const weekMet = (tally: WeekTally | undefined): boolean =>
    (tally?.count ?? 0) >= goal && (tally?.days.size ?? 0) >= need

  const current = perWeek.get(currentWeek)
  const answered = current?.count ?? 0
  const days = current?.days.size ?? 0
  const met = weekMet(current)

  let streak = 0
  for (
    let week = met ? currentWeek : currentWeek - WEEK_MS;
    weekMet(perWeek.get(week));
    week -= WEEK_MS
  ) streak++

  return { answered, days, goal, minDays: need, met, streak }
}

/** How many more questions this week to hit the goal. 0 once the count is reached. */
export function questionsToGoal(progress: WeeklyGoalProgress): number {
  return Math.max(0, progress.goal - progress.answered)
}

/**
 * How many more separate days this week to hit the goal. 0 once spread enough.
 *
 * Kept separate from questionsToGoal because the two shortfalls need different
 * words: "3 questions to go" is a nudge to carry on now, "come back tomorrow"
 * is a nudge to stop and return — and a student can be short of either, or both.
 */
export function daysToGoal(progress: WeeklyGoalProgress): number {
  return Math.max(0, progress.minDays - progress.days)
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
