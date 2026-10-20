import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * The cheap "has anything changed?" probe behind the session live view
 * (docs/audit/29, increment 5; the same shape as the assignment one).
 *
 * The full results route runs three queries and a pass over every attempt. A
 * teacher watching a lesson polls every 10s, which would be ~360 of those an
 * hour per open tab, almost all returning exactly what the client already has.
 *
 * This returns the two numbers that can only change when a pupil answers
 * something, and the client refetches the real payload only when one moves.
 *
 * Same ownership gate as the full route. It deliberately exposes no per-pupil
 * detail — a count and a timestamp — so the cheap endpoint, which is the one
 * hit constantly, carries no names.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    )
    const { data: { user } } = await authClient.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    const { data: session } = await service
      .from('class_sessions')
      .select('id')
      .eq('id', id)
      .eq('teacher_id', user.id)
      .single()
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // One query for both figures: `count` covers every matching row, while the
    // ordered limit-1 gives the newest timestamp.
    const { data, count } = await service
      .from('session_attempts')
      .select('attempted_at', { count: 'exact' })
      .eq('session_id', id)
      .order('attempted_at', { ascending: false })
      .limit(1)

    return NextResponse.json({
      attemptCount:  count ?? 0,
      lastAttemptAt: data?.[0]?.attempted_at ?? null,
    })
  } catch (err) {
    console.error('[class-sessions/results/head]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
