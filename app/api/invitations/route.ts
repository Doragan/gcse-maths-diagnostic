import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// Student-side invitations: see who has invited you, and accept.
//
// This is where the consent property of the whole design is enforced, so the
// checks below are load-bearing rather than defensive habit.
//
//   1. THE ACCEPTING ACCOUNT'S EMAIL MUST BE CONFIRMED.
//      20260913_auth_signup_triggers.sql records that a students row is created
//      at SIGNUP, before confirmation, so an unconfirmed account proves nothing
//      about who is holding it. It must not be able to take a place in a class.
//
//      ⚠ NOTE WHAT THIS CHECKS AND WHAT IT NO LONGER CHECKS. The original build
//      required the confirmed address to EQUAL the invited address, because the
//      address was the only key. That is the rule that got the feature
//      reverted: a pupil who signed up with a personal address rather than the
//      school one their teacher typed could never accept, and was shown an
//      empty page with no explanation. Now the token in the link is the key, and
//      this check is about the ACCOUNT being real rather than about which
//      address it uses. A mismatch is shown to the student and recorded for the
//      teacher instead of silently failing.
//
//   2. ACCEPTANCE IS AN EXPLICIT ACT. POST exists precisely so that nothing
//      joins a student to a class on their behalf. It would be easy to accept
//      automatically when a link is opened, or at signup, and call it a
//      smoother flow; that would recreate exactly the "no student act anywhere"
//      problem invitations exist to avoid, and student-consented membership is
//      what the entitlement union is built on. A token in a URL is not consent.
//
// `class_invitations` denies every client role, so everything goes through here
// and app/api/invitations/lookup. GET also returns the class NAME, which the
// student could not read for themselves: classes_member_select requires
// membership, which is the very thing they have not yet accepted.
//
//   GET  — invitations matched to my confirmed address (the fallback path)
//   POST — accept one, by token from the emailed link or by id from GET
// ─────────────────────────────────────────────────────────────────────────────

type StudentContext = {
  user: { id: string; email: string }
  admin: SupabaseClient
  email: string
}

type AuthFailure = { error: string; code: string; status: number }

async function authedStudent(req: Request): Promise<StudentContext | AuthFailure> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Not authenticated', code: 'unauthenticated', status: 401 }
  }
  const token = authHeader.replace('Bearer ', '')

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
  const { data: { user }, error: userError } = await authClient.auth.getUser(token)
  if (userError || !user) {
    return { error: 'Not authenticated', code: 'unauthenticated', status: 401 }
  }

  // See (1) above. Without a confirmed address, the account is not proof of
  // anything and must not be able to claim a place in a class.
  //
  // `code` is returned because two different conditions answer 403 here and the
  // client has to tell them apart: an unconfirmed student needs to be told to
  // check their inbox, while a teacher who somehow reached this needs nothing at
  // all. Matching on the prose would work until someone reworded it.
  if (!user.email_confirmed_at || !user.email) {
    return {
      error: 'Please confirm your email address first',
      code: 'email_unconfirmed',
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
      error: 'Only student accounts can accept a class invitation',
      code: 'not_a_student',
      status: 403,
    }
  }

  return { user: { id: user.id, email: user.email }, admin, email: user.email.toLowerCase() }
}

function isFailure(ctx: StudentContext | AuthFailure): ctx is AuthFailure {
  return 'error' in ctx
}

export async function GET(req: Request) {
  try {
    const ctx = await authedStudent(req)
    if (isFailure(ctx)) {
      return NextResponse.json({ error: ctx.error, code: ctx.code }, { status: ctx.status })
    }

    // The ADDRESS-MATCHED path, kept as a convenience rather than as the
    // mechanism. A pupil who signed up with the address their teacher typed sees
    // the invitation without needing the email at all — useful when the mail
    // went to spam, which is a real failure mode here (delivery was greylisted
    // for two days in October). A pupil who used a different address simply sees
    // nothing from this, and reaches their invitation by its link instead.
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

    const invitations = (data ?? []).map(i => {
      const cls = i.classes as unknown as { name?: string } | null
      return {
        id: i.id,
        class_id: i.class_id,
        class_name: cls?.name ?? 'a class',
        created_at: i.created_at,
      }
    })

    return NextResponse.json({ invitations })
  } catch (err) {
    console.error('invitations GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await authedStudent(req)
    if (isFailure(ctx)) {
      return NextResponse.json({ error: ctx.error, code: ctx.code }, { status: ctx.status })
    }

    const body = await req.json().catch(() => null)
    const token = typeof body?.token === 'string' ? body.token.trim() : ''
    const invitationId = typeof body?.id === 'string' ? body.id : ''

    if (!token && !invitationId) {
      return NextResponse.json({ error: 'Which invitation?' }, { status: 400 })
    }

    // Two ways in, and the difference matters:
    //
    //   BY TOKEN — from the emailed link. The token IS the authorisation to
    //     claim this invitation, because it was sent to the invited address and
    //     nowhere else. The accepting account's address is NOT required to
    //     match; that requirement is what broke the original build.
    //
    //   BY ID — from GET above, which only ever returned invitations already
    //     matched to this student's confirmed address. Still scoped by email
    //     here rather than trusting the id, because an id that came from
    //     somewhere else must not be enough: a guessed uuid would otherwise
    //     join someone else's class.
    const query = ctx.admin
      .from('class_invitations')
      .select('id, class_id, email, classes(name)')
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())

    const { data: invitation } = token
      ? await query.eq('token', token).maybeSingle()
      : await query.eq('id', invitationId).eq('email', ctx.email).maybeSingle()

    if (!invitation) {
      return NextResponse.json(
        {
          error: 'That invitation is no longer available',
          code: 'invitation_unavailable',
        },
        { status: 404 },
      )
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
    //
    // `accepted_by` is this student, whatever address they used, which is how
    // the teacher's roster shows "invited a.pupil@school.uk, joined as Amara"
    // rather than two lists that disagree.
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
    return NextResponse.json({
      class: { id: invitation.class_id, name: cls?.name ?? 'Class' },
    })
  } catch (err) {
    console.error('invitations POST error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
