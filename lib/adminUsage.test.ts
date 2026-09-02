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

const student = (id: string, signedUpDaysAgo: number, tier = 'free', paidUntilDaysAhead = 30): UsageStudent =>
  ({ id, created_at: iso(ago(signedUpDaysAgo)), subscription_tier: tier,
     paid_until: tier === 'paid' ? iso(NOW + paidUntilDaysAhead * DAY) : null })

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
    expect(r.totals.withPremiumAccess).toBe(1)
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

describe('computeUsage — premium access vs actual customers', () => {
  const raw = (id: string, tier: string, paidUntil: string | null): UsageStudent =>
    ({ id, created_at: iso(ago(60)), subscription_tier: tier, paid_until: paidUntil })

  it('excludes a "paid" tier with a NULL paid_until', () => {
    // The real case that made this wrong: a Stripe subscription was created but
    // invoice.payment_succeeded never landed, so the tier says paid while the
    // app itself treats them as free.
    const r = computeUsage({ students: [raw('a', 'paid', null)], attempts: [], sends: [], now: NOW })
    expect(r.totals.withPremiumAccess).toBe(0)
  })

  it('excludes a "paid" tier that has expired', () => {
    const r = computeUsage({
      students: [raw('a', 'paid', iso(ago(1)))], attempts: [], sends: [], now: NOW,
    })
    expect(r.totals.withPremiumAccess).toBe(0)
  })

  it('counts a paid tier with a future paid_until', () => {
    const r = computeUsage({
      students: [raw('a', 'paid', iso(NOW + 5 * DAY))], attempts: [], sends: [], now: NOW,
    })
    expect(r.totals.withPremiumAccess).toBe(1)
  })

  it('keeps tracked purchases separate from access', () => {
    // Access includes comped and manually-granted accounts, which nothing in
    // the schema distinguishes from purchases. The two numbers must not be
    // conflated, and neither is derivable from the other.
    const r = computeUsage({
      students: [raw('a', 'paid', iso(NOW + DAY)), raw('b', 'paid', iso(NOW + DAY))],
      attempts: [], sends: [], conversions: 1, now: NOW,
    })
    expect(r.totals.withPremiumAccess).toBe(2)
    expect(r.totals.conversions).toBe(1)
  })

  it('reports zero tracked purchases rather than undefined when none are passed', () => {
    const r = computeUsage({ students: [], attempts: [], sends: [], now: NOW })
    expect(r.totals.conversions).toBe(0)
  })
})

describe('computeUsage — acquisition (the pre-signup funnel)', () => {
  const ev = (event: string, session: string, daysAgo = 1, props: any = null) =>
    ({ event, session_id: session, created_at: iso(ago(daysAgo)), properties: props })

  it('is null when no analytics rows are supplied', () => {
    expect(computeUsage({ students: [], attempts: [], sends: [], now: NOW }).acquisition).toBeNull()
  })

  it('counts SESSIONS, not events — the mistake this exists to prevent', () => {
    // One visitor answering seven demo questions is one interested session, not
    // seven. Counting events made a 6% engagement rate look like 40%.
    const analytics = [
      ev('page_view', 's1'),
      ...Array.from({ length: 7 }, () => ev('demo_question_answered', 's1')),
    ]
    const a = computeUsage({ students: [], attempts: [], sends: [], analytics, now: NOW }).acquisition!
    expect(a.steps.find(s => s.label.includes('demo'))!.sessions).toBe(1)
  })

  it('excludes internal traffic, so our own testing is not counted as demand', () => {
    const analytics = [
      ev('page_view', 'real'),
      ev('page_view', 'mine', 1, { internal: true }),
    ]
    const a = computeUsage({ students: [], attempts: [], sends: [], analytics, now: NOW }).acquisition!
    expect(a.steps[0].sessions).toBe(1)
  })

  it('ignores rows with no session id rather than counting them as one visit', () => {
    const analytics = [ev('page_view', 'a'), { event: 'page_view', session_id: null, created_at: iso(ago(1)) }]
    const a = computeUsage({ students: [], attempts: [], sends: [], analytics, now: NOW }).acquisition!
    expect(a.steps[0].sessions).toBe(1)
  })

  it('expresses each step as a share of ALL VISITS, never of the row above', () => {
    const analytics = [
      ...['a', 'b', 'c', 'd'].map(s => ev('page_view', s)),
      ...['a'].map(s => ev('demo_question_answered', s)),
    ]
    const a = computeUsage({ students: [], attempts: [], sends: [], analytics, now: NOW }).acquisition!
    expect(a.steps[0].ofVisits).toBeNull()          // nothing above the first step
    expect(a.steps[1].ofVisits).toBeCloseTo(0.25)
  })

  it('does not divide by zero when a step above it is empty', () => {
    const analytics = [ev('signup_success', 'a')]
    const a = computeUsage({ students: [], attempts: [], sends: [], analytics, now: NOW }).acquisition!
    for (const s of a.steps) expect(s.ofVisits === null || Number.isFinite(s.ofVisits)).toBe(true)
  })

  it('tracks visits and signups per week, on the same weeks as the rest of the report', () => {
    const analytics = [ev('page_view', 'a', 0), ev('signup_success', 'a', 0), ev('page_view', 'b', 8)]
    const r = computeUsage({ students: [], attempts: [], sends: [], analytics, now: NOW, weeks: 3 })
    expect(r.acquisition!.weekly.map(w => w.weekStart)).toEqual(r.weekly.map(w => w.weekStart))
    expect(r.acquisition!.weekly.at(-1)).toMatchObject({ visits: 1, signups: 1 })
  })
})

describe('acquisition — the ratio can never exceed 100%', () => {
  const ev = (event: string, session: string) =>
    ({ event, session_id: session, created_at: iso(ago(1)) })

  it('holds even when a later step has MORE sessions than an earlier one', () => {
    // The live case that made "share of the previous row" wrong: the /practice
    // prompt is reached by more sessions than the homepage demo, which produced
    // 211%. Against all visits it stays a real proportion.
    const analytics = [
      ...['a', 'b', 'c', 'd'].map(s => ev('page_view', s)),
      ev('demo_question_answered', 'a'),
      ...['a', 'b', 'c'].map(s => ev('practice_signup_prompt_shown', s)),
    ]
    const a = computeUsage({ students: [], attempts: [], sends: [], analytics, now: NOW }).acquisition!
    const demo   = a.steps.find(s => s.label.includes('demo'))!
    const prompt = a.steps.find(s => s.label.includes('sign up'))!
    expect(prompt.sessions).toBeGreaterThan(demo.sessions)  // not nested
    expect(prompt.ofVisits).toBeCloseTo(0.75)
    for (const s of a.steps) {
      if (s.ofVisits !== null) expect(s.ofVisits).toBeLessThanOrEqual(1)
    }
  })
})
