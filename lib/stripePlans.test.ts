import { describe, it, expect } from 'vitest'

// stripePlans reads price ids from env at module load, so set them BEFORE the
// (dynamic) import — a static import would be hoisted above these assignments.
describe('priceIdFor (founder vs standard exam price)', () => {
  it('picks the founder price for the exam pass only when seats remain', async () => {
    process.env.STRIPE_STUDENT_MONTHLY_PRICE_ID = 'price_monthly'
    process.env.STRIPE_STUDENT_ANNUAL_PRICE_ID = 'price_annual'
    process.env.STRIPE_STUDENT_EXAM_PRICE_ID = 'price_exam_standard'
    process.env.STRIPE_STUDENT_EXAM_FOUNDER_PRICE_ID = 'price_exam_founder'
    const { priceIdFor } = await import('./stripePlans')

    expect(priceIdFor('exam', { founder: true })).toBe('price_exam_founder')
    expect(priceIdFor('exam', { founder: false })).toBe('price_exam_standard')
    expect(priceIdFor('exam')).toBe('price_exam_standard')
    // The flag only affects the exam pass.
    expect(priceIdFor('annual', { founder: true })).toBe('price_annual')
  })
})
