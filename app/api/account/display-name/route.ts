import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { parseDisplayName } from '../../../../lib/invitations'

// ─────────────────────────────────────────────────────────────────────────────
// A teacher's own display name: read it, set it, clear it.
//
// This is the ONLY write path to teachers.display_name, and that is the point.
//
// ⚠ WHY A ROUTE RATHER THAN RLS. An UPDATE policy on `teachers` was considered
// and rejected. That is the table where a policy once let an account grant
// itself `is_admin` (20260914_close_teachers_self_admin.sql), and re-opening it
// to client writes — even for something as harmless as a name — means getting
// column grants exactly right, on a system where a column-level REVOKE is a
// silent no-op and the table-level grant is what actually decides. Too much
// risk for a text field.
//
// So this route holds the whole surface, and the shape of it is the safety
// argument: the update is `.update({ display_name })` on `.eq('id', user.id)`.
// One named column, one row, the caller's own. There is no request body that
// can reach `is_admin`, `paid_until` or anyone else's row, because no value
// from the request chooses the column or the row — the token does.
//
// Same auth shape as the other teacher routes: authenticate on the anon client,
// then reach for the service role.
//
//   GET   — my display name
//   PATCH — set it, or clear it with null / ""
// ─────────────────────────────────────────────────────────────────────────────

type Ctx = { userId: string; admin: SupabaseClient }
type Failure = { error: string; status: number }

async function authedTeacher(req: Request): Promise<Ctx | Failure> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Not authenticated', status: 401 }
  }
  const token = authHeader.replace('Bearer ', '')

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
  const { data: { user }, error } = await authClient.auth.getUser(token)
  if (error || !user) return { error: 'Not authenticated', status: 401 }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  // Must actually be a teacher. A student reaching here would otherwise get a
  // silent no-op update against a row that does not exist, and a 200 saying
  // their name was saved when nothing was.
  const { data: teacher } = await admin
    .from('teachers')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()
  if (!teacher) {
    return { error: 'Only teacher accounts have a display name', status: 403 }
  }

  return { userId: user.id, admin }
}

function isFailure(ctx: Ctx | Failure): ctx is Failure {
  return 'error' in ctx
}

export async function GET(req: Request) {
  try {
    const ctx = await authedTeacher(req)
    if (isFailure(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const { data, error } = await ctx.admin
      .from('teachers')
      .select('display_name')
      .eq('id', ctx.userId)
      .maybeSingle()
    if (error) {
      console.error('display_name read failed:', error)
      return NextResponse.json({ error: 'Could not load your name' }, { status: 500 })
    }

    return NextResponse.json({ display_name: data?.display_name ?? null })
  } catch (err) {
    console.error('display-name GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await authedTeacher(req)
    if (isFailure(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const body = await req.json().catch(() => null)
    const parsed = parseDisplayName(body?.display_name)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    // The entire write. One column, named here and not taken from the request;
    // one row, chosen by the authenticated id and not by the request.
    const { error } = await ctx.admin
      .from('teachers')
      .update({ display_name: parsed.value })
      .eq('id', ctx.userId)
    if (error) {
      console.error('display_name update failed:', error)
      return NextResponse.json({ error: 'Could not save your name' }, { status: 500 })
    }

    return NextResponse.json({ display_name: parsed.value })
  } catch (err) {
    console.error('display-name PATCH error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
