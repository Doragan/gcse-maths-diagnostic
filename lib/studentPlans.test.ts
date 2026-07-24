import { describe, it, expect } from 'vitest'
import { PLANS, planPricing, seatsLeftLabel, FOUNDER_SEAT_CAP } from './studentPlans'

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
