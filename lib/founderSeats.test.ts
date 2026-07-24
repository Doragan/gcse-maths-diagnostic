import { describe, it, expect } from 'vitest'
import { founderSeatsUsed, founderSeatsLeft, STUDENT_EXAM_PASS_UNTIL, FOUNDER_SEAT_CAP } from './founderSeats'

// Minimal fake Supabase query builder: chainable + thenable, so
// `await admin.from(...).select(...).eq(...).eq(...).is(...)` resolves to a
// fixed { count, error } result. Records every filter call so a test can assert
// exactly which columns/values were filtered on.
function fakeAdmin(result: { count: number | null; error: { code?: string } | null }) {
  const calls: { method: string; args: unknown[] }[] = []
  const builder: Record<string, unknown> = {}
  for (const method of ['from', 'select', 'eq', 'not', 'is']) {
    builder[method] = (...args: unknown[]) => { calls.push({ method, args }); return builder }
  }
  builder.then = (resolve: (r: typeof result) => void) => resolve(result)
  return { admin: builder as any, calls } // eslint-disable-line @typescript-eslint/no-explicit-any
}

describe('founderSeatsUsed', () => {
  // Regression: production had two pre-existing test accounts with an unrelated
  // paid_until ('2026-09-30', not the exam-pass expiry) and no subscription id.
  // The original filter — "paid_until IS NOT NULL" — miscounted both as founder
  // seats (98/100 left with zero real purchases). The fix filters on the EXACT
  // exam-pass expiry, which only the webhook's exam-pass branch ever writes.
  it('filters on the exact exam-pass expiry, not merely "any paid_until"', async () => {
    const { admin, calls } = fakeAdmin({ count: 0, error: null })
    await founderSeatsUsed(admin)

    const eqCalls = calls.filter(c => c.method === 'eq')
    expect(eqCalls).toContainEqual({ method: 'eq', args: ['paid_until', STUDENT_EXAM_PASS_UNTIL] })
    expect(calls.some(c => c.method === 'not' && c.args[0] === 'paid_until')).toBe(false)
  })

  it('returns the count on success', async () => {
    const { admin } = fakeAdmin({ count: 3, error: null })
    expect(await founderSeatsUsed(admin)).toBe(3)
  })

  it('fails open (0 used) on a query error', async () => {
    const { admin } = fakeAdmin({ count: null, error: { code: '42P01' } })
    expect(await founderSeatsUsed(admin)).toBe(0)
  })
})

describe('founderSeatsLeft', () => {
  it('subtracts used seats from the cap', async () => {
    const { admin } = fakeAdmin({ count: 40, error: null })
    expect(await founderSeatsLeft(admin)).toBe(FOUNDER_SEAT_CAP - 40)
  })

  it('never goes negative if usage somehow exceeds the cap', async () => {
    const { admin } = fakeAdmin({ count: FOUNDER_SEAT_CAP + 5, error: null })
    expect(await founderSeatsLeft(admin)).toBe(0)
  })
})
