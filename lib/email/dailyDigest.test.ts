import { describe, it, expect } from 'vitest'
import {
  buildDailyDigestEmail,
  summariseStudents,
  summariseTraffic,
  type DailyDigestInput,
  type DigestEvent,
} from './dailyDigest'

const DAY = 86_400_000
// "Today" is 17 Oct 2026 00:00 UTC, so the summarised day is 16 Oct.
const TODAY = Date.UTC(2026, 9, 17)
const at = (daysAgo: number, hour = 12) => new Date(TODAY - daysAgo * DAY + hour * 3_600_000).toISOString()

const ev = (
  session_id: string,
  event: string,
  created_at: string,
  properties: Record<string, unknown> | null = {},
): DigestEvent => ({ event, session_id, properties, created_at })

describe('summariseTraffic', () => {
  it('does not count a visit that only loaded a page and answered the cookie banner as engaged', () => {
    const t = summariseTraffic(
      [
        ev('a', 'page_view', at(1)), ev('a', 'cookie_consent', at(1)),
        ev('b', 'page_view', at(1)),
      ],
      TODAY,
    )
    expect(t.yesterday).toMatchObject({ visits: 2, engaged: 0 })
  })

  it('counts a visit with anything beyond one page view as engaged', () => {
    const t = summariseTraffic(
      [
        ev('a', 'page_view', at(1)), ev('a', 'demo_question_answered', at(1)),
        ev('b', 'page_view', at(1)), ev('b', 'page_view', at(1, 13)),
      ],
      TODAY,
    )
    expect(t.yesterday).toMatchObject({ visits: 2, engaged: 2 })
  })

  it('splits yesterday, the last 7 days (inclusive) and the 7 days before', () => {
    const t = summariseTraffic(
      [
        ev('y', 'page_view', at(1)),
        ev('w', 'page_view', at(4)),
        ev('p', 'page_view', at(9)),
        ev('old', 'page_view', at(15)),
        ev('today', 'page_view', new Date(TODAY + 3_600_000).toISOString()),
      ],
      TODAY,
    )
    expect(t.yesterday.visits).toBe(1)
    expect(t.last7.visits).toBe(2)
    expect(t.prev7.visits).toBe(1)
  })

  it('puts the 7-day boundaries on the right side', () => {
    const t = summariseTraffic(
      [ev('edge7', 'page_view', new Date(TODAY - 7 * DAY).toISOString()), ev('edge14', 'page_view', new Date(TODAY - 14 * DAY).toISOString())],
      TODAY,
    )
    expect(t.last7.visits).toBe(1)
    expect(t.prev7.visits).toBe(1)
  })

  it('assigns a visit to the day of its first event, even when events arrive out of order', () => {
    const t = summariseTraffic(
      [ev('s', 'page_view', at(0, -1)), ev('s', 'page_view', at(1, 20)), ev('s', 'page_view', at(1, 2))],
      TODAY,
    )
    // earliest event is 02:00 yesterday → counted once, yesterday
    expect(t.yesterday.visits).toBe(1)
    expect(t.last7.visits).toBe(1)
  })

  it('flags ad-tagged visits from any event carrying a gclid, and ignores an empty one', () => {
    const t = summariseTraffic(
      [
        ev('ad', 'page_view', at(1)), ev('ad', 'signup_success', at(1), { gclid: 'Cj0KCQ' }),
        ev('blank', 'page_view', at(1), { gclid: '' }),
        ev('org', 'page_view', at(1)),
      ],
      TODAY,
    )
    expect(t.yesterday.adTagged).toBe(1)
    expect(t.yesterday.visits).toBe(3)
  })

  it('counts signups by the day of the event, regardless of ad attribution', () => {
    const t = summariseTraffic(
      [
        ev('a', 'signup_success', at(1), { gclid: 'x' }),
        ev('b', 'signup_success', at(1)),
        ev('c', 'signup_success', at(3)),
        ev('d', 'signup_success', at(10)),
        ev('e', 'signup_submit', at(1)),
      ],
      TODAY,
    )
    expect(t.yesterday.signups).toBe(2)
    expect(t.last7.signups).toBe(3)
    expect(t.prev7.signups).toBe(1)
  })

  it('excludes the maintainer’s own traffic', () => {
    const t = summariseTraffic(
      [
        ev('me', 'page_view', at(1), { internal: true }),
        ev('me', 'signup_success', at(1), { internal: true }),
        ev('real', 'page_view', at(1)),
      ],
      TODAY,
    )
    expect(t.yesterday).toMatchObject({ visits: 1, signups: 0 })
  })

  it('returns zeros, not NaN, for no data', () => {
    const t = summariseTraffic([], TODAY)
    expect(t.yesterday).toEqual({ visits: 0, engaged: 0, adTagged: 0, signups: 0 })
    expect(t.prev7).toEqual({ visits: 0, engaged: 0, adTagged: 0, signups: 0 })
  })
})

describe('summariseStudents', () => {
  const row = (student_id: string, daysAgo: number) => ({ student_id, attempted_at: at(daysAgo) })

  it('counts a student once however many answers, and splits new from returning', () => {
    const attempts = [row('new1', 1), row('new1', 1), row('back1', 1), row('back1', 4)]
    const first = { new1: at(1), back1: at(40) }
    const s = summariseStudents(attempts, first, TODAY)
    expect(s.yesterday).toEqual({ practised: 2, newlyStarted: 1, returning: 1 })
    expect(s.last7).toEqual({ practised: 2, newlyStarted: 1, returning: 1 })
  })

  it('treats "new" as relative to each window', () => {
    // First practised 4 days ago: new for the week, returning for yesterday.
    const s = summariseStudents([row('x', 4), row('x', 1)], { x: at(4) }, TODAY)
    expect(s.yesterday).toEqual({ practised: 1, newlyStarted: 0, returning: 1 })
    expect(s.last7).toEqual({ practised: 1, newlyStarted: 1, returning: 0 })
  })

  it('does not count activity from today or before the week', () => {
    const attempts = [
      { student_id: 'today', attempted_at: new Date(TODAY + 3_600_000).toISOString() },
      row('old', 9),
    ]
    const s = summariseStudents(attempts, { today: at(0), old: at(9) }, TODAY)
    expect(s.last7.practised).toBe(0)
    expect(s.yesterday.practised).toBe(0)
  })

  it('falls back to the earliest attempt in the data when the first-attempt lookup is missing', () => {
    const s = summariseStudents([row('x', 3), row('x', 1)], {}, TODAY)
    expect(s.last7).toEqual({ practised: 1, newlyStarted: 1, returning: 0 })
  })

  it('returns zeros for no activity', () => {
    const s = summariseStudents([], {}, TODAY)
    expect(s.yesterday).toEqual({ practised: 0, newlyStarted: 0, returning: 0 })
  })
})

describe('buildDailyDigestEmail', () => {
  const window = (visits: number, engaged: number, adTagged: number, signups: number) => ({ visits, engaged, adTagged, signups })
  const input: DailyDigestInput = {
    dateLabel: '16 October 2026',
    traffic: { yesterday: window(41, 12, 1, 1), last7: window(294, 84, 7, 3), prev7: window(1050, 210, 590, 12) },
    students: {
      yesterday: { practised: 4, newlyStarted: 1, returning: 3 },
      last7: { practised: 9, newlyStarted: 6, returning: 3 },
    },
    totalStudents: 131,
    paidCount: 2,
    paid: [
      { id: '6aa3a9e1-4aa7-4b86-94ea-1e49904ce58a', daysSincePractised: 2 },
      { id: 'bf08febf-b457-4087-a517-7a6695b37ca7', daysSincePractised: null },
    ],
    founderSeatsLeft: 98,
    founderSeatCap: 100,
  }

  it('leads the subject with the date and the three numbers that matter', () => {
    expect(buildDailyDigestEmail(input).subject).toBe(
      'Mathsense daily — 16 October 2026: 12 engaged visits, 1 signup, 4 practised',
    )
  })

  it('singularises one engaged visit and reads plural at zero', () => {
    const one = buildDailyDigestEmail({ ...input, traffic: { ...input.traffic, yesterday: window(5, 1, 0, 0) } })
    expect(one.subject).toContain('1 engaged visit,')
    expect(one.subject).toContain('0 signups')
  })

  it('gives each figure its 7-day context and the previous week to compare against', () => {
    const { text } = buildDailyDigestEmail(input)
    expect(text).toContain('Visits: 41 (7-day avg 42, previous 7 days 150)')
    expect(text).toContain('Engaged visits: 12 (7-day avg 12, previous 7 days 30)')
    expect(text).toContain('Ad-tagged visits: 1 (last 7 days: 7)')
    expect(text).toContain('Yesterday: 1 · last 7 days: 3 · previous 7 days: 12')
  })

  it('reports new and returning students separately', () => {
    const { text } = buildDailyDigestEmail(input)
    expect(text).toContain('Practised yesterday: 4 (1 new, 3 returning)')
    expect(text).toContain('Practised in the last 7 days: 9 (6 new, 3 returning)')
    expect(text).toContain('Total students: 131')
  })

  it('lists paid access by id prefix only, with how long since each last practised', () => {
    const { text, html } = buildDailyDigestEmail(input)
    expect(text).toContain('2 active · founder seats left: 98 of 100')
    expect(text).toContain('6aa3a9e1 — last practised 2 days ago')
    expect(text).toContain('bf08febf — no practice recorded')
    expect(text).not.toContain('6aa3a9e1-4aa7')
    expect(html).not.toContain('b457-4087')
  })

  it('says so when more payers exist than are listed, and when nobody is paying', () => {
    expect(buildDailyDigestEmail({ ...input, paidCount: 14 }).text).toContain('…and 12 more')
    const none = buildDailyDigestEmail({ ...input, paidCount: 0, paid: [] }).text
    expect(none).toContain('0 active · founder seats left: 98 of 100')
    expect(none).not.toContain('…and')
  })

  it('phrases the day-count correctly at 0 and 1 days', () => {
    const { text } = buildDailyDigestEmail({
      ...input,
      paidCount: 2,
      paid: [{ id: 'aaaaaaaa-x', daysSincePractised: 0 }, { id: 'bbbbbbbb-x', daysSincePractised: 1 }],
    })
    expect(text).toContain('aaaaaaaa — practised today')
    expect(text).toContain('bbbbbbbb — last practised 1 day ago')
  })

  it('never prints NaN or undefined on an all-zero day', () => {
    const z = window(0, 0, 0, 0)
    const zero: DailyDigestInput = {
      ...input,
      traffic: { yesterday: z, last7: z, prev7: z },
      students: { yesterday: { practised: 0, newlyStarted: 0, returning: 0 }, last7: { practised: 0, newlyStarted: 0, returning: 0 } },
      totalStudents: 0, paidCount: 0, paid: [],
    }
    const { subject, text, html } = buildDailyDigestEmail(zero)
    for (const s of [subject, text, html]) {
      expect(s).not.toMatch(/NaN|undefined|Infinity/)
    }
  })

  it('explains what “engaged” means', () => {
    expect(buildDailyDigestEmail(input).text).toContain('Engaged = a visit with more than one event')
  })
})
