import { describe, it, expect } from 'vitest'
import {
  computeUsage, ENGAGED_THRESHOLD, MIN_SENDS_FOR_RATE,
  type UsageStudent, type UsageAttempt,
} from './adminUsage'

const DAY = 86400000
// Wednesday 2026-09-02, midday UTC. Its week begins Monday 2026-08-31.
const NOW = Date.UTC(2026, 8, 2, 12, 0, 0)
const ago = (days: number) => NOW - days * DAY
const iso = (ms: number) => new Date(ms).toISOString()

const student = (id: string, signedUpDaysAgo: number, tier = 'free'): UsageStudent =>
  ({ id, created_at: iso(ago(signedUpDaysAgo)), subscription_tier: tier })

/** n attempts for `id`, one per day working backwards from `daysAgo`. */
const attemptsOn = (id: string, daysAgoList: number[]): UsageAttempt[] =>
  daysAgoList.map(d => ({ student_id: id, attempted_at: iso(ago(d)) }))

describe('computeUsage — totals', () => {
  it('counts students, paid students and attempts', () => {
    const r = computeUsage({
      students: [student('a', 30), student('b', 20, 'paid')],
      attempts: attemptsOn('a', [5, 4]),
      sends: [],
      now: NOW,
    })
    expect(r.totals.students).toBe(2)
    expect(r.totals.paidStudents).toBe(1)
    expect(r.totals.attempts).toBe(2)
  })

  it('counts a student active in the last 7 days once, however many attempts', () => {
    const r = computeUsage({
      students: [student('a', 30)],
      attempts: attemptsOn('a', [1, 1, 2, 3]),
      sends: [], now: NOW,
    })
    expect(r.totals.activeLast7).toBe(1)
  })

  it('excludes activity older than 7 days from activeLast7', () => {
    const r = computeUsage({
      students: [student('a', 30)],
      attempts: attemptsOn('a', [9, 10]),
      sends: [], now: NOW,
    })
    expect(r.totals.activeLast7).toBe(0)
  })

  it('the headline: "ever returned" needs a SECOND distinct day, not a second attempt', () => {
    const sameDay  = computeUsage({ students: [student('a', 30)], attempts: attemptsOn('a', [5, 5, 5]), sends: [], now: NOW })
    const twoDays  = computeUsage({ students: [student('a', 30)], attempts: attemptsOn('a', [5, 4]),    sends: [], now: NOW })
    expect(sameDay.totals.everReturned).toBe(0)   // one long sitting is not a return
    expect(twoDays.totals.everReturned).toBe(1)
  })

  it('reports the return rate over all students, including those who never practised', () => {
    const r = computeUsage({
      students: [student('a', 30), student('b', 30), student('c', 30), student('d', 30)],
      attempts: attemptsOn('a', [5, 4]),
      sends: [], now: NOW,
    })
    expect(r.totals.everReturned).toBe(1)
    expect(r.totals.everReturnedRate).toBeCloseTo(0.25)
  })

  it('does not divide by zero on an empty database', () => {
    const r = computeUsage({ students: [], attempts: [], sends: [], now: NOW })
    expect(r.totals.everReturnedRate).toBe(0)
    expect(r.weekly.length).toBeGreaterThan(0)
  })
})

describe('computeUsage — weekly activity', () => {
  it('returns a contiguous run of weeks ending with the current one', () => {
    const r = computeUsage({ students: [], attempts: [], sends: [], now: NOW, weeks: 4 })
    expect(r.weekly).toHaveLength(4)
    expect(r.weekly.at(-1)!.weekStart).toBe('2026-08-31') // the Monday of NOW's week
    expect(r.weekly[0].weekStart).toBe('2026-08-10')
  })

  it('shows a quiet week as zero rather than omitting it', () => {
    // A gap week must still appear — an absent row would hide exactly the
    // collapse this page exists to make visible.
    const r = computeUsage({
      students: [], attempts: attemptsOn('a', [0, 14]), sends: [], now: NOW, weeks: 3,
    })
    expect(r.weekly.map(w => w.attempts)).toEqual([1, 0, 1])
  })

  it('counts distinct active students, not attempts', () => {
    const r = computeUsage({
      students: [], now: NOW, sends: [], weeks: 1,
      attempts: [...attemptsOn('a', [0, 0, 1]), ...attemptsOn('b', [1])],
    })
    expect(r.weekly.at(-1)).toMatchObject({ attempts: 4, activeStudents: 2 })
  })

  it('buckets signups into the week they happened', () => {
    const r = computeUsage({
      students: [student('a', 0), student('b', 8)],
      attempts: [], sends: [], now: NOW, weeks: 3,
    })
    expect(r.weekly.at(-1)!.signups).toBe(1)
    expect(r.weekly.reduce((n, w) => n + w.signups, 0)).toBe(2)
  })
})

describe('computeUsage — cohort funnel', () => {
  it('each step is a subset of the one before it', () => {
    const r = computeUsage({
      now: NOW, sends: [],
      students: [student('none', 40), student('light', 40), student('deep', 40), student('back', 40)],
      attempts: [
        ...attemptsOn('light', [30]),                      // practised, not engaged
        ...attemptsOn('deep', Array(ENGAGED_THRESHOLD).fill(30)), // engaged, one day
        ...attemptsOn('back', [30, 29]),                   // returned
      ],
    })
    const c = r.cohorts[0]
    expect(c.signedUp).toBe(4)
    expect(c.practised).toBe(3)
    expect(c.engaged).toBe(1)
    expect(c.returned).toBe(1)
    expect(c.practised).toBeLessThanOrEqual(c.signedUp)
    expect(c.engaged).toBeLessThanOrEqual(c.practised)
  })

  it('measures retention from each student\'s OWN signup, not a fixed date', () => {
    // Both students last practised 1 day ago. The one who signed up 40 days ago
    // is retained; the one who signed up 3 days ago simply has not had 28 days
    // and must not be counted as a failure.
    const r = computeUsage({
      now: NOW, sends: [],
      students: [student('old', 40), student('new', 3)],
      attempts: [...attemptsOn('old', [1]), ...attemptsOn('new', [1])],
    })
    const old = r.cohorts.find(c => c.cohort === new Date(ago(40)).toISOString().slice(0, 7))!
    const fresh = r.cohorts.find(c => c.cohort === new Date(ago(3)).toISOString().slice(0, 7))!
    expect(old.retained).toBe(1)
    expect(fresh.retained).toBe(0)
  })

  it('groups by signup month and orders oldest first', () => {
    const r = computeUsage({
      now: NOW, sends: [], attempts: [],
      students: [student('a', 5), student('b', 40), student('c', 75)],
    })
    expect(r.cohorts.map(c => c.cohort)).toEqual([...r.cohorts.map(c => c.cohort)].sort())
    expect(r.cohorts).toHaveLength(3)
  })

  it('counts a student with no attempts at all in signedUp only', () => {
    const r = computeUsage({ students: [student('ghost', 40)], attempts: [], sends: [], now: NOW })
    expect(r.cohorts[0]).toMatchObject({ signedUp: 1, practised: 0, engaged: 0, returned: 0, retained: 0 })
  })
})

describe('computeUsage — email funnel', () => {
  const sendRows = (n: number, clicked = 0) =>
    Array.from({ length: n }, (_, i) => ({
      student_id: `s${i}`,
      sent_at: iso(ago(10)),
      clicked_at: i < clicked ? iso(ago(9)) : null,
    }))

  it('counts sends, clicks and distinct students per channel', () => {
    const r = computeUsage({
      students: [], attempts: [], now: NOW,
      sends: [{ channel: 'reengagement', rows: sendRows(40, 4) }],
    })
    expect(r.email[0]).toMatchObject({ channel: 'reengagement', sends: 40, clicks: 4, students: 40 })
  })

  it('WITHHOLDS the click rate below the sample floor', () => {
    // The whole point: 0 clicks from 12 sends is not evidence of anything, and
    // printing "0%" invites a conclusion the sample cannot support.
    const r = computeUsage({
      students: [], attempts: [], now: NOW,
      sends: [{ channel: 'reengagement', rows: sendRows(12, 0) }],
    })
    expect(r.email[0].sends).toBe(12)
    expect(r.email[0].clickRate).toBeNull()
  })

  it('reports the rate once there are enough sends', () => {
    const r = computeUsage({
      students: [], attempts: [], now: NOW,
      sends: [{ channel: 'x', rows: sendRows(MIN_SENDS_FOR_RATE, 3) }],
    })
    expect(r.email[0].clickRate).toBeCloseTo(3 / MIN_SENDS_FOR_RATE)
  })

  it('keeps channels separate', () => {
    const r = computeUsage({
      students: [], attempts: [], now: NOW,
      sends: [
        { channel: 'reengagement', rows: sendRows(5) },
        { channel: 'nudge', rows: sendRows(2) },
      ],
    })
    expect(r.email.map(e => [e.channel, e.sends])).toEqual([['reengagement', 5], ['nudge', 2]])
  })
})

describe('computeUsage — bad data', () => {
  it('ignores unparseable timestamps rather than throwing', () => {
    const r = computeUsage({
      students: [{ id: 'a', created_at: 'not a date' }, student('b', 10)],
      attempts: [{ student_id: 'b', attempted_at: 'nonsense' }, ...attemptsOn('b', [2])],
      sends: [], now: NOW,
    })
    expect(r.totals.students).toBe(2)
    expect(r.totals.attempts).toBe(2)   // raw count, honest about what was fetched
    expect(r.cohorts).toHaveLength(1)   // only the parseable signup formed a cohort
  })
})
