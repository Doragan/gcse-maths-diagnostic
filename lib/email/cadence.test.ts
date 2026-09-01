import { describe, it, expect } from 'vitest'
import {
  contactState, cooldownDaysAfter, dueForContact, sentOnDate,
  BASE_COOLDOWN_DAYS, MAX_SENDS_PER_LAPSE,
} from './cadence'

const DAY = 86400000
const NOW = Date.UTC(2026, 8, 15, 12, 0, 0) // Tue 2026-09-15, midday
const ago = (days: number) => NOW - days * DAY

describe('cooldownDaysAfter — the taper', () => {
  it('doubles each time: 14, 28, 56, 112', () => {
    expect(cooldownDaysAfter(1)).toBe(14)
    expect(cooldownDaysAfter(2)).toBe(28)
    expect(cooldownDaysAfter(3)).toBe(56)
    expect(cooldownDaysAfter(4)).toBe(112)
  })

  it('has no wait before the first email — the lapsed threshold is that gate', () => {
    expect(cooldownDaysAfter(0)).toBe(0)
  })

  it('never collapses to daily, however the base is misconfigured', () => {
    for (const base of [0, -1, -365]) {
      expect(cooldownDaysAfter(1, base)).toBeGreaterThanOrEqual(1)
      expect(cooldownDaysAfter(4, base)).toBeGreaterThanOrEqual(1)
    }
  })

  it('spans about seven months over the full sequence', () => {
    const total = [1, 2, 3, 4].reduce((sum, n) => sum + cooldownDaysAfter(n), 0)
    expect(total).toBe(210)
  })
})

describe('contactState — the sequence', () => {
  // Well before every send in this block, so the reset rule doesn't discard any
  // of them and each case really is testing the taper. (Setting this to ago(90)
  // while placing sends at ago(120) silently tests the reset instead — the
  // reset is covered on purpose in the next block.)
  const lastAttempt = ago(1000)

  it('the first email is due with no history', () => {
    const s = contactState({ now: NOW, lastAttempt, sends: [] })
    expect(s).toMatchObject({ priorSends: 0, due: true, exhausted: false })
  })

  it('holds the second for a fortnight, then releases it', () => {
    const held = contactState({ now: NOW, lastAttempt, sends: [ago(13)] })
    expect(held.due).toBe(false)
    expect(held.nextDueAt?.getTime()).toBe(ago(13) + 14 * DAY)

    expect(contactState({ now: NOW, lastAttempt, sends: [ago(14)] }).due).toBe(true)
  })

  it('widens the gap with each unanswered email', () => {
    // Two prior sends → 28 days, not 14.
    expect(contactState({ now: NOW, lastAttempt, sends: [ago(60), ago(20)] }).due).toBe(false)
    expect(contactState({ now: NOW, lastAttempt, sends: [ago(60), ago(29)] }).due).toBe(true)
    // Three prior → 56.
    expect(contactState({ now: NOW, lastAttempt, sends: [ago(120), ago(90), ago(50)] }).due).toBe(false)
    expect(contactState({ now: NOW, lastAttempt, sends: [ago(120), ago(90), ago(57)] }).due).toBe(true)
  })

  it('measures from the LATEST send, not the first', () => {
    const s = contactState({ now: NOW, lastAttempt, sends: [ago(200), ago(5)] })
    expect(s.due).toBe(false)
    expect(s.nextDueAt?.getTime()).toBe(ago(5) + 28 * DAY)
  })

  it('is order-independent', () => {
    const asc  = contactState({ now: NOW, lastAttempt, sends: [ago(60), ago(20)] })
    const desc = contactState({ now: NOW, lastAttempt, sends: [ago(20), ago(60)] })
    expect(asc).toEqual(desc)
  })

  it('stops after the fifth, and says so', () => {
    const sends = [ago(300), ago(280), ago(250), ago(200), ago(100)]
    const s = contactState({ now: NOW, lastAttempt: ago(400), sends })
    expect(s).toMatchObject({ priorSends: 5, due: false, exhausted: true, nextDueAt: null })
    expect(MAX_SENDS_PER_LAPSE).toBe(5)
  })

  it('stays stopped however long it has been', () => {
    const sends = [ago(3000), ago(2900), ago(2800), ago(2700), ago(2600)]
    expect(contactState({ now: NOW, lastAttempt: ago(4000), sends }).due).toBe(false)
  })
})

describe('contactState — coming back resets the sequence', () => {
  it('ignores sends that predate the most recent attempt', () => {
    // Four emails, then the student returned and practised, then lapsed again.
    const sends = [ago(300), ago(280), ago(250), ago(200)]
    const s = contactState({ now: NOW, lastAttempt: ago(30), sends })
    expect(s.priorSends).toBe(0)
    expect(s.due).toBe(true)
    expect(s.exhausted).toBe(false)
  })

  it('reopens an exhausted sequence when they return', () => {
    const sends = [ago(300), ago(280), ago(250), ago(200), ago(150)]
    expect(contactState({ now: NOW, lastAttempt: ago(400), sends }).exhausted).toBe(true)
    // Same history, but they practised 100 days ago — after every send.
    expect(contactState({ now: NOW, lastAttempt: ago(100), sends }).exhausted).toBe(false)
  })

  it('counts only the sends since the return, not all of them', () => {
    const sends = [ago(300), ago(280), ago(5)]
    const s = contactState({ now: NOW, lastAttempt: ago(60), sends })
    expect(s.priorSends).toBe(1)                          // just the one after the attempt
    expect(s.nextDueAt?.getTime()).toBe(ago(5) + 14 * DAY) // base wait, not 56 days
  })
})

describe('contactState — bad data', () => {
  it('ignores unparseable send timestamps', () => {
    const s = contactState({ now: NOW, lastAttempt: ago(90), sends: [NaN, ago(5)] })
    expect(s.priorSends).toBe(1)
  })
})

describe('dueForContact', () => {
  const c = (id: string, lastAttemptDaysAgo: number) =>
    ({ student_id: id, last_attempt: new Date(ago(lastAttemptDaysAgo)).toISOString() })

  it('keeps the due, drops the waiting and the exhausted', () => {
    const candidates = [c('fresh', 30), c('waiting', 60), c('done', 400)]
    const sends = new Map<string, number[]>([
      ['fresh', []],
      ['waiting', [ago(3)]],
      ['done', [ago(300), ago(280), ago(250), ago(200), ago(150)]],
    ])
    expect(dueForContact(candidates, sends, NOW).map(x => x.student_id)).toEqual(['fresh'])
  })

  it('treats a student with no send history as due', () => {
    expect(dueForContact([c('a', 30)], new Map(), NOW)).toHaveLength(1)
  })

  it('preserves order, so a batch slice stays deterministic', () => {
    const candidates = [c('a', 30), c('b', 30), c('c', 30)]
    expect(dueForContact(candidates, new Map(), NOW).map(x => x.student_id)).toEqual(['a', 'b', 'c'])
  })

  it('filters BEFORE a batch slice, so waiting students cannot starve the batch', () => {
    // 100 not-yet-due students ahead of one never contacted. Slice first and the
    // batch is entirely blocked students, every run, forever.
    const many = Array.from({ length: 100 }, (_, i) => c(`waiting${i}`, 60))
    const all = [...many, c('never-contacted', 30)]
    const sends = new Map(many.map(m => [m.student_id, [ago(3)]] as [string, number[]]))

    expect(dueForContact(all, sends, NOW).slice(0, 100).map(x => x.student_id))
      .toEqual(['never-contacted'])
    expect(dueForContact(all.slice(0, 100), sends, NOW)).toEqual([])
  })
})

describe('the taper is a rolling window, not a calendar bucket', () => {
  const fortnightBucket = (ms: number) => Math.floor(ms / (14 * DAY))

  it('a bucket WOULD permit two sends two days apart', () => {
    const lastDay  = 14 * DAY * 100 - DAY
    const firstDay = 14 * DAY * 100 + DAY
    expect(fortnightBucket(lastDay)).not.toBe(fortnightBucket(firstDay))
    expect(firstDay - lastDay).toBe(2 * DAY)
  })

  it('the rolling window refuses that same pair', () => {
    expect(contactState({ now: NOW, lastAttempt: ago(90), sends: [ago(2)] }).due).toBe(false)
  })
})

describe('sentOnDate', () => {
  it('is the UTC calendar date, for the same-day uniqueness key', () => {
    expect(sentOnDate(NOW)).toBe('2026-09-15')
    expect(sentOnDate(Date.UTC(2026, 8, 15, 23, 59, 59))).toBe('2026-09-15')
    expect(sentOnDate(Date.UTC(2026, 8, 16, 0, 0, 0))).toBe('2026-09-16')
  })
})

describe('constants', () => {
  it('starts at a fortnight', () => {
    expect(BASE_COOLDOWN_DAYS).toBe(14)
  })
})
