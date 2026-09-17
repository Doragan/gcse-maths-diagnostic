import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { summariseSchools } from '../../../../lib/adminSchools'

// ─────────────────────────────────────────────────────────────────────────────
// What each school was granted, and what it is actually using.
//
// `schools` denies every client role outright — no policy, grants revoked — so
// the client cannot compute this, by design: seat counts and grant dates are
// commercial data. Same shape as app/api/admin/usage: authenticate on the anon
// client (which does not bypass RLS), prove the caller is an admin, and only
// then reach for the service role.
//
// Returns counts and school names only. No student id, no display name and no
// email address is fetched, so none can leak into the response.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
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

    // 404 rather than 403 for a non-admin: a 403 would confirm the endpoint
    // exists and that admin is a thing to become. Mirrors /api/admin/usage.
    const { data: teacher } = await admin
      .from('teachers').select('is_admin').eq('id', user.id).maybeSingle()
    if (teacher?.is_admin !== true) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const [schoolsRes, classesRes, membersRes] = await Promise.all([
      admin.from('schools').select('id, name, seats, granted_until'),
      admin.from('classes').select('id, school_id, teacher_id'),
      // student_id is needed to count DISTINCT students and never leaves this
      // route — summariseSchools returns counts only.
      admin.from('class_memberships').select('class_id, student_id, status'),
    ])

    if (schoolsRes.error) {
      // The schools table may not exist in an environment where
      // 20260915_schools_and_class_grant.sql has not been applied. An empty
      // report is the honest answer there, not a 500.
      console.warn('[admin/schools] schools unavailable:', schoolsRes.error.message)
    }
    if (classesRes.error) throw new Error(`classes: ${classesRes.error.message}`)
    if (membersRes.error) throw new Error(`class_memberships: ${membersRes.error.message}`)

    const report = summariseSchools({
      schools: schoolsRes.data ?? [],
      classes: classesRes.data ?? [],
      memberships: membersRes.data ?? [],
    })

    return NextResponse.json(report)
  } catch (err: any) {
    console.error('[admin/schools] failed:', err?.message ?? err)
    return NextResponse.json({ error: 'Failed to build the schools report' }, { status: 500 })
  }
}
