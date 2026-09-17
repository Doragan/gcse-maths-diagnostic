import { describe, it, expect } from 'vitest'
import { decideRetention, planRetention, RETENTION_MS, type RetentionCandidate } from './retention'

const DAY = 86400000
const NOW = Date.UTC(2027, 5, 1, 12, 0, 0) // 1 June 2027
const ago = (days: number) => new Date(NOW - days * DAY).toISOString()

const candidate = (over: Partial<RetentionCandidate> = {}): RetentionCandidate => ({
  id: 's1',
  created_at: ago(800),
  last_sign_in_at: ago(800),
  last_attempt_at: null,
  subscription_tier: 'free',
  paid_until: null,
  ...over,
})

describe('decideRetention — the year', () => {
  it('deletes an account untouched for over a year', () => {
    const d = decideRetention(candidate({ last_sign_in_at: ago(400) }), NOW)
    expect(d.delete).toBe(true)
  })

  it('keeps one that signed in inside the year', () => {
    const d = decideRetention(candidate({ last_sign_in_at: ago(364) }), NOW)
    expect(d.delete).toBe(false)
    expect(d.keptBecause).toBe('recent_activity')
  })

  it('keeps an account exactly on the boundary', () => {
    // 365 days to the millisecond is not yet "more than a year". The promise is
    // read against the account, not for us.
    const d = decideRetention(
      candidate({ last_sign_in_at: new Date(NOW - RETENTION_MS).toISOString() }),
      NOW,
    )
    expect(d.delete).toBe(false)
  })
})

describe('decideRetention — what counts as activity', () => {
  it('counts practising, even with no recent sign-in', () => {
    // A student who stays signed in on a school device and practises daily has a
    // stale last_sign_in_at. Deleting them would be absurd.
    const d = decideRetention(
      candidate({ last_sign_in_at: ago(500), last_attempt_at: ago(10) }),
      NOW,
    )
    expect(d.delete).toBe(false)
  })

  it('counts signing in, even with no practice at all', () => {
    const d = decideRetention(
      candidate({ last_sign_in_at: ago(30), last_attempt_at: null }),
      NOW,
    )
    expect(d.delete).toBe(false)
  })

  it('takes the LATEST of the two, not the earliest', () => {
    const d = decideRetention(
      candidate({ last_sign_in_at: ago(400), last_attempt_at: ago(100) }),
      NOW,
    )
    expect(d.lastActivity).toBe(NOW - 100 * DAY)
    expect(d.delete).toBe(false)
  })

  it('falls back to created_at when the account never signed in', () => {
    // Real case: the students row is written at signup, before email
    // confirmation, so last_sign_in_at can be null on a brand-new account.
    const fresh = decideRetention(
      candidate({ created_at: ago(1), last_sign_in_at: null, last_attempt_at: null }),
      NOW,
    )
    expect(fresh.delete).toBe(false)

    const abandoned = decideRetention(
      candidate({ created_at: ago(400), last_sign_in_at: null, last_attempt_at: null }),
      NOW,
    )
    expect(abandoned.delete).toBe(true)
  })
})

describe('decideRetention — refusals to delete', () => {
  it('NEVER deletes an account with a live subscription', () => {
    // Deleting someone's data while taking their money would be indefensible,
    // and a dormant monthly subscriber is exactly who this would otherwise hit.
    const d = decideRetention(
      candidate({
        last_sign_in_at: ago(500),
        subscription_tier: 'paid',
        paid_until: new Date(NOW + 30 * DAY).toISOString(),
      }),
      NOW,
    )
    expect(d.delete).toBe(false)
    expect(d.keptBecause).toBe('paying')
  })

  it('does delete when the subscription has expired too', () => {
    const d = decideRetention(
      candidate({
        last_sign_in_at: ago(500),
        subscription_tier: 'paid',
        paid_until: ago(400),
      }),
      NOW,
    )
    expect(d.delete).toBe(true)
  })

  it('ignores a paid tier with no paid_until — that is not a live subscription', () => {
    const d = decideRetention(
      candidate({ last_sign_in_at: ago(500), subscription_tier: 'paid', paid_until: null }),
      NOW,
    )
    expect(d.delete).toBe(true)
  })

  it('NEVER deletes when no date on the row can be read', () => {
    // "Unknown" must not resolve to "delete".
    const d = decideRetention(
      { id: 's1', created_at: 'not a date', last_sign_in_at: null, last_attempt_at: null },
      NOW,
    )
    expect(d.delete).toBe(false)
    expect(d.keptBecause).toBe('unreadable_dates')
  })

  it('survives a single unparseable date if another is readable', () => {
    const d = decideRetention(
      candidate({ created_at: 'rubbish', last_sign_in_at: ago(10), last_attempt_at: null }),
      NOW,
    )
    expect(d.delete).toBe(false)
    expect(d.lastActivity).toBe(NOW - 10 * DAY)
  })
})

describe('planRetention', () => {
  const stale = (id: string, days: number) =>
    candidate({ id, created_at: ago(days), last_sign_in_at: ago(days) })

  it('caps the blast radius and says it did', () => {
    const plan = planRetention([stale('a', 500), stale('b', 600), stale('c', 700)], NOW, 2)
    expect(plan.eligible).toBe(3)
    expect(plan.toDelete).toHaveLength(2)
    expect(plan.capped).toBe(true)
  })

  it('takes the oldest first', () => {
    const plan = planRetention([stale('a', 400), stale('b', 900), stale('c', 600)], NOW, 2)
    expect(plan.toDelete).toEqual(['b', 'c'])
  })

  it('deletes nothing when nothing qualifies', () => {
    const plan = planRetention([stale('a', 10), stale('b', 20)], NOW, 50)
    expect(plan.toDelete).toEqual([])
    expect(plan.eligible).toBe(0)
    expect(plan.capped).toBe(false)
  })

  it('a cap of zero deletes nothing, whatever qualifies', () => {
    // The dry-run guarantee, as a property rather than a code path.
    const plan = planRetention([stale('a', 900), stale('b', 900)], NOW, 0)
    expect(plan.toDelete).toEqual([])
    expect(plan.eligible).toBe(2)
    expect(plan.capped).toBe(true)
  })

  it('reports a decision for every account, kept or not', () => {
    const plan = planRetention([stale('a', 900), stale('b', 10)], NOW, 50)
    expect(plan.decisions).toHaveLength(2)
  })

  it('today: nothing in the real data is old enough', () => {
    // The oldest account is 27 May 2026, so on 1 June 2026 the job is a no-op —
    // which is why it can ship long before it ever acts.
    const early = Date.UTC(2026, 5, 1)
    const plan = planRetention(
      [candidate({ created_at: '2026-05-27T21:11:18Z', last_sign_in_at: '2026-05-27T21:11:18Z' })],
      early, 50,
    )
    expect(plan.eligible).toBe(0)
  })
})
