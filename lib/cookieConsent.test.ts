import { describe, it, expect } from 'vitest'
import {
  parseConsent,
  consentValue,
  shouldShowBanner,
  CONSENT_KEY,
} from './cookieConsent'

describe('parseConsent — reading the stored choice', () => {
  it('reads the two recorded decisions', () => {
    expect(parseConsent('true')).toBe('accepted')
    expect(parseConsent('false')).toBe('declined')
  })

  it('treats a missing value as undecided, so the banner asks', () => {
    expect(parseConsent(null)).toBe('undecided')
    expect(parseConsent(undefined)).toBe('undecided')
    expect(parseConsent('')).toBe('undecided')
  })

  // The direction that matters: a corrupted or half-written value must never
  // read as consent, because consent is the state that sends data to Google.
  it('treats anything unrecognised as undecided rather than accepted', () => {
    expect(parseConsent('yes')).toBe('undecided')
    expect(parseConsent('TRUE')).toBe('undecided')
    expect(parseConsent('1')).toBe('undecided')
    expect(parseConsent('{}')).toBe('undecided')
    expect(parseConsent(' true ')).toBe('undecided')
  })
})

describe('consentValue — what gets stored', () => {
  it('round-trips both decisions', () => {
    expect(parseConsent(consentValue('accepted'))).toBe('accepted')
    expect(parseConsent(consentValue('declined'))).toBe('declined')
  })

  // Backwards compatibility: every visitor who already accepted stored "true",
  // and must keep their choice across this change rather than be asked again.
  it('keeps "true" for accept, so existing choices survive the change', () => {
    expect(consentValue('accepted')).toBe('true')
  })

  it('uses the key the original implementation wrote', () => {
    expect(CONSENT_KEY).toBe('cookie-consent')
  })
})

describe('shouldShowBanner — the fairness property', () => {
  it('asks only when no choice has been recorded', () => {
    expect(shouldShowBanner('undecided')).toBe(true)
  })

  // The defect this closes: decline was never persisted, so the banner
  // reappeared on every visit while accept was remembered forever. An interface
  // that forgets "no" and remembers "yes" keeps asking until it gets the answer
  // it wants. Most users here are 13 to 16.
  it('does not re-ask someone who declined', () => {
    expect(shouldShowBanner('declined')).toBe(false)
  })

  it('does not re-ask someone who accepted', () => {
    expect(shouldShowBanner('accepted')).toBe(false)
  })

  it('treats both decisions identically for re-asking', () => {
    expect(shouldShowBanner('declined')).toBe(shouldShowBanner('accepted'))
  })
})
