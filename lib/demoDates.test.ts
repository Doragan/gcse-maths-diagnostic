import { describe, it, expect } from 'vitest'
import { demoAnchor, demoDate, demoDateIso, demoMonthLabel } from './demoDates'

describe('demoDates', () => {
  it('anchors on the UTC calendar day', () => {
    expect(demoAnchor(new Date('2026-08-09T23:30:00Z'))).toBe('2026-08-09')
  })

  it('formats past and future offsets for display', () => {
    expect(demoDate('2026-08-09', 0)).toBe('9 Aug 2026')
    expect(demoDate('2026-08-09', -18)).toBe('22 Jul 2026')
    expect(demoDate('2026-08-09', 9)).toBe('18 Aug 2026')
  })

  it('crosses month and year boundaries', () => {
    expect(demoDate('2026-01-05', -10)).toBe('26 Dec 2025')
    expect(demoDateIso('2026-01-05', -10)).toBe('2025-12-26')
    expect(demoMonthLabel('2026-01-05', -10)).toBe('Dec 25')
  })

  it('keeps iso output sortable and comparable', () => {
    expect(demoDateIso('2026-08-09', -1) < demoDateIso('2026-08-09', 0)).toBe(true)
  })

  // The whole point of the module: a demo rendered a year later must not still
  // be showing last year's dates.
  it('moves with the anchor', () => {
    expect(demoDate('2027-03-01', -30)).toBe('30 Jan 2027')
    expect(demoMonthLabel('2027-03-01', -30)).toBe('Jan 27')
  })
})
