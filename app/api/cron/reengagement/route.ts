import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { skills } from '../../../../data/skills'
import { buildReengagementEmail } from '../../../../lib/email/reengagement'
import {
  REENGAGEMENT_COOLDOWN_DAYS, cooldownCutoff, dueForContact, sentOnDate,
} from '../../../../lib/email/cadence'

// Daily re-engagement cron. Emails opted-in students who practised but haven't
// returned in N days. Triggered by Vercel Cron (see vercel.json), which sends an
// `Authorization: Bearer <CRON_SECRET>` header when CRON_SECRET is configured.
//
// A student may receive this at most once per COOLDOWN_DAYS (14). That cadence
// is applied here rather than in the selector, because a rolling window can't be
// an index — see lib/email/cadence.ts. The database still backs it with
// `unique (student_id, sent_on)`, which catches a same-day double run.
//
// Per project convention, the admin Supabase client and Resend are instantiated
// PER REQUEST (never at module top-level), so a missing key can't throw during
// the production build's page-data collection.

export const dynamic = 'force-dynamic' // never statically optimise a cron route
export const maxDuration = 60

const DEFAULT_DAYS = 4          // lapsed threshold (see proposal; override via env)
const DEFAULT_MIN_ATTEMPTS = 5  // "previously active" floor — filters one-question bounces
// Cap per run; the daily cadence drains any backlog. Overridable because the
// first run after the fortnightly cap lands releases everyone whose single
// historical send is already older than the cooldown — a burst, onto a domain
// whose deliverability is unresolved. Set REENGAGEMENT_BATCH_LIMIT low for a few
// days to warm up gradually, then let it return to the default.
const DEFAULT_BATCH_LIMIT = 100

type LapsedStudent = {
  student_id: string
  email: string
  display_name: string
  total_attempts: number
  skill_ids: string[]
  last_attempt: string
}

const skillName = (id: string): string => skills.find(s => s.id === id)?.name ?? ''

export async function GET(req: NextRequest) {
  // ── Auth: only Vercel Cron (or a caller with the secret) may run this ─────────
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[reengagement] CRON_SECRET not set — refusing to run')
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  const siteUrl   = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  if (!resendKey) {
    console.warn('[reengagement] RESEND_API_KEY not set — skipping run')
    return NextResponse.json({ ok: true, sent: 0, skipped: 'no_resend_key' })
  }

  const days        = parseInt(process.env.REENGAGEMENT_DAYS || '', 10) || DEFAULT_DAYS
  const minAttempts = parseInt(process.env.REENGAGEMENT_MIN_ATTEMPTS || '', 10) || DEFAULT_MIN_ATTEMPTS

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const resend = new Resend(resendKey)

  // ── Select the lapsed, opted-in, not-yet-emailed cohort ───────────────────────
  const { data, error } = await supabase.rpc('get_lapsed_students', {
    p_days: days,
    p_min_attempts: minAttempts,
  })
  if (error) {
    console.error('[reengagement] get_lapsed_students failed:', error.message)
    return NextResponse.json({ error: 'Selection failed' }, { status: 500 })
  }

  const cohort = (data as LapsedStudent[] | null) ?? []

  // ── Cadence: drop anyone contacted inside the cooldown ───────────────────────
  // The selector no longer knows about sends at all, so this is the whole cap.
  // Filtered BEFORE the batch slice, or cooled-down students could occupy the
  // batch on every run and starve someone never contacted.
  const cooldownDays = parseInt(process.env.REENGAGEMENT_COOLDOWN_DAYS || '', 10)
    || REENGAGEMENT_COOLDOWN_DAYS
  const { data: recent, error: recentErr } = await supabase
    .from('reengagement_sends')
    .select('student_id')
    .gte('sent_at', cooldownCutoff(Date.now(), cooldownDays).toISOString())
  if (recentErr) {
    console.error('[reengagement] cooldown lookup failed:', recentErr.message)
    return NextResponse.json({ error: 'Cooldown check failed' }, { status: 500 })
  }
  const cooling = new Set((recent ?? []).map(r => r.student_id as string))
  const batchLimit = parseInt(process.env.REENGAGEMENT_BATCH_LIMIT || '', 10) || DEFAULT_BATCH_LIMIT
  const due = dueForContact(cohort, cooling)
  const batch = due.slice(0, batchLimit)

  let sent = 0
  let failed = 0

  for (const s of batch) {
    if (!s.email) continue

    // 1. Reserve a send row FIRST. Its id is the opaque token in the click /
    //    unsubscribe links, and the unique (student_id, sent_on) index makes a
    //    concurrent double-run a no-op for this student.
    const { data: row, error: insErr } = await supabase
      .from('reengagement_sends')
      .insert({ student_id: s.student_id, sent_on: sentOnDate() })
      .select('id')
      .single()
    if (insErr || !row) {
      // Likely the unique-index guard (already sent) or a transient error — skip.
      continue
    }
    const sendId = row.id as string

    const dashboardUrl   = `${siteUrl}/api/email/click?s=${sendId}`
    const unsubscribeUrl = `${siteUrl}/api/email/unsubscribe?s=${sendId}`
    const skillNames     = (s.skill_ids ?? []).map(skillName).filter(Boolean)

    const { subject, html, text } = buildReengagementEmail({
      displayName:   s.display_name,
      totalAttempts: Number(s.total_attempts) || 0,
      skillNames,
      dashboardUrl,
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
      await supabase.from('reengagement_sends').delete().eq('id', sendId)
      failed++
      continue
    }

    // 2. Record the send for measurement (trackEvent is client-only, so insert
    //    into analytics_events directly — mirrors the feedback/report routes).
    const daysLapsed = Math.floor((Date.now() - new Date(s.last_attempt).getTime()) / 86_400_000)
    await supabase.from('analytics_events').insert({
      event:      'reengagement_email_sent',
      path:       '/email/reengagement',
      session_id: sendId,
      properties: {
        student_id:     s.student_id,
        days_lapsed:    daysLapsed,
        total_attempts: Number(s.total_attempts) || 0,
      },
    })
    sent++
  }

  // `cooling` is reported separately so a quiet run is legible: a cohort of 8
  // with 8 cooling down is the cap working, not a broken selector.
  console.log(`[reengagement] run complete — cohort=${cohort.length} cooling=${cooling.size} due=${due.length} sent=${sent} failed=${failed}`)
  return NextResponse.json({
    ok: true,
    cohort: cohort.length, cooling: cooling.size, due: due.length,
    cooldownDays, batchLimit, sent, failed,
  })
}
