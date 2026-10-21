import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { aggregateProgress } from '../../../../../lib/liveProgress'

// ─────────────────────────────────────────────────────────────────────────────
// The teacher's live view of a class session (docs/audit/29, increment 5).
//
// Compare app/api/assignments/[id]/results: that route spends four queries
// walking targets → classes → memberships → students to build a roster, and
// has to dedup a pupil who is targeted both ways. A session roster is ONE
// query on session_participants, and nobody can be in it twice. The
// aggregation half is then literally the same function.
//
// Service role, ownership-gated, exactly as the assignment route is — the
// client never reads session_participants or session_attempts, which have no
// client SELECT policy at all.
//
// Completion is fixed at pool/attempt_once: a session is "answer N questions",
// so a participant is complete once they have N attempts. There is no picked
// mode and no mastery mode to choose from, which is why nothing here reads a
// completion_mode column — the session table does not have one.
// ─────────────────────────────────────────────────────────────────────────────

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
      .select('id, target_count')
      .eq('id', id)
      .eq('teacher_id', user.id)
      .single()
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [{ data: participants }, { data: attempts }] = await Promise.all([
      service
        .from('session_participants')
        .select('id, display_name')
        .eq('session_id', id),
      service
        .from('session_attempts')
        .select('participant_id, question_id, correct, attempted_at')
        .eq('session_id', id),
    ])

    const results = aggregateProgress(
      (participants ?? []).map(p => ({
        id:           p.id,
        display_name: p.display_name,
        // A session has no year group to report, and deliberately no column to
        // put one in. The shared table renders it only when present.
        year_group:   null,
      })),
      (attempts ?? []).map(a => ({
        subject_id:   a.participant_id,
        question_id:  a.question_id,
        correct:      a.correct,
        attempted_at: a.attempted_at,
      })),
      {
        selectionMode:  'pool',
        completionMode: 'attempt_once',
        assignedCount:  session.target_count ?? 0,
        // Out of the target, not out of what each pupil has tried. On a screen
        // being read while a lesson runs, 0/3, 1/3 and 2/3 compare by eye;
        // scoring out of attempts made the pupil furthest behind read "1/1".
        scoreAgainst:   'target',
      },
    )

    return NextResponse.json({ results, assignedCount: session.target_count ?? 0 })
  } catch (err) {
    console.error('[class-sessions/results]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
