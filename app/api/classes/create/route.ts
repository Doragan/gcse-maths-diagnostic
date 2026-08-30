import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { generateClassCode } from '../../../../lib/classCode'

// ─────────────────────────────────────────────────────────────────────────────
// Server-side class creation.
//
// Mirrors app/api/assessments/create: the caller's JWT is validated with the
// anon client, then a service-role client does the insert with code-collision
// retry. Going through the server keeps join codes unique and leaves a single
// place to add a creation gate later (the freemium "pay for persistence" idea).
// INSERT on `classes` is REVOKE'd from anon/authenticated, so creation MUST go
// through here.
// ─────────────────────────────────────────────────────────────────────────────

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
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    if (!name) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 })
    }
    if (name.length > 80) {
      return NextResponse.json({ error: 'Class name is too long (max 80 characters)' }, { status: 400 })
    }

    // ── 3. Service-role client (server-only secret; bypasses RLS) ──────────────
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    // Caller must be a teacher (has a teachers row) — a student token can't
    // create a class.
    const { data: teacher, error: teacherErr } = await admin
      .from('teachers')
      .select('id')
      .eq('id', user.id)
      .single()
    if (teacherErr || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // ── 4. Insert (retry a few times on code collision) ────────────────────────
    let created: any = null
    let lastErr: any = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await admin
        .from('classes')
        .insert({ name, code: generateClassCode(), teacher_id: user.id })
        .select()
        .single()
      if (!error) { created = data; break }
      // 23505 = unique_violation (code clash) → regenerate and retry.
      if (error.code !== '23505') { lastErr = error; break }
      lastErr = error
    }
    if (!created) {
      console.error('class insert failed:', lastErr)
      return NextResponse.json({ error: 'Failed to create class' }, { status: 500 })
    }

    return NextResponse.json({ class: created })
  } catch (err: any) {
    console.error('class create route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
