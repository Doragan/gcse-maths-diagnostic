import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// Student-side invitations: see who has invited you, and accept.
//
// This is where the consent property of the whole design is actually enforced,
// so the two checks below are load-bearing rather than defensive habit:
//
//   1. THE EMAIL MUST BE CONFIRMED. An invitation is matched by email and by
//      nothing else — there is no token — so an unconfirmed address would let
//      anyone claim a pupil's place by guessing a school address they cannot
//      read. 20260913_auth_signup_triggers.sql records that a students row is
//      created at SIGNUP, before confirmation, so this cannot be assumed.
//
//   2. ACCEPTANCE IS AN EXPLICIT ACT. POST exists precisely so that nothing
//      joins a student to a class on their behalf. It would be easy to join
//      them automatically at signup and call it a smoother flow; that would
//      recreate exactly the "no student act anywhere" problem that invitations
//      exist to avoid, and student-consented membership is what the entitlement
//      union is built on.
//
// `class_invitations` denies every client role, so both directions go through
// here. GET also returns the class NAME, which the student could not read for
// themselves: classes_member_select requires membership, which is the very
// thing they have not yet accepted.
//
//   GET  — my pending invitations
//   POST — accept one
// ─────────────────────────────────────────────────────────────────────────────

async function authedStudent(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Not authenticated' as const, code: 'unauthenticated' as const, status: 401 }
  }
  const token = authHeader.replace('Bearer ', '')

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
  const { data: { user }, error: userError } = await authClient.auth.getUser(token)
  if (userError || !user) return { error: 'Not authenticated' as const, code: 'unauthenticated' as const, status: 401 }

  // See (1) above. Without a confirmed address, email is not proof of anything.
  //
  // `code` is returned because two different conditions answer 403 here, and the
  // client has to tell them apart: an unconfirmed student needs to be told to
  // check their inbox, while a teacher who somehow reached this needs nothing at
  // all. Matching on the prose would work until someone reworded it.
  if (!user.email_confirmed_at || !user.email) {
    return {
      error: 'Please confirm your email address first' as const,
      code: 'email_unconfirmed' as const,
      status: 403,
    }
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  // class_memberships.student_id references students(id), so a teacher's token
  // would fail on the foreign key anyway. Checking first gives a clean error.
  const { data: student } = await admin
    .from('students')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()
  if (!student) {
    return {
      error: 'Only student accounts can accept a class invitation' as const,
      code: 'not_a_student' as const,
      status: 403,
    }
  }

  return { user, admin, email: user.email.toLowerCase() }
}

export async function GET(req: Request) {
  try {
    const ctx = await authedStudent(req)
    if ('error' in ctx) return NextResponse.json({ error: ctx.error, code: ctx.code }, { status: ctx.status })

    const { data, error } = await ctx.admin
      .from('class_invitations')
      .select('id, class_id, created_at, classes(name)')
      .eq('email', ctx.email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    if (error) {
      console.error('invitations load failed:', error)
      return NextResponse.json({ error: 'Failed to load invitations' }, { status: 500 })
    }

    const invitations = (data ?? []).map((i: any) => ({
      id: i.id,
      class_id: i.class_id,
      class_name: i.classes?.name ?? 'a class',
      created_at: i.created_at,
    }))

    return NextResponse.json({ invitations })
  } catch (err) {
    console.error('invitations GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await authedStudent(req)
    if ('error' in ctx) return NextResponse.json({ error: ctx.error, code: ctx.code }, { status: ctx.status })

    const body = await req.json().catch(() => null)
    const invitationId = typeof body?.id === 'string' ? body.id : ''
    if (!invitationId) {
      return NextResponse.json({ error: 'Which invitation?' }, { status: 400 })
    }

    // Scoped by EMAIL as well as by id: the id alone must never be enough, or a
    // guessed uuid would join someone else's class. This is the check that makes
    // "no token" safe.
    const { data: invitation } = await ctx.admin
      .from('class_invitations')
      .select('id, class_id, classes(name)')
      .eq('id', invitationId)
      .eq('email', ctx.email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
    if (!invitation) {
      return NextResponse.json({ error: 'That invitation is no longer available' }, { status: 404 })
    }

    // Same upsert as the join-by-code route, and idempotent for the same reason:
    // the (class_id, student_id) unique index means a student who previously
    // left is reactivated rather than duplicated. joined_at is omitted so an
    // existing row keeps its original timestamp.
    const { error: joinErr } = await ctx.admin
      .from('class_memberships')
      .upsert(
        { class_id: invitation.class_id, student_id: ctx.user.id, status: 'active', left_at: null },
        { onConflict: 'class_id,student_id' },
      )
    if (joinErr) {
      console.error('invitation join failed:', joinErr)
      return NextResponse.json({ error: 'Could not join the class' }, { status: 500 })
    }

    // Marked accepted only AFTER the membership exists. The other order would
    // leave an invitation that says it was taken when the student is in no
    // class, and nothing would ever offer it to them again.
    const { error: markErr } = await ctx.admin
      .from('class_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: ctx.user.id,
      })
      .eq('id', invitation.id)
    if (markErr) {
      // The student IS in the class, which is what they asked for, so this is
      // not their problem to see. It only means the teacher's roster view still
      // shows the invitation as pending.
      console.error('invitation mark-accepted failed:', markErr)
    }

    const cls = invitation.classes as unknown as { name?: string } | null
    return NextResponse.json({ class: { id: invitation.class_id, name: cls?.name ?? 'Class' } })
  } catch (err) {
    console.error('invitations POST error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
