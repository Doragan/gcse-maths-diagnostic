import { describe, it, expect } from 'vitest'
import {
  isTerminalStatus,
  subscriptionToCancel,
  isMissingFromStripe,
  mayProceedToDelete,
  describeOutcome,
  TERMINAL_STATUSES,
  type CancelOutcome,
} from './subscriptionCancel'

describe('isTerminalStatus — which subscriptions can still charge', () => {
  it('treats the two dead statuses as terminal', () => {
    expect(isTerminalStatus('canceled')).toBe(true)
    expect(isTerminalStatus('incomplete_expired')).toBe(true)
  })

  it('treats every billable status as NOT terminal', () => {
    for (const s of ['active', 'trialing', 'past_due', 'unpaid', 'incomplete', 'paused']) {
      expect(isTerminalStatus(s)).toBe(false)
    }
  })

  // The direction that matters: an unrecognised status must mean "try to
  // cancel", never "assume it is already dead and walk away".
  it('treats an unknown status as still billable', () => {
    expect(isTerminalStatus('some_future_stripe_status')).toBe(false)
  })

  it('treats null, undefined and empty as still billable', () => {
    expect(isTerminalStatus(null)).toBe(false)
    expect(isTerminalStatus(undefined)).toBe(false)
    expect(isTerminalStatus('')).toBe(false)
    expect(isTerminalStatus('   ')).toBe(false)
  })

  it('is not fooled by case or padding', () => {
    expect(isTerminalStatus('CANCELED')).toBe(true)
    expect(isTerminalStatus('  canceled  ')).toBe(true)
  })

  // Guards the British/American spelling trap: Stripe spells it "canceled".
  it('does not accept the British spelling, which Stripe never sends', () => {
    expect(isTerminalStatus('cancelled')).toBe(false)
    expect(TERMINAL_STATUSES).toContain('canceled')
  })
})

describe('subscriptionToCancel — is there anything to cancel', () => {
  it('returns the id when one is present', () => {
    expect(subscriptionToCancel({ stripe_subscription_id: 'sub_123' })).toBe('sub_123')
  })

  it('trims surrounding whitespace', () => {
    expect(subscriptionToCancel({ stripe_subscription_id: '  sub_123 ' })).toBe('sub_123')
  })

  it('returns null for null, undefined and empty ids', () => {
    expect(subscriptionToCancel({ stripe_subscription_id: null })).toBeNull()
    expect(subscriptionToCancel({ stripe_subscription_id: undefined })).toBeNull()
    expect(subscriptionToCancel({ stripe_subscription_id: '' })).toBeNull()
    expect(subscriptionToCancel({ stripe_subscription_id: '   ' })).toBeNull()
  })

  // A teacher has no such column, and no row is returned for a teacher at all.
  it('returns null when there is no account row, which is every teacher', () => {
    expect(subscriptionToCancel(null)).toBeNull()
    expect(subscriptionToCancel(undefined)).toBeNull()
    expect(subscriptionToCancel({})).toBeNull()
  })

  it('ignores a non-string id rather than throwing', () => {
    expect(subscriptionToCancel({ stripe_subscription_id: 12345 as unknown as string })).toBeNull()
  })
})

describe('isMissingFromStripe — a 404 is a green light, not a failure', () => {
  it('recognises the resource_missing code', () => {
    expect(isMissingFromStripe({ code: 'resource_missing' })).toBe(true)
  })

  it('recognises a 404 status', () => {
    expect(isMissingFromStripe({ statusCode: 404 })).toBe(true)
  })

  // The cases that must NOT be waved through: if Stripe is down or refusing us,
  // we do not know whether the subscription is still charging.
  it('does not treat an outage or an auth failure as missing', () => {
    expect(isMissingFromStripe({ statusCode: 500 })).toBe(false)
    expect(isMissingFromStripe({ statusCode: 401, code: 'api_key_expired' })).toBe(false)
    expect(isMissingFromStripe({ statusCode: 429, code: 'rate_limit' })).toBe(false)
    expect(isMissingFromStripe(new Error('network timeout'))).toBe(false)
  })

  it('handles junk without throwing', () => {
    expect(isMissingFromStripe(null)).toBe(false)
    expect(isMissingFromStripe(undefined)).toBe(false)
    expect(isMissingFromStripe('resource_missing')).toBe(false)
    expect(isMissingFromStripe(404)).toBe(false)
  })

  // Reading the shape, not the prose: Stripe's wording is not a stable interface.
  it('does not depend on the error message', () => {
    expect(isMissingFromStripe({ message: 'No such subscription: sub_1' })).toBe(false)
    expect(isMissingFromStripe({ message: 'anything at all', code: 'resource_missing' })).toBe(true)
  })
})

describe('mayProceedToDelete — every outcome is a green light', () => {
  const outcomes: CancelOutcome[] = [
    { kind: 'none' },
    { kind: 'already_ended', subscriptionId: 'sub_1', status: 'canceled' },
    { kind: 'not_in_stripe', subscriptionId: 'sub_1' },
    { kind: 'cancelled', subscriptionId: 'sub_1' },
  ]

  it('allows deletion for every outcome the route can reach', () => {
    for (const o of outcomes) expect(mayProceedToDelete(o)).toBe(true)
  })

  // The blocking case produces no outcome at all — the route throws before it
  // gets one — so there is deliberately no CancelOutcome meaning "stop".
  it('gives every outcome a log line', () => {
    for (const o of outcomes) expect(describeOutcome(o).length).toBeGreaterThan(0)
  })

  it('names the subscription in the line for the case that cost money', () => {
    expect(describeOutcome({ kind: 'cancelled', subscriptionId: 'sub_abc' })).toContain('sub_abc')
  })
})
