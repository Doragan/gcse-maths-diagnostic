import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// Every student a teacher can see, across all of their classes.
//
// The teacher-keyed counterpart to app/api/classes/[id]/members, for the 1:1
// tutor view (docs/audit/26 §4.2). A tutor's students sit in one class each, so
// the per-class roster means one request per student and no single list of the
// people they actually teach.
//
// SAME CROSS-ACCOUNT READ, SAME LIMITS. This is a teacher reading fields from
// another user's account, so it keeps every constraint the members route sets:
// service-role, server-side, and column-scoped to display_name + year_group.
//
// ⚠ NO EMAIL ADDRESS, EVER, and it is not merely omitted from the select —
// `public.students` HAS no email column. A teacher cannot reach a pupil's
// address, which the privacy notice tells pupils, docs/legal/dpa-schools.md §4
// tells schools (calling it a property of the design rather than a configurable
// rule), and the DPIA repeats. The one place an address was reachable — the
// invitation roster showing who accepted — is masked, see PR #138.
//
// Also NOT exposed: subscription_tier, paid_until, stripe ids, mini-exam
// counters. Those are the student's own commercial data and no teacher-facing
// screen has a use for them.
// ─────────────────────────────────────────────────────────────────────────────

/** One row of the tutor's student list. `classes` is for grouping, not display. */
export type TutorStudentRow = {
  student_id: string
  display_name: string
  year_group: string | null
  joined_at: string
  /** Every class of this teacher's that the student belongs to. Usually one. */
  classes: Array<{ id: string; name: string }>
}

export async function GET(req: Request) {
  try {
    // ── Authenticate ─────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
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

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    // ── The caller's classes ─────────────────────────────────────────────────
    // Ownership is the gate, exactly as in the per-class route: a caller who
    // owns no classes gets an empty list rather than an error, because "a
    // teacher with no classes yet" is an ordinary state, not a failure.
    const { data: classes, error: clsErr } = await admin
      .from('classes')
      .select('id, name')
      .eq('teacher_id', user.id)
    if (clsErr) {
      console.error('tutor students: classes load failed:', clsErr)
      return NextResponse.json({ error: 'Failed to load students' }, { status: 500 })
    }
    if (!classes?.length) return NextResponse.json({ students: [] })

    const classById = new Map(classes.map(c => [c.id as string, c.name as string]))

    // ── Active members of those classes ──────────────────────────────────────
    const { data: members, error: memErr } = await admin
      .from('class_memberships')
      .select('class_id, student_id, joined_at, students(display_name, year_group)')
      .in('class_id', [...classById.keys()])
      .eq('status', 'active')
    if (memErr) {
      console.error('tutor students: members load failed:', memErr)
      return NextResponse.json({ error: 'Failed to load students' }, { status: 500 })
    }

    // ── One row per STUDENT, not per membership ──────────────────────────────
    // A student in two of this teacher's classes is one person and must appear
    // once; the classes they are in are collected onto that single row. Getting
    // this wrong would double them in the list and, worse, double-count them in
    // any total computed from it.
    const byStudent = new Map<string, TutorStudentRow>()
    for (const m of members ?? []) {
      const id = m.student_id as string
      const s = m.students as unknown as { display_name?: string; year_group?: string | null } | null
      const cls = { id: m.class_id as string, name: classById.get(m.class_id as string) ?? 'Class' }

      const existing = byStudent.get(id)
      if (existing) {
        existing.classes.push(cls)
        // Keep the EARLIEST join date: it is when this teacher first started
        // seeing them, which is what the list means by "joined".
        if ((m.joined_at as string) < existing.joined_at) existing.joined_at = m.joined_at as string
        continue
      }
      byStudent.set(id, {
        student_id: id,
        display_name: s?.display_name ?? 'Student',
        year_group: s?.year_group ?? null,
        joined_at: m.joined_at as string,
        classes: [cls],
      })
    }

    const students = [...byStudent.values()]
      .sort((a, b) => a.display_name.localeCompare(b.display_name))

    return NextResponse.json({ students })
  } catch (err) {
    console.error('tutor students error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
