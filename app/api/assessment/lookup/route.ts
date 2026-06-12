import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { rateLimitLookup } from '../../../../lib/rateLimit'

export async function GET(req: Request) {
  if (!(await rateLimitLookup(req)).ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code || code.length !== 4) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data, error } = await adminClient
    .from('assessments')
    .select('id, title, course_id')
    .eq('code', code.toUpperCase())
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Code not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}