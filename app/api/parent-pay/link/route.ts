import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { signPayToken } from '../../../../lib/parentPay'

/**
 * Generate a shareable parent-pay link for the logged-in student. Auth required
 * (Bearer token, same pattern as /api/stripe/student-checkout) — a student can
 * only ever mint a link for their own account.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/pay/${signPayToken(user.id)}`
    return NextResponse.json({ url })
  } catch (err: any) {
    console.error('Parent-pay link error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
