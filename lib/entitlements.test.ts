import { describe, it, expect } from 'vitest'
import { isPaidStudent } from './entitlements'

// Revenue-critical: this single predicate decides premium access. Lock it down.
describe('isPaidStudent', () => {
  const future = new Date(Date.now() + 86_400_000).toISOString()
  const past   = new Date(Date.now() - 86_400_000).toISOString()

  it('grants access on a paid tier with an unexpired paid_until', () => {
    expect(isPaidStudent({ subscription_tier: 'paid', paid_until: future })).toBe(true)
  })

  it('denies access when paid_until has expired', () => {
    expect(isPaidStudent({ subscription_tier: 'paid', paid_until: past })).toBe(false)
  })

  it('denies access when paid_until is null', () => {
    expect(isPaidStudent({ subscription_tier: 'paid', paid_until: null })).toBe(false)
  })

  it('denies a free tier even with a future paid_until', () => {
    expect(isPaidStudent({ subscription_tier: 'free', paid_until: future })).toBe(false)
  })

  it('class membership grants access regardless of personal grant', () => {
    expect(isPaidStudent({ subscription_tier: 'free', paid_until: null, activeClassMembership: true })).toBe(true)
    expect(isPaidStudent({ subscription_tier: 'free', paid_until: past, activeClassMembership: true })).toBe(true)
  })

  it('a paused personal grant (null paid_until) stays premium via class membership', () => {
    // Mirrors the documented pause-and-bank behaviour.
    expect(isPaidStudent({ subscription_tier: 'paid', paid_until: null, activeClassMembership: true })).toBe(true)
  })
})
