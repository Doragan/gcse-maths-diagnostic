import { describe, it, expect } from 'vitest'
import { buildReengagementEmail } from './reengagement'

const base = {
  displayName: 'Jamie Smith',
  totalAttempts: 14,
  skillNames: ['Expanding brackets', 'Fractions of an amount'],
  dashboardUrl: 'https://mathsense.net/api/email/click?s=abc',
  unsubscribeUrl: 'https://mathsense.net/api/email/unsubscribe?s=abc',
}

describe('buildReengagementEmail', () => {
  it('greets by first name only and personalises the subject', () => {
    const { subject, html, text } = buildReengagementEmail(base)
    expect(subject).toBe('Ready for your next Mathsense session, Jamie?')
    expect(html).toContain('Hi Jamie,')
    expect(text).toContain('Hi Jamie,')
    // Never leak the surname into the greeting.
    expect(html).not.toContain('Hi Jamie Smith')
  })

  it('states the real question count and up to two real skills', () => {
    const { html } = buildReengagementEmail(base)
    expect(html).toContain('14 questions')
    expect(html).toContain('Expanding brackets and Fractions of an amount')
  })

  it('caps the skill list at two even when more are supplied', () => {
    const { html } = buildReengagementEmail({
      ...base,
      skillNames: ['Pythagoras', 'Rounding', 'Vectors', 'Histograms'],
    })
    expect(html).toContain('Pythagoras and Rounding')
    // The third and fourth skills must not leak into the email.
    expect(html).not.toContain('Vectors')
    expect(html).not.toContain('Histograms')
  })

  it('handles a missing name with a neutral greeting', () => {
    const { subject, html } = buildReengagementEmail({ ...base, displayName: '' })
    expect(subject).toBe('Ready for your next Mathsense session?')
    expect(html).toContain('Hi there,')
  })

  it('reads as singular for a single question and omits skills when none', () => {
    const { html } = buildReengagementEmail({ ...base, totalAttempts: 1, skillNames: [] })
    expect(html).toContain('1 question')
    expect(html).not.toContain('1 questions')
    expect(html).not.toContain('including some on')
  })

  it('always includes the CTA and unsubscribe links', () => {
    const { html, text } = buildReengagementEmail(base)
    expect(html).toContain(base.dashboardUrl)
    expect(html).toContain(base.unsubscribeUrl)
    expect(text).toContain(base.dashboardUrl)
    expect(text).toContain(base.unsubscribeUrl)
  })

  it('never mentions a non-existent "skill map" feature', () => {
    const { html, text } = buildReengagementEmail(base)
    expect(html.toLowerCase()).not.toContain('skill map')
    expect(text.toLowerCase()).not.toContain('skill map')
  })

  it('escapes markup in dynamic values to prevent HTML injection', () => {
    const { html } = buildReengagementEmail({
      ...base,
      displayName: '<script>evil</script> Smith',
    })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
