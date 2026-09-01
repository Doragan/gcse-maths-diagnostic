import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { buildWeeklyNudgeEmail, nudgeActiveDays } from '../../../../lib/email/weeklyNudge'
import { SEND_ANALYTICS } from '../../../../lib/email/sendKind'
import { WEEKLY_GOAL, mondayOf, weekStartDate } from '../../../../lib/skills/weeklyGoal'

// Weekly-goal nudge cron. Emails opted-in students who have practised this week
// but are still short of the goal. Scheduled for SATURDAY (see vercel.json) —
// two clear days to act on it, rather than a Sunday-night scramble.
//
// The counterpart to /api/cron/reengagement, which handles the LAPSED. The two
// cohorts must never overlap: this selector requires a recent attempt, that one
// requires the absence of one. Both thresholds come from REENGAGEMENT_DAYS so
// they cannot be tuned apart, and this one is deliberately a day tighter —
// see nudgeActiveDays for why equal values are NOT disjoint in practice.
//
// Per project convention the admin Supabase client and Resend are instantiated
// PER REQUEST (never at module top-level), so a missing key can't throw during
// the production build's page-data collection.

export const dynamic = 'force-dynamic' // never statically optimise a cron route
export const maxDuration = 60

const DEFAULT_LAPSED_DAYS  = 4   // mirrors the re-engagement cron default
const DEFAULT_MIN_PROGRESS = 3   // below this, a nudge is nagging rather than helpful
const BATCH_LIMIT = 100          // cap per run

type Candidate = {
  student_id: string
  email: string
  display_name: string
  answered: number
}

export async function GET(req: NextRequest) {
  // ── Auth: only Vercel Cron (or a caller with the secret) may run this ─────────
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[weekly-nudge] CRON_SECRET not set — refusing to run')
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  const siteUrl   = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  if (!resendKey) {
    console.warn('[weekly-nudge] RESEND_API_KEY not set — skipping run')
    return NextResponse.json({ ok: true, sent: 0, skipped: 'no_resend_key' })
  }

  // Derived from the re-engagement cron's threshold, never configured apart from
  // it: these are two halves of one boundary. nudgeActiveDays shaves a day off so
  // the two cohorts can't overlap even though the crons evaluate their tests at
  // different times of day — see the comment on that function.
  const lapsedDays  = parseInt(process.env.REENGAGEMENT_DAYS || '', 10) || DEFAULT_LAPSED_DAYS
  const activeDays  = nudgeActiveDays(lapsedDays)
  const minProgress = parseInt(process.env.WEEKLY_NUDGE_MIN_PROGRESS || '', 10) || DEFAULT_MIN_PROGRESS
  const goal        = parseInt(process.env.WEEKLY_GOAL || '', 10) || WEEKLY_GOAL

  const now       = Date.now()
  const weekStart = new Date(mondayOf(now)).toISOString()
  const weekKey   = weekStartDate(now)   // the ledger key; same definition of a week

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const resend = new Resend(resendKey)

  // ── Who is short of their goal? ──────────────────────────────────────────────
  const { data, error } = await supabase.rpc('get_weekly_goal_candidates', {
    p_week_start:   weekStart,
    p_goal:         goal,
    p_min_progress: minProgress,
    p_active_days:  activeDays,
  })
  if (error) {
    console.error('[weekly-nudge] get_weekly_goal_candidates failed:', error.message)
    return NextResponse.json({ error: 'Selection failed' }, { status: 500 })
  }
  const cohort = (data as Candidate[] | null) ?? []

  // ── Who have we already emailed this week? ───────────────────────────────────
  // Applied HERE rather than inside the selector, so "who is short of their
  // goal" stays a separate question from "have we contacted them" — the lesson
  // recorded against get_lapsed_students, which welded the two together and
  // would make a second channel fork the query.
  //
  // Filtering before the batch slice also matters: with the cap inside the
  // selector it would be invisible, but applied after `.slice(BATCH_LIMIT)` an
  // already-emailed student could occupy the batch every run and starve someone
  // who has never been reached.
  const { data: already, error: sentErr } = await supabase
    .from('weekly_nudge_sends')
    .select('student_id')
    .eq('week_start', weekKey)
  if (sentErr) {
    console.error('[weekly-nudge] could not read this week\'s sends:', sentErr.message)
    return NextResponse.json({ error: 'Cap check failed' }, { status: 500 })
  }
  const emailed = new Set((already ?? []).map(r => r.student_id as string))
  const batch = cohort.filter(c => !emailed.has(c.student_id)).slice(0, BATCH_LIMIT)

  let sent = 0
  let failed = 0

  for (const s of batch) {
    if (!s.email) continue

    // 1. Reserve a send row FIRST. Its id is the opaque token in the click /
    //    unsubscribe links, and the unique (student_id, week_start) index makes
    //    a concurrent double-run a no-op for this student.
    const { data: row, error: insErr } = await supabase
      .from('weekly_nudge_sends')
      .insert({ student_id: s.student_id, week_start: weekKey })
      .select('id')
      .single()
    if (insErr || !row) continue // unique-index guard or a transient error
    const sendId = row.id as string

    const practiceUrl    = `${siteUrl}/api/email/click?s=${sendId}&k=nudge`
    const unsubscribeUrl = `${siteUrl}/api/email/unsubscribe?s=${sendId}&k=nudge`

    const { subject, html, text } = buildWeeklyNudgeEmail({
      displayName: s.display_name,
      answered:    Number(s.answered) || 0,
      goal,
      practiceUrl,
      unsubscribeUrl,
    })

    const { error: sendErr } = await resend.emails.send({
      from: fromEmail,
      to:   s.email,
      subject,
      html,
      text,
      headers: {
        // RFC 8058 one-click unsubscribe — lets mail clients surface a native
        // "unsubscribe" control, on top of the in-body link.
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })

    if (sendErr) {
      // Roll back the reservation so this student is retried on the next run,
      // rather than being silently consumed by a failed send.
      await supabase.from('weekly_nudge_sends').delete().eq('id', sendId)
      failed++
      continue
    }

    await supabase.from('analytics_events').insert({
      event:      `${SEND_ANALYTICS.nudge.prefix}_sent`,
      path:       SEND_ANALYTICS.nudge.path,
      session_id: sendId,
      properties: {
        student_id: s.student_id,
        answered:   Number(s.answered) || 0,
        goal,
        week_start: weekKey,
      },
    })
    sent++
  }

  console.log(`[weekly-nudge] run complete — week=${weekKey} cohort=${cohort.length} sent=${sent} failed=${failed}`)
  return NextResponse.json({ ok: true, week: weekKey, cohort: cohort.length, sent, failed })
}
