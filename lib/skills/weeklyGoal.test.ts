import { describe, it, expect } from 'vitest'
import { computeWeeklyGoal, questionsToGoal, weekStartDate, WEEKLY_GOAL } from './weeklyGoal'

// Wednesday 2026-09-02, midday UTC. Its week runs Mon 2026-08-31 → Sun 2026-09-06.
const WED = Date.UTC(2026, 8, 2, 12, 0, 0)
const DAY = 86400000
const WEEK = 7 * DAY

/** n attempts, all at `ms`. */
const on = (ms: number, n: number) =>
  Array.from({ length: n }, () => ({ attempted_at: new Date(ms).toISOString() }))

describe('computeWeeklyGoal — the current week', () => {
  it('counts only attempts inside the current week', () => {
    const p = computeWeeklyGoal([...on(WED, 4), ...on(WED - WEEK, 9)], WED)
    expect(p.answered).toBe(4)
    expect(p.met).toBe(false)
  })

  it('meets the goal at exactly 10, not 9', () => {
    expect(computeWeeklyGoal(on(WED, 9), WED).met).toBe(false)
    expect(computeWeeklyGoal(on(WED, 10), WED).met).toBe(true)
  })

  it('reports overshoot honestly rather than capping at the goal', () => {
    expect(computeWeeklyGoal(on(WED, 14), WED).answered).toBe(14)
  })

  it('includes Monday 00:00 and Sunday 23:59 — the whole week, both ends', () => {
    const monday = Date.UTC(2026, 7, 31, 0, 0, 0)
    const sunday = Date.UTC(2026, 8, 6, 23, 59, 59)
    expect(computeWeeklyGoal([...on(monday, 1), ...on(sunday, 1)], sunday).answered).toBe(2)
  })

  it('excludes the Sunday before — the week boundary is Monday, not a rolling 7 days', () => {
    const sundayBefore = Date.UTC(2026, 7, 30, 23, 59, 59)
    expect(computeWeeklyGoal(on(sundayBefore, 5), WED).answered).toBe(0)
  })

  it('is empty, not broken, for a student with no attempts', () => {
    expect(computeWeeklyGoal([], WED)).toEqual({ answered: 0, goal: 10, met: false, streak: 0 })
  })
})

describe('computeWeeklyGoal — the streak', () => {
  const fullWeeks = (n: number, from = WED) =>
    Array.from({ length: n }, (_, i) => on(from - i * WEEK, WEEKLY_GOAL)).flat()

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
    // 3 good weeks, then a missed one, then a good one → streak is 1, not 4.
    const attempts = [
      ...fullWeeks(1, WED),               // this week: met
      ...on(WED - WEEK, 2),               // last week: missed
      ...fullWeeks(3, WED - 2 * WEEK),    // three met weeks before that
    ]
    expect(computeWeeklyGoal(attempts, WED).streak).toBe(1)
  })

  it('a week just short of the goal breaks the run', () => {
    const attempts = [...on(WED, WEEKLY_GOAL), ...on(WED - WEEK, WEEKLY_GOAL - 1)]
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
})

describe('questionsToGoal', () => {
  it('counts down to the goal', () => {
    expect(questionsToGoal(computeWeeklyGoal(on(WED, 3), WED))).toBe(7)
  })
  it('is 0 once met, and never negative', () => {
    expect(questionsToGoal(computeWeeklyGoal(on(WED, 14), WED))).toBe(0)
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
