import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import {
  subscriptionToCancel,
  isTerminalStatus,
  isMissingFromStripe,
  describeOutcome,
  type CancelOutcome,
} from '../../../../lib/subscriptionCancel'

export const runtime = 'nodejs'

// ─────────────────────────────────────────────────────────────────────────────
// Delete the caller's own account.
//
// 🔴 THIS ROUTE NEVER WORKED, for two independent reasons. Account deletion has
// never succeeded for anyone, teacher or student.
//
// 1. IT WAS AT THE WRONG PATH. The file lived at app/account/delete/route.ts,
//    serving /account/delete, while lib/auth.ts has always fetched
//    /api/account/delete. That is a 404, which is the "Failed to delete
//    account" people actually hit. It was also the only route handler in the
//    app outside app/api/; moving it here matches every other one.
//
// 2. IT READ THE SESSION FROM COOKIES, via @supabase/ssr's createServerClient.
//    lib/supabase.ts builds the browser client with plain
//    @supabase/supabase-js, which keeps the session in localStorage, so there
//    is no Supabase auth cookie anywhere in this app. Even at the right path it
//    would have found nobody and answered 401. It was the only route using the
//    cookie pattern and the only consumer of @supabase/ssr; every other
//    authenticated route takes the token in an Authorization header. It does
//    now too.
//
// lib/auth.ts threw a generic "Failed to delete account" for any failure, which
// is why a 404 and a 401 were indistinguishable from the outside. It now
// surfaces what the server said, and sends the token.
//
// That matters beyond the bug: app/terms says "You may close your account at any
// time via Account Settings", and the right to erasure was not actually
// deliverable through the product.
//
// Pattern: validate the caller's JWT with the anon client (no RLS bypass), then
// do the deletion under the service role. Deleting the auth.users row is what
// removes the account; `students` and `teachers` both reference it with
// ON DELETE CASCADE, so the profile row and everything hanging off it goes with
// it. See 20260914_capture_students_teachers.sql for the full cascade.
//
// 🔴 A THIRD DEFECT, FIXED 2026-09-18: IT NEVER CANCELLED THE SUBSCRIPTION.
//
// Once the two bugs above were fixed and deletion started working, it started
// working wrongly. The cascade destroyed the `students` row holding
// `stripe_subscription_id`, while the subscription itself lives in Stripe and
// carried on charging — against someone with no account, no billing portal to
// reach (deleting the account removes the page it is opened from), and no row
// left tying the payment to a person. Leaving was the act that made leaving
// impossible.
//
// The parent-paid case was worse: the payer is a third party who never sees the
// child's deletion and would have gone on paying indefinitely.
//
// The subscription is now cancelled FIRST, and the reasoning about order,
// failure and which way the doubt resolves is in lib/subscriptionCancel.ts.
// ─────────────────────────────────────────────────────────────────────────────

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    )
    const { data: { user }, error: userError } = await authClient.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    // ── Cancel any live subscription BEFORE deleting the account ──────────────
    //
    // ORDER IS THE WHOLE POINT. The subscription id lives on the `students` row,
    // which the deletion below destroys by cascade. Delete first and a failed
    // cancel leaves a charge recurring forever against a person who no longer
    // has an account, with nothing left in our database to identify it by. Cancel
    // first and the worst case is a cancelled subscription on an account that
    // still exists, which the person can see and we can put right.
    //
    // This also covers the parent-paid case (/pay/[token]), where the payer is a
    // third party who never sees the child's deletion. The id is on the student's
    // row whoever paid, so cancelling by it stops the parent's charge too.
    //
    // Teachers fall through: they have no stripe_subscription_id column, the row
    // lookup returns nothing, and the teacher pass was a one-off payment rather
    // than a subscription, so there has never been anything recurring to cancel.
    const { data: account } = await admin
      .from('students')
      .select('stripe_subscription_id')
      .eq('id', user.id)
      .maybeSingle()

    const subscriptionId = subscriptionToCancel(account)
    let outcome: CancelOutcome = { kind: 'none' }

    if (subscriptionId) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
        // Retrieve before cancelling, rather than cancelling and reading the
        // error. Stripe's response to "cancel something already cancelled" is an
        // error whose wording we would have to pattern-match, and matching on
        // prose is how this breaks silently later. A status is a stable answer.
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        if (isTerminalStatus(subscription.status)) {
          outcome = { kind: 'already_ended', subscriptionId, status: subscription.status }
        } else {
          // Immediate, not at period end. The account is going now, so leaving it
          // running to the end of a paid period serves nobody and keeps a live
          // subscription pointing at a deleted account. No proration is requested:
          // refunds are a human decision, and app/terms §7.3 does not promise one.
          await stripe.subscriptions.cancel(subscriptionId)
          outcome = { kind: 'cancelled', subscriptionId }
        }
      } catch (stripeErr) {
        if (isMissingFromStripe(stripeErr)) {
          // The id points at nothing, so nobody is being billed. Proceed.
          outcome = { kind: 'not_in_stripe', subscriptionId }
        } else {
          // We do NOT know whether the subscription is still charging, so we stop.
          //
          // Blocking erasure on a third party's outage is a real cost and is not
          // taken lightly. It is the lesser one: deleting now would take money
          // from someone indefinitely with no record left of who or why, and no
          // way for them to stop it. Erasure delayed by an hour is recoverable;
          // that is not. The message tells them exactly what to do, and retrying
          // later is free.
          console.error(
            `[account delete] BLOCKED: could not verify subscription ${subscriptionId} for user ${user.id}:`,
            stripeErr,
          )
          return NextResponse.json({
            error:
              'We could not cancel your subscription just now, so we have not deleted your account — '
              + 'deleting it while the subscription is live would keep charging you. '
              + 'Please try again in a few minutes, or email privacy@mathsense.net and we will do both by hand.',
            code: 'SUBSCRIPTION_CANCEL_FAILED',
          }, { status: 503 })
        }
      }
    }

    // The caller can only ever delete themselves: the id comes from the
    // validated token, never from the request body.
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) {
      // Returned verbatim, and lib/auth.ts now surfaces it. A deletion can also
      // fail on a foreign key: any table referencing students(id) or
      // teachers(id) with no ON DELETE action blocks it, and the message names
      // the table.
      //
      // ⚠ THIS COMMENT USED TO NAME paper_sittings.marked_by AS ONE, AND WAS
      // FIVE HOURS OUT OF DATE WHEN IT WAS WRITTEN. It was true at 09:01 on
      // 2026-09-15, when this route was fixed. At 14:05 the same day,
      // 20260915_class_ownership_survives_teacher.sql made marked_by nullable
      // and SET NULL, which removed the blocker. Nobody came back here, and the
      // stale sentence was still being quoted as a live defect three days later.
      // Corrected 2026-09-18. If you add a blocking reference, name it here AND
      // delete it from here when you fix it.
      //
      // Whether that migration has been APPLIED to the live database is a
      // separate question this file cannot answer: it is hand-applied SQL, and
      // the verification query is at the foot of the migration.
      //
      // If we cancelled a subscription just above and then failed here, say so in
      // the log: the person still has an account but no longer has a subscription,
      // and that is the one state this route can leave behind that nobody would
      // otherwise know about.
      console.error('account delete failed:', error)
      if (outcome.kind === 'cancelled') {
        console.error(
          `[account delete] ⚠ ${describeOutcome(outcome)}, but the account deletion then FAILED `
          + `for user ${user.id}. The account still exists with no subscription.`,
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[account delete] user ${user.id} deleted — ${describeOutcome(outcome)}`)
    return NextResponse.json({ success: true, subscriptionCancelled: outcome.kind === 'cancelled' })
  } catch (err) {
    console.error('account delete route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
