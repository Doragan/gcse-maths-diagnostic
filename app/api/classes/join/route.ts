import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { rateLimitLookup } from '../../../../lib/rateLimit'

// ─────────────────────────────────────────────────────────────────────────────
// Student joins a class by CODE (audit F2).
//
// Replaces the old client-side insert into class_memberships. That path let a
// student join any class by uuid, because the RLS INSERT policy checked only
// `auth.uid() = student_id` — the join code was a client-side convention, never
// a server-enforced gate. INSERT is now revoked from anon/authenticated
// (20260727_class_membership_scope.sql), so creation must come through here.
//
// The code — not a class id — is the input: that is what makes knowing the code
// an actual requirement. Mirrors app/api/classes/create: validate the caller's
// JWT with the anon client, then write under the service role.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // Same enumeration guard as /api/classes/lookup — this endpoint takes the
    // same 4-char code space, and joins on a hit, so it must not become a
    // cheaper oracle than the endpoint it supersedes.
    if (!(await rateLimitLookup(req)).ok) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // ── 1. Authenticate the caller (anon client — does NOT bypass RLS) ─────────
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

    // ── 2. Validate input ──────────────────────────────────────────────────────
    const body = await req.json().catch(() => null)
    const raw = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : ''
    if (raw.length !== 4) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    // ── 3. Caller must be a student ────────────────────────────────────────────
    // class_memberships.student_id references students(id), so a teacher token
    // would fail on the FK anyway — check first for a clean error.
    const { data: student } = await admin
      .from('students')
      .select('id')
      .eq('id', user.id)
      .single()
    if (!student) {
      return NextResponse.json({ error: 'Only student accounts can join a class' }, { status: 403 })
    }

    // ── 4. Resolve the code → class (the gate the old flow was missing) ────────
    const { data: cls } = await admin
      .from('classes')
      .select('id, name')
      .eq('code', raw)
      .single()
    if (!cls) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 })
    }

    // ── 5. Join, or reactivate a previously-left membership ────────────────────
    // The (class_id, student_id) unique index makes this idempotent; joined_at is
    // omitted so an existing row keeps its original timestamp.
    const { error: upsertErr } = await admin
      .from('class_memberships')
      .upsert(
        { class_id: cls.id, student_id: user.id, status: 'active', left_at: null },
        { onConflict: 'class_id,student_id' },
      )
    if (upsertErr) {
      console.error('class join failed:', upsertErr)
      return NextResponse.json({ error: 'Could not join the class' }, { status: 500 })
    }

    return NextResponse.json({ class: { id: cls.id, name: cls.name } })
  } catch (err) {
    console.error('class join route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
