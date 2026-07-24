/**
 * Founder-seat accounting for the 2027 exam pass — server-only.
 *
 * The founder price (£4.99) is limited to the first {@link FOUNDER_SEAT_CAP}
 * one-off pass holders; after that the pass reverts to its standard price. We
 * count "seats used" by INFERENCE rather than a dedicated column, so there's no
 * migration: a founder seat is a student with an active one-off EXAM PASS —
 *
 *   subscription_tier = 'paid'  AND  paid_until = STUDENT_EXAM_PASS_UNTIL  AND
 *   stripe_subscription_id IS NULL
 *
 * Matching the EXACT expiry (not just "paid_until IS NOT NULL") is deliberate:
 * it's the one value only the exam-pass webhook branch below ever writes, so
 * unrelated paid_until values — legacy/manually-granted test accounts, a future
 * exam season's pass once the date rolls over — can't be miscounted as a
 * founder-seat purchase. (Production had exactly this: two pre-existing test
 * accounts with an unrelated paid_until and no subscription id were inflating
 * the count before this field was added to the filter.)
 *
 * The `stripe_subscription_id IS NULL` clause is what excludes monthly/annual
 * subscribers (they always carry a subscription id), so recurring payers never
 * consume founder seats. Teacher passes live on a different table entirely.
 *
 * ⚠ Requires a service-role client (bypasses RLS) — call only from server routes.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { FOUNDER_SEAT_CAP } from './studentPlans'

export { FOUNDER_SEAT_CAP }

/**
 * Fixed end-of-season expiry the webhook grants for the one-off student exam
 * pass (founder-priced or standard — the webhook doesn't distinguish). Single
 * source of truth, imported by app/api/stripe/webhook/route.ts, so the grant and
 * the count of it can never drift apart.
 * ⚠ UPDATE EACH EXAM SEASON (or set the env override).
 */
export const STUDENT_EXAM_PASS_UNTIL = process.env.STRIPE_EXAM_PASS_UNTIL ?? '2027-07-31T23:59:59Z'

/** How many founder seats have been taken. Fail-open: 0 on error (see below). */
export async function founderSeatsUsed(admin: SupabaseClient): Promise<number> {
  const { count, error } = await admin
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('subscription_tier', 'paid')
    .eq('paid_until', STUDENT_EXAM_PASS_UNTIL)
    .is('stripe_subscription_id', null)

  if (error) {
    // Fail OPEN: treat as "seats available" so a transient DB hiccup never
    // wrongly charges a buyer the higher standard price. Overselling a few
    // founder passes is far cheaper than breaking the promised founder price.
    console.warn(`[founderSeats] count unavailable (${error.code ?? '?'}) — assuming seats available`)
    return 0
  }
  return count ?? 0
}

/** Founder seats still available (never negative). */
export async function founderSeatsLeft(admin: SupabaseClient): Promise<number> {
  return Math.max(0, FOUNDER_SEAT_CAP - (await founderSeatsUsed(admin)))
}
