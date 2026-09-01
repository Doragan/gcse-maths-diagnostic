import { describe, it, expect } from 'vitest'
import {
  cooldownCutoff, dueForContact, sentOnDate, REENGAGEMENT_COOLDOWN_DAYS,
} from './cadence'

const DAY = 86400000
const NOW = Date.UTC(2026, 8, 15, 12, 0, 0) // Tue 2026-09-15, midday

describe('cooldownCutoff', () => {
  it('is exactly the cooldown back from now', () => {
    expect(cooldownCutoff(NOW, 14).getTime()).toBe(NOW - 14 * DAY)
  })

  it('defaults to a fortnight', () => {
    expect(REENGAGEMENT_COOLDOWN_DAYS).toBe(14)
    expect(cooldownCutoff(NOW).getTime()).toBe(NOW - 14 * DAY)
  })

  it('never collapses to "no cooldown", however it is misconfigured', () => {
    // A 0 or negative env value must not turn the cap off and let the cron mail
    // the same student on consecutive days.
    for (const days of [0, -1, -365]) {
      expect(cooldownCutoff(NOW, days).getTime()).toBeLessThanOrEqual(NOW - DAY)
    }
  })
})

describe('the rolling window is not a calendar bucket', () => {
  // The property that makes this worth a module. A fortnight-numbered bucket
  // would let two sends land a day apart across its boundary; a rolling window
  // measured from the last contact cannot.
  const fortnightBucket = (ms: number) => Math.floor(ms / (14 * DAY))

  it('a bucket WOULD permit two sends 24 hours apart', () => {
    const lastDayOfBucket  = 14 * DAY * 100 - 1 * DAY
    const firstDayOfNext   = 14 * DAY * 100 + 1 * DAY
    expect(fortnightBucket(lastDayOfBucket)).not.toBe(fortnightBucket(firstDayOfNext))
    expect(firstDayOfNext - lastDayOfBucket).toBe(2 * DAY) // ...only two days apart
  })

  it('the rolling window refuses that same pair', () => {
    const previousSend = NOW - 2 * DAY
    expect(previousSend).toBeGreaterThan(cooldownCutoff(NOW, 14).getTime())
  })

  it('allows a send once, and only once, the full fortnight has passed', () => {
    const cutoff = cooldownCutoff(NOW, 14).getTime()
    expect(NOW - 13 * DAY).toBeGreaterThan(cutoff)          // still blocked
    expect(NOW - 15 * DAY).toBeLessThan(cutoff)             // now due
  })
})

describe('dueForContact', () => {
  const cohort = [{ student_id: 'a' }, { student_id: 'b' }, { student_id: 'c' }]

  it('drops students still cooling down and keeps the rest', () => {
    expect(dueForContact(cohort, ['b'])).toEqual([{ student_id: 'a' }, { student_id: 'c' }])
  })

  it('accepts a Set or any iterable', () => {
    expect(dueForContact(cohort, new Set(['a', 'c']))).toEqual([{ student_id: 'b' }])
  })

  it('is a no-op when nobody has been contacted', () => {
    expect(dueForContact(cohort, [])).toEqual(cohort)
  })

  it('preserves order, so a batch slice stays deterministic', () => {
    expect(dueForContact(cohort, []).map(c => c.student_id)).toEqual(['a', 'b', 'c'])
  })

  it('filters BEFORE a batch slice, so blocked students cannot starve the batch', () => {
    // The bug this ordering prevents: 100 cooled-down students ahead of one who
    // has never been contacted. Slice first and the batch is entirely blocked
    // students, every run, forever.
    const many = Array.from({ length: 100 }, (_, i) => ({ student_id: `blocked${i}` }))
    const cohortWithTail = [...many, { student_id: 'never-contacted' }]
    const blocked = many.map(m => m.student_id)

    const rightWay = dueForContact(cohortWithTail, blocked).slice(0, 100)
    expect(rightWay).toEqual([{ student_id: 'never-contacted' }])

    const wrongWay = dueForContact(cohortWithTail.slice(0, 100), blocked)
    expect(wrongWay).toEqual([])
  })
})

describe('sentOnDate', () => {
  it('is the UTC calendar date, for the same-day uniqueness key', () => {
    expect(sentOnDate(NOW)).toBe('2026-09-15')
    expect(sentOnDate(Date.UTC(2026, 8, 15, 23, 59, 59))).toBe('2026-09-15')
    expect(sentOnDate(Date.UTC(2026, 8, 16, 0, 0, 0))).toBe('2026-09-16')
  })
})
