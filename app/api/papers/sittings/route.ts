import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { PAPERS } from '../../../../lib/demoPapers'
import {
  validateEntries, deriveAttempts, marksEarned, marksTotal,
  type StudentEntry,
} from '../../../../lib/papers/sittingMarks'

// ─────────────────────────────────────────────────────────────────────────────
// Record a teacher-marked paper for a class.
//
// This is the write that turns marks into skill tracking. It is the second
// cross-account write in the codebase (after assignments): a teacher creating
// rows attributed to students. Same shape as the class-roster route — bearer
// auth against the anon client, then the service role ONLY after class
// ownership is proven — because `practice_attempts` has no teacher INSERT
// policy and deliberately should not gain one; a single server-side gate is
// easier to reason about than a second, weaker authorisation path.
//
// WHAT IT WRITES, per student:
//   1. a `paper_sittings` row — the durable record, holding every mark
//   2. one `practice_attempts` row per marked item, stamped with `sitting_id`
//
// A sitting is a ROW, NOT A KEY: posting without `sittingId` always creates a
// new one, so a resit is simply a second sitting and both feed mastery. Passing
// `sittingId` corrects an existing sitting in place — its derived attempts are
// deleted and rebuilt, scoped by `sitting_id` so a *different* sitting of the
// same paper is untouched.
//
// TWO RULES THE MARKS OBEY (user rulings):
//   • Full marks only counts as correct. A 3-out-of-4 is `correct: false`,
//     exactly as a wrong answer in practice would be. No partial-credit banding
//     reaches the mastery substrate — partial credit lives in the marks, which
//     the sitting keeps in full.
//   • Every derived attempt is `kind: 'exam'`, i.e. POSITIVE-ONLY, whatever the
//     item's own kind. calculateMastery skips a wrong exam-kind attempt
//     entirely, so a dropped mark can never lower a skill; it credits on
//     success and stays silent on failure.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // ── Authenticate ─────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    )
    const { data: { user }, error: userError } = await authClient.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // ── Validate the request shape ───────────────────────────────────────────
    const body = await req.json().catch(() => null)
    const sourcePaper = typeof body?.sourcePaper === 'string' ? body.sourcePaper : ''
    const classId = typeof body?.classId === 'string' ? body.classId : ''
    const satOn = typeof body?.satOn === 'string' ? body.satOn : null
    const entries: StudentEntry[] = Array.isArray(body?.students) ? body.students : []

    const paper = PAPERS[sourcePaper]
    if (!paper) {
      return NextResponse.json({ error: 'Unknown paper' }, { status: 400 })
    }
    // A class is required for now. The schema allows class_id NULL so a paper
    // can later be set for one student, but that needs its own authorisation
    // story — without a class there is nothing linking teacher to student, and
    // accepting it here would let any teacher write to any student.
    if (!classId) {
      return NextResponse.json({ error: 'classId is required' }, { status: 400 })
    }
    if (satOn && !/^\d{4}-\d{2}-\d{2}$/.test(satOn)) {
      return NextResponse.json({ error: 'satOn must be YYYY-MM-DD' }, { status: 400 })
    }

    // Reject the whole submission before writing anything, so one bad mark
    // cannot leave half a class recorded. See lib/papers/sittingMarks.ts.
    const validation = validateEntries(paper, entries)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const totalMarks = marksTotal(paper)

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    // ── Authorise: caller must own the class ─────────────────────────────────
    const { data: cls } = await admin
      .from('classes').select('id, teacher_id').eq('id', classId).single()
    if (!cls || cls.teacher_id !== user.id) {
      // 404 not 403, so a non-owner cannot confirm a class id exists.
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // ── Authorise: every student must be an ACTIVE member of that class ──────
    const { data: members } = await admin
      .from('class_memberships')
      .select('student_id')
      .eq('class_id', classId)
      .eq('status', 'active')
    const active = new Set((members ?? []).map(m => m.student_id))
    const outsiders = entries.filter(e => !active.has(e.studentId)).map(e => e.studentId)
    if (outsiders.length) {
      return NextResponse.json(
        { error: `Not active members of this class: ${outsiders.join(', ')}` },
        { status: 403 },
      )
    }

    // ── Resolve each paper item to its anchor `questions` row ────────────────
    // These are the unpublished rows created by scripts/sync-paper-items.ts;
    // practice_attempts.question_id is a NOT NULL foreign key, so without them
    // marks cannot become attempts at all.
    const { data: anchors } = await admin
      .from('questions')
      .select('id, question_template')
      .eq('source_paper', sourcePaper)
    const questionIdByItem = new Map<string, string>()
    for (const a of anchors ?? []) {
      const m = a.question_template?.match(/^\[[^#]+#([^\]]+)\]/)
      if (m) questionIdByItem.set(m[1], a.id)
    }
    const unanchored = paper.questions.filter(q => !questionIdByItem.has(q.id)).map(q => q.id)
    if (unanchored.length) {
      console.error(`paper ${sourcePaper} missing anchor rows for: ${unanchored.join(', ')}`)
      return NextResponse.json(
        { error: 'This paper is not set up for tracking yet' },
        { status: 409 },
      )
    }

    // ── Write, one student at a time ─────────────────────────────────────────
    const results: { studentId: string; sittingId: string; marksEarned: number }[] = []

    for (const e of entries) {
      const marks = e.marks ?? {}
      const earned = marksEarned(marks)

      let sittingId = e.sittingId ?? null

      if (sittingId) {
        // Correcting an existing sitting. Re-check it is this student's, on this
        // paper, in this class — a sitting id from elsewhere must not be
        // steerable into this class's data.
        const { data: existing } = await admin
          .from('paper_sittings')
          .select('id, student_id, source_paper, class_id')
          .eq('id', sittingId).single()
        if (!existing || existing.student_id !== e.studentId
            || existing.source_paper !== sourcePaper || existing.class_id !== classId) {
          return NextResponse.json({ error: 'Sitting not found' }, { status: 404 })
        }
        const { error: upErr } = await admin
          .from('paper_sittings')
          .update({ marks, marks_earned: earned, marks_total: totalMarks,
                    sat_on: satOn, updated_at: new Date().toISOString() })
          .eq('id', sittingId)
        if (upErr) {
          console.error('sitting update failed:', upErr)
          return NextResponse.json({ error: 'Failed to save marks' }, { status: 500 })
        }
        // Rebuild this sitting's derived attempts. Scoped by sitting_id, so a
        // different sitting of the same paper (a resit) is left alone.
        await admin.from('practice_attempts').delete().eq('sitting_id', sittingId)
      } else {
        const { data: created, error: insErr } = await admin
          .from('paper_sittings')
          .insert({
            student_id: e.studentId, source_paper: sourcePaper, class_id: classId,
            marked_by: user.id, sat_on: satOn,
            marks, marks_earned: earned, marks_total: totalMarks,
          })
          .select('id').single()
        if (insErr || !created) {
          console.error('sitting insert failed:', insErr)
          return NextResponse.json({ error: 'Failed to save marks' }, { status: 500 })
        }
        sittingId = created.id
      }

      // Full marks only counts as correct, and every row is positive-only
      // exam-kind — both rules live in lib/papers/sittingMarks.ts, tested.
      const attempts = deriveAttempts(paper, marks, questionIdByItem, e.studentId, sittingId!)
      if (attempts.length) {
        const { error: attErr } = await admin.from('practice_attempts').insert(attempts)
        if (attErr) {
          console.error('attempt insert failed:', attErr)
          // The sitting is saved but its attempts are not, which would silently
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
    console.error('paper sittings route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
