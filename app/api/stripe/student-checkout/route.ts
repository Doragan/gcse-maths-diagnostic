import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { priceIdFor, isSubscriptionPlan, toPlan } from '../../../../lib/stripePlans'
import { founderSeatsLeft } from '../../../../lib/founderSeats'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const plan = toPlan((await req.json()).plan)

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    const isSubscription = isSubscriptionPlan(plan)

    // Founder pricing: the exam pass charges the discounted founder price while
    // seats remain, then reverts to the standard price. A service-role client is
    // used for the count (it must bypass RLS). Non-exam plans skip the check.
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const founder = plan === 'exam' ? (await founderSeatsLeft(admin)) > 0 : false

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceIdFor(plan, { founder }), quantity: 1 }],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/student/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/student/upgrade`,
      customer_email: user.email,
      metadata: {
        student_id: user.id,
        plan,
        founder: String(founder),
      },
      ...(isSubscription
        ? {
            subscription_data: {
              metadata: { student_id: user.id, plan },
            },
          }
        : {
            // One-off (exam pass). Subscription mode always creates a Customer;
            // payment mode defaults to `if_required`, which with only
            // customer_email set means NO Customer is created at all — so the
            // webhook had nothing to store and an exam-pass buyer could not be
            // linked back to Stripe from the app afterwards.
            //
            // Only valid in payment mode: sending it alongside a subscription
            // is an error from Stripe, hence the branch rather than a spread.
            customer_creation: 'always' as const,
          }),
    })

    return NextResponse.json({ url: session.url })

  } catch (err: any) {
    console.error('Student checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
