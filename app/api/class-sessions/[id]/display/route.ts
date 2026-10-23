import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// What the projector needs, and nothing else.
//
// The display view goes on a classroom screen, so the governing rule is that it
// must never receive a pupil's name. That is a property of THIS ROUTE rather
// than of the page: a page can be careful about what it renders, but whatever
// it fetches is in the browser and in the network tab, and a teacher is not
// going to audit that before plugging in a projector.
//
// So this returns counts and the code, and the results route — which does carry
// names — is not called by the display page at all.
//
// ── Why not reuse the head probe ────────────────────────────────────────────
//
// `results/head` already returns an attempt count with no names, and the
// temptation is to add a participant count to it. It is polled every 10s by the
// live table, so a second aggregate there costs every open teacher tab for the
// benefit of a view that may not be open. A separate endpoint keeps the hot
// path cheap and lets this one answer the different question a projector asks:
// not "has anything changed" but "are they in, and is the code still good".
//
// Same ownership gate as the rest of the session routes.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    )
    const { data: { user } } = await authClient.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    const { data: session } = await service
      .from('class_sessions')
      .select('id, title, code, status, expires_at')
      .eq('id', id)
      .eq('teacher_id', user.id)
      .single()
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Counts only — `head: true` means the rows themselves never leave the
    // database, so there is no list of names to leak even server-side.
    const [{ count: joined }, { count: answers }] = await Promise.all([
      service.from('session_participants')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', id),
      service.from('session_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', id),
    ])

    return NextResponse.json({
      title:      session.title,
      code:       session.code,
      status:     session.status,
      expires_at: session.expires_at,
      joined:     joined ?? 0,
      answers:    answers ?? 0,
    })
  } catch (err) {
    console.error('[class-sessions/display]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
