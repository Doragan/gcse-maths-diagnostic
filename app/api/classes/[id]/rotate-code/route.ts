import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { generateClassCode } from '../../../../../lib/classCode'

// ─────────────────────────────────────────────────────────────────────────────
// Rotate a class's join code.
//
// A join code is a STANDING INVITE: it never changed, so once it had been read
// out in a lesson, photographed off a whiteboard or forwarded into a group
// chat, there was no way to take it back. Anyone who ever saw it could join the
// class months later. This is the revocation half of that.
//
// Rotation does NOT touch membership. Students are linked by class_id, so
// everyone already in the class stays in it — only future joins are affected.
// That is the whole point: the teacher can cut off a leaked code without
// disrupting the class, which is what makes rotating it a cheap, safe action
// rather than something to be nervous about.
//
// Server-side under the service role and gated on ownership, mirroring
// app/api/classes/[id]/members. UPDATE on `classes` is not something the client
// should ever do directly.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: classId } = await params

    // ── Authenticate (anon client — does NOT bypass RLS) ───────────────────────
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

    // ── Authorise: caller must OWN this class ──────────────────────────────────
    const { data: cls } = await admin
      .from('classes')
      .select('id, teacher_id, code')
      .eq('id', classId)
      .single()
    if (!cls || cls.teacher_id !== user.id) {
      // 404 (not 403) so a non-owner can't confirm a class id exists — same
      // reasoning as the members route.
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // ── Rotate (retry on collision, same as creation) ──────────────────────────
    let rotated: { code: string } | null = null
    let lastErr: unknown = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const next = generateClassCode()
      // Guard against handing back the code we already had. Astronomically
      // unlikely (1 in ~1.05M), but a no-op rotation looks to the teacher like
      // the button is broken, and re-rolling costs nothing.
      if (next === cls.code) continue

      const { data, error } = await admin
        .from('classes')
        .update({ code: next })
        .eq('id', classId)
        .select('code')
        .single()
      if (!error) { rotated = data; break }
      // 23505 = unique_violation (another class holds that code) → re-roll.
      if (error.code !== '23505') { lastErr = error; break }
      lastErr = error
    }

    if (!rotated) {
      console.error('class code rotation failed:', lastErr)
      return NextResponse.json({ error: 'Could not generate a new code' }, { status: 500 })
    }

    return NextResponse.json({ code: rotated.code })
  } catch (err) {
    console.error('class code rotation route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
