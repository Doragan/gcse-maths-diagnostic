import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase as anonClient } from '../../../../../lib/supabase'
import { aggregateProgress } from '../../../../../lib/liveProgress'

// GET — teacher fetches per-student completion and scores for an assignment.
// Resolves class targets → members, then aggregates assignment_attempts per student.
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

    // Verify teacher owns this assignment
    const { data: assignment } = await service
      .from('assignments')
      .select('id, teacher_id, selection_mode, target_count, completion_mode')
      .eq('id', id)
      .eq('teacher_id', user.id)
      .single()
    if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // For picked mode: count how many questions are assigned
    let assignedCount = assignment.target_count ?? 0
    if (assignment.selection_mode === 'picked') {
      const { count } = await service
        .from('assignment_questions')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', id)
      assignedCount = count ?? 0
    }

    // Get all targets (class_id or student_id)
    const { data: targets } = await service
      .from('assignment_targets')
      .select('class_id, student_id')
      .eq('assignment_id', id)

    // Resolve targets → student info map (dedup so a student targeted both
    // directly and via a class appears only once). Batched into two `in`
    // queries instead of one query per target (audit ⑤ — was N+1).
    const studentMap = new Map<string, { display_name: string; year_group: string | null }>()
    const classIds         = (targets ?? []).filter(t => t.class_id).map(t => t.class_id)
    const directStudentIds = (targets ?? []).filter(t => t.student_id && !t.class_id).map(t => t.student_id)

    // All members of all targeted classes, one query.
    if (classIds.length > 0) {
      const { data: members } = await service
        .from('class_memberships')
        .select('student_id, students(display_name, year_group)')
        .in('class_id', classIds)
        .eq('status', 'active')
      for (const m of members ?? []) {
        if (!studentMap.has(m.student_id)) {
          const s = (m as any).students
          studentMap.set(m.student_id, {
            display_name: s?.display_name ?? 'Unknown',
            year_group:   s?.year_group   ?? null,
          })
        }
      }
    }

    // All directly-targeted students, one query.
    if (directStudentIds.length > 0) {
      const { data: directStudents } = await service
        .from('students')
        .select('id, display_name, year_group')
        .in('id', directStudentIds)
      for (const s of directStudents ?? []) {
        if (!studentMap.has(s.id)) {
          studentMap.set(s.id, {
            display_name: s.display_name ?? 'Unknown',
            year_group:   s.year_group   ?? null,
          })
        }
      }
    }

    // All attempts for this assignment.
    const { data: allAttempts } = await service
      .from('assignment_attempts')
      .select('student_id, question_id, correct, attempted_at, parts_correct, parts_total')
      .eq('assignment_id', id)
      .order('attempted_at', { ascending: true })

    // ── Aggregation ──────────────────────────────────────────────────────────
    // Everything above resolved a ROSTER, which is the half that is specific to
    // assignments (targets → classes → memberships → students). Turning
    // attempts into per-person progress is not, so it lives in
    // lib/liveProgress.ts and the class-session results route calls the same
    // function. See docs/audit/29 §6.
    const results = aggregateProgress(
      Array.from(studentMap.entries()).map(([studentId, info]) => ({
        id:           studentId,
        display_name: info.display_name,
        year_group:   info.year_group,
      })),
      (allAttempts ?? []).map(a => ({
        subject_id:    a.student_id,
        question_id:   a.question_id,
        correct:       a.correct,
        attempted_at:  a.attempted_at,
        parts_correct: a.parts_correct,
        parts_total:   a.parts_total,
      })),
      {
        selectionMode:  assignment.selection_mode,
        completionMode: assignment.completion_mode,
        assignedCount,
        // Pool scores read out of the target, not out of what each student has
        // tried so far. Scoring out of attempts meant a student one question in
        // showed "1/1" — full marks — beside one who had finished and showed
        // "2/3", and it inflated the class average with it: measured at 83%
        // against 50% on the same rows. It is also the figure `is_complete`
        // already counts against, so the two now agree.
        //
        // Changed for assignments on 2026-10-21, after the class-session view
        // was built with it (docs/audit/29 §9). Affects pool/attempt_once only.
        scoreAgainst:   'target',
      },
    )

    return NextResponse.json({ results, assignedCount, completionMode: assignment.completion_mode })
  } catch (err) {
    console.error('[assignments/results]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
