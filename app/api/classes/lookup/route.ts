import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { rateLimitLookup } from '../../../../lib/rateLimit'

// Resolve a class join code → { id, name } so a logged-in student can join.
// Uses the service role because there is no anon SELECT policy on `classes`
// (students should not be able to enumerate classes). Returns the class name
// only — no roster, no teacher identity. Mirrors app/api/assessment/lookup.
export async function GET(req: Request) {
  if (!(await rateLimitLookup(req)).ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code || code.length !== 4) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { data, error } = await admin
    .from('classes')
    .select('id, name')
    .eq('code', code.toUpperCase())
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Code not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
