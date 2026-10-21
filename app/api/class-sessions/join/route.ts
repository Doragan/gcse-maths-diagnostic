import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { rateLimitLookup } from '../../../../lib/rateLimit'
import { parseParticipantName } from '../../../../lib/classSessions'
import { CLASS_CODE_LENGTH } from '../../../../lib/classCode'

// ─────────────────────────────────────────────────────────────────────────────
// A pupil joins a class session (docs/audit/29, increment 4).
//
// UNAUTHENTICATED BY DESIGN — that is the entire feature. The code is the only
// credential, so this route carries the protections that would otherwise have
// nowhere to live:
//
//   * RATE LIMITED on the 4-character code space, reusing the same limiter the
//     legacy assessment lookup uses (20/min/IP). Without it this endpoint is an
//     enumerator that returns a class's topic list.
//   * NAME VALIDATED server-side, with the same rules the database CHECKs
//     enforce. A client check alone would not survive a direct call.
//   * SESSION STATE CHECKED here as well as in RLS, so a pupil gets a sentence
//     they can read instead of a failed insert.
//
// It is also why session_participants needs no client INSERT policy at all: the
// row is written under the service role, and the new participant id comes back
// in the response, which an insert().select() from the browser would have
// needed a SELECT policy to do.
//
// WHAT IT DELIBERATELY DOES NOT RETURN: the teacher, the school, the other
// participants, or anything about a previous session. A pupil holding a code
// learns the session's name, its skills and how many questions to answer.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    if (!(await rateLimitLookup(req)).ok) {
      return NextResponse.json({ error: 'Too many tries. Wait a moment.' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)

    const rawCode = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : ''
    if (rawCode.length !== CLASS_CODE_LENGTH) {
      return NextResponse.json({ error: 'That code is not right. Check with your teacher.' }, { status: 400 })
    }

    // Validated before the code is looked up, so a pupil who typed their email
    // into the name box is told so rather than being told the code is wrong.
    const name = parseParticipantName(body?.name)
    if (!name.ok) return NextResponse.json({ error: name.error }, { status: 400 })

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    // Only an OPEN session is findable by code at all. A closed one has
    // released its code, so matching it here would be wrong as well as useless.
    const { data: session, error: lookupError } = await admin
      .from('class_sessions')
      .select('id, title, skill_ids, target_count, course_id, status, expires_at')
      .eq('code', rawCode)
      .eq('status', 'open')
      .maybeSingle()

    if (lookupError) {
      console.error('[class-sessions/join] lookup', lookupError)
      return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
    }
    if (!session) {
      return NextResponse.json({ error: 'No session with that code. Check with your teacher.' }, { status: 404 })
    }

    // Expiry is a separate message from a wrong code, because the pupil's next
    // action differs: one is "check the code", the other is "ask your teacher
    // to start a new one".
    if (new Date(session.expires_at).getTime() <= Date.now()) {
      return NextResponse.json(
        { error: 'That session has finished. Ask your teacher to start a new one.' },
        { status: 410 },
      )
    }

    const { data: participant, error: joinError } = await admin
      .from('session_participants')
      .insert({ session_id: session.id, display_name: name.value })
      .select('id, display_name')
      .single()

    if (joinError || !participant) {
      console.error('[class-sessions/join] insert', joinError)
      return NextResponse.json({ error: 'Could not join. Try again.' }, { status: 500 })
    }

    return NextResponse.json({
      participant_id: participant.id,
      display_name:   participant.display_name,
      session: {
        id:           session.id,
        title:        session.title,
        skill_ids:    session.skill_ids,
        target_count: session.target_count,
        course_id:    session.course_id,
        expires_at:   session.expires_at,
      },
    })
  } catch (err) {
    console.error('[class-sessions/join]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
