import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { STUDENT_EXAM_PASS_UNTIL } from '../../../../lib/founderSeats'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Season-pass expiry cut-off for the NON-recurring teacher pass. Fixed
// end-of-season date, not a rolling window — named here so it isn't a magic
// string buried in the handler. ⚠ UPDATE EACH EXAM SEASON (or set the env
// override). The student exam-pass equivalent lives in lib/founderSeats.ts,
// shared with the founder-seat count so the two can't drift apart.
const TEACHER_PASS_UNTIL = process.env.STRIPE_TEACHER_PASS_UNTIL ?? '2026-12-31T23:59:59Z'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // ── Idempotency ─────────────────────────────────────────────────────────────
  // Stripe re-delivers events, and we deliberately ask it to (a failed write
  // below returns 500 → Stripe retries). Skip an event we've already fully
  // processed. The event id is recorded ONLY after success (at the end), so a
  // failed-then-retried event is reprocessed correctly. Degrades gracefully if
  // the `stripe_events` table isn't applied yet — we log and process anyway
  // rather than drop a real payment event.
  const seen = await adminClient.from('stripe_events').select('id').eq('id', event.id).maybeSingle()
  if (seen.data) {
    return NextResponse.json({ received: true, duplicate: true })
  }
  if (seen.error) {
    console.warn(`[stripe webhook] idempotency check unavailable (${seen.error.code ?? '?'}) — processing without dedupe`)
  }

  /**
   * Record a conversion for the usage report. BEST-EFFORT ONLY — deliberately
   * not wrapped in applyOrFail, and its failure is swallowed.
   *
   * `students` has `subscription_tier` and `paid_until` but no `paid_at`, and
   * `stripe_events` is an idempotency ledger holding only (id, processed_at),
   * so nothing currently records WHEN a student converted. This makes that
   * answerable from here on; it cannot backfill the existing subscribers.
   *
   * Analytics must never be able to fail a payment: an error here would turn a
   * successful entitlement grant into a 500, and Stripe would retry a webhook
   * whose real work already succeeded. The idempotency check upstream means a
   * retry cannot double-count this either.
   */
  async function recordConversion(studentId: string, plan: string) {
    const { error } = await adminClient.from('analytics_events').insert({
      event: 'subscription_started',
      path: '/stripe/webhook',
      session_id: event.id,          // Stripe's event id: stable, and not a student's
      properties: { student_id: studentId, plan },
    })
    if (error) console.warn(`[stripe webhook] conversion event not recorded: ${error.message}`)
  }

  // Run a Supabase write and turn a DB failure into a 500 so Stripe RETRIES
  // (instead of the old behaviour: swallow the error, return 200, and leave a
  // paying customer with no access). Returns a 500 response on failure, else null.
  async function applyOrFail(
    label: string,
    run: () => PromiseLike<{ error: { message: string } | null }>,
  ): Promise<NextResponse | null> {
    const { error } = await run()
    if (error) {
      console.error(`[stripe webhook] ${label} failed:`, error.message)
      return NextResponse.json({ error: `${label}: ${error.message}` }, { status: 500 })
    }
    return null
  }

  // ── One-off and subscription initial checkout ──────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const teacherId = session.metadata?.teacher_id
    const studentId = session.metadata?.student_id
    const plan      = session.metadata?.plan

    if (teacherId) {
      const fail = await applyOrFail('teacher pass grant', () =>
        adminClient.from('teachers').update({ paid_until: TEACHER_PASS_UNTIL }).eq('id', teacherId))
      if (fail) return fail

    } else if (studentId && plan) {
      if (plan === 'monthly' || plan === 'annual') {
        // Recurring subscription — store Stripe IDs; paid_until is set by
        // invoice.payment_succeeded (works for any billing interval).
        const fail = await applyOrFail('student subscription init', () =>
          adminClient.from('students').update({
            subscription_tier: 'paid',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          }).eq('id', studentId))
        if (fail) return fail
        await recordConversion(studentId, plan)
      } else {
        // One-off payment (exam season pass — fixed expiry, no renewal).
        //
        // The customer id is stored even though there is nothing to renew: it
        // is the only link from a student row back to Stripe, without which an
        // exam-pass buyer cannot be looked up, refunded against, or told apart
        // from an account someone granted by hand. There is no subscription id
        // because a one-off payment creates no subscription.
        //
        // Written only when present, so a session that somehow arrives without
        // a Customer cannot null out a value already on the row.
        const customerId = typeof session.customer === 'string' ? session.customer : null
        const fail = await applyOrFail('student exam pass grant', () =>
          adminClient.from('students').update({
            subscription_tier: 'paid',
            paid_until: STUDENT_EXAM_PASS_UNTIL,
            ...(customerId ? { stripe_customer_id: customerId } : {}),
          }).eq('id', studentId))
        if (fail) return fail
        await recordConversion(studentId, plan)
      }
    }
  }

  // ── Monthly / annual renewal ───────────────────────────────────────────────
  if (event.type === 'invoice.payment_succeeded') {
    // `subscription` was removed from the Invoice type in Stripe SDK v17 / API 2024-09-30.
    // Cast via `any` so the code compiles against both old and new SDK versions.
    // At runtime Stripe still sends the field (or its newer equivalent).
    const invoice = event.data.object as any
    const subscriptionId: string | undefined =
      (typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id)
      ?? invoice.parent?.subscription_details?.subscription   // API 2024-09-30+ path
    if (!subscriptionId) return NextResponse.json({ received: true })

    // Use Stripe's billing period end as the paid_until date
    const periodEnd = invoice.lines?.data?.[0]?.period?.end
    const paidUntil = periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString() })()

    const fail = await applyOrFail('subscription renewal', () =>
      adminClient.from('students').update({ paid_until: paidUntil }).eq('stripe_subscription_id', subscriptionId))
    if (fail) return fail
  }

  // ── Cancellation ───────────────────────────────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const fail = await applyOrFail('subscription cancel', () =>
      adminClient.from('students').update({
        subscription_tier: 'free',
        paid_until: null,
        stripe_subscription_id: null,
      }).eq('stripe_subscription_id', subscription.id))
    if (fail) return fail
  }

  // ── Mark processed (best-effort; missing table is non-fatal) ────────────────
  const recorded = await adminClient.from('stripe_events').insert({ id: event.id })
  if (recorded.error && recorded.error.code !== '23505') {
    console.warn(`[stripe webhook] could not record event ${event.id} (${recorded.error.code ?? '?'})`)
  }

  return NextResponse.json({ received: true })
}
