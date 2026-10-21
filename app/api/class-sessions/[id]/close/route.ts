import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// Close a class session (docs/audit/29, increment 3).
//
// UPDATE on class_sessions is REVOKE'd from client roles, so this is the only
// way to close one. Ownership is checked in the WHERE clause rather than with a
// read first: a teacher who does not own the session matches no row, which is
// reported as 404 — the same answer as a session that does not exist, so this
// route cannot be used to discover that an id is real.
//
// NO REOPEN, deliberately. The attempt gate treats a closed session as
// immutable, and a code that can come back to life is one last lesson's class
// can type into this lesson's session. A teacher who closed one by accident
// starts another; it costs them reading out four characters.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
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

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    // `eq('status', 'open')` makes this idempotent in the way that matters: a
    // second click cannot overwrite closed_at with a later time, so the record
    // of when the lesson actually ended survives a double tap.
    const { data, error } = await admin
      .from('class_sessions')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('teacher_id', user.id)
      .eq('status', 'open')
      .select()
      .maybeSingle()

    if (error) {
      console.error('[class-sessions/close]', error)
      return NextResponse.json({ error: 'Could not close the session' }, { status: 500 })
    }

    // No row updated: it is not theirs, does not exist, or was already closed.
    // Re-read under the service role, still ownership-scoped, so an
    // already-closed session answers 200 with the truth rather than an error
    // the teacher cannot act on.
    if (!data) {
      const { data: existing } = await admin
        .from('class_sessions')
        .select('*')
        .eq('id', id)
        .eq('teacher_id', user.id)
        .maybeSingle()
      if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({ session: existing })
    }

    return NextResponse.json({ session: data })
  } catch (err) {
    console.error('[class-sessions/close]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
