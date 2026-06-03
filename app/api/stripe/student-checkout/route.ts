import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const PRICE_IDS: Record<string, string> = {
  monthly: process.env.STRIPE_STUDENT_MONTHLY_PRICE_ID!,
  annual:  process.env.STRIPE_STUDENT_ANNUAL_PRICE_ID!,
  exam:    process.env.STRIPE_STUDENT_EXAM_PRICE_ID!,
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { plan } = await req.json()

    if (!plan || !PRICE_IDS[plan]) {
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

    const isSubscription = plan === 'monthly' || plan === 'annual'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/student/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/student/upgrade`,
      customer_email: user.email,
      metadata: {
        student_id: user.id,
        plan,
      },
      ...(isSubscription && {
        subscription_data: {
          metadata: { student_id: user.id, plan },
        },
      }),
    })

    return NextResponse.json({ url: session.url })

  } catch (err: any) {
    console.error('Student checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
