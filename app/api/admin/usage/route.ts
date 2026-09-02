import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { computeUsage } from '../../../../lib/adminUsage'

// ─────────────────────────────────────────────────────────────────────────────
// Product-usage aggregates for /admin/usage.
//
// Reading across every student is exactly what RLS is there to prevent, so the
// client cannot compute this. The alternative to this route is a SECURITY
// DEFINER RPC, which would need a migration; a service-role route behind an
// is_admin check gives the same guarantee with no schema change and keeps the
// admin check server-side, where the client can't be trusted to have done it.
//
// Same shape as app/api/classes/[id]/rotate-code: authenticate on the ANON
// client (which does not bypass RLS), prove the caller is an admin, and only
// then reach for the service role.
//
// Returns aggregates and opaque student ids only — no email address and no
// display name is ever fetched, so none can leak into the response.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

/** Page size for the attempt sweep. PostgREST caps a single select well below the row count. */
const PAGE = 1000

export async function GET(req: Request) {
  try {
    // ── Authenticate (anon client — does NOT bypass RLS) ─────────────────────
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
    )

    // ── Authorise ────────────────────────────────────────────────────────────
    // 404 rather than 403 for a non-admin: a 403 would confirm the endpoint
    // exists and that admin is a thing to become.
    const { data: teacher } = await admin
      .from('teachers').select('is_admin').eq('id', user.id).maybeSingle()
    if (teacher?.is_admin !== true) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // ── Fetch ────────────────────────────────────────────────────────────────
    // Only the columns the report needs. `students` deliberately does not
    // select display_name, and auth.users is not touched at all.
    const { data: students, error: sErr } = await admin
      .from('students').select('id, created_at, subscription_tier')
    if (sErr) throw new Error(`students: ${sErr.message}`)

    const attempts: { student_id: string; attempted_at: string }[] = []
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await admin
        .from('practice_attempts')
        .select('student_id, attempted_at')
        .order('attempted_at')
        .range(from, from + PAGE - 1)
      if (error) throw new Error(`practice_attempts: ${error.message}`)
      attempts.push(...(data ?? []))
      if (!data || data.length < PAGE) break
    }

    // A missing nudge table (migration not yet applied) must not take the whole
    // page down — that channel simply reports zero until it exists.
    const sendsFor = async (table: string) => {
      const { data, error } = await admin.from(table).select('student_id, sent_at, clicked_at')
      if (error) {
        console.warn(`[admin/usage] ${table} unavailable: ${error.message}`)
        return []
      }
      return data ?? []
    }

    const report = computeUsage({
      students: students ?? [],
      attempts,
      sends: [
        { channel: 'Re-engagement', rows: await sendsFor('reengagement_sends') },
        { channel: 'Weekly nudge',  rows: await sendsFor('weekly_nudge_sends') },
      ],
    })

    return NextResponse.json(report)
  } catch (err: any) {
    console.error('[admin/usage] failed:', err?.message ?? err)
    return NextResponse.json({ error: 'Failed to build usage report' }, { status: 500 })
  }
}
