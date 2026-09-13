import { describe, it, expect } from 'vitest'
import {
  computeWeeklyGoal, questionsToGoal, daysToGoal, weekStartDate,
  WEEKLY_GOAL, MIN_GOAL_DAYS,
} from './weeklyGoal'

// Wednesday 2026-09-02, midday UTC. Its week runs Mon 2026-08-31 → Sun 2026-09-06.
const WED = Date.UTC(2026, 8, 2, 12, 0, 0)
const DAY = 86400000
const WEEK = 7 * DAY

/** n attempts, all at `ms` — i.e. all on ONE day. */
const on = (ms: number, n: number) =>
  Array.from({ length: n }, () => ({ attempted_at: new Date(ms).toISOString() }))

/**
 * A week that MEETS the goal: the full count, spread over the minimum days.
 *
 * The second day is the day BEFORE `from`, never after: `from` doubles as
 * `now` in most of these tests, and an attempt dated in the future is
 * discarded by design — so a "tomorrow" row could never supply the spread.
 * `from` must therefore be far enough into its week that `from - DAY` stays
 * inside it (every caller uses a Wednesday).
 */
const metWeek = (from: number) => [...on(from - DAY, 1), ...on(from, WEEKLY_GOAL - 1)]

describe('computeWeeklyGoal — the current week', () => {
  it('counts only attempts inside the current week', () => {
    const p = computeWeeklyGoal([...on(WED, 4), ...on(WED - WEEK, 9)], WED)
    expect(p.answered).toBe(4)
    expect(p.met).toBe(false)
  })

  it('needs the count AND the spread: ten in one sitting is not a met week', () => {
    // The rule this module exists for. A session is 10 questions, so the old
    // count-only goal was satisfied by a single first sitting.
    const oneSitting = computeWeeklyGoal(on(WED, WEEKLY_GOAL), WED)
    expect(oneSitting.answered).toBe(WEEKLY_GOAL)
    expect(oneSitting.days).toBe(1)
    expect(oneSitting.met).toBe(false)

    const twoDays = computeWeeklyGoal(metWeek(WED), WED)
    expect(twoDays.answered).toBe(WEEKLY_GOAL)
    expect(twoDays.days).toBe(2)
    expect(twoDays.met).toBe(true)
  })

  it('needs the count as well as the days: nine over two days is not a met week', () => {
    const p = computeWeeklyGoal([...on(WED, 8), ...on(WED - DAY, 1)], WED)
    expect(p.answered).toBe(9)
    expect(p.days).toBe(2)
    expect(p.met).toBe(false)
  })

  it('meets the goal at exactly 10, not 9, once the days are there', () => {
    expect(computeWeeklyGoal([...on(WED, 8), ...on(WED - DAY, 1)], WED).met).toBe(false)
    expect(computeWeeklyGoal([...on(WED, 9), ...on(WED - DAY, 1)], WED).met).toBe(true)
  })

  it('counts days, not sittings: two sessions on one day is still one day', () => {
    const morning = Date.UTC(2026, 8, 2, 8, 0, 0)
    const evening = Date.UTC(2026, 8, 2, 20, 0, 0)
    const p = computeWeeklyGoal([...on(morning, 6), ...on(evening, 6)], WED + DAY)
    expect(p.answered).toBe(12)
    expect(p.days).toBe(1)
    expect(p.met).toBe(false)
  })

  it('reports overshoot honestly rather than capping at the goal', () => {
    expect(computeWeeklyGoal(on(WED, 14), WED).answered).toBe(14)
  })

  it('includes Monday 00:00 and Sunday 23:59 — the whole week, both ends', () => {
    const monday = Date.UTC(2026, 7, 31, 0, 0, 0)
    const sunday = Date.UTC(2026, 8, 6, 23, 59, 59)
    const p = computeWeeklyGoal([...on(monday, 1), ...on(sunday, 1)], sunday)
    expect(p.answered).toBe(2)
    expect(p.days).toBe(2)
  })

  it('excludes the Sunday before — the week boundary is Monday, not a rolling 7 days', () => {
    const sundayBefore = Date.UTC(2026, 7, 30, 23, 59, 59)
    expect(computeWeeklyGoal(on(sundayBefore, 5), WED).answered).toBe(0)
  })

  it('is empty, not broken, for a student with no attempts', () => {
    expect(computeWeeklyGoal([], WED)).toEqual({
      answered: 0, days: 0, goal: 10, minDays: MIN_GOAL_DAYS, met: false, streak: 0,
    })
  })

  it('falls back to the default rather than to zero on a nonsense minimum', () => {
    // A zero minimum would quietly restore the single-sitting goal.
    for (const bad of [0, -1, NaN]) {
      expect(computeWeeklyGoal(on(WED, WEEKLY_GOAL), WED, WEEKLY_GOAL, bad).met).toBe(false)
    }
  })
})

describe('computeWeeklyGoal — the streak', () => {
  const fullWeeks = (n: number, from = WED) =>
    Array.from({ length: n }, (_, i) => metWeek(from - i * WEEK)).flat()

  it('counts the current week once the goal is met', () => {
    expect(computeWeeklyGoal(fullWeeks(1), WED).streak).toBe(1)
    expect(computeWeeklyGoal(fullWeeks(3), WED).streak).toBe(3)
  })

  it('an unmet current week does NOT reset a run of met weeks', () => {
    // The whole point of the weekly model: on Monday morning, having done
    // nothing yet, last week's work still counts.
    const p = computeWeeklyGoal([...fullWeeks(3, WED - WEEK), ...on(WED, 2)], WED)
    expect(p.answered).toBe(2)
    expect(p.met).toBe(false)
    expect(p.streak).toBe(3)
  })

  it('counts back from last week when the current week is untouched', () => {
    expect(computeWeeklyGoal(fullWeeks(2, WED - WEEK), WED).streak).toBe(2)
  })

  it('a missed week costs the streak, but only back to that week', () => {
    const attempts = [
      ...fullWeeks(1, WED),               // this week: met
      ...on(WED - WEEK, 2),               // last week: missed
      ...fullWeeks(3, WED - 2 * WEEK),    // three met weeks before that
    ]
    expect(computeWeeklyGoal(attempts, WED).streak).toBe(1)
  })

  it('a week just short of the goal breaks the run', () => {
    const attempts = [
      ...fullWeeks(1, WED),
      // Nine answers over two days: the spread is there, the count is not.
      ...on(WED - WEEK, WEEKLY_GOAL - 2), ...on(WED - WEEK + DAY, 1),
    ]
    expect(computeWeeklyGoal(attempts, WED).streak).toBe(1)
  })

  it('a past week met in one sitting no longer counts — the rule is not forward-only', () => {
    // Deliberate: the streak claims weeks of RETURNING, so a single-sitting
    // week was never that. Some students' streaks will fall when this ships.
    const attempts = [...fullWeeks(1, WED), ...on(WED - WEEK, WEEKLY_GOAL + 4)]
    expect(computeWeeklyGoal(attempts, WED).streak).toBe(1)
  })

  it('two missed weeks in a row leave nothing', () => {
    const attempts = [...on(WED - WEEK, 1), ...fullWeeks(2, WED - 2 * WEEK)]
    expect(computeWeeklyGoal(attempts, WED).streak).toBe(0)
  })

  it('steps by whole weeks across a British clock change without drifting', () => {
    // BST ends Sun 2026-10-25. A streak spanning it must still walk week by week.
    const nov = Date.UTC(2026, 10, 4, 12, 0, 0) // Wed 2026-11-04
    expect(computeWeeklyGoal(fullWeeks(4, nov), nov).streak).toBe(4)
  })
})

describe('computeWeeklyGoal — bad data cannot manufacture a streak', () => {
  it('ignores attempts dated in the future', () => {
    const p = computeWeeklyGoal([...on(WED + WEEK, 20), ...on(WED, 3)], WED)
    expect(p.answered).toBe(3)
    expect(p.streak).toBe(0)
  })

  it('ignores unparseable timestamps', () => {
    const p = computeWeeklyGoal(
      [{ attempted_at: 'not a date' }, ...on(WED, 2)],
      WED,
    )
    expect(p.answered).toBe(2)
  })

  it('a future-dated row cannot supply the second day', () => {
    const p = computeWeeklyGoal([...on(WED, WEEKLY_GOAL), ...on(WED + DAY, 1)], WED)
    expect(p.days).toBe(1)
    expect(p.met).toBe(false)
  })
})

describe('questionsToGoal / daysToGoal', () => {
  it('counts questions down to the goal', () => {
    expect(questionsToGoal(computeWeeklyGoal(on(WED, 3), WED))).toBe(7)
  })

  it('is 0 once the count is reached, and never negative', () => {
    expect(questionsToGoal(computeWeeklyGoal(on(WED, 14), WED))).toBe(0)
  })

  it('counts the days still needed, separately from the questions', () => {
    // The single-sitting case: nothing left to answer, one day still to come.
    // Two different shortfalls needing two different words.
    const oneSitting = computeWeeklyGoal(on(WED, WEEKLY_GOAL), WED)
    expect(questionsToGoal(oneSitting)).toBe(0)
    expect(daysToGoal(oneSitting)).toBe(1)

    expect(daysToGoal(computeWeeklyGoal(metWeek(WED), WED))).toBe(0)
    expect(daysToGoal(computeWeeklyGoal([], WED))).toBe(MIN_GOAL_DAYS)
  })
})

describe('weekStartDate', () => {
  it('names the Monday of the week containing the instant', () => {
    expect(weekStartDate(WED)).toBe('2026-08-31')
  })

  it('is stable across every day of one week, and steps on Monday', () => {
    const monday = Date.UTC(2026, 7, 31, 0, 0, 0)
    for (let d = 0; d < 7; d++) {
      expect(weekStartDate(monday + d * DAY + 13 * 3600000)).toBe('2026-08-31')
    }
    expect(weekStartDate(monday + 7 * DAY)).toBe('2026-09-07')
  })

  it('agrees with the window computeWeeklyGoal actually counts', () => {
    // The ledger key and the counting window must name the same week, or the
    // frequency cap would guard a different week from the one being reported.
    const start = Date.parse(`${weekStartDate(WED)}T00:00:00.000Z`)
    expect(computeWeeklyGoal(on(start, 1), WED).answered).toBe(1)
    expect(computeWeeklyGoal(on(start - 1, 1), WED).answered).toBe(0)
  })
})
