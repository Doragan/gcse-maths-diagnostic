import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { PAPERS } from '../../../../lib/demoPapers'
import {
  validateEntries, deriveAttempts, marksEarned, marksTotal, selectedItems,
  type StudentEntry, type ItemSelection,
} from '../../../../lib/papers/sittingMarks'

// ─────────────────────────────────────────────────────────────────────────────
// Teacher-marked paper sittings: list, record, correct, delete.
//
// This is the write that turns marks into skill tracking. It is a cross-account
// write — a teacher creating rows attributed to students — so it follows the
// class-roster route: bearer auth on the anon client, then the service role
// ONLY after class ownership is proven. practice_attempts has no teacher INSERT
// policy and deliberately should not gain one; a single server-side gate is
// easier to reason about than a second, weaker authorisation path.
//
// WHAT A POST WRITES, per student:
//   1. a `paper_sittings` row — the durable record, holding every mark
//   2. one `practice_attempts` row per marked item, stamped with `sitting_id`
//
// A sitting is a ROW, NOT A KEY: posting without `sittingId` always creates a
// new one, so a resit is simply a second sitting and both feed mastery. Passing
// `sittingId` corrects an existing sitting in place — its derived attempts are
// deleted and rebuilt, scoped by `sitting_id` so a *different* sitting of the
// same paper is untouched.
//
// WHY GET AND DELETE EXIST: because "a second sitting" and "submitted twice by
// accident" produce identical data, and the difference matters. Duplicated
// attempts inflate mastery — the engine's fast-track marks a skill mastered at
// three correct attempts, so one right answer submitted three times reads as
// secure. GET lets the UI surface what already exists and make the choice
// explicit; DELETE is the escape hatch when the answer was "that was a mistake".
//
// TWO RULES THE MARKS OBEY (user rulings), both in lib/papers/sittingMarks.ts:
//   • Full marks only counts as correct.
//   • Every derived attempt is positive-only exam-kind, so a dropped mark can
//     never lower a skill.
// ─────────────────────────────────────────────────────────────────────────────

type Authorised = { admin: SupabaseClient; userId: string }

/**
 * Authenticate the caller and prove they own `classId`, or return the response
 * to send back. Shared by all three verbs so the gate cannot drift between them.
 */
async function authoriseClass(
  req: Request,
  classId: string,
): Promise<{ ok: true; ctx: Authorised } | { ok: false; res: NextResponse }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, res: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
  }
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
  const { data: { user }, error } = await authClient.auth.getUser(authHeader.replace('Bearer ', ''))
  if (error || !user) {
    return { ok: false, res: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
  const { data: cls } = await admin
    .from('classes').select('id, teacher_id').eq('id', classId).single()
  if (!cls || cls.teacher_id !== user.id) {
    // 404 not 403, so a non-owner cannot confirm a class id exists.
    return { ok: false, res: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  }
  return { ok: true, ctx: { admin, userId: user.id } }
}

// ── GET: what has already been recorded for this class + paper ───────────────
// The UI calls this before letting a teacher submit, so an existing sitting is
// something they choose to correct or add to, rather than silently duplicate.
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const classId = url.searchParams.get('classId') ?? ''
    const sourcePaper = url.searchParams.get('sourcePaper') ?? ''
    if (!classId) return NextResponse.json({ error: 'classId is required' }, { status: 400 })

    const auth = await authoriseClass(req, classId)
    if (!auth.ok) return auth.res

    let q = auth.ctx.admin
      .from('paper_sittings')
      .select('id, student_id, source_paper, sat_on, created_at, updated_at, marks, marks_earned, marks_total, selected_items')
      .eq('class_id', classId)
      .order('created_at', { ascending: false })
    if (sourcePaper) q = q.eq('source_paper', sourcePaper)

    const { data, error } = await q
    if (error) {
      console.error('sittings list failed:', error)
      return NextResponse.json({ error: 'Failed to load sittings' }, { status: 500 })
    }
    return NextResponse.json({ sittings: data ?? [] })
  } catch (err) {
    console.error('sittings GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ── DELETE: undo a sitting recorded by mistake ───────────────────────────────
// Its derived practice_attempts go with it via ON DELETE CASCADE, so the
// student's skill map returns to what it was before — which is the whole point:
// an accidental double-submit must be fully reversible, not just hidden.
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id') ?? ''
    const classId = url.searchParams.get('classId') ?? ''
    if (!id || !classId) {
      return NextResponse.json({ error: 'id and classId are required' }, { status: 400 })
    }

    const auth = await authoriseClass(req, classId)
    if (!auth.ok) return auth.res

    // Scope the delete by class as well as id, so a sitting id from another
    // teacher's class cannot be steered into this one.
    const { data: deleted, error } = await auth.ctx.admin
      .from('paper_sittings')
      .delete()
      .eq('id', id).eq('class_id', classId)
      .select('id')
    if (error) {
      console.error('sitting delete failed:', error)
      return NextResponse.json({ error: 'Failed to delete sitting' }, { status: 500 })
    }
    if (!deleted?.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ deleted: deleted[0].id })
  } catch (err) {
    console.error('sittings DELETE error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ── POST: record a set of marks (or correct an existing sitting) ─────────────
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const sourcePaper = typeof body?.sourcePaper === 'string' ? body.sourcePaper : ''
    const classId = typeof body?.classId === 'string' ? body.classId : ''
    const satOn = typeof body?.satOn === 'string' ? body.satOn : null
    const entries: StudentEntry[] = Array.isArray(body?.students) ? body.students : []
    // Absent means the whole paper — the default, and what every caller meant
    // before partial papers existed.
    const selection: ItemSelection = Array.isArray(body?.selectedItems)
      ? body.selectedItems.filter((id: unknown): id is string => typeof id === 'string')
      : null

    const paper = PAPERS[sourcePaper]
    if (!paper) return NextResponse.json({ error: 'Unknown paper' }, { status: 400 })
    // A class is required for now. The schema allows class_id NULL so a paper
    // can later be set for one student, but that needs its own authorisation
    // story — without a class there is nothing linking teacher to student.
    if (!classId) return NextResponse.json({ error: 'classId is required' }, { status: 400 })
    if (satOn && !/^\d{4}-\d{2}-\d{2}$/.test(satOn)) {
      return NextResponse.json({ error: 'satOn must be YYYY-MM-DD' }, { status: 400 })
    }

    // Reject the whole submission before writing anything, so one bad mark
    // cannot leave half a class recorded.
    const validation = validateEntries(paper, entries, selection)
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })

    const auth = await authoriseClass(req, classId)
    if (!auth.ok) return auth.res
    const { admin, userId } = auth.ctx

    // From the SELECTION, not the paper: with eight questions set out of thirty,
    // a student scoring 34 of an available 42 would otherwise store as 34/80 —
    // and that figure feeds the class average.
    const totalMarks = marksTotal(paper, selection)

    // ── Authorise: every student must be an ACTIVE member of that class ──────
    const { data: members } = await admin
      .from('class_memberships')
      .select('student_id').eq('class_id', classId).eq('status', 'active')
    const active = new Set((members ?? []).map(m => m.student_id))
    const outsiders = entries.filter(e => !active.has(e.studentId)).map(e => e.studentId)
    if (outsiders.length) {
      return NextResponse.json(
        { error: `Not active members of this class: ${outsiders.join(', ')}` },
        { status: 403 },
      )
    }

    // ── Resolve each paper item to its anchor `questions` row ────────────────
    // Unpublished rows created by scripts/sync-paper-items.ts;
    // practice_attempts.question_id is a NOT NULL foreign key, so without them
    // marks cannot become attempts at all.
    const { data: anchors } = await admin
      .from('questions').select('id, question_template').eq('source_paper', sourcePaper)
    const questionIdByItem = new Map<string, string>()
    for (const a of anchors ?? []) {
      const m = a.question_template?.match(/^\[[^#]+#([^\]]+)\]/)
      if (m) questionIdByItem.set(m[1], a.id)
    }
    // Only the items actually set need an anchor row — a paper part-way through
    // being anchored is still usable for the section that is ready.
    const unanchored = selectedItems(paper, selection)
      .filter(q => !questionIdByItem.has(q.id)).map(q => q.id)
    if (unanchored.length) {
      console.error(`paper ${sourcePaper} missing anchor rows for: ${unanchored.join(', ')}`)
      return NextResponse.json({ error: 'This paper is not set up for tracking yet' }, { status: 409 })
    }

    // ── Write, one student at a time ─────────────────────────────────────────
    const results: { studentId: string; sittingId: string; marksEarned: number }[] = []

    for (const e of entries) {
      const marks = e.marks ?? {}
      const earned = marksEarned(marks)
      let sittingId = e.sittingId ?? null

      if (sittingId) {
        // Correcting. Re-check the sitting is this student's, on this paper, in
        // this class — an id from elsewhere must not be steerable into it.
        const { data: existing } = await admin
          .from('paper_sittings')
          .select('id, student_id, source_paper, class_id').eq('id', sittingId).single()
        if (!existing || existing.student_id !== e.studentId
            || existing.source_paper !== sourcePaper || existing.class_id !== classId) {
          return NextResponse.json({ error: 'Sitting not found' }, { status: 404 })
        }
        const { error: upErr } = await admin
          .from('paper_sittings')
          .update({ marks, marks_earned: earned, marks_total: totalMarks,
                    selected_items: selection, sat_on: satOn,
                    updated_at: new Date().toISOString() })
          .eq('id', sittingId)
        if (upErr) {
          console.error('sitting update failed:', upErr)
          return NextResponse.json({ error: 'Failed to save marks' }, { status: 500 })
        }
        // Rebuild this sitting's attempts only — scoped by sitting_id, so a
        // different sitting of the same paper (a resit) is left alone.
        await admin.from('practice_attempts').delete().eq('sitting_id', sittingId)
      } else {
        const { data: created, error: insErr } = await admin
          .from('paper_sittings')
          .insert({
            student_id: e.studentId, source_paper: sourcePaper, class_id: classId,
            marked_by: userId, sat_on: satOn,
            marks, marks_earned: earned, marks_total: totalMarks,
            selected_items: selection,
          })
          .select('id').single()
        if (insErr || !created) {
          console.error('sitting insert failed:', insErr)
          return NextResponse.json({ error: 'Failed to save marks' }, { status: 500 })
        }
        sittingId = created.id
      }

      const attempts = deriveAttempts(paper, marks, questionIdByItem, e.studentId, sittingId!)
      if (attempts.length) {
        const { error: attErr } = await admin.from('practice_attempts').insert(attempts)
        if (attErr) {
          console.error('attempt insert failed:', attErr)
          // The sitting saved but its attempts did not, which would silently
          // under-report mastery. Drop the sitting so the teacher sees a clean
          // failure and can retry, rather than a half-recorded paper.
          if (!e.sittingId) await admin.from('paper_sittings').delete().eq('id', sittingId)
          return NextResponse.json({ error: 'Failed to record skills' }, { status: 500 })
        }
      }

      results.push({ studentId: e.studentId, sittingId: sittingId!, marksEarned: earned })
    }

    return NextResponse.json({ sittings: results, marksTotal: totalMarks })
  } catch (err) {
    console.error('sittings POST error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
