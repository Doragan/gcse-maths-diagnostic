import { describe, it, expect } from 'vitest'
import { buildTeacherSignupAlert, formatSignupTime } from './teacherSignupAlert'

const base = {
  email: 'r.okafor@northgate.sch.uk',
  displayName: 'Mr Okafor',
  signedUpAt: '2026-11-11T14:32:09.000Z',
  method: 'email' as const,
  totalTeachers: 7,
}

describe('formatSignupTime', () => {
  it('formats in UTC, not the server\'s local zone', () => {
    // 23:45 UTC is the next day in BST and the previous day west of Greenwich.
    // The label must not move with the box this runs on.
    expect(formatSignupTime('2026-11-11T23:45:00.000Z')).toBe('11 Nov 2026, 23:45 UTC')
    expect(formatSignupTime('2026-07-01T00:05:00.000Z')).toBe('1 Jul 2026, 00:05 UTC')
  })

  it('pads the clock but not the date', () => {
    expect(formatSignupTime('2026-01-05T09:07:00.000Z')).toBe('5 Jan 2026, 09:07 UTC')
  })

  it('returns the raw value rather than "Invalid Date" when it cannot parse', () => {
    // A broken timestamp must not be what stops the alert: the address is the
    // part that matters, and "Invalid Date" in an ops email hides the reason.
    expect(formatSignupTime('not a date')).toBe('not a date')
  })
})

describe('buildTeacherSignupAlert', () => {
  it('names the teacher in the subject, which is what gets read on a lock screen', () => {
    expect(buildTeacherSignupAlert(base).subject).toBe('New teacher signup: Mr Okafor')
  })

  it('falls back to the address when no name was given', () => {
    const { subject, text } = buildTeacherSignupAlert({ ...base, displayName: null })
    expect(subject).toBe('New teacher signup: r.okafor@northgate.sch.uk')
    // And says the blank is expected, so it doesn't read as missing data.
    expect(text).toContain('(not given — optional at signup)')
  })

  it('treats a whitespace-only name as no name', () => {
    expect(buildTeacherSignupAlert({ ...base, displayName: '   ' }).subject)
      .toBe('New teacher signup: r.okafor@northgate.sch.uk')
  })

  it('always carries the address in the body — the alert is useless without it', () => {
    const { text } = buildTeacherSignupAlert(base)
    expect(text).toContain('r.okafor@northgate.sch.uk')
    expect(text).toContain('11 Nov 2026, 14:32 UTC')
  })

  it('says which signup path it came from', () => {
    expect(buildTeacherSignupAlert(base).text).toContain('Email and password')
    expect(buildTeacherSignupAlert({ ...base, method: 'google' }).text).toContain('Google sign-in')
  })

  it('states the running total, and reads as singular at one', () => {
    expect(buildTeacherSignupAlert(base).text).toContain('7 accounts in total')
    const first = buildTeacherSignupAlert({ ...base, totalTeachers: 1 }).text
    expect(first).toContain('1 account in total')
    expect(first).not.toContain('1 accounts')
  })

  it('omits the total rather than inventing one when the count failed', () => {
    const { text } = buildTeacherSignupAlert({ ...base, totalTeachers: null })
    expect(text).not.toContain('in total')
    // Everything else still there.
    expect(text).toContain('r.okafor@northgate.sch.uk')
  })

  it('is an internal notice: no unsubscribe link, no tracking, no CTA button', () => {
    const { text } = buildTeacherSignupAlert(base)
    expect(text.toLowerCase()).not.toContain('unsubscribe?')
    expect(text).not.toContain('/api/email/click')
    expect(text).toContain('never twice')
  })
})
