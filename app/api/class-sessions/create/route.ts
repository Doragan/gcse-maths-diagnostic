import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { generateClassCode } from '../../../../lib/classCode'
import { COURSE_IDS_ALL } from '../../../../data/courses'
import { skillsById } from '../../../../lib/skills/skillGraph'

// ─────────────────────────────────────────────────────────────────────────────
// Start a no-login class session (docs/audit/29, increment 3).
//
// Mirrors app/api/classes/create: validate the caller's JWT with the anon
// client, confirm they are a teacher, then insert under the service role with
// code-collision retry. INSERT on class_sessions is REVOKE'd from anon and
// authenticated, so creation MUST come through here.
//
// A TEACHER ACCOUNT IS REQUIRED, and that is not an oversight. The constraint
// this feature exists for is the approval time on PUPIL logins; staff accounts
// are not blocked, teachers sign themselves up, and the live view has to
// survive the teacher's tab crashing mid-lesson — which needs an owner the
// session can be found by. /mark needs no account at all because it keeps
// nothing; a session keeps something for a few hours, and something kept needs
// an owner.
// ─────────────────────────────────────────────────────────────────────────────

/** Matches the target_count CHECK on the table. One lesson, not a term. */
const MAX_TARGET = 50
/** How many times to re-mint a colliding code before giving up. */
const CODE_ATTEMPTS = 5

export async function POST(req: Request) {
  try {
    // ── 1. Authenticate the caller (anon client — does NOT bypass RLS) ───────
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

    // ── 2. Validate input ────────────────────────────────────────────────────
    const body = await req.json().catch(() => null)

    const title = typeof body?.title === 'string' ? body.title.trim() : ''
    if (!title) {
      return NextResponse.json({ error: 'Give the session a name' }, { status: 400 })
    }
    if (title.length > 120) {
      return NextResponse.json({ error: 'That name is too long (max 120 characters)' }, { status: 400 })
    }

    // Every skill id checked against the curriculum. An unknown id would serve
    // an empty question pool to a whole class at once, and the pupil side has
    // no way to report that back.
    const rawSkills = Array.isArray(body?.skill_ids) ? body.skill_ids : []
    const skillIds: string[] = rawSkills.filter((s: unknown): s is string => typeof s === 'string')
    if (skillIds.length === 0) {
      return NextResponse.json({ error: 'Choose at least one skill' }, { status: 400 })
    }
    const unknown = skillIds.filter(id => !skillsById[id])
    if (unknown.length > 0) {
      return NextResponse.json({ error: `Unknown skill: ${unknown[0]}` }, { status: 400 })
    }

    const targetCount = Number(body?.target_count)
    if (!Number.isInteger(targetCount) || targetCount < 1 || targetCount > MAX_TARGET) {
      return NextResponse.json(
        { error: `Set a target between 1 and ${MAX_TARGET} questions` },
        { status: 400 },
      )
    }

    // Guarded against the real course list rather than trusted: a bad course id
    // is how an International GCSE class ends up being served GCSE questions,
    // which is the leak qualification scoping was built to close (PR #140).
    const courseId = typeof body?.course_id === 'string' ? body.course_id : ''
    if (!COURSE_IDS_ALL.includes(courseId)) {
      return NextResponse.json({ error: 'Unknown course' }, { status: 400 })
    }

    // ── 3. Service-role client (server-only secret; bypasses RLS) ────────────
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    const { data: teacher, error: teacherErr } = await admin
      .from('teachers')
      .select('id')
      .eq('id', user.id)
      .single()
    if (teacherErr || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // ── 4. Insert, re-minting the code on collision ──────────────────────────
    //
    // The unique index is PARTIAL (`where status = 'open'`), so a collision
    // only happens against another session that is still open — a much smaller
    // set than every session ever, and the reason old codes become reusable.
    let created: ClassSessionRow | null = null
    let lastErr: { code?: string; message?: string } | null = null

    for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
      const { data, error } = await admin
        .from('class_sessions')
        .insert({
          teacher_id:   user.id,
          title,
          code:         generateClassCode(),
          skill_ids:    skillIds,
          target_count: targetCount,
          course_id:    courseId,
        })
        .select()
        .single()

      if (!error) { created = data as ClassSessionRow; break }
      lastErr = error
      // 23505 = unique_violation (code clash) → re-mint and retry. Anything
      // else is not going to fix itself on a second go.
      if (error.code !== '23505') break
    }

    if (!created) {
      console.error('[class-sessions/create]', lastErr)
      return NextResponse.json({ error: 'Could not start the session' }, { status: 500 })
    }

    return NextResponse.json({ session: created })
  } catch (err) {
    console.error('[class-sessions/create]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

type ClassSessionRow = {
  id: string
  code: string
  status: string
  expires_at: string
}
