import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'

// Set the signing secret before any sign/verify runs (read lazily at call time).
beforeAll(() => { process.env.PARENT_PAY_SECRET = 'test-secret-key' })
afterEach(() => { vi.useRealTimers() })

import { signPayToken, verifyPayToken } from './parentPay'

const SID = '11111111-2222-3333-4444-555555555555'

describe('parentPay tokens', () => {
  it('round-trips a signed token back to the student id', () => {
    expect(verifyPayToken(signPayToken(SID))).toEqual({ studentId: SID })
  })

  it('rejects a tampered signature', () => {
    const token = signPayToken(SID)
    const [payload, sig] = token.split('.')
    const flipped = sig.slice(0, -1) + (sig.endsWith('A') ? 'B' : 'A')
    expect(verifyPayToken(`${payload}.${flipped}`)).toBeNull()
  })

  it('rejects a tampered payload (signature no longer matches)', () => {
    const token = signPayToken(SID)
    const [, sig] = token.split('.')
    const forged = Buffer.from(JSON.stringify({ sid: 'someone-else', exp: 9999999999 }), 'utf8').toString('base64url')
    expect(verifyPayToken(`${forged}.${sig}`)).toBeNull()
  })

  it('rejects malformed tokens', () => {
    expect(verifyPayToken('')).toBeNull()
    expect(verifyPayToken('no-dot')).toBeNull()
    expect(verifyPayToken('a.b.c')).toBeNull()
  })

  it('rejects an expired token', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const token = signPayToken(SID) // 30-day expiry from this instant
    vi.setSystemTime(new Date('2026-03-01T00:00:00Z')) // ~59 days later
    expect(verifyPayToken(token)).toBeNull()
  })

  it('rejects a token signed with a different secret', () => {
    const token = signPayToken(SID)
    process.env.PARENT_PAY_SECRET = 'a-different-secret'
    expect(verifyPayToken(token)).toBeNull()
    process.env.PARENT_PAY_SECRET = 'test-secret-key' // restore
  })
})
