import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { notifyTeacherSignup } from '../../../../lib/email/teacherSignupNotify'

// ─────────────────────────────────────────────────────────────────────────────
// "Has this teacher been alerted on yet?" — asked by the teacher dashboard on
// load, answered by sending one email the first time and doing nothing ever
// after (lib/email/teacherSignupNotify.ts holds the claim and the reasoning).
//
// WHY A ROUTE EXISTS AT ALL. Google teachers are provisioned by server code
// (app/api/auth/provision), which fires the alert itself — no route needed.
// Email-and-password teachers are not: their `teachers` row is created by the
// `handle_new_user` DB trigger at signup, before the address is confirmed, and
// NO app code runs on that path. There is no server moment to hook, so the
// trigger is the first authenticated page load instead.
//
// That means the alert for an email signup fires when they first open the
// dashboard rather than at the instant they submit the form. That is the more
// useful moment anyway: an unconfirmed signup that never comes back is not a
// teacher, and the daily digest already counts those.
//
// ── Authentication, and why there is no rate limit ─────────────────────────
// Same Bearer-token pattern as /api/auth/provision: the caller's JWT is
// validated with the anon client, then the service-role client does the write.
// The caller cannot choose WHO the alert is about — it is always their own id
// from the verified token — and the claim is single-shot, so the worst a
// determined caller achieves is one email that was going to be sent anyway.
// There is nothing here to rate-limit.
//
// Returns 200 either way and never says whether mail went. The client has no
// use for the answer, and a teacher has no business knowing that an internal
// notice exists.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
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

    // A user with no teachers row claims nothing and sends nothing — the claim
    // simply matches no row, so a student calling this is a no-op.
    await notifyTeacherSignup(admin, user.id, 'email')

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[teacher-signup-alert] route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
