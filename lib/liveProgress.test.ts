import { describe, it, expect } from 'vitest'
import {
  headChanged, isAnsweringNow, shouldPause, formatLastAttempt,
  ANSWERING_NOW_MS, IDLE_PAUSE_MS,
} from './liveProgress'

const NOW = new Date('2026-10-16T14:30:00Z').getTime()
const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString()

describe('headChanged', () => {
  it('treats the first probe as a change, so the baseline gets set', () => {
    expect(headChanged(null, { attemptCount: 0, lastAttemptAt: null })).toBe(true)
  })

  it('is false when nothing has moved — the case that must stay cheap', () => {
    const h = { attemptCount: 12, lastAttemptAt: iso(60_000) }
    expect(headChanged(h, { ...h })).toBe(false)
  })

  it('catches a new attempt by either figure', () => {
    const h = { attemptCount: 12, lastAttemptAt: iso(60_000) }
    expect(headChanged(h, { ...h, attemptCount: 13 })).toBe(true)
    expect(headChanged(h, { ...h, lastAttemptAt: iso(0) })).toBe(true)
  })

  it('notices a deletion that leaves the timestamp alone', () => {
    // Count falling is still a change worth refetching for.
    const h = { attemptCount: 12, lastAttemptAt: iso(60_000) }
    expect(headChanged(h, { ...h, attemptCount: 11 })).toBe(true)
  })
})

describe('isAnsweringNow', () => {
  it('is true inside the window and false outside it', () => {
    expect(isAnsweringNow(iso(30_000), NOW)).toBe(true)
    expect(isAnsweringNow(iso(ANSWERING_NOW_MS + 1_000), NOW)).toBe(false)
  })

  it('tolerates a student clock slightly ahead of ours', () => {
    // A timestamp a few seconds in the future must not read as "not here".
    expect(isAnsweringNow(new Date(NOW + 5_000).toISOString(), NOW)).toBe(true)
  })

  it('is false when the student has never attempted', () => {
    expect(isAnsweringNow(null, NOW)).toBe(false)
  })
})

describe('shouldPause', () => {
  it('holds on through a quiet stretch of a lesson', () => {
    expect(shouldPause(NOW - 20 * 60 * 1000, NOW)).toBe(false)
  })

  it('stands down once nothing has changed for the idle window', () => {
    expect(shouldPause(NOW - IDLE_PAUSE_MS, NOW)).toBe(true)
  })
})

describe('formatLastAttempt', () => {
  it('says so while they are still answering', () => {
    expect(formatLastAttempt(iso(30_000), NOW)).toBe('answering now')
  })

  it('gives a clock time later the same day, not just "today"', () => {
    // During a lesson every row is today, so a date alone says nothing.
    const out = formatLastAttempt(iso(3 * 60 * 60 * 1000), NOW)
    expect(out).toMatch(/^\d{2}:\d{2}$/)
  })

  it('falls back to a date on an earlier day', () => {
    expect(formatLastAttempt(iso(3 * 24 * 60 * 60 * 1000), NOW)).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('shows a dash when there is nothing to report', () => {
    expect(formatLastAttempt(null, NOW)).toBe('—')
  })
})
