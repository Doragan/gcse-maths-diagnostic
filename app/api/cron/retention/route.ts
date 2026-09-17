import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { planRetention, RETENTION_MS, type RetentionCandidate } from '../../../../lib/retention'

// ─────────────────────────────────────────────────────────────────────────────
// Retention: delete student accounts abandoned for a year.
//
// Keeps the promise in the privacy notice — "if you do not sign in or practise
// for 1 year, we delete the account and everything in it" — which was published
// long before anything implemented it.
//
// The RULE lives in lib/retention.ts, pure and exhaustively tested. This route
// only fetches, calls it, and acts. That split matters more here than usual:
// the action is irreversible and lands on children's data, so the part that
// decides has to be testable without a database.
//
// ── This deletes nothing unless told to ─────────────────────────────────────
// DRY RUN IS THE DEFAULT. The route reports what it WOULD delete and stops,
// unless RETENTION_DELETE is exactly 'true'. That is not ceremony:
//
//   * The oldest account is 27 May 2026, so nothing can qualify until May 2027.
//     There are eight months in which this can run daily, report zero, and be
//     watched — which is the only honest way to gain confidence in code whose
//     failure mode is destroying a child's work.
//   * When the first real candidates appear, they can be inspected before the
//     switch is thrown, rather than discovered in a deletion log.
//
// RETENTION_MAX_PER_RUN caps the blast radius even when armed. If a date bug
// ever made everyone look inactive, the loss is bounded and visible in the run's
// report while most of the data is still there. A daily schedule drains a
// genuine backlog in days, so the cap costs nothing when the logic is right.
//
// ── Students only ───────────────────────────────────────────────────────────
// Teacher accounts are NOT touched. The promise is about student accounts, and
// deleting a teacher cascades to their classes and from there to other people's
// membership and assignment records — someone else's data removed by a third
// party's inactivity. If teacher retention is ever wanted it needs its own rule
// and its own reasoning.
//
// Deleting the auth user is what removes the account: `students` references
// auth.users with ON DELETE CASCADE, and everything else hangs off `students`
// the same way (see 20260914_capture_students_teachers.sql).
//
// Per project convention the admin client is built PER REQUEST, never at module
// top level, so a missing key cannot throw during the production build.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Bounded so one bad run cannot be catastrophic. See the header. */
const DEFAULT_MAX_PER_RUN = 25

/** PostgREST caps a single select; the account count is small but this is cheap. */
const PAGE = 1000

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[retention] CRON_SECRET not set — refusing to run')
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const armed = process.env.RETENTION_DELETE === 'true'
  const cap = Number(process.env.RETENTION_MAX_PER_RUN) || DEFAULT_MAX_PER_RUN

  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    // ── Students, and their entitlement columns ─────────────────────────────
    // No display_name and no email: this route decides on dates alone, and
    // pulling identifying fields it does not need would only create a way for
    // them to reach a log.
    const { data: students, error: sErr } = await admin
      .from('students')
      .select('id, created_at, subscription_tier, paid_until')
    if (sErr) throw new Error(`students: ${sErr.message}`)

    const ids = new Set((students ?? []).map(s => s.id as string))
    if (ids.size === 0) {
      return NextResponse.json({ ok: true, armed, scanned: 0, eligible: 0, deleted: 0 })
    }

    // ── Last sign-in, from auth ─────────────────────────────────────────────
    // Only students are kept; teachers and any other auth user are dropped here.
    const lastSignIn = new Map<string, string | null>()
    for (let page = 1; page <= 20; page++) {
      const r = await admin.auth.admin.listUsers({ page, perPage: 200 })
      if (r.error) throw new Error(`auth users: ${r.error.message}`)
      const users = r.data?.users ?? []
      for (const u of users) {
        if (ids.has(u.id)) lastSignIn.set(u.id, u.last_sign_in_at ?? null)
      }
      if (users.length < 200) break
    }

    // ── Most recent practice attempt per student ────────────────────────────
    const lastAttempt = new Map<string, string>()
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await admin
        .from('practice_attempts')
        .select('student_id, attempted_at')
        .order('attempted_at', { ascending: false })
        .range(from, from + PAGE - 1)
      if (error) throw new Error(`practice_attempts: ${error.message}`)
      for (const a of data ?? []) {
        // Rows arrive newest first, so the first sighting of a student is theirs.
        if (!lastAttempt.has(a.student_id)) lastAttempt.set(a.student_id, a.attempted_at)
      }
      if (!data || data.length < PAGE) break
    }

    const candidates: RetentionCandidate[] = (students ?? []).map(s => ({
      id: s.id,
      created_at: s.created_at,
      last_sign_in_at: lastSignIn.get(s.id) ?? null,
      last_attempt_at: lastAttempt.get(s.id) ?? null,
      subscription_tier: s.subscription_tier,
      paid_until: s.paid_until,
    }))

    const plan = planRetention(candidates, Date.now(), cap, RETENTION_MS)

    // ── Report before acting, always ────────────────────────────────────────
    // Logged whether or not it is armed, so the dry-run period leaves the same
    // trail a live run would.
    console.log(
      `[retention] scanned=${candidates.length} eligible=${plan.eligible} `
      + `capped=${plan.capped} armed=${armed} ids=${plan.toDelete.join(',') || 'none'}`,
    )

    if (!armed) {
      return NextResponse.json({
        ok: true, armed: false, dryRun: true,
        scanned: candidates.length,
        eligible: plan.eligible,
        wouldDelete: plan.toDelete,
        capped: plan.capped,
      })
    }

    // ── Delete ──────────────────────────────────────────────────────────────
    // One at a time, so a single failure — a foreign key with no cascade, say —
    // stops that account rather than the run, and names itself in the log.
    const deleted: string[] = []
    const failed: { id: string; error: string }[] = []
    for (const id of plan.toDelete) {
      const { error } = await admin.auth.admin.deleteUser(id)
      if (error) {
        console.error(`[retention] delete failed for ${id}: ${error.message}`)
        failed.push({ id, error: error.message })
      } else {
        console.log(`[retention] deleted ${id}`)
        deleted.push(id)
      }
    }

    return NextResponse.json({
      ok: true, armed: true,
      scanned: candidates.length,
      eligible: plan.eligible,
      deleted: deleted.length,
      failed,
      capped: plan.capped,
    })
  } catch (err: any) {
    console.error('[retention] failed:', err?.message ?? err)
    return NextResponse.json({ error: 'Retention run failed' }, { status: 500 })
  }
}
