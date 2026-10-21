import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { planSessionSweep, SWEEP_GRACE_MS, type SweepCandidate } from '../../../../lib/sessionSweep'

// ─────────────────────────────────────────────────────────────────────────────
// Delete finished class sessions (docs/audit/29, increment 6).
//
// Scheduled DAILY at 22:40 UTC, not hourly: Vercel's Hobby plan fails the whole
// deployment for any cron that would run more than once a day. 22:40 UTC is
// before local midnight in both GMT and BST, so a session from any realistic
// lesson is still deleted the same day — which is what the privacy notice,
// /dpa and the DPIA all now say. See the note on SWEEP_GRACE_MS.
//
// This is what makes the join page's one sentence about a child's data true:
// "it is all deleted at the end of the day." Without it the product collects
// first names from eleven-year-olds and keeps them indefinitely while telling
// them otherwise — so this increment is a prerequisite for a real class, not a
// tidy-up to follow one.
//
// It is also the mechanism the whole data protection position rests on
// (docs/audit/29 §4). "We hold a first name and some marks for the length of a
// lesson, then delete it" is a short answer to a DPO, and this is the only
// reason it is a true one.
//
// ── ARMED BY DEFAULT, unlike app/api/cron/retention ─────────────────────────
// The retention route is dry-run until RETENTION_DELETE is set, because what it
// deletes is a child's account and a year of work. Here the risk runs the other
// way: failing to delete is the breach, and what is deleted is a first name and
// a few hours of marks that nothing else depends on. The reasoning is in
// lib/sessionSweep.ts. SESSION_SWEEP_DISABLED=true turns it off to inspect a
// run — it has to be set to DISARM, not to arm.
//
// The cap is kept for the same reason the retention route has one: if a date
// bug ever made every session look finished, the damage is bounded and shows up
// in a report while most of the data is still there.
//
// Deleting the class_sessions row is all that is needed: participants and
// attempts reference it ON DELETE CASCADE (20261020_class_sessions.sql).
//
// Per project convention the admin client is built PER REQUEST, never at module
// top level, so a missing key cannot throw during the production build.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Bounded so one bad run cannot be catastrophic. See the header. */
const DEFAULT_MAX_PER_RUN = 200

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[session-sweep] CRON_SECRET not set — refusing to run')
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const disabled = process.env.SESSION_SWEEP_DISABLED === 'true'
  const cap = Number(process.env.SESSION_SWEEP_MAX_PER_RUN) || DEFAULT_MAX_PER_RUN

  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    // Only the columns the rule reads. No title, and above all no participant
    // names: a cron log is not a place for a child's first name, and this route
    // never needs to know one to do its job.
    const { data, error } = await admin
      .from('class_sessions')
      .select('id, status, expires_at, closed_at')
      .order('expires_at', { ascending: true })

    if (error) {
      console.error('[session-sweep] read failed:', error.message)
      return NextResponse.json({ error: 'Read failed' }, { status: 500 })
    }

    const now = Date.now()
    const plan = planSessionSweep((data ?? []) as SweepCandidate[], now, cap)

    const unreadable = plan.kept.filter(k => k.keptBecause === 'unreadable_dates')
    if (unreadable.length > 0) {
      // Should be unreachable — both columns are timestamptz. Loud, because the
      // alternative is rows kept past their promise with nobody told.
      console.error('[session-sweep] sessions with unreadable dates, kept:',
        unreadable.map(u => u.id))
    }

    const report = {
      scanned:     (data ?? []).length,
      due:         plan.due.length,
      capped:      plan.capped,
      stillLive:   plan.kept.filter(k => k.keptBecause === 'still_live').length,
      withinGrace: plan.kept.filter(k => k.keptBecause === 'within_grace').length,
      unreadable:  unreadable.length,
      graceMinutes: SWEEP_GRACE_MS / 60_000,
      disabled,
    }

    if (disabled) {
      console.log('[session-sweep] DISABLED — would have deleted', plan.due.length)
      return NextResponse.json({ ...report, deleted: 0 })
    }

    let deleted = 0
    const failed: string[] = []
    for (const decision of plan.due) {
      const { error: delError } = await admin
        .from('class_sessions')
        .delete()
        .eq('id', decision.id)
      if (delError) {
        // Keep going: one row failing must not strand the rest past their
        // promise. The next run retries whatever is left.
        failed.push(decision.id)
        console.error('[session-sweep] delete failed for', decision.id, delError.message)
      } else {
        deleted++
      }
    }

    console.log('[session-sweep]', JSON.stringify({ ...report, deleted, failed: failed.length }))
    return NextResponse.json({ ...report, deleted, failed: failed.length })
  } catch (err) {
    console.error('[session-sweep]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
