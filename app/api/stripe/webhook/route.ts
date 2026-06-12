import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Season-pass expiry cut-offs for the NON-recurring products (teacher pass +
// student exam pass). These are fixed end-of-season dates, not rolling windows —
// named here so they aren't magic strings buried in the handler.
// ⚠ UPDATE EACH EXAM SEASON (or set the env overrides).
const TEACHER_PASS_UNTIL      = process.env.STRIPE_TEACHER_PASS_UNTIL ?? '2026-12-31T23:59:59Z'
const STUDENT_EXAM_PASS_UNTIL = process.env.STRIPE_EXAM_PASS_UNTIL    ?? '2027-07-31T23:59:59Z'

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
      } else {
        // One-off payment (exam season pass — fixed expiry, no renewal).
        const fail = await applyOrFail('student exam pass grant', () =>
          adminClient.from('students').update({
            subscription_tier: 'paid',
            paid_until: STUDENT_EXAM_PASS_UNTIL,
          }).eq('id', studentId))
        if (fail) return fail
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
