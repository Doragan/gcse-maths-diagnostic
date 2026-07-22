/**
 * Stripe price-id mapping for the student plans — server-only (reads env price
 * IDs). Shared by /api/stripe/student-checkout and /api/parent-pay/checkout so
 * the plan→price mapping lives in exactly one place.
 */

import type { Plan } from './studentPlans'

export const PRICE_IDS: Record<Plan, string> = {
  monthly: process.env.STRIPE_STUDENT_MONTHLY_PRICE_ID!,
  annual:  process.env.STRIPE_STUDENT_ANNUAL_PRICE_ID!,
  exam:    process.env.STRIPE_STUDENT_EXAM_PRICE_ID!,   // standard (£9.99) exam pass
}

/**
 * The discounted founder price for the 2027 exam pass (first 100 seats). Falls
 * back to the standard exam price if the dedicated founder price isn't set, so
 * the offer degrades gracefully rather than 500-ing during checkout.
 */
const EXAM_FOUNDER_PRICE_ID = process.env.STRIPE_STUDENT_EXAM_FOUNDER_PRICE_ID

/**
 * The Stripe price id to charge for a plan. For the exam pass, `founder: true`
 * (i.e. seats still remain) selects the discounted founder price; once the
 * founder offer is closed the standard price is used. All other plans ignore the
 * flag.
 */
export function priceIdFor(plan: Plan, opts?: { founder?: boolean }): string {
  if (plan === 'exam' && opts?.founder && EXAM_FOUNDER_PRICE_ID) {
    return EXAM_FOUNDER_PRICE_ID
  }
  return PRICE_IDS[plan]
}

/** True for the recurring plans; false for the one-off exam season pass. */
export function isSubscriptionPlan(plan: Plan): boolean {
  return plan === 'monthly' || plan === 'annual'
}

/** Narrow an arbitrary string to a known plan (or null). */
export function toPlan(value: unknown): Plan | null {
  return value === 'monthly' || value === 'annual' || value === 'exam' ? value : null
}
