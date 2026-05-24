import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // ── One-off and subscription initial checkout ──────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const teacherId = session.metadata?.teacher_id
    const studentId = session.metadata?.student_id
    const plan      = session.metadata?.plan

    if (teacherId) {
      const paidUntil = new Date('2026-12-31T23:59:59Z').toISOString()
      const { error } = await adminClient
        .from('teachers')
        .update({ paid_until: paidUntil })
        .eq('id', teacherId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    } else if (studentId && plan) {
      if (plan === 'monthly') {
        // Store Stripe IDs — paid_until will be set by invoice.payment_succeeded
        await adminClient
          .from('students')
          .update({
            subscription_tier: 'paid',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq('id', studentId)
      } else {
        // One-off payment (annual or exam)
        const paidUntil = plan === 'exam'
          ? new Date('2027-07-31T23:59:59Z').toISOString()
          : (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString() })()
        await adminClient
          .from('students')
          .update({ subscription_tier: 'paid', paid_until: paidUntil })
          .eq('id', studentId)
      }
    }
  }

  // ── Monthly renewal ────────────────────────────────────────────────────────
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id
    if (!subscriptionId) return NextResponse.json({ received: true })

    // Use Stripe's billing period end as the paid_until date
    const periodEnd = (invoice as any).lines?.data?.[0]?.period?.end
    const paidUntil = periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString() })()

    await adminClient
      .from('students')
      .update({ paid_until: paidUntil })
      .eq('stripe_subscription_id', subscriptionId)
  }

  // ── Cancellation ───────────────────────────────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    await adminClient
      .from('students')
      .update({
        subscription_tier: 'free',
        paid_until: null,
        stripe_subscription_id: null,
      })
      .eq('stripe_subscription_id', subscription.id)
  }

  return NextResponse.json({ received: true })
}