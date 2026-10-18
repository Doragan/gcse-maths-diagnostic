import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { buildDailyDigestEmail } from '../../../../lib/email/dailyDigest'
import { loadDailyDigestInput } from '../../../../lib/email/dailyDigestData'

// Daily digest to the founder: yesterday's traffic, signups, student activity and
// paid-access health, from Supabase only. Triggered by Vercel Cron (see
// vercel.json), which sends an `Authorization: Bearer <CRON_SECRET>` header when
// CRON_SECRET is set.
//
// The path still says "ad-digest" because that is what the cron is registered
// under in vercel.json; this was a Google Ads funnel digest until paid ads
// stopped. Ad spend/CPC/CTR were never here (no Ads API integration) and still
// are not. What the email contains and how it is counted lives in
// lib/email/dailyDigest.ts (pure, tested) and lib/email/dailyDigestData.ts (I/O).
//
// Per project convention, the admin Supabase client and Resend are instantiated
// PER REQUEST (never at module top-level), so a missing key can't throw during
// the production build's page-data collection.

export const dynamic = 'force-dynamic' // never statically optimise a cron route
export const maxDuration = 60

const DIGEST_TO = 'christopher.reay89@gmail.com'

export async function GET(req: NextRequest) {
  // ── Auth: only Vercel Cron (or a caller with the secret) may run this ─────────
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[daily-digest] CRON_SECRET not set — refusing to run')
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  if (!resendKey) {
    console.warn('[daily-digest] RESEND_API_KEY not set — skipping run')
    return NextResponse.json({ ok: true, sent: false, skipped: 'no_resend_key' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const resend = new Resend(resendKey)

  let input
  try {
    input = await loadDailyDigestInput(supabase, Date.now())
  } catch (err) {
    console.error('[daily-digest] data load failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }

  const { subject, html, text } = buildDailyDigestEmail(input)

  const { error: sendErr } = await resend.emails.send({
    from: fromEmail,
    to: DIGEST_TO,
    subject,
    html,
    text,
  })

  if (sendErr) {
    console.error('[daily-digest] send failed:', sendErr.message)
    return NextResponse.json({ error: 'Send failed' }, { status: 500 })
  }

  const { traffic, students } = input
  console.log(`[daily-digest] ${input.dateLabel} — visits=${traffic.yesterday.visits} engaged=${traffic.yesterday.engaged} adTagged=${traffic.yesterday.adTagged} signups=${traffic.yesterday.signups} practised=${students.yesterday.practised}(new ${students.yesterday.newlyStarted}, returning ${students.yesterday.returning}) paid=${input.paidCount}`)

  return NextResponse.json({
    ok: true, sent: true, day: input.dateLabel,
    traffic, students, totalStudents: input.totalStudents,
    paidCount: input.paidCount, founderSeatsLeft: input.founderSeatsLeft,
  })
}
