import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyPayToken } from '../../../../lib/parentPay'
import { isPaidStudent } from '../../../../lib/entitlements'
import { PRICE_IDS, isSubscriptionPlan, toPlan } from '../../../../lib/stripePlans'

/**
 * Public: create a Stripe Checkout Session a parent can complete for a student.
 * The student is resolved from the signed token (not from any login), and the
 * resulting session carries `metadata.student_id` so the existing webhook grants
 * access to the right account — no webhook change needed.
 *
 * Single-use-once-paid: we refuse to create a session for a student who already
 * has active premium, so a shared link stops charging after the first payment
 * lands (and the token also hard-expires after 30 days).
 */
export async function POST(req: Request) {
  try {
    const { token, plan: rawPlan } = await req.json()
    const verified = verifyPayToken(token)
    if (!verified) {
      return NextResponse.json({ error: 'This link is no longer valid.' }, { status: 400 })
    }
    const plan = toPlan(rawPlan)
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    const studentId = verified.studentId

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data: student } = await admin
      .from('students')
      .select('subscription_tier, paid_until')
      .eq('id', studentId)
      .single()

    if (!student) {
      return NextResponse.json({ error: 'This link is no longer valid.' }, { status: 400 })
    }
    // Guard: don't charge an already-subscribed student (makes the link inert
    // once the first payment succeeds).
    if (isPaidStudent({ subscription_tier: student.subscription_tier, paid_until: student.paid_until })) {
      return NextResponse.json({ alreadyPaid: true })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const isSubscription = isSubscriptionPlan(plan)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      mode: isSubscription ? 'subscription' : 'payment',
      // Return the PARENT to the pay page; Stripe collects the parent's email.
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pay/${token}?paid=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pay/${token}`,
      // Grant is keyed on student_id — same metadata the webhook already reads.
      metadata: { student_id: studentId, plan, payer: 'parent' },
      ...(isSubscription && {
        subscription_data: { metadata: { student_id: studentId, plan, payer: 'parent' } },
      }),
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Parent-pay checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
