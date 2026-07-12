import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// Provision an account row (teachers | students) for an OAuth (Google) user.
//
// WHY THIS EXISTS: email/password signups get their teachers/students row from
// the `handle_new_user` DB trigger, which keys off raw_user_meta_data->>'role'.
// Google OAuth carries no role and can't run the student 13+ age gate, so the
// trigger deliberately creates NO row for OAuth users (see the
// handle_new_user_oauth migration). The /auth/callback page calls this route
// once the OAuth session exists to create the correct row.
//
// Mirrors the Bearer-token pattern in app/api/classes/create: the caller's JWT
// is validated with the anon client, then the service-role client does the
// insert (client-role INSERT/UPDATE on these tables is REVOKE'd — see
// 20260611_lock_sensitive_columns.sql). Idempotent: a returning user (row
// already present) is a no-op success.
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
    const role = body?.role
    if (role !== 'teacher' && role !== 'student') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    // ── 3. Idempotency: if either account row already exists, we're done ───────
    // Covers double-fires and returning users. It also protects the invariant
    // that a user is EITHER a teacher OR a student — we never create a second
    // row of the other kind.
    const [{ data: existingTeacher }, { data: existingStudent }] = await Promise.all([
      admin.from('teachers').select('id').eq('id', user.id).maybeSingle(),
      admin.from('students').select('id').eq('id', user.id).maybeSingle(),
    ])
    if (existingTeacher || existingStudent) {
      return NextResponse.json({ ok: true, existed: true })
    }

    // ── 4. Create the requested row ────────────────────────────────────────────
    if (role === 'student') {
      // The 13+ age gate + consent is collected client-side before we get here
      // (Google can't run it). Enforce it server-side too.
      const displayName = typeof body?.displayName === 'string' ? body.displayName.trim() : ''
      if (!displayName) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 })
      }
      if (body?.confirmed13 !== true) {
        return NextResponse.json({ error: 'Age confirmation is required' }, { status: 400 })
      }
      // Match handle_new_student's column handling exactly: empty year_group is
      // stored as NULL (the trigger uses nullif(...,'')), and confirmed_13 is set
      // — it's a NOT NULL column the trigger always populates. The 13+ check above
      // is what lets us set it true here.
      const yearGroupRaw = typeof body?.yearGroup === 'string' ? body.yearGroup : ''
      const yearGroup = yearGroupRaw === '' ? null : yearGroupRaw
      const emailReminders = body?.emailReminders === true

      const { error: insertErr } = await admin.from('students').insert({
        id: user.id,
        display_name: displayName,
        year_group: yearGroup,
        confirmed_13: true,
        subscription_tier: 'free',
      })
      if (insertErr) {
        console.error('student provision insert failed:', insertErr)
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
      }

      // Mirror what signUpStudent stores in auth metadata, so downstream consumers
      // (e.g. the re-engagement cron's raw_user_meta_data->>'email_reminders'
      // consent check in 20260630_reengagement.sql) behave identically for Google
      // and email students.
      const { error: metaErr } = await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          role: 'student',
          display_name: displayName,
          year_group: yearGroup,
          email_reminders: emailReminders,
        },
      })
      if (metaErr) console.error('student metadata update failed:', metaErr)

      return NextResponse.json({ ok: true, role: 'student' })
    }

    // role === 'teacher' — no extra consent; mirrors the email teacher path.
    // is_admin / paid_until / free_assessments_used are intentionally NOT taken
    // from the body: they keep their column defaults (false / null / 0) so this
    // route can't be used to self-grant admin or a paid pass.
    const { error: insertErr } = await admin.from('teachers').insert({ id: user.id })
    if (insertErr) {
      console.error('teacher provision insert failed:', insertErr)
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }
    const { error: metaErr } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { role: 'teacher' },
    })
    if (metaErr) console.error('teacher metadata update failed:', metaErr)

    return NextResponse.json({ ok: true, role: 'teacher' })
  } catch (err: any) {
    console.error('provision route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
