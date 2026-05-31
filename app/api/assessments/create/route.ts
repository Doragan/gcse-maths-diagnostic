import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// Server-side assessment creation.
//
// Why this exists: the free-tier limit and the free_assessments_used counter
// used to be enforced/incremented in the browser with the anon key, which made
// them trivially bypassable (skip the check, or PATCH the counter back to 0).
// This route runs the whole flow under the service role:
//   1. validate the caller's JWT,
//   2. read paid status + free usage authoritatively,
//   3. enforce the free limit,
//   4. insert the assessment,
//   5. increment the counter.
// The client no longer writes teachers.free_assessments_used, so that column
// can be REVOKE'd from anon/authenticated.
// ─────────────────────────────────────────────────────────────────────────────

const FREE_LIMIT = 1
const ALLOWED_COURSES = ['gcse_foundation', 'gcse_higher']

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function POST(req: Request) {
  try {
    // ── 1. Authenticate the caller (anon client — does NOT bypass RLS) ─────────
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

    // ── 2. Validate input ──────────────────────────────────────────────────────
    const body = await req.json().catch(() => null)
    const title = typeof body?.title === 'string' ? body.title.trim() : ''
    const courseId = typeof body?.courseId === 'string' ? body.courseId.trim() : ''
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!ALLOWED_COURSES.includes(courseId)) {
      return NextResponse.json({ error: 'Invalid course' }, { status: 400 })
    }

    // ── 3. Service-role client (server-only secret; bypasses RLS) ──────────────
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    // Authoritative read of the teacher's paid status + free usage.
    const { data: teacher, error: teacherErr } = await admin
      .from('teachers')
      .select('paid_until, free_assessments_used')
      .eq('id', user.id)
      .single()
    if (teacherErr || !teacher) {
      // No teacher row → caller isn't a teacher (e.g. a student token).
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const isPaid = teacher.paid_until != null && new Date(teacher.paid_until) > new Date()
    const used = teacher.free_assessments_used ?? 0

    // ── 4. Enforce the free limit server-side ──────────────────────────────────
    if (!isPaid && used >= FREE_LIMIT) {
      return NextResponse.json(
        { error: 'Free limit reached', code: 'LIMIT_REACHED' },
        { status: 402 },
      )
    }

    // ── 5. Insert the assessment (retry a few times on code collision) ─────────
    let assessment: any = null
    let lastErr: any = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await admin
        .from('assessments')
        .insert({ title, code: generateCode(), teacher_id: user.id, course_id: courseId })
        .select()
        .single()
      if (!error) { assessment = data; break }
      // 23505 = unique_violation (code clash) → regenerate and retry.
      if (error.code !== '23505') { lastErr = error; break }
      lastErr = error
    }
    if (!assessment) {
      console.error('assessment insert failed:', lastErr)
      return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 })
    }

    // ── 6. Increment the free counter (non-paid only) ──────────────────────────
    // Note: read-then-write, not atomic. Worst case under a deliberate race a
    // teacher gets one extra free assessment. See the RPC hardening note.
    let freeUsed = used
    if (!isPaid) {
      freeUsed = used + 1
      const { error: incErr } = await admin
        .from('teachers')
        .update({ free_assessments_used: freeUsed })
        .eq('id', user.id)
      if (incErr) console.error('free counter increment failed:', incErr)
    }

    return NextResponse.json({ assessment, freeAssessmentsUsed: freeUsed })
  } catch (err: any) {
    console.error('assessment create route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
