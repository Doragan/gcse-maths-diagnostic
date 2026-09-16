import { describe, it, expect } from 'vitest'
import { examPeriodOf, resolveMiniExamQuota, FREE_MINI_EXAMS_PER_MONTH } from './monthlyQuota'

// Midday UTC dates so the Europe/London offset never tips them into an
// adjacent month.
const at = (iso: string) => new Date(iso)

describe('examPeriodOf', () => {
  it('formats the month as YYYY-MM', () => {
    expect(examPeriodOf(at('2026-07-15T12:00:00Z'))).toBe('2026-07')
    expect(examPeriodOf(at('2026-01-01T12:00:00Z'))).toBe('2026-01')
    expect(examPeriodOf(at('2026-12-31T12:00:00Z'))).toBe('2026-12')
  })
})

describe('resolveMiniExamQuota — free student', () => {
  const now = at('2026-07-15T12:00:00Z')

  it('allows the first generation of the month', () => {
    const d = resolveMiniExamQuota({ period: null, used: 0 }, now, false)
    expect(d.allowed).toBe(true)
    expect(d.remaining).toBe(1)
    expect(d.next).toEqual({ period: '2026-07', used: 1 })
  })

  it('blocks a second generation in the same month', () => {
    const d = resolveMiniExamQuota({ period: '2026-07', used: 1 }, now, false)
    expect(d.allowed).toBe(false)
    expect(d.remaining).toBe(0)
    // next still points at the current period so a persist is idempotent.
    expect(d.next.period).toBe('2026-07')
  })

  it('resets when the stored counter is from an earlier month', () => {
    const d = resolveMiniExamQuota({ period: '2026-06', used: 1 }, now, false)
    expect(d.allowed).toBe(true)
    expect(d.remaining).toBe(1)
    expect(d.usedThisPeriod).toBe(0)
    expect(d.next).toEqual({ period: '2026-07', used: 1 })
  })

  it('treats a future-dated stored period as not-current too (rolls to now)', () => {
    const d = resolveMiniExamQuota({ period: '2099-01', used: 5 }, now, false)
    expect(d.allowed).toBe(true)
    expect(d.usedThisPeriod).toBe(0)
    expect(d.next.period).toBe('2026-07')
  })

  it('honours a custom limit', () => {
    expect(resolveMiniExamQuota({ period: '2026-07', used: 2 }, now, false, 3).allowed).toBe(true)
    expect(resolveMiniExamQuota({ period: '2026-07', used: 3 }, now, false, 3).allowed).toBe(false)
  })

  it('defaults to one per month', () => {
    expect(FREE_MINI_EXAMS_PER_MONTH).toBe(1)
  })
})

describe('resolveMiniExamQuota — paid student', () => {
  const now = at('2026-07-15T12:00:00Z')

  it('is always allowed with unlimited remaining', () => {
    const d = resolveMiniExamQuota({ period: '2026-07', used: 99 }, now, true)
    expect(d.allowed).toBe(true)
    expect(d.remaining).toBe(null)
  })

  it('does NOT consume the free allowance', () => {
    // The counter rations the free tier. A paid generation rations nothing, so
    // writing it back would charge for something that was never limited.
    expect(resolveMiniExamQuota({ period: '2026-07', used: 0 }, now, true).persist).toBe(false)
    expect(resolveMiniExamQuota({ period: null, used: 0 }, now, true).persist).toBe(false)
  })

  it('a free generation still consumes it', () => {
    expect(resolveMiniExamQuota({ period: '2026-07', used: 0 }, now, false).persist).toBe(true)
  })
})

describe('resolveMiniExamQuota — a school grant that lapses mid-month', () => {
  // The case this rule exists for. A covered student runs a mini-exam, then the
  // school's grant expires before the month is out. They must not be worse off
  // than a student the school never covered at all.
  const now = at('2026-07-15T12:00:00Z')

  it('leaves the free allowance intact for the rest of the month', () => {
    // 1st: covered, and runs one. Nothing is written, so the stored counter
    // stays where it was.
    const covered = resolveMiniExamQuota({ period: null, used: 0 }, now, true)
    expect(covered.allowed).toBe(true)
    expect(covered.persist).toBe(false)

    // The grant lapses. The row is untouched, so they still hold their one.
    const afterLapse = resolveMiniExamQuota({ period: null, used: 0 }, now, false)
    expect(afterLapse.allowed).toBe(true)
    expect(afterLapse.remaining).toBe(1)
  })

  it('matches a student who was never covered', () => {
    const neverCovered = resolveMiniExamQuota({ period: null, used: 0 }, now, false)
    const wasCovered = resolveMiniExamQuota({ period: null, used: 0 }, now, false)
    expect(wasCovered.remaining).toBe(neverCovered.remaining)
  })

  it('still respects an allowance the student had already spent while free', () => {
    // Being covered does not REFUND a generation used before the grant began.
    const d = resolveMiniExamQuota({ period: '2026-07', used: 1 }, now, false)
    expect(d.allowed).toBe(false)
    expect(d.remaining).toBe(0)
  })
})
