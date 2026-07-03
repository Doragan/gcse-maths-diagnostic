import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyPayToken } from '../../../../lib/parentPay'
import { isPaidStudent } from '../../../../lib/entitlements'

/**
 * Public: describe a parent-pay link to the (unauthenticated) parent opening it.
 * Returns the student's FIRST NAME only — the minimum needed for the parent to
 * recognise whose account they're paying for — plus whether the account already
 * has active premium (so the pay page can say "no payment needed" instead of
 * charging again).
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token') ?? ''
  const verified = verifyPayToken(token)
  if (!verified) return NextResponse.json({ status: 'invalid' })

  // Service-role read (the parent has no auth). Built inside the handler.
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: student } = await admin
    .from('students')
    .select('display_name, subscription_tier, paid_until')
    .eq('id', verified.studentId)
    .single()

  if (!student) return NextResponse.json({ status: 'invalid' })

  const firstName = (student.display_name ?? '').trim().split(/\s+/)[0] || null
  const alreadyPaid = isPaidStudent({
    subscription_tier: student.subscription_tier,
    paid_until: student.paid_until,
  })

  return NextResponse.json({ status: alreadyPaid ? 'already_paid' : 'ok', firstName })
}
