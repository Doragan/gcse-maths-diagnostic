import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase as anonClient } from '../../../../../lib/supabase'

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
    // directly and via a class appears only once)
    const studentMap = new Map<string, { display_name: string; year_group: string | null }>()

    for (const target of targets ?? []) {
      if (target.class_id) {
        const { data: members } = await service
          .from('class_memberships')
          .select('student_id, students(display_name, year_group)')
          .eq('class_id', target.class_id)
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
      } else if (target.student_id && !studentMap.has(target.student_id)) {
        const { data: s } = await service
          .from('students')
          .select('display_name, year_group')
          .eq('id', target.student_id)
          .single()
        studentMap.set(target.student_id, {
          display_name: s?.display_name ?? 'Unknown',
          year_group:   s?.year_group   ?? null,
        })
      }
    }

    // All attempts for this assignment (ordered chronologically)
    const { data: allAttempts } = await service
      .from('assignment_attempts')
      .select('student_id, question_id, correct, attempted_at')
      .eq('assignment_id', id)
      .order('attempted_at', { ascending: true })

    // Compute per-student summary
    const results = Array.from(studentMap.entries()).map(([studentId, info]) => {
      const attempts = (allAttempts ?? []).filter(a => a.student_id === studentId)

      // Unique questions with any attempt / any correct attempt
      const attemptedQIds = new Set(attempts.map(a => a.question_id))
      const correctQIds   = new Set(attempts.filter(a => a.correct).map(a => a.question_id))
      const correctCount  = attempts.filter(a => a.correct).length

      let isComplete = false
      let score: string | null = null

      if (assignment.selection_mode === 'picked') {
        if (assignment.completion_mode === 'attempt_once') {
          isComplete = attemptedQIds.size >= assignedCount
          score      = `${correctQIds.size}/${assignedCount}`
        } else if (assignment.completion_mode === 'until_correct') {
          isComplete = correctQIds.size >= assignedCount
          score      = `${correctQIds.size}/${assignedCount}`
        } else {
          // mastery_based — open-ended; show attempts
          score = `${correctCount}/${attempts.length}`
        }
      } else {
        // pool mode
        if (assignment.completion_mode === 'attempt_once') {
          isComplete = attempts.length >= assignedCount
          score      = `${correctCount}/${attempts.length}`
        } else if (assignment.completion_mode === 'until_correct') {
          isComplete = correctCount >= assignedCount
          score      = `${correctCount}/${assignedCount}`
        } else {
          score = `${correctCount}/${attempts.length}`
        }
      }

      return {
        student_id:       studentId,
        display_name:     info.display_name,
        year_group:       info.year_group,
        total_attempts:   attempts.length,
        correct_count:    correctCount,
        questions_started: attemptedQIds.size,
        is_complete:      isComplete,
        score,
        last_attempt_at:  attempts.length > 0 ? attempts[attempts.length - 1].attempted_at : null,
      }
    })

    // Sort: complete first, then by last attempt desc, then alphabetically
    results.sort((a, b) => {
      if (a.is_complete !== b.is_complete) return a.is_complete ? -1 : 1
      if (a.last_attempt_at && b.last_attempt_at)
        return b.last_attempt_at.localeCompare(a.last_attempt_at)
      if (a.last_attempt_at) return -1
      if (b.last_attempt_at) return 1
      return a.display_name.localeCompare(b.display_name)
    })

    return NextResponse.json({ results, assignedCount, completionMode: assignment.completion_mode })
  } catch (err) {
    console.error('[assignments/results]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
