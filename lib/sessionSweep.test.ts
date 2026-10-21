import { describe, it, expect } from 'vitest'
import { decideSweep, planSessionSweep, SWEEP_GRACE_MS, type SweepCandidate } from './sessionSweep'

const NOW = new Date('2026-10-20T15:00:00Z').getTime()
const at = (msFromNow: number) => new Date(NOW + msFromNow).toISOString()
const HOUR = 60 * 60 * 1000

const session = (over: Partial<SweepCandidate> = {}): SweepCandidate => ({
  id: 's1',
  status: 'open',
  expires_at: at(HOUR),
  closed_at: null,
  ...over,
})

describe('decideSweep', () => {
  it('keeps a session that is still running', () => {
    const d = decideSweep(session({ expires_at: at(2 * HOUR) }), NOW)
    expect(d.delete).toBe(false)
    expect(d.keptBecause).toBe('still_live')
  })

  it('keeps a just-expired session through the grace period', () => {
    // A teacher often looks at the screen for another minute after a lesson.
    // Emptying the table under them teaches them not to trust it.
    const d = decideSweep(session({ expires_at: at(-5 * 60 * 1000) }), NOW)
    expect(d.delete).toBe(false)
    expect(d.keptBecause).toBe('within_grace')
  })

  it('deletes once the grace period has passed', () => {
    const d = decideSweep(session({ expires_at: at(-SWEEP_GRACE_MS - 1000) }), NOW)
    expect(d.delete).toBe(true)
    expect(d.keptBecause).toBeNull()
  })

  it('treats the exact grace boundary as due', () => {
    // A one-hour grace is over at one hour, so the boundary deletes. Pinned
    // because it is the kind of off-by-one that only ever shows up as "why is
    // this still here" an hour later, and either reading would be defensible
    // if it were not written down.
    expect(decideSweep(session({ expires_at: at(-SWEEP_GRACE_MS) }), NOW).delete).toBe(true)
    expect(decideSweep(session({ expires_at: at(-SWEEP_GRACE_MS + 1) }), NOW).delete).toBe(false)
  })

  it('sweeps from when the teacher CLOSED it, not from the later expiry', () => {
    // Closing early is the teacher saying the lesson is over, so a session
    // closed at 10am goes at 11am rather than waiting for a 2pm expiry.
    const d = decideSweep(session({
      status: 'closed',
      expires_at: at(3 * HOUR),
      closed_at: at(-2 * HOUR),
    }), NOW)
    expect(d.delete).toBe(true)
    expect(d.endedAt).toBe(NOW - 2 * HOUR)
  })

  it('does not let a late closed_at extend the life of an expired session', () => {
    // Whichever came FIRST ends it. A row closed after it had already expired
    // must still be dated from the expiry.
    const d = decideSweep(session({
      status: 'closed',
      expires_at: at(-5 * HOUR),
      closed_at: at(-30 * 60 * 1000),
    }), NOW)
    expect(d.delete).toBe(true)
    expect(d.endedAt).toBe(NOW - 5 * HOUR)
  })

  it('still keeps a freshly closed session through the grace period', () => {
    const d = decideSweep(session({
      status: 'closed',
      expires_at: at(3 * HOUR),
      closed_at: at(-60 * 1000),
    }), NOW)
    expect(d.delete).toBe(false)
    expect(d.keptBecause).toBe('within_grace')
  })

  it('keeps and flags a session whose dates cannot be read', () => {
    // Defensive: both columns are timestamptz. Keeping is the safe direction
    // for an unexplained row, and the route logs it loudly so a person looks
    // rather than rows being destroyed on a parse failure.
    const d = decideSweep(session({ expires_at: 'not a date', closed_at: null }), NOW)
    expect(d.delete).toBe(false)
    expect(d.keptBecause).toBe('unreadable_dates')
    expect(d.endedAt).toBeNull()
  })

  it('falls back to closed_at when expires_at is unreadable', () => {
    const d = decideSweep(session({
      expires_at: 'not a date',
      closed_at: at(-2 * HOUR),
    }), NOW)
    expect(d.delete).toBe(true)
    expect(d.endedAt).toBe(NOW - 2 * HOUR)
  })
})

describe('planSessionSweep', () => {
  it('separates due from kept, with the reason', () => {
    const plan = planSessionSweep([
      session({ id: 'live',   expires_at: at(HOUR) }),
      session({ id: 'grace',  expires_at: at(-60 * 1000) }),
      session({ id: 'stale',  expires_at: at(-5 * HOUR) }),
    ], NOW, 100)

    expect(plan.due.map(d => d.id)).toEqual(['stale'])
    expect(plan.kept.map(k => k.keptBecause).sort()).toEqual(['still_live', 'within_grace'])
    expect(plan.capped).toBe(false)
  })

  it('takes the oldest first, so a backlog drains in order', () => {
    const plan = planSessionSweep([
      session({ id: 'newer', expires_at: at(-2 * HOUR) }),
      session({ id: 'oldest', expires_at: at(-9 * HOUR) }),
      session({ id: 'middle', expires_at: at(-5 * HOUR) }),
    ], NOW, 100)
    expect(plan.due.map(d => d.id)).toEqual(['oldest', 'middle', 'newer'])
  })

  it('caps the run and says so, keeping the rest for next time', () => {
    const many = Array.from({ length: 5 }, (_, i) =>
      session({ id: `s${i}`, expires_at: at(-(i + 2) * HOUR) }))
    const plan = planSessionSweep(many, NOW, 2)
    expect(plan.due).toHaveLength(2)
    expect(plan.capped).toBe(true)
    // Oldest first: s4 and s3 have the earliest expiries.
    expect(plan.due.map(d => d.id)).toEqual(['s4', 's3'])
  })

  it('deletes nothing with a cap of zero, and reports being capped', () => {
    const plan = planSessionSweep([session({ expires_at: at(-5 * HOUR) })], NOW, 0)
    expect(plan.due).toHaveLength(0)
    expect(plan.capped).toBe(true)
  })

  it('handles an empty table', () => {
    const plan = planSessionSweep([], NOW, 100)
    expect(plan.due).toHaveLength(0)
    expect(plan.kept).toHaveLength(0)
    expect(plan.capped).toBe(false)
  })

  it('never deletes a live session however big the backlog', () => {
    // The property that matters most: a bug in the cap or the sort must not
    // reach a session a class is sitting in.
    const many = Array.from({ length: 50 }, (_, i) =>
      session({ id: `old${i}`, expires_at: at(-(i + 2) * HOUR) }))
    const plan = planSessionSweep([...many, session({ id: 'inLesson', expires_at: at(HOUR) })], NOW, 100)
    expect(plan.due.map(d => d.id)).not.toContain('inLesson')
  })
})
