import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase as anonClient } from '../../../../../../lib/supabase'

/**
 * GET — the cheap "has anything changed?" probe behind the live view
 * (docs/audit/24, Part 3).
 *
 * The full results route resolves targets → classes → memberships → students
 * and then aggregates every attempt per student: five queries and a pass over
 * the whole attempt list. A teacher watching a lesson polls every 10s, which
 * would be ~360 of those an hour per open tab, almost all of them returning
 * exactly what the client already has.
 *
 * This returns the two numbers that can only change when a student answers
 * something. The client refetches the real payload only when one of them moves.
 *
 * Same ownership gate as the full route — the teacher must own the assignment.
 * It deliberately exposes no per-student detail: a count and a timestamp.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: assignment } = await service
      .from('assignments')
      .select('id')
      .eq('id', id)
      .eq('teacher_id', user.id)
      .single()
    if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // One query for both figures: `count` covers every matching row, while the
    // ordered limit-1 gives the newest timestamp.
    const { data, count } = await service
      .from('assignment_attempts')
      .select('attempted_at', { count: 'exact' })
      .eq('assignment_id', id)
      .order('attempted_at', { ascending: false })
      .limit(1)

    return NextResponse.json({
      attemptCount: count ?? 0,
      lastAttemptAt: data?.[0]?.attempted_at ?? null,
    })
  } catch (err) {
    console.error('[assignments/results/head]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
