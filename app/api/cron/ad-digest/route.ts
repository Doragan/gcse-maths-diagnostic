import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { buildAdDigestEmail } from '../../../../lib/email/adDigest'

// Daily Google Ads funnel digest. Summarises the previous UTC day's traffic from
// analytics_events (sessions / practice rate / signups, ad-attributed vs organic)
// and emails it to the founder. Triggered by Vercel Cron (see vercel.json), which
// sends an `Authorization: Bearer <CRON_SECRET>` header when CRON_SECRET is set.
//
// Out of scope by design: Google Ads spend/CPC/impressions/CTR. That data only
// lives in the Ads console — there's no Ads API integration here, and none is
// intended. This is a Supabase-only funnel digest.
//
// Per project convention, the admin Supabase client and Resend are instantiated
// PER REQUEST (never at module top-level), so a missing key can't throw during
// the production build's page-data collection.

export const dynamic = 'force-dynamic' // never statically optimise a cron route
export const maxDuration = 60

const DIGEST_TO = 'christopher.reay89@gmail.com'
const DAY_MS = 86_400_000

type EventRow = {
  event: string
  path: string
  session_id: string
  properties: Record<string, unknown> | null
  created_at: string
}

const dayKey = (iso: string): string => iso.slice(0, 10) // UTC date, since created_at is stored/returned in UTC
const isAd = (r: EventRow): boolean => typeof r.properties?.gclid === 'string' && r.properties.gclid.length > 0
const isPracticeEvent = (r: EventRow): boolean => r.path?.startsWith('/practice/question') ?? false

export async function GET(req: NextRequest) {
  // ── Auth: only Vercel Cron (or a caller with the secret) may run this ─────────
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[ad-digest] CRON_SECRET not set — refusing to run')
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  if (!resendKey) {
    console.warn('[ad-digest] RESEND_API_KEY not set — skipping run')
    return NextResponse.json({ ok: true, sent: false, skipped: 'no_resend_key' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const resend = new Resend(resendKey)

  // ── Time window: the previous full UTC day, plus 6 days before it for the ─────
  // 7-day rolling context (so a single quiet day doesn't look alarming alone).
  const now = new Date()
  const todayStartUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const targetDayStart = new Date(todayStartUTC.getTime() - DAY_MS)
  const targetDay = dayKey(targetDayStart.toISOString())
  const windowStart = new Date(todayStartUTC.getTime() - 7 * DAY_MS)

  const { data, error } = await supabase
    .from('analytics_events')
    .select('event, path, session_id, properties, created_at')
    .gte('created_at', windowStart.toISOString())
    .lt('created_at', todayStartUTC.toISOString())

  if (error) {
    console.error('[ad-digest] analytics_events query failed:', error.message)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }

  // Exclude the maintainer's own testing traffic (see lib/analytics.ts isInternal()).
  const rows = ((data as EventRow[] | null) ?? []).filter(r => r.properties?.internal !== true)

  // ── Target-day session grouping (ad vs organic, and practice-question reach) ──
  const sessionsByDay = new Map<string, Map<string, { ad: boolean; practice: boolean }>>()
  for (const r of rows) {
    const day = dayKey(r.created_at)
    let sessions = sessionsByDay.get(day)
    if (!sessions) { sessions = new Map(); sessionsByDay.set(day, sessions) }
    const s = sessions.get(r.session_id) ?? { ad: false, practice: false }
    if (isAd(r)) s.ad = true
    if (isPracticeEvent(r)) s.practice = true
    sessions.set(r.session_id, s)
  }

  const targetSessions = sessionsByDay.get(targetDay) ?? new Map()
  let adSessions = 0, organicSessions = 0, adSessionsWithPractice = 0
  for (const s of targetSessions.values()) {
    if (s.ad) { adSessions++; if (s.practice) adSessionsWithPractice++ }
    else organicSessions++
  }

  // 7-day average of ad sessions/day (including the target day), for trend context.
  let adSessions7dSum = 0
  for (const sessions of sessionsByDay.values()) {
    for (const s of sessions.values()) if (s.ad) adSessions7dSum++
  }
  const adSessions7dAvg = adSessions7dSum / 7

  // ── Signups (event-level, since attribution is stamped on every event of a session) ──
  let signupsAd = 0, signupsOrganic = 0, rolling7dSignups = 0
  for (const r of rows) {
    if (r.event !== 'signup_success') continue
    rolling7dSignups++
    if (dayKey(r.created_at) === targetDay) {
      if (isAd(r)) signupsAd++
      else signupsOrganic++
    }
  }

  // 7-day rolling distinct sessions (ad + organic combined) for context.
  const rolling7dSessions = new Set(rows.map(r => r.session_id)).size

  const dateLabel = new Date(targetDayStart).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })

  const { subject, html, text } = buildAdDigestEmail({
    dateLabel,
    adSessions,
    organicSessions,
    adSessions7dAvg,
    adSessionsWithPractice,
    signupsAd,
    signupsOrganic,
    rolling7dSessions,
    rolling7dSignups,
  })

  const { error: sendErr } = await resend.emails.send({
    from: fromEmail,
    to: DIGEST_TO,
    subject,
    html,
    text,
  })

  if (sendErr) {
    console.error('[ad-digest] send failed:', sendErr.message)
    return NextResponse.json({ error: 'Send failed' }, { status: 500 })
  }

  console.log(`[ad-digest] ${targetDay} — ad=${adSessions} organic=${organicSessions} practiceRate=${adSessions > 0 ? Math.round((adSessionsWithPractice / adSessions) * 100) : 0}% signups(ad=${signupsAd},organic=${signupsOrganic}) rolling7d(sessions=${rolling7dSessions},signups=${rolling7dSignups})`)

  return NextResponse.json({
    ok: true, sent: true, day: targetDay,
    adSessions, organicSessions, adSessionsWithPractice, signupsAd, signupsOrganic,
    rolling7dSessions, rolling7dSignups,
  })
}
