import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase as anonClient } from '../../../../lib/supabase'

// POST — teacher creates an assignment.
// Writes to REVOKE'd tables (assignments, assignment_questions, assignment_targets)
// via the service role, after verifying the caller is an authenticated teacher.
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: { user }, error: authError } = await anonClient.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Verify caller has a teachers row
    const { data: teacher } = await service
      .from('teachers').select('id').eq('id', user.id).single()
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const body = await req.json()
    const {
      title,
      instructions,
      selectionMode,
      skillIds,
      targetCount,
      completionMode,
      dueAt,
      pickedQuestionIds,   // string[] — only for selectionMode='picked'
      targetClassIds,      // string[]
      targetStudentIds,    // string[]
    } = body

    // ── Validation ──────────────────────────────────────────────────────────
    if (!title?.trim())
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    if (!['picked', 'pool'].includes(selectionMode))
      return NextResponse.json({ error: 'Invalid selection mode' }, { status: 400 })
    if (!['attempt_once', 'until_correct', 'mastery_based'].includes(completionMode))
      return NextResponse.json({ error: 'Invalid completion mode' }, { status: 400 })

    if (selectionMode === 'picked') {
      if (!pickedQuestionIds || pickedQuestionIds.length === 0)
        return NextResponse.json({ error: 'Choose at least one question' }, { status: 400 })
    }
    if (selectionMode === 'pool') {
      if (!skillIds || skillIds.length === 0)
        return NextResponse.json({ error: 'Choose at least one skill' }, { status: 400 })
      if (!targetCount || targetCount < 1)
        return NextResponse.json({ error: 'Target count must be at least 1' }, { status: 400 })
    }
    if ((!targetClassIds || targetClassIds.length === 0) &&
        (!targetStudentIds || targetStudentIds.length === 0)) {
      return NextResponse.json({ error: 'Choose at least one target class or student' }, { status: 400 })
    }

    // ── Verify teacher owns the targeted classes ─────────────────────────────
    if (targetClassIds?.length) {
      const { data: classes } = await service
        .from('classes')
        .select('id')
        .in('id', targetClassIds)
        .eq('teacher_id', user.id)
      if (!classes || classes.length !== targetClassIds.length)
        return NextResponse.json({ error: 'One or more target classes not found' }, { status: 403 })
    }

    // ── Insert assignment ────────────────────────────────────────────────────
    const { data: assignment, error: insertError } = await service
      .from('assignments')
      .insert({
        teacher_id:      user.id,
        title:           title.trim().slice(0, 120),
        instructions:    instructions ? instructions.trim().slice(0, 2000) : null,
        selection_mode:  selectionMode,
        skill_ids:       selectionMode === 'pool' ? skillIds : [],
        target_count:    selectionMode === 'pool' ? targetCount : null,
        completion_mode: completionMode,
        due_at:          dueAt || null,
      })
      .select()
      .single()

    if (insertError || !assignment)
      return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })

    // ── Insert picked questions ──────────────────────────────────────────────
    if (selectionMode === 'picked' && pickedQuestionIds?.length) {
      const rows = (pickedQuestionIds as string[]).map((qid, i) => ({
        assignment_id: assignment.id,
        question_id:   qid,
        position:      i,
      }))
      await service.from('assignment_questions').insert(rows)
    }

    // ── Insert targets ───────────────────────────────────────────────────────
    const targetRows = [
      ...(targetClassIds   ?? []).map((cid: string) => ({ assignment_id: assignment.id, class_id:   cid })),
      ...(targetStudentIds ?? []).map((sid: string) => ({ assignment_id: assignment.id, student_id: sid })),
    ]
    if (targetRows.length > 0) {
      await service.from('assignment_targets').insert(targetRows)
    }

    return NextResponse.json({ assignment })
  } catch (err) {
    console.error('[assignments/create]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
