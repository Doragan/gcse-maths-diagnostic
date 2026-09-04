import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// Server-side assessment creation.
//
// Originally this existed to enforce a one-diagnostic free limit server-side,
// because the browser was doing it with the anon key and it was trivially
// bypassable. THE LIMIT IS GONE — class diagnostics are free — but the route
// stays: creation still belongs under the service role so the client never
// writes teachers.free_assessments_used, and that column stays REVOKE'd from
// anon/authenticated.
//
//   1. validate the caller's JWT,
//   2. confirm they are a teacher,
//   3. insert the assessment,
//   4. count it.
// ─────────────────────────────────────────────────────────────────────────────

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

    const used = teacher.free_assessments_used ?? 0

    // ── 4. No limit: class diagnostics are free ────────────────────────────────
    // The 402 that used to live here gated the wrong thing. The diagnostic is
    // self-reported and deliberately the LOWEST-weight signal the product has —
    // it was demoted to one input among many on the student side — so charging
    // for it put the paywall on the weakest feature while the genuinely useful
    // teacher work (class mastery, assignments, paper marking) was never gated
    // at all. A teacher's first experience is now the whole thing.
    //
    // The teacher checkout is disabled alongside this, since the pass had
    // nothing else to sell. See app/api/stripe/checkout.

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

    // ── 6. Count diagnostics run ───────────────────────────────────────────────
    // The column outlives the limit it was named for: nothing gates on it now,
    // so it is simply how many diagnostics this teacher has run. Kept because
    // it is the only record of that, and dropping it would lose the history for
    // no gain. The old read-then-write race no longer matters — an off-by-one
    // in a counter that grants nothing is not a bug worth an RPC.
    const freeUsed = used + 1
    const { error: incErr } = await admin
      .from('teachers')
      .update({ free_assessments_used: freeUsed })
      .eq('id', user.id)
    if (incErr) console.error('diagnostic counter increment failed:', incErr)

    return NextResponse.json({ assessment, freeAssessmentsUsed: freeUsed })
  } catch (err: any) {
    console.error('assessment create route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
