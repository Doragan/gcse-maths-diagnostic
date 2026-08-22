import { describe, it, expect } from 'vitest'
import { PLANS, planPricing, seatsLeftLabel, wantedFeatureLabel, FOUNDER_SEAT_CAP } from './studentPlans'

const exam = PLANS.find(p => p.id === 'exam')!
const annual = PLANS.find(p => p.id === 'annual')!

// Revenue-facing: this display logic decides which price a buyer SEES. The
// actual charge is decided server-side (priceIdFor) — kept in lockstep here.
describe('planPricing (founder sale display)', () => {
  it('shows the founder price with the standard price struck through while seats remain', () => {
    const p = planPricing(exam, 42)
    expect(p.founderOpen).toBe(true)
    expect(p.price).toBe('£4.99')
    expect(p.strikePrice).toBe('£9.99')
    expect(p.badge).toBe('Founder price')
  })

  it('treats unknown seat count (null) as open — never flashes the higher price', () => {
    const p = planPricing(exam, null)
    expect(p.founderOpen).toBe(true)
    expect(p.price).toBe('£4.99')
  })

  it('reverts to the standard price with no badge once the founder offer is closed', () => {
    const p = planPricing(exam, 0)
    expect(p.founderOpen).toBe(false)
    expect(p.price).toBe('£9.99')
    expect(p.strikePrice).toBeNull()
    expect(p.badge).toBeNull()
  })

  it('leaves non-founder plans untouched by the seat count', () => {
    const p = planPricing(annual, 0)
    expect(p.founderOpen).toBe(false)
    expect(p.price).toBe('£11.99')
    expect(p.strikePrice).toBeNull()
    expect(p.badge).toBe('Best value')
  })
})

describe('seatsLeftLabel', () => {
  it('renders a count while seats remain', () => {
    expect(seatsLeftLabel(7)).toBe(`7 of ${FOUNDER_SEAT_CAP} founder seats left`)
  })
  it('renders nothing when unknown or closed', () => {
    expect(seatsLeftLabel(null)).toBeNull()
    expect(seatsLeftLabel(0)).toBeNull()
  })
})

describe('wantedFeatureLabel', () => {
  it('names the skill the student reached for', () => {
    expect(wantedFeatureLabel('skill', 'Ratio'))
      .toBe('You wanted to drill ratio on its own.')
  })

  it('falls back to a generic line when the skill is unknown', () => {
    // A ?want=skill with a skill id that no longer resolves must still say
    // something true rather than "drill null on its own".
    expect(wantedFeatureLabel('skill', null))
      .toBe('You wanted to drill one skill on its own.')
  })

  it('covers the other locked focus modes', () => {
    expect(wantedFeatureLabel('topic', null)).toContain('whole topic')
    expect(wantedFeatureLabel('weakspots', null)).toContain('weak spots')
  })

  it('shows nothing for an absent or unrecognised want', () => {
    // Degrades to the plain pricing page rather than asserting something wrong.
    expect(wantedFeatureLabel(null, null)).toBeNull()
    expect(wantedFeatureLabel(undefined, null)).toBeNull()
    expect(wantedFeatureLabel('something-invented', null)).toBeNull()
  })
})
