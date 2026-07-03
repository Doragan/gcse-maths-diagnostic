/**
 * Stripe price-id mapping for the student plans — server-only (reads env price
 * IDs). Shared by /api/stripe/student-checkout and /api/parent-pay/checkout so
 * the plan→price mapping lives in exactly one place.
 */

import type { Plan } from './studentPlans'

export const PRICE_IDS: Record<Plan, string> = {
  monthly: process.env.STRIPE_STUDENT_MONTHLY_PRICE_ID!,
  annual:  process.env.STRIPE_STUDENT_ANNUAL_PRICE_ID!,
  exam:    process.env.STRIPE_STUDENT_EXAM_PRICE_ID!,
}

/** True for the recurring plans; false for the one-off exam season pass. */
export function isSubscriptionPlan(plan: Plan): boolean {
  return plan === 'monthly' || plan === 'annual'
}

/** Narrow an arbitrary string to a known plan (or null). */
export function toPlan(value: unknown): Plan | null {
  return value === 'monthly' || value === 'annual' || value === 'exam' ? value : null
}
