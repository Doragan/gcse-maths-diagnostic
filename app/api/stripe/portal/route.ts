import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Opens a Stripe Customer Billing Portal session so a monthly subscriber can
// update their card or cancel. Only recurring plans (monthly/annual) store a
// stripe_customer_id (the one-off Exam pass has nothing recurring to manage),
// so callers without one get a 400.
//
// NOTE: the portal must be enabled once per mode in Stripe → Settings → Billing
// → Customer portal. If it isn't, Stripe throws a configuration error here.
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    // Verify the caller with their own token via the anon client.
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data: { user }, error: userError } = await authClient.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Look up the Stripe customer with the service role so the result is
    // independent of client-facing column privileges / RLS.
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data: student } = await adminClient
      .from('students')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!student?.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription to manage' }, { status: 400 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const session = await stripe.billingPortal.sessions.create({
      customer: student.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/student/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('Billing portal error:', err)
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
